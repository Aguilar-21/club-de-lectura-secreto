import { consultar, ejecutar, ultimoIdInsertado } from '../db/database';

export interface Resena {
  id: number;
  libroId: number;
  alias: string;
  estrellas: number;
  comentario: string;
  creadoEn: string;
}

export interface DatosResena {
  libroId: number;
  estrellas: number;
  comentario: string;
}

interface FilaResena {
  id: number;
  libro_id: number;
  alias: string;
  estrellas: number;
  comentario: string;
  creado_en: string;
}

const SUSTANTIVOS = [
  'Pluma',
  'Búho',
  'Cuervo',
  'Faro',
  'Sombra',
  'Tinta',
  'Lámpara',
  'Pájaro',
  'Sauce',
  'Cometa',
  'Helecho',
  'Zorro',
];

const ADJETIVOS = [
  'Errante',
  'Nocturno',
  'Invisible',
  'Insomne',
  'Crepuscular',
  'de Papel',
  'de Medianoche',
  'Silencioso',
  'Anónimo',
  'del Estante',
];

function mapearResena(fila: FilaResena): Resena {
  return {
    id: Number(fila.id),
    libroId: Number(fila.libro_id),
    alias: fila.alias,
    estrellas: Number(fila.estrellas),
    comentario: fila.comentario,
    creadoEn: fila.creado_en,
  };
}

export function generarAlias(): string {
  const sustantivo = SUSTANTIVOS[Math.floor(Math.random() * SUSTANTIVOS.length)];
  const adjetivo = ADJETIVOS[Math.floor(Math.random() * ADJETIVOS.length)];
  return `${sustantivo} ${adjetivo}`;
}

export function listarResenas(libroId: number): Resena[] {
  return consultar<FilaResena>(
    `SELECT id, libro_id, alias, estrellas, comentario, creado_en
     FROM resenas
     WHERE libro_id = ?
     ORDER BY creado_en DESC, id DESC`,
    [libroId],
  ).map(mapearResena);
}

export function crearResena(datos: DatosResena): Resena {
  const alias = generarAlias();
  const estrellas = Math.min(5, Math.max(1, Math.round(datos.estrellas)));

  ejecutar(
    `INSERT INTO resenas (libro_id, alias, estrellas, comentario)
     VALUES (?, ?, ?, ?)`,
    [datos.libroId, alias, estrellas, datos.comentario.trim()],
  );

  const id = ultimoIdInsertado();
  const fila = consultar<FilaResena>(
    `SELECT id, libro_id, alias, estrellas, comentario, creado_en
     FROM resenas WHERE id = ?`,
    [id],
  )[0];

  return mapearResena(fila);
}
