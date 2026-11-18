import {
  actualizarLibro,
  crearLibro,
  eliminarLibro,
  ESTADOS,
  listarLibros,
  obtenerEstadisticas,
  obtenerLibro,
  type DatosLibro,
  type EstadoLectura,
  type FiltrosLibros,
  type Libro,
} from '../models/libro';
import { listarAutores } from '../models/autor';
import {
  abrirModal,
  cerrarModal,
  confirmarAccion,
  mostrarToast,
} from '../views/vistaComunes';
import { renderFormularioLibro, renderGrilla } from '../views/vistaLibros';
import { abrirDetalleLibro } from './resenaController';

let filtros: FiltrosLibros = { busqueda: '', estado: 'todos' };
let interfazIniciada = false;

export function iniciarLibros(): void {
  if (interfazIniciada) return;
  interfazIniciada = true;

  conectarEventos();
  refrescarEstante();

  document.addEventListener('club:datos-actualizados', () => {
    refrescarEstante();
  });
}

export function refrescarEstante(): void {
  renderizarGrilla();
  actualizarEstadisticas();
}

function conectarEventos(): void {
  document.addEventListener('click', manejarAcciones);

  const buscador = document.getElementById('buscador');
  buscador?.addEventListener('input', (evento) => {
    const campo = evento.currentTarget as HTMLInputElement;
    filtros = { ...filtros, busqueda: campo.value };
    renderizarGrilla();
  });

  document.querySelectorAll<HTMLButtonElement>('[data-filtro]').forEach((boton) => {
    boton.addEventListener('click', () => {
      const valor = boton.dataset.filtro;
      filtros = {
        ...filtros,
        estado: valor === 'leyendo' || valor === 'terminado' || valor === 'pausado' ? valor : 'todos',
      };
      renderizarGrilla();
    });
  });
}

function manejarAcciones(evento: MouseEvent): void {
  const disparador = (evento.target as HTMLElement).closest<HTMLElement>('[data-accion]');
  if (!disparador) return;

  const accion = disparador.dataset.accion;
  const id = Number(disparador.dataset.id);

  switch (accion) {
    case 'nuevo-libro':
      abrirFormularioLibro(null);
      break;
    case 'limpiar-filtros':
      limpiarFiltros();
      break;
    case 'detalle':
      if (Number.isFinite(id)) abrirDetalleLibro(id);
      break;
    case 'editar': {
      const libro = Number.isFinite(id) ? obtenerLibro(id) : null;
      if (libro) abrirFormularioLibro(libro);
      else mostrarToast('Ese libro ya no está en el estante.', 'error');
      break;
    }
    case 'eliminar':
      if (Number.isFinite(id)) void solicitarEliminacion(id);
      break;
    default:
      break;
  }
}

function limpiarFiltros(): void {
  filtros = { busqueda: '', estado: 'todos' };
  const buscador = document.getElementById('buscador');
  if (buscador instanceof HTMLInputElement) buscador.value = '';
  renderizarGrilla();
}

function renderizarGrilla(): void {
  const contenedor = document.getElementById('grilla-libros');
  if (!contenedor) return;

  const libros = listarLibros(filtros);
  const total = listarLibros().length;
  const hayBusqueda = Boolean(filtros.busqueda?.trim());
  const hayFiltros = hayBusqueda || filtros.estado !== 'todos';
  const criterio = hayBusqueda ? 'tu búsqueda' : 'tu filtro';

  contenedor.innerHTML = renderGrilla(libros, hayFiltros);
  contenedor.classList.toggle('grilla--vacia', libros.length === 0);

  const resumen = document.getElementById('resumen-estante');
  if (resumen) {
    if (libros.length === 0 && hayFiltros) {
      resumen.textContent = `0 de ${total} libros coinciden con ${criterio}.`;
    } else if (libros.length === 1) {
      resumen.textContent = hayFiltros
        ? `1 de ${total} libros coincide con ${criterio}.`
        : '1 libro registrado. Las reseñas se escriben sin firmar.';
    } else {
      resumen.textContent = hayFiltros
        ? `${libros.length} de ${total} libros coinciden con ${criterio}.`
        : `${libros.length} libros registrados. Las reseñas se escriben sin firmar.`;
    }
  }

  document.querySelectorAll<HTMLButtonElement>('[data-filtro]').forEach((boton) => {
    const activo = (filtros.estado ?? 'todos') === boton.dataset.filtro;
    boton.classList.toggle('filtro--activo', activo);
    boton.setAttribute('aria-pressed', String(activo));
  });
}

function actualizarEstadisticas(): void {
  const cifras = obtenerEstadisticas();
  escribir('stat-libros', String(cifras.libros));
  escribir('stat-resenas', String(cifras.resenas));
  escribir('stat-promedio', cifras.resenas > 0 ? cifras.promedio.toFixed(1) : '—');
  escribir('stat-lectores', String(cifras.lectores));
}

function escribir(id: string, valor: string): void {
  const elemento = document.getElementById(id);
  if (elemento) elemento.textContent = valor;
}

function abrirFormularioLibro(libro: Libro | null): void {
  const autores = listarAutores().map((autor) => autor.nombre);
  const panel = abrirModal(renderFormularioLibro(libro, autores), {
    etiqueta: libro ? `Editar ${libro.titulo}` : 'Registrar un libro',
  });

  const formulario = panel.querySelector<HTMLFormElement>('#form-libro');
  if (!formulario) return;

  formulario.addEventListener('submit', (evento) => {
    evento.preventDefault();
    const error = panel.querySelector<HTMLElement>('#error-libro');
    const datos = leerFormulario(formulario);

    if (!datos) return;

    if (datos.titulo.length < 2) {
      mostrarError(error, formulario, 'titulo', 'El título necesita al menos 2 caracteres.');
      return;
    }

    if (datos.autor.length < 2) {
      mostrarError(error, formulario, 'autor', 'Escribe el nombre del autor o autora.');
      return;
    }

    try {
      if (libro) {
        actualizarLibro(libro.id, datos);
        mostrarToast(`La ficha de «${datos.titulo}» quedó actualizada.`);
      } else {
        crearLibro(datos);
        mostrarToast(`«${datos.titulo}» ya ocupa un lugar en el estante.`);
      }

      cerrarModal();
      refrescarEstante();
    } catch (excepcion) {
      console.error(excepcion);
      if (error) error.textContent = 'No se pudo guardar. Inténtalo de nuevo.';
    }
  });
}

function leerFormulario(formulario: HTMLFormElement): DatosLibro | null {
  const datos = new FormData(formulario);
  const titulo = String(datos.get('titulo') ?? '').trim();
  const autor = String(datos.get('autor') ?? '').trim();
  const genero = String(datos.get('genero') ?? '').trim();
  const sinopsis = String(datos.get('sinopsis') ?? '').trim();
  const estadoCrudo = String(datos.get('estado') ?? 'leyendo');

  const estado: EstadoLectura = ESTADOS.some((elemento) => elemento.valor === estadoCrudo)
    ? (estadoCrudo as EstadoLectura)
    : 'leyendo';

  return { titulo, autor, genero, estado, sinopsis };
}

function mostrarError(
  contenedor: HTMLElement | null,
  formulario: HTMLFormElement,
  campo: string,
  mensaje: string,
): void {
  if (contenedor) contenedor.textContent = mensaje;
  formulario.querySelector<HTMLElement>(`#${campo}`)?.focus();
}

async function solicitarEliminacion(id: number): Promise<void> {
  const libro = obtenerLibro(id);
  if (!libro) {
    mostrarToast('Ese libro ya no existe.', 'error');
    return;
  }

  const resenas =
    libro.totalResenas === 0
      ? 'No tiene reseñas.'
      : `Se borrarán también sus ${libro.totalResenas} ${
          libro.totalResenas === 1 ? 'reseña' : 'reseñas'
        }.`;

  const confirmado = await confirmarAccion({
    titulo: 'Sacar del estante',
    mensaje: `«${libro.titulo}» desaparecerá del club. ${resenas} Esta acción no se puede deshacer.`,
    accion: 'Eliminar libro',
  });

  if (!confirmado) return;

  try {
    eliminarLibro(id);
    mostrarToast(`«${libro.titulo}» salió del estante.`);
    refrescarEstante();
  } catch (excepcion) {
    console.error(excepcion);
    mostrarToast('No se pudo eliminar el libro.', 'error');
  }
}
