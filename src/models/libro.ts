import { consultar, ejecutar, ultimoIdInsertado } from '../db/database';
import { obtenerOCrearAutor } from './autor';

export type EstadoLectura = 'leyendo' | 'terminado' | 'pausado';

export const ESTADOS: ReadonlyArray<{ valor: EstadoLectura; etiqueta: string }> = [
  { valor: 'leyendo', etiqueta: 'Leyendo ahora' },
  { valor: 'terminado', etiqueta: 'Terminado' },
  { valor: 'pausado', etiqueta: 'En pausa' },
];

export interface Libro {
  id: number;
  titulo: string;
  autorId: number;
  autor: string;
  genero: string;
  estado: EstadoLectura;
  sinopsis: string;
  promedio: number;
  totalResenas: number;
  creadoEn: string;
}

export interface DatosLibro {
  titulo: string;
  autor: string;
  genero: string;
  estado: EstadoLectura;
  sinopsis: string;
}

export interface FiltrosLibros {
  busqueda?: string;
  estado?: EstadoLectura | 'todos';
}

export interface EstadisticasClub {
  libros: number;
  resenas: number;
  promedio: number;
  lectores: number;
}

interface FilaLibro {
  id: number;
  titulo: string;
  autor_id: number;
  autor: string;
  genero: string;
  estado: string;
  sinopsis: string;
  promedio: number;
  total_resenas: number;
  creado_en: string;
}

const SELECCION = `
  SELECT
    l.id,
    l.titulo,
    l.autor_id,
    a.nombre AS autor,
    l.genero,
    l.estado,
    l.sinopsis,
    COALESCE(ROUND(AVG(r.estrellas), 1), 0) AS promedio,
    COUNT(r.id) AS total_resenas,
    l.creado_en
  FROM libros l
  JOIN autores a ON a.id = l.autor_id
  LEFT JOIN resenas r ON r.libro_id = l.id
`;

function mapearLibro(fila: FilaLibro): Libro {
  return {
    id: Number(fila.id),
    titulo: fila.titulo,
    autorId: Number(fila.autor_id),
    autor: fila.autor,
    genero: fila.genero,
    estado: fila.estado as EstadoLectura,
    sinopsis: fila.sinopsis,
    promedio: Number(fila.promedio),
    totalResenas: Number(fila.total_resenas),
    creadoEn: fila.creado_en,
  };
}

function escaparLike(texto: string): string {
  return texto.replace(/[\\%_]/g, (caracter) => `\\${caracter}`);
}

export function listarLibros(filtros: FiltrosLibros = {}): Libro[] {
  const condiciones: string[] = [];
  const parametros: Array<string | number> = [];

  if (filtros.estado && filtros.estado !== 'todos') {
    condiciones.push('l.estado = ?');
    parametros.push(filtros.estado);
  }

  const busqueda = (filtros.busqueda ?? '').trim();
  if (busqueda.length > 0) {
    const patron = `%${escaparLike(busqueda)}%`;
    condiciones.push(
      "(l.titulo LIKE ? ESCAPE '\\' OR a.nombre LIKE ? ESCAPE '\\' OR l.genero LIKE ? ESCAPE '\\')",
    );
    parametros.push(patron, patron, patron);
  }

  const donde = condiciones.length > 0 ? `WHERE ${condiciones.join(' AND ')}` : '';
  const sql = `${SELECCION} ${donde} GROUP BY l.id ORDER BY l.creado_en DESC, l.id DESC`;

  return consultar<FilaLibro>(sql, parametros).map(mapearLibro);
}

export function obtenerLibro(id: number): Libro | null {
  const filas = consultar<FilaLibro>(`${SELECCION} WHERE l.id = ? GROUP BY l.id`, [id]);
  return filas.length > 0 ? mapearLibro(filas[0]) : null;
}

export function crearLibro(datos: DatosLibro): number {
  const autorId = obtenerOCrearAutor(datos.autor);
  ejecutar(
    `INSERT INTO libros (titulo, autor_id, genero, estado, sinopsis)
     VALUES (?, ?, ?, ?, ?)`,
    [
      datos.titulo.trim(),
      autorId,
      datos.genero.trim() || 'Sin clasificar',
      datos.estado,
      datos.sinopsis.trim(),
    ],
  );
  return ultimoIdInsertado();
}

export function actualizarLibro(id: number, datos: DatosLibro): void {
  const autorId = obtenerOCrearAutor(datos.autor);
  ejecutar(
    `UPDATE libros
     SET titulo = ?, autor_id = ?, genero = ?, estado = ?, sinopsis = ?,
         actualizado_en = datetime('now')
     WHERE id = ?`,
    [
      datos.titulo.trim(),
      autorId,
      datos.genero.trim() || 'Sin clasificar',
      datos.estado,
      datos.sinopsis.trim(),
      id,
    ],
  );
}

export function eliminarLibro(id: number): void {
  ejecutar('DELETE FROM libros WHERE id = ?', [id]);
}

export function generarFiltrosVacios(): FiltrosLibros {
  return { busqueda: '', estado: 'todos' };
}

export function obtenerEstadisticas(): EstadisticasClub {
  const fila = consultar<{
    libros: number;
    resenas: number;
    promedio: number | null;
    lectores: number;
  }>(`
    SELECT
      (SELECT COUNT(*) FROM libros)                    AS libros,
      (SELECT COUNT(*) FROM resenas)                   AS resenas,
      (SELECT ROUND(AVG(estrellas), 1) FROM resenas)   AS promedio,
      (SELECT COUNT(DISTINCT alias) FROM resenas)      AS lectores
  `)[0];

  return {
    libros: Number(fila?.libros ?? 0),
    resenas: Number(fila?.resenas ?? 0),
    promedio: Number(fila?.promedio ?? 0),
    lectores: Number(fila?.lectores ?? 0),
  };
}
