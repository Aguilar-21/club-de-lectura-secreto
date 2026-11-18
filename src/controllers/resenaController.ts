import { obtenerLibro, type Libro } from '../models/libro';
import { crearResena, listarResenas } from '../models/resena';
import { abrirModal, mostrarToast } from '../views/vistaComunes';
import { renderDetalleLibro } from '../views/vistaResenas';

const MENSAJES_ESTRELLAS = [
  '',
  'No era para mí',
  'Me costó',
  'Correcto',
  'Muy bueno',
  'Inolvidable',
];

export function abrirDetalleLibro(id: number): void {
  const libro = obtenerLibro(id);
  if (!libro) {
    mostrarToast('Ese libro ya no está en el estante.', 'error');
    return;
  }
  montarDetalle(libro);
}

function montarDetalle(libro: Libro): void {
  const panel = abrirModal(renderDetalleLibro(libro, listarResenas(libro.id)), {
    clase: 'modal--detalle',
    etiqueta: `Reseñas de ${libro.titulo}`,
  });

  const selector = panel.querySelector<HTMLElement>('#selector-estrellas');
  const oculto = panel.querySelector<HTMLInputElement>('#estrellas');
  const texto = panel.querySelector<HTMLElement>('#texto-estrellas');
  const formulario = panel.querySelector<HTMLFormElement>('#form-resena');
  const comentario = panel.querySelector<HTMLTextAreaElement>('#comentario');
  const error = panel.querySelector<HTMLElement>('#error-resena');

  if (!selector || !oculto || !formulario || !comentario) return;

  const botones = Array.from(selector.querySelectorAll<HTMLButtonElement>('.estrella-boton'));

  const pintar = (valor: number): void => {
    botones.forEach((boton) => {
      const numero = Number(boton.dataset.valor);
      boton.classList.toggle('estrella-boton--activa', numero <= valor);
    });
  };

  const marcarSeleccion = (valor: number): void => {
    botones.forEach((boton) => {
      boton.setAttribute('aria-pressed', String(Number(boton.dataset.valor) === valor));
    });
  };

  const explicar = (valor: number): void => {
    if (!texto) return;
    texto.textContent =
      valor > 0 ? `${valor} de 5 · ${MENSAJES_ESTRELLAS[valor]}` : 'Elige de 1 a 5 estrellas';
  };

  selector.addEventListener('click', (evento) => {
    const boton = (evento.target as HTMLElement).closest<HTMLButtonElement>('.estrella-boton');
    if (!boton) return;

    const valor = Number(boton.dataset.valor);
    oculto.value = String(valor);
    pintar(valor);
    marcarSeleccion(valor);
    explicar(valor);
    if (error) error.textContent = '';
  });

  selector.addEventListener('mouseover', (evento) => {
    const boton = (evento.target as HTMLElement).closest<HTMLButtonElement>('.estrella-boton');
    if (boton) pintar(Number(boton.dataset.valor));
  });

  selector.addEventListener('mouseleave', () => {
    pintar(Number(oculto.value));
  });

  formulario.addEventListener('submit', (evento) => {
    evento.preventDefault();
    const estrellas = Number(oculto.value);
    const contenido = comentario.value.trim();

    if (estrellas < 1 || estrellas > 5) {
      if (error) error.textContent = 'Elige una valoración de 1 a 5 estrellas.';
      botones[0]?.focus();
      return;
    }

    if (contenido.length < 3) {
      if (error) error.textContent = 'Escribe al menos unas palabras sobre el libro.';
      comentario.focus();
      return;
    }

    try {
      const resena = crearResena({ libroId: libro.id, estrellas, comentario: contenido });
      mostrarToast(`Publicada como «${resena.alias}». Nadie sabrá que fuiste tú.`);

      document.dispatchEvent(new CustomEvent('club:datos-actualizados'));

      const actualizado = obtenerLibro(libro.id);
      if (actualizado) montarDetalle(actualizado);
    } catch (excepcion) {
      console.error(excepcion);
      if (error) error.textContent = 'La reseña no se pudo guardar. Inténtalo otra vez.';
    }
  });
}
