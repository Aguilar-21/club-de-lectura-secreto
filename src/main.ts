import './styles/styles.css';
import { iniciarBaseDeDatos } from './db/database';
import { iniciarLibros } from './controllers/libroController';
import { iniciarInterfazGlobal } from './views/vistaComunes';
import { renderizarAplicacion } from './views/vistaApp';

async function arrancar(): Promise<void> {
  const app = document.querySelector<HTMLDivElement>('#app');

  if (!app) {
    console.error('No se encontró el contenedor principal de la aplicación.');
    return;
  }

  try {
    await iniciarBaseDeDatos();

    app.innerHTML = renderizarAplicacion();
    iniciarLibros();
    iniciarInterfazGlobal();
    document.body.classList.add('aplicacion-lista');
  } catch (error) {
    console.error('No se pudo iniciar la base de datos SQLite:', error);

    app.innerHTML = `
      <div class="error-fatal" role="alert">
        <span class="error-fatal-sello" aria-hidden="true">★</span>
        <h1>El estante no pudo abrirse</h1>
        <p>
          SQLite necesita WebAssembly y almacenamiento local para funcionar.
          Revisa que tu navegador no esté en modo privado estricto y vuelve a intentarlo.
        </p>
        <button class="boton" type="button" id="reintentar">Volver a intentar</button>
      </div>
    `;

    app.querySelector<HTMLButtonElement>('#reintentar')?.addEventListener('click', () => {
      window.location.reload();
    });
  }
}

void arrancar();
