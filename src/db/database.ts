import initSqlJs, { type Database, type SqlJsStatic, type SqlValue } from 'sql.js';
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url';

const CLAVE_ALMACEN = 'club-lectura-secreto:sqlite:v1';
const TAMANO_TROZO = 0x8000;

const ESQUEMA = `
  CREATE TABLE IF NOT EXISTS autores (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre    TEXT NOT NULL COLLATE NOCASE UNIQUE,
    creado_en TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS libros (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo         TEXT NOT NULL,
    autor_id       INTEGER NOT NULL REFERENCES autores(id) ON DELETE CASCADE,
    genero         TEXT NOT NULL DEFAULT 'Sin clasificar',
    estado         TEXT NOT NULL DEFAULT 'leyendo'
                   CHECK (estado IN ('leyendo', 'terminado', 'pausado')),
    sinopsis       TEXT NOT NULL DEFAULT '',
    creado_en      TEXT NOT NULL DEFAULT (datetime('now')),
    actualizado_en TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS resenas (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    libro_id   INTEGER NOT NULL REFERENCES libros(id) ON DELETE CASCADE,
    alias      TEXT NOT NULL,
    estrellas  INTEGER NOT NULL CHECK (estrellas BETWEEN 1 AND 5),
    comentario TEXT NOT NULL,
    creado_en  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_libros_estado  ON libros(estado);
  CREATE INDEX IF NOT EXISTS idx_resenas_libro  ON resenas(libro_id);
`;

let sqlJs: SqlJsStatic | null = null;
let baseDeDatos: Database | null = null;
let temporizadorGuardado: number | undefined;

function obtenerBase(): Database {
  if (!baseDeDatos) {
    throw new Error('La base de datos todavía no está lista.');
  }
  return baseDeDatos;
}

function aBase64(bytes: Uint8Array): string {
  let texto = '';
  for (let i = 0; i < bytes.length; i += TAMANO_TROZO) {
    texto += String.fromCharCode(...bytes.subarray(i, i + TAMANO_TROZO));
  }
  return btoa(texto);
}

function desdeBase64(texto: string): Uint8Array {
  const binario = atob(texto);
  const bytes = new Uint8Array(binario.length);
  for (let i = 0; i < binario.length; i += 1) {
    bytes[i] = binario.charCodeAt(i);
  }
  return bytes;
}

function leerBaseGuardada(): Uint8Array | null {
  try {
    const crudo = localStorage.getItem(CLAVE_ALMACEN);
    return crudo ? desdeBase64(crudo) : null;
  } catch (error) {
    console.warn('No se pudo leer la base guardada; se creará una nueva.', error);
    return null;
  }
}

export function persistirAhora(): void {
  if (!baseDeDatos) return;
  if (temporizadorGuardado !== undefined) {
    window.clearTimeout(temporizadorGuardado);
    temporizadorGuardado = undefined;
  }
  try {
    localStorage.setItem(CLAVE_ALMACEN, aBase64(baseDeDatos.export()));
  } catch (error) {
    console.error('No se pudo guardar la base de datos en el navegador.', error);
  }
}

export function programarGuardado(): void {
  if (temporizadorGuardado !== undefined) {
    window.clearTimeout(temporizadorGuardado);
  }
  temporizadorGuardado = window.setTimeout(persistirAhora, 120);
}

export async function iniciarBaseDeDatos(): Promise<void> {
  if (baseDeDatos) return;

  sqlJs = await initSqlJs({
    locateFile: (archivo) => (archivo.endsWith('.wasm') ? wasmUrl : archivo),
  });

  const guardada = leerBaseGuardada();
  baseDeDatos = guardada ? new sqlJs.Database(guardada) : new sqlJs.Database();

  baseDeDatos.run('PRAGMA foreign_keys = ON;');
  baseDeDatos.run(ESQUEMA);

  if (!guardada) {
    sembrarDatos(baseDeDatos);
  }

  persistirAhora();

  window.addEventListener('beforeunload', persistirAhora);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') persistirAhora();
  });
}

export function consultar<T>(sql: string, parametros: SqlValue[] = []): T[] {
  const sentencia = obtenerBase().prepare(sql);
  try {
    if (parametros.length > 0) sentencia.bind(parametros);
    const filas: T[] = [];
    while (sentencia.step()) {
      filas.push(sentencia.getAsObject() as unknown as T);
    }
    return filas;
  } finally {
    sentencia.free();
  }
}

export function ejecutar(sql: string, parametros: SqlValue[] = []): void {
  obtenerBase().run(sql, parametros);
  programarGuardado();
}

export function ultimoIdInsertado(): number {
  const filas = consultar<{ id: number }>('SELECT last_insert_rowid() AS id');
  return Number(filas[0]?.id ?? 0);
}

function sembrarDatos(base: Database): void {
  const insertarAutor = base.prepare('INSERT INTO autores (nombre) VALUES (?)');
  const insertarLibro = base.prepare(`
    INSERT INTO libros (titulo, autor_id, genero, estado, sinopsis, creado_en, actualizado_en)
    VALUES (?, ?, ?, ?, ?, datetime('now', ?), datetime('now', ?))
  `);
  const insertarResena = base.prepare(`
    INSERT INTO resenas (libro_id, alias, estrellas, comentario, creado_en)
    VALUES (?, ?, ?, ?, datetime('now', ?))
  `);

  const autores = [
    'Gabriel García Márquez',
    'Carlos Ruiz Zafón',
    'Jorge Luis Borges',
    'Haruki Murakami',
    'Umberto Eco',
    'Isabel Allende',
  ];

  const idsAutores = new Map<string, number>();
  for (const autor of autores) {
    insertarAutor.run([autor]);
    idsAutores.set(autor, Number(base.exec('SELECT last_insert_rowid()')[0]?.values[0]?.[0] ?? 0));
  }

  interface SemillaLibro {
    titulo: string;
    autor: string;
    genero: string;
    estado: string;
    sinopsis: string;
    dias: number;
    resenas: Array<{ alias: string; estrellas: number; comentario: string; dias: number }>;
  }

  const libros: SemillaLibro[] = [
    {
      titulo: 'Cien años de soledad',
      autor: 'Gabriel García Márquez',
      genero: 'Realismo mágico',
      estado: 'terminado',
      sinopsis:
        'Siete generaciones de los Buendía atraviesan Macondo entre prodigios, guerras y soledades que se repiten como un sueño.',
      dias: 64,
      resenas: [
        {
          alias: 'Pluma Errante',
          estrellas: 5,
          comentario:
            'Cerré el libro y Macondo siguió lloviendo dentro de mí durante semanas. Una genealogía de la memoria que no se olvida.',
          dias: 41,
        },
        {
          alias: 'Búho de Medianoche',
          estrellas: 4,
          comentario:
            'Me costó entrar, pero cuando entendí el ritmo de las generaciones ya no pude soltarlo. La última página es un golpe perfecto.',
          dias: 27,
        },
        {
          alias: 'Tinta Invisible',
          estrellas: 5,
          comentario: 'Cada frase parece escrita con la intención de quedarse a vivir en quien la lee.',
          dias: 12,
        },
      ],
    },
    {
      titulo: 'La sombra del viento',
      autor: 'Carlos Ruiz Zafón',
      genero: 'Misterio literario',
      estado: 'leyendo',
      sinopsis:
        'Un joven descubre el Cementerio de los Libros Olvidados y un volumen maldito que lo arrastra a la Barcelona de posguerra.',
      dias: 21,
      resenas: [
        {
          alias: 'La Sombra Lectora',
          estrellas: 5,
          comentario:
            'Huele a papel viejo y a secretos. Lo estoy leyendo de noche, con una lámpara, como debe ser.',
          dias: 9,
        },
        {
          alias: 'Voz de Papel',
          estrellas: 4,
          comentario: 'La trama engancha, aunque a veces se enamora demasiado de sus propias metáforas. Aun así, qué metáforas.',
          dias: 4,
        },
      ],
    },
    {
      titulo: 'Ficciones',
      autor: 'Jorge Luis Borges',
      genero: 'Cuento',
      estado: 'terminado',
      sinopsis:
        'Laberintos, bibliotecas infinitas, espejos y destinos que se cruzan en relatos donde la imaginación juega con la lógica.',
      dias: 48,
      resenas: [
        {
          alias: 'El Lector N.º 7',
          estrellas: 5,
          comentario:
            'Leer a Borges es aceptar que el universo cabe en una biblioteca y que nunca terminaremos de recorrerla. Volveré siempre.',
          dias: 30,
        },
        {
          alias: 'Cornejo Anónimo',
          estrellas: 3,
          comentario:
            'Admiro su ingenio, pero algunos cuentos me dejaron fuera, como si el autor escribiera para un club al que no pertenezco. Igual pienso releerlo.',
          dias: 18,
        },
        {
          alias: 'Lámpara de Aceite',
          estrellas: 5,
          comentario: '“El jardín de senderos que se bifurcan” merece una relectura por semana.',
          dias: 6,
        },
      ],
    },
    {
      titulo: 'Tokio blues',
      autor: 'Haruki Murakami',
      genero: 'Contemporánea',
      estado: 'pausado',
      sinopsis:
        'Un joven recuerda sus años universitarios en Tokio, entre pérdidas, música, amistades imposibles y un primer amor que duele.',
      dias: 35,
      resenas: [
        {
          alias: 'Pluma Errante',
          estrellas: 4,
          comentario:
            'Melancolía pura y una banda sonora que se queda. Lo pausé para no terminarlo demasiado pronto.',
          dias: 15,
        },
      ],
    },
    {
      titulo: 'El nombre de la rosa',
      autor: 'Umberto Eco',
      genero: 'Novela histórica',
      estado: 'leyendo',
      sinopsis:
        'En una abadía medieval, un fraile y su aprendiz investigan muertes que parecen orbitar alrededor de una biblioteca prohibida.',
      dias: 14,
      resenas: [
        {
          alias: 'Búho de Medianoche',
          estrellas: 5,
          comentario:
            'Un laberinto de páginas y de ideas. Me detengo a subrayar cada dos párrafos, así que avanzaré durante meses.',
          dias: 8,
        },
        {
          alias: 'Tinta Invisible',
          estrellas: 4,
          comentario: 'Denso, erudito y fascinante. No es una lectura rápida, pero tampoco lo pretende.',
          dias: 3,
        },
      ],
    },
    {
      titulo: 'La casa de los espíritus',
      autor: 'Isabel Allende',
      genero: 'Realismo mágico',
      estado: 'terminado',
      sinopsis:
        'La historia de la familia Trueba cruza cuatro generaciones, entre presagios, política y mujeres que sostienen el mundo.',
      dias: 7,
      resenas: [],
    },
  ];

  for (const libro of libros) {
    insertarLibro.run([
      libro.titulo,
      idsAutores.get(libro.autor) ?? null,
      libro.genero,
      libro.estado,
      libro.sinopsis,
      `-${libro.dias} days`,
      `-${libro.dias - 1} days`,
    ]);
    const idLibro = Number(base.exec('SELECT last_insert_rowid()')[0]?.values[0]?.[0] ?? 0);

    for (const resena of libro.resenas) {
      insertarResena.run([
        idLibro,
        resena.alias,
        resena.estrellas,
        resena.comentario,
        `-${resena.dias} days`,
      ]);
    }
  }

  insertarAutor.free();
  insertarLibro.free();
  insertarResena.free();
}
