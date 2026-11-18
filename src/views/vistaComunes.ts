export type NombreIcono =
  | 'libro'
  | 'buscar'
  | 'mas'
  | 'lapiz'
  | 'papelera'
  | 'estrella'
  | 'cerrar'
  | 'flecha'
  | 'usuarios'
  | 'chispa'
  | 'candado'
  | 'alerta'
  | 'vacio';

const TRAZOS: Record<NombreIcono, string> = {
  libro:
    '<path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>',
  buscar: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  mas: '<path d="M5 12h14"/><path d="M12 5v14"/>',
  lapiz:
    '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  papelera:
    '<path d="M3 6h18"/><path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/>',
  estrella:
    '<path d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5-5.8-3-5.8 3 1.1-6.5-4.7-4.6 6.5-.9z"/>',
  cerrar: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  flecha: '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
  usuarios:
    '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  chispa:
    '<path d="m12 3-1.9 5.8L4 10.7l5.8 1.9L12 18.4l1.9-5.8L20 10.7l-5.8-1.9z"/><path d="M19 3v3"/><path d="M20.5 4.5h-3"/>',
  candado:
    '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  alerta:
    '<path d="M12 9v4"/><path d="M12 17h.01"/><path d="M10.3 3.6 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.6a2 2 0 0 0-3.4 0Z"/>',
  vacio:
    '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/>',
};

export function icono(nombre: NombreIcono, clase = ''): string {
  return `<svg class="icono ${clase}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${TRAZOS[nombre]}</svg>`;
}

export function escaparHtml(valor: string): string {
  return valor
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function atributo(valor: string): string {
  return escaparHtml(valor);
}

export function estrellasHtml(promedio: number, clase = ''): string {
  const valor = Math.max(0, Math.min(5, promedio));
  const porcentaje = (valor / 5) * 100;
  const fila = Array.from(
    { length: 5 },
    () =>
      '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5-5.8-3-5.8 3 1.1-6.5-4.7-4.6 6.5-.9z"/></svg>',
  ).join('');

  return `<span class="estrellas ${clase}" role="img" aria-label="${valor.toFixed(1)} de 5 estrellas">
    <span class="estrellas-fondo">${fila}</span>
    <span class="estrellas-relleno" style="width:${porcentaje}%">${fila}</span>
  </span>`;
}

function interpretarFecha(valor: string): Date | null {
  const normalizada = valor.includes('T') ? valor : `${valor.replace(' ', 'T')}Z`;
  const fecha = new Date(normalizada);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

export function formatearFecha(valor: string): string {
  const fecha = interpretarFecha(valor);
  if (!fecha) return valor;

  const diferencia = Date.now() - fecha.getTime();
  const dia = 86_400_000;
  const dias = Math.floor(diferencia / dia);

  if (dias <= 0) return 'hoy';
  if (dias === 1) return 'ayer';
  if (dias < 30) return `hace ${dias} días`;

  if (dias < 365) {
    const meses = Math.max(1, Math.floor(dias / 30));
    return `hace ${meses} ${meses === 1 ? 'mes' : 'meses'}`;
  }

  return new Intl.DateTimeFormat('es', { month: 'long', year: 'numeric' }).format(fecha);
}

let focoPrevio: HTMLElement | null = null;

export function abrirModal(
  contenidoHtml: string,
  opciones: { clase?: string; etiqueta?: string } = {},
): HTMLElement {
  const raiz = document.getElementById('modal-root');
  if (!raiz) throw new Error('No existe el contenedor de modales.');

  if (!raiz.classList.contains('modal-abierto')) {
    focoPrevio = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  }

  raiz.classList.add('modal-abierto');
  raiz.innerHTML = `
    <div class="modal-fondo" data-cerrar-modal></div>
    <div class="modal ${opciones.clase ?? ''}" role="dialog" aria-modal="true" aria-label="${atributo(
      opciones.etiqueta ?? 'Ventana del club',
    )}" tabindex="-1">
      <button class="modal-cerrar" type="button" data-cerrar-modal aria-label="Cerrar ventana">
        ${icono('cerrar')}
      </button>
      <div class="modal-cuerpo">${contenidoHtml}</div>
    </div>
  `;

  raiz.querySelectorAll<HTMLElement>('[data-cerrar-modal]').forEach((elemento) => {
    elemento.addEventListener('click', cerrarModal);
  });

  document.body.classList.add('sin-scroll');
  const panel = raiz.querySelector<HTMLElement>('.modal');
  if (!panel) throw new Error('No se pudo crear el modal.');

  requestAnimationFrame(() => {
    const primerCampo = panel.querySelector<HTMLElement>(
      'input:not([type="hidden"]), select, textarea',
    );
    (primerCampo ?? panel).focus({ preventScroll: true });
  });

  return panel;
}

export function cerrarModal(): void {
  const raiz = document.getElementById('modal-root');
  if (!raiz) return;

  raiz.classList.remove('modal-abierto');
  raiz.innerHTML = '';

  const confirmacionAbierta = document
    .getElementById('confirm-root')
    ?.classList.contains('modal-abierto');
  if (!confirmacionAbierta) {
    document.body.classList.remove('sin-scroll');
  }

  if (focoPrevio?.isConnected) {
    focoPrevio.focus({ preventScroll: true });
  }
  focoPrevio = null;
}

export function confirmarAccion(opciones: {
  titulo: string;
  mensaje: string;
  accion: string;
}): Promise<boolean> {
  return new Promise((resolver) => {
    const raiz = document.getElementById('confirm-root');
    if (!raiz) {
      resolver(window.confirm(opciones.mensaje));
      return;
    }

    raiz.classList.add('modal-abierto');
    raiz.innerHTML = `
      <div class="modal-fondo" data-cancelar></div>
      <div class="confirmacion" role="alertdialog" aria-modal="true" aria-labelledby="confirmar-titulo" aria-describedby="confirmar-mensaje">
        <span class="confirmacion-icono">${icono('papelera')}</span>
        <h2 id="confirmar-titulo">${escaparHtml(opciones.titulo)}</h2>
        <p id="confirmar-mensaje">${escaparHtml(opciones.mensaje)}</p>
        <div class="confirmacion-acciones">
          <button class="boton boton--fantasma" type="button" data-cancelar>Cancelar</button>
          <button class="boton boton--peligro" type="button" data-confirmar>${escaparHtml(
            opciones.accion,
          )}</button>
        </div>
      </div>
    `;

    document.body.classList.add('sin-scroll');

    const alPresionarTecla = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') {
        evento.preventDefault();
        finalizar(false);
      }
    };

    const finalizar = (valor: boolean) => {
      document.removeEventListener('keydown', alPresionarTecla);
      raiz.classList.remove('modal-abierto');
      raiz.innerHTML = '';

      const modalAbierto = document
        .getElementById('modal-root')
        ?.classList.contains('modal-abierto');
      if (!modalAbierto) document.body.classList.remove('sin-scroll');

      resolver(valor);
    };

    raiz.querySelectorAll<HTMLElement>('[data-cancelar]').forEach((elemento) => {
      elemento.addEventListener('click', () => finalizar(false));
    });
    raiz.querySelector<HTMLElement>('[data-confirmar]')?.addEventListener('click', () => finalizar(true));
    document.addEventListener('keydown', alPresionarTecla);

    requestAnimationFrame(() => {
      raiz.querySelector<HTMLElement>('[data-confirmar]')?.focus({ preventScroll: true });
    });
  });
}

export function mostrarToast(mensaje: string, tipo: 'exito' | 'error' = 'exito'): void {
  const raiz = document.getElementById('toast-root');
  if (!raiz) return;

  const aviso = document.createElement('div');
  aviso.className = `toast toast--${tipo}`;
  aviso.innerHTML = `
    <span class="toast-icono">${icono(tipo === 'exito' ? 'chispa' : 'alerta')}</span>
    <p>${escaparHtml(mensaje)}</p>
  `;
  raiz.appendChild(aviso);

  window.setTimeout(() => {
    aviso.classList.add('toast--saliendo');
    window.setTimeout(() => aviso.remove(), 320);
  }, 3600);
}

export function iniciarInterfazGlobal(): void {
  document.addEventListener('keydown', (evento) => {
    if (evento.key !== 'Escape') return;

    const confirmacionAbierta = document
      .getElementById('confirm-root')
      ?.classList.contains('modal-abierto');
    if (confirmacionAbierta) return;

    cerrarModal();
  });
}
