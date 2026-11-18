import { ESTADOS, type Libro } from '../models/libro';
import type { Resena } from '../models/resena';
import { escaparHtml, estrellasHtml, formatearFecha, icono } from './vistaComunes';
import { paletaDeLibro } from './vistaLibros';

function etiquetaEstado(libro: Libro): string {
  return ESTADOS.find((estado) => estado.valor === libro.estado)?.etiqueta ?? libro.estado;
}

function inicialDe(texto: string): string {
  return texto.trim().charAt(0).toUpperCase() || '·';
}

function renderResena(resena: Resena): string {
  return `
    <article class="resena">
      <header class="resena-cabecera">
        <span class="resena-avatar" aria-hidden="true">${escaparHtml(inicialDe(resena.alias))}</span>
        <div class="resena-identidad">
          <p class="resena-alias">${escaparHtml(resena.alias)}</p>
          <p class="resena-fecha">${escaparHtml(formatearFecha(resena.creadoEn))}</p>
        </div>
        <div class="resena-puntuacion">
          ${estrellasHtml(resena.estrellas, 'estrellas--sm')}
          <span>${resena.estrellas}/5</span>
        </div>
      </header>
      <p class="resena-texto">${escaparHtml(resena.comentario)}</p>
    </article>
  `;
}

export function renderDetalleLibro(libro: Libro, resenas: Resena[]): string {
  const [tonoA, tonoB] = paletaDeLibro(libro.titulo);
  const promedioTexto = libro.totalResenas > 0 ? libro.promedio.toFixed(1) : '—';
  const totalTexto =
    libro.totalResenas === 0
      ? 'Todavía sin reseñas'
      : `${libro.totalResenas} ${libro.totalResenas === 1 ? 'reseña anónima' : 'reseñas anónimas'}`;

  const estrellasSelector = [1, 2, 3, 4, 5]
    .map(
      (valor) => `
        <button
          class="estrella-boton"
          type="button"
          data-valor="${valor}"
          aria-label="${valor} ${valor === 1 ? 'estrella' : 'estrellas'}"
          aria-pressed="false"
        >${icono('estrella')}</button>
      `,
    )
    .join('');

  return `
    <div class="detalle">
      <aside class="detalle-ficha">
        <div
          class="detalle-portada"
          style="--portada-a:${tonoA}; --portada-b:${tonoB}"
          aria-hidden="true"
        >
          <span class="libro-sello">★ Club Secreto</span>
          <span class="detalle-monograma">${escaparHtml(inicialDe(libro.titulo))}</span>
          <span class="libro-serie">N.º ${String(libro.id).padStart(2, '0')}</span>
        </div>

        <div class="detalle-datos">
          <div class="detalle-meta">
            <span class="chip chip--${libro.estado}">
              <span class="chip-punto" aria-hidden="true"></span>${escaparHtml(etiquetaEstado(libro))}
            </span>
            <span class="detalle-genero">${escaparHtml(libro.genero)}</span>
          </div>
          <h2 class="detalle-titulo">${escaparHtml(libro.titulo)}</h2>
          <p class="detalle-autor">de ${escaparHtml(libro.autor)}</p>
          <p class="detalle-sinopsis">
            ${
              libro.sinopsis
                ? escaparHtml(libro.sinopsis)
                : 'Nadie dejó una sinopsis. A veces el silencio también es una pista.'
            }
          </p>
        </div>

        <div class="detalle-promedio">
          <span class="promedio-numero">${promedioTexto}</span>
          <div class="promedio-detalle">
            ${estrellasHtml(libro.promedio, 'estrellas--grandes')}
            <p>${escaparHtml(totalTexto)}</p>
          </div>
        </div>

        <form id="form-resena" class="formulario formulario--resena" novalidate>
          <h3>Deja tu reseña anónima</h3>
          <p class="nota-secreta">
            ${icono('candado')} El club te asignará un alias. Tu nombre no se guarda.
          </p>

          <div class="campo">
            <span class="etiqueta-campo">Tu valoración <span class="requerido">*</span></span>
            <div class="selector-estrellas" id="selector-estrellas" role="group" aria-label="Valoración de 1 a 5 estrellas">
              ${estrellasSelector}
            </div>
            <input type="hidden" id="estrellas" name="estrellas" value="0" />
            <p class="ayuda-estrellas" id="texto-estrellas">Elige de 1 a 5 estrellas</p>
          </div>

          <div class="campo">
            <label for="comentario">Tu reseña <span class="requerido">*</span></label>
            <textarea
              id="comentario"
              name="comentario"
              rows="3"
              maxlength="400"
              placeholder="¿Qué te está dejando este libro?"
              required
            ></textarea>
          </div>

          <p class="formulario-error" id="error-resena" role="alert"></p>

          <button class="boton boton--ancho" type="submit">
            ${icono('chispa')} Publicar en el anonimato
          </button>
        </form>
      </aside>

      <section class="detalle-resenas" aria-label="Reseñas del libro">
        <header class="detalle-resenas-cabecera">
          <div>
            <p class="sobrelinea">Voces del margen</p>
            <h3>Lo que se dice en voz baja</h3>
          </div>
          <span class="contador contador--grande">${libro.totalResenas}</span>
        </header>

        <div class="lista-resenas">
          ${
            resenas.length > 0
              ? resenas.map(renderResena).join('')
              : `
                <div class="resenas-vacio">
                  <span class="resenas-vacio-comilla" aria-hidden="true">“</span>
                  <p>Este libro aún no tiene voces.<br />La primera puede ser la tuya.</p>
                </div>
              `
          }
        </div>

        <footer class="detalle-pie">
          ${icono('candado')}
          <p>Las reseñas se guardan con alias inventados. El club no conserva nombres.</p>
        </footer>
      </section>
    </div>
  `;
}
