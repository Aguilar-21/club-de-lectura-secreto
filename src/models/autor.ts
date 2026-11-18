import { consultar, ejecutar, ultimoIdInsertado } from '../db/database';

export interface Autor {
  id: number;
  nombre: string;
  totalLibros: number;
}

interface FilaAutor {
  id: number;
  nombre: string;
  total_libros: number;
}

export function listarAutores(): Autor[] {
  return consultar<FilaAutor>(`
    SELECT a.id, a.nombre, COUNT(l.id) AS total_libros
    FROM autores a
    LEFT JOIN libros l ON l.autor_id = a.id
    GROUP BY a.id
    ORDER BY a.nombre COLLATE NOCASE ASC
  `).map((fila) => ({
    id: fila.id,
    nombre: fila.nombre,
    totalLibros: Number(fila.total_libros),
  }));
}

export function obtenerOCrearAutor(nombre: string): number {
  const limpio = nombre.trim().replace(/\s+/g, ' ');
  const existente = consultar<{ id: number }>(
    'SELECT id FROM autores WHERE nombre = ? COLLATE NOCASE LIMIT 1',
    [limpio],
  );

  if (existente.length > 0) {
    return Number(existente[0].id);
  }

  ejecutar('INSERT INTO autores (nombre) VALUES (?)', [limpio]);
  return ultimoIdInsertado();
}
