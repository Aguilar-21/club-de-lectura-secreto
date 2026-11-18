import { icono } from './vistaComunes';

export function renderizarAplicacion(): string {
  return `
    <div class="barra-envoltorio">
      <header class="barra">
        <a class="marca" href="#" aria-label="El Club de Lectura Secreto, inicio">
          <span class="marca-sello" aria-hidden="true">★</span>
          <span class="marca-texto">
            <strong>El Club de Lectura</strong>
            <small>Secreto · desde 2026</small>
          </span>
        </a>
        <p class="barra-nota">${icono('candado')} Sin cuentas. Sin nombres reales.</p>
      </header>
    </div>

    <main>
      <section class="hero" aria-labelledby="titulo-club">
        <div class="hero-texto">
          <p class="sobrelinea"><span class="sobrelinea-linea"></span> Sociedad literaria · Est. 2026</p>
          <h1 id="titulo-club">El Club de Lectura <em>Secreto</em></h1>
          <p class="hero-descripcion">
            Un estante compartido para los libros que estás leyendo y las voces que
            prefieren no firmar. Registra, corrige y deja reseñas anónimas:
            <strong>cada lectura deja una huella, nunca un nombre.</strong>
          </p>
          <div class="hero-acciones">
            <button class="boton boton--grande" type="button" data-accion="nuevo-libro">
              ${icono('mas')} Registrar un libro
            </button>
            <a class="boton boton--fantasma boton--grande" href="#estante">
              Bajar al estante ${icono('flecha')}
            </a>
          </div>
          <p class="hero-nota">${icono('candado')} Tus reseñas se publican con un alias inventado.</p>
        </div>

        <aside class="credencial" aria-label="Credencial de socio del club">
          <div class="credencial-marco">
            <div class="credencial-cabecera">
              <span class="credencial-club">Sociedad de lectores</span>
              <span class="credencial-serie">Serie A</span>
            </div>
            <p class="credencial-titulo">El Club de<br />Lectura Secreto</p>
            <div class="credencial-separador" aria-hidden="true"></div>
            <dl class="credencial-datos">
              <div><dt>Socio</dt><dd>N.º 001</dd></div>
              <div><dt>Ingreso</dt><dd>2026</dd></div>
              <div><dt>Regla</dt><dd>Leer sin decir quién eres</dd></div>
            </dl>
            <span class="credencial-sello" aria-hidden="true">★</span>
            <p class="credencial-pie">“Nadie sabe quién escribe.<br />Todos sabemos qué se siente.”</p>
          </div>
        </aside>
      </section>

      <section class="panel-estadisticas" aria-label="Cifras del club">
        <div class="estadistica">
          <span class="estadistica-valor" id="stat-libros">—</span>
          <span class="estadistica-etiqueta">libros en el estante</span>
        </div>
        <div class="estadistica">
          <span class="estadistica-valor" id="stat-resenas">—</span>
          <span class="estadistica-etiqueta">reseñas anónimas</span>
        </div>
        <div class="estadistica">
          <span class="estadistica-valor" id="stat-promedio">—</span>
          <span class="estadistica-etiqueta">estrellas de promedio</span>
        </div>
        <div class="estadistica">
          <span class="estadistica-valor" id="stat-lectores">—</span>
          <span class="estadistica-etiqueta">alias entre los márgenes</span>
        </div>
      </section>

      <section class="estante" id="estante" aria-labelledby="titulo-estante">
        <div class="estante-cabecera">
          <div>
            <p class="sobrelinea"><span class="sobrelinea-linea"></span> El estante compartido</p>
            <h2 id="titulo-estante">Libros que están <em>viviendo</em> ahora</h2>
            <p class="resumen-estante" id="resumen-estante">Cargando el catálogo…</p>
          </div>
          <button class="boton" type="button" data-accion="nuevo-libro">
            ${icono('mas')} Registrar libro
          </button>
        </div>

        <div class="barra-filtros">
          <label class="buscador" for="buscador">
            ${icono('buscar')}
            <input
              id="buscador"
              type="search"
              placeholder="Buscar por título, autor o género…"
              autocomplete="off"
              aria-label="Buscar libros"
            />
          </label>
          <div class="filtros" role="group" aria-label="Filtrar libros por estado de lectura">
            <button class="filtro" type="button" data-filtro="todos" aria-pressed="true">Todos</button>
            <button class="filtro" type="button" data-filtro="leyendo" aria-pressed="false">Leyendo</button>
            <button class="filtro" type="button" data-filtro="terminado" aria-pressed="false">Terminados</button>
            <button class="filtro" type="button" data-filtro="pausado" aria-pressed="false">En pausa</button>
          </div>
        </div>

        <div id="grilla-libros" class="grilla" aria-live="polite">
          <div class="esqueleto-tarjeta" aria-hidden="true"></div>
          <div class="esqueleto-tarjeta" aria-hidden="true"></div>
          <div class="esqueleto-tarjeta" aria-hidden="true"></div>
        </div>
      </section>

      <section class="juramento" aria-labelledby="titulo-juramento">
        <div class="juramento-texto">
          <p class="sobrelinea"><span class="sobrelinea-linea"></span> El juramento del club</p>
          <blockquote id="titulo-juramento">
            “Un libro no se termina:<br />se comparte en voz baja.”
          </blockquote>
          <p>
            Las reseñas se firman con alias inventados. La base de datos viaja contigo:
            SQLite corre dentro de tu navegador y guarda todo en este dispositivo,
            sin cuentas ni servidores.
          </p>
        </div>
        <ul class="juramento-lista">
          <li><span>01</span> Sin registro</li>
          <li><span>02</span> Sin nombres reales</li>
          <li><span>03</span> Datos persistentes</li>
        </ul>
      </section>
    </main>

    <footer class="pie">
      <div class="pie-marca">
        <span class="marca-sello" aria-hidden="true">★</span>
        <p>El Club de Lectura Secreto</p>
      </div>
      <p class="pie-tecnologia">Hecho con SQLite en el navegador · Vite + TypeScript</p>
      <a class="pie-enlace" href="https://github.com/Aguilar-21/club-de-lectura-secreto" target="_blank" rel="noopener">
        Ver el repositorio ${icono('flecha')}
      </a>
    </footer>
  `;
}
