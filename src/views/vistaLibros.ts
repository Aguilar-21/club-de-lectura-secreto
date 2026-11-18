import { ESTADOS, type EstadoLectura, type Libro } from '../models/libro';
import { atributo, escaparHtml, estrellasHtml, icono } from './vistaComunes';

const PALETAS: ReadonlyArray<readonly [string, string]> = [
  ['#6d3040', '#2a1119'],
  ['#2f5040', '#10221a'],
  ['#41406e', '#191832'],
  ['#7d5729', '#2e1f0e'],
  ['#2c4f58', '#0f2226'],
  ['#5a3255', '#221224'],
  ['#5c4032', '#241811'],
];

const GENEROS_SUGERIDOS = [
  'Realismo mágico',
  'Misterio literario',
  'Cuento',
  'Contemporánea',
  'Novela histórica',
  'Ciencia ficción',
  'Poesía',
  'Ensayo',
  'Terror',
  'Romance',
];

export function paletaDeLibro(texto: string): readonly [string, string] {
  let hash = 0;
  for (let i = 0; i < texto.length; i += 1) {
    hash = (hash * 31 + texto.charCodeAt(i)) >>> 0;
  }
  return PALETAS[hash % PALETAS.length];
}

function etiquetaEstado(estado: EstadoLectura): string {
  return ESTADOS.find((elemento) => elemento.valor === estado)?.etiqueta ?? estado;
}

function renderTarjetaLibro(libro: Libro, indice: number): string {
  const [tonoA, tonoB] = paletaDeLibro(libro.titulo);
  const inicial = libro.titulo.trim().charAt(0).toUpperCase() || '·';
  const resenasTexto =
    libro.totalResenas === 0
      ? 'Sin reseñas todavía'
      : `${libro.promedio.toFixed(1)} · ${libro.totalResenas} ${
          libro.totalResenas === 1 ? 'reseña' : 'reseñas'
        }`;

  return `
    <article class="libro" data-id="${libro.id}" style="--i:${indice}; --portada-a:${tonoA}; --portada-b:${tonoB}">
      <div class="libro-portada" aria-hidden="true">
        <span class="libro-sello">★ Club Secreto</span>
        <span class="libro-monograma">${escaparHtml(inicial)}</span>
        <span class="libro-serie">N.º ${String(libro.id).padStart(2, '0')}</span>
      </div>

      <div class="libro-cuerpo">
        <div class="libro-meta">
          <span class="chip chip--${libro.estado}">
            <span class="chip-punto" aria-hidden="true"></span>${escaparHtml(etiquetaEstado(libro.estado))}
          </span>
          <span class="libro-genero">${escaparHtml(libro.genero)}</span>
        </div>

        <h3 class="libro-titulo">${escaparHtml(libro.titulo)}</h3>
        <p class="libro-autor">de ${escaparHtml(libro.autor)}</p>

        ${
          libro.sinopsis
            ? `<p class="libro-sinopsis">${escaparHtml(libro.sinopsis)}</p>`
            : '<p class="libro-sinopsis libro-sinopsis--vacia">Sin sinopsis. Solo el título y las ganas.</p>'
        }

        <div class="libro-valoracion">
          ${estrellasHtml(libro.promedio, 'estrellas--sm')}
          <span>${resenasTexto}</span>
        </div>

        <div class="libro-pie">
          <button class="boton boton--pequeno boton--fantasma" type="button" data-accion="detalle" data-id="${libro.id}">
            ${icono('libro')} Reseñas
            <span class="contador">${libro.totalResenas}</span>
          </button>
          <div class="libro-iconos">
            <button class="boton-icono" type="button" data-accion="editar" data-id="${libro.id}" aria-label="Editar ${atributo(libro.titulo)}">
              ${icono('lapiz')}
            </button>
            <button class="boton-icono boton-icono--peligro" type="button" data-accion="eliminar" data-id="${libro.id}" aria-label="Eliminar ${atributo(libro.titulo)}">
              ${icono('papelera')}
            </button>
          </div>
        </div>
      </div>
    </article>
  `;
}

export function renderGrilla(libros: Libro[], filtrosActivos: boolean): string {
  if (libros.length === 0) {
    if (filtrosActivos) {
      return `
        <div class="vacio">
          <span class="vacio-icono">${icono('buscar')}</span>
          <h3>Ningún libro coincide</h3>
          <p>Prueba con otro título, autor o género. El estante sigue ahí.</p>
          <button class="boton boton--fantasma" type="button" data-accion="limpiar-filtros">
            Limpiar búsqueda y filtros
          </button>
        </div>
      `;
    }

    return `
      <div class="vacio">
        <span class="vacio-icono">${icono('vacio')}</span>
        <h3>El estante está vacío todavía</h3>
        <p>Nadie ha dejado su primera lectura. Sé quien rompa el silencio.</p>
        <button class="boton" type="button" data-accion="nuevo-libro">
          ${icono('mas')} Registrar el primer libro
        </button>
      </div>
    `;
  }

  return libros.map((libro, indice) => renderTarjetaLibro(libro, indice)).join('');
}

export function renderFormularioLibro(libro: Libro | null, autores: string[]): string {
  const opcionesEstado = ESTADOS.map(
    (estado) => `
      <option value="${estado.valor}" ${libro?.estado === estado.valor ? 'selected' : ''}>
        ${estado.etiqueta}
      </option>
    `,
  ).join('');

  const listaAutores = autores
    .map((autor) => `<option value="${atributo(autor)}"></option>`)
    .join('');

  const listaGeneros = GENEROS_SUGERIDOS.map(
    (genero) => `<option value="${atributo(genero)}"></option>`,
  ).join('');

  return `
    <header class="modal-encabezado">
      <p class="sobrelinea">${libro ? 'Editar ficha' : 'Nueva entrada'}</p>
      <h2>${libro ? 'Corregir la ficha' : 'Registrar un libro'}</h2>
      <p>
        ${
          libro
            ? 'Ajusta los datos del ejemplar. Las reseñas anónimas se conservan.'
            : 'Anota qué estás leyendo. El club lo guardará en el estante y en SQLite.'
        }
      </p>
    </header>

    <form id="form-libro" class="formulario" novalidate>
      <div class="campo">
        <label for="titulo">Título <span class="requerido">*</span></label>
        <input
          id="titulo"
          name="titulo"
          type="text"
          value="${atributo(libro?.titulo ?? '')}"
          placeholder="Ej. Pedro Páramo"
          autocomplete="off"
          maxlength="120"
          required
        />
      </div>

      <div class="campo-fila">
        <div class="campo">
          <label for="autor">Autor/a <span class="requerido">*</span></label>
          <input
            id="autor"
            name="autor"
            type="text"
            value="${atributo(libro?.autor ?? '')}"
            placeholder="Ej. Juan Rulfo"
            list="lista-autores"
            autocomplete="off"
            maxlength="90"
            required
          />
          <datalist id="lista-autores">${listaAutores}</datalist>
        </div>

        <div class="campo">
          <label for="genero">Género</label>
          <input
            id="genero"
            name="genero"
            type="text"
            value="${atributo(libro?.genero ?? '')}"
            placeholder="Ej. Realismo mágico"
            list="lista-generos"
            autocomplete="off"
            maxlength="60"
          />
          <datalist id="lista-generos">${listaGeneros}</datalist>
        </div>
      </div>

      <div class="campo">
        <label for="estado">Estado de lectura</label>
        <select id="estado" name="estado">${opcionesEstado}</select>
      </div>

      <div class="campo">
        <label for="sinopsis">De qué trata <span class="opcional">(opcional)</span></label>
        <textarea
          id="sinopsis"
          name="sinopsis"
          rows="3"
          maxlength="320"
          placeholder="Una línea para que otros sepan qué encontrarán…"
        >${escaparHtml(libro?.sinopsis ?? '')}</textarea>
      </div>

      <p class="formulario-error" id="error-libro" role="alert"></p>

      <div class="formulario-acciones">
        <button class="boton boton--fantasma" type="button" data-cerrar-modal>Cancelar</button>
        <button class="boton" type="submit">${libro ? 'Guardar cambios' : 'Añadir al estante'}</button>
      </div>
    </form>
  `;
}
