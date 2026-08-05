/*
 * Conexión a PostgreSQL.
 *
 * SE USA UN POOL Y NO UNA CONEXIÓN SUELTA. Abrir una conexión por consulta es
 * de las formas más rápidas de tumbar un plan de hosting chico: el saludo
 * inicial de PostgreSQL (TCP + autenticación) cuesta más que la mayoría de las
 * consultas que hace este panel. El pool las reutiliza.
 *
 * LAS CREDENCIALES NO VAN EN EL CÓDIGO. Vienen del .env, que está en
 * .gitignore. Node las lee solo con `--env-file=.env`, que ya está puesto en
 * los scripts de package.json — por eso este proyecto no necesita la librería
 * dotenv ni ninguna otra dependencia para esto.
 *
 * Hoy apunta a un PostgreSQL instalado en la misma máquina. El día que se
 * hospede, cambian los valores del .env y este archivo no se toca.
 */

import pg from 'pg';

const { Pool, types } = pg;

/*
  NUMERIC llega como TEXTO, a propósito, y conviene entender por qué antes de
  "arreglarlo".

  El driver no lo convierte a number porque el number de JavaScript es un
  flotante de doble precisión y no puede representar exactamente todos los
  decimales: 0.1 + 0.2 da 0.30000000000000004. En dinero eso son totales que no
  cuadran por un colón, y en un sistema de ventas eso es un error que alguien
  tiene que ir a buscar a mano.

  Por eso los montos se dejan como string de punta a punta y TODA la aritmética
  de dinero se hace en SQL, donde NUMERIC es exacto. Ver ventaManual.js.

  Esta línea no cambia el comportamiento —es el que ya trae el driver—; está
  escrita para que nadie lo "corrija" sin leer esto primero.
*/
const OID_NUMERIC = 1700;
types.setTypeParser(OID_NUMERIC, (valor) => valor);

function exigir(clave) {
    const valor = process.env[clave];
    if (!valor) {
        throw new Error(
            `Falta la variable ${clave}. Copiá .env.ejemplo a .env y llenalo. ` +
            `Si ya existe, revisá que el servidor se arranque con "npm run iniciar", ` +
            `que es lo que le pasa --env-file a Node.`
        );
    }
    return valor;
}

export const pool = new Pool({
    host: process.env.BD_HOST || 'localhost',
    port: Number(process.env.BD_PUERTO || 5432),
    database: exigir('BD_NOMBRE'),
    user: exigir('BD_USUARIO'),
    password: exigir('BD_CLAVE'),

    /* Un panel que usan dos o tres personas no necesita más. Un pool grande
       contra una base chica solo consume conexiones que el servidor tiene
       limitadas. */
    max: 10,
    idleTimeoutMillis: 30000,

    /* Si la base no contesta en 5 segundos, algo está mal: es mejor un error
       claro que una pantalla cargando para siempre. */
    connectionTimeoutMillis: 5000
});

/*
  Un error en una conexión que está en reposo no tiene a quién avisarle, y sin
  este manejador Node considera que es un error no atendido y mata el proceso
  entero. Con esto el pool descarta esa conexión y sigue.
*/
pool.on('error', (error) => {
    console.error('[La Morán] Conexión inactiva caída:', error.message);
});

/** Atajo para consultas sueltas que no necesitan transacción. */
export const consultar = (texto, valores) => pool.query(texto, valores);

/**
 * Ejecuta una función dentro de una transacción.
 *
 * Toma una conexión del pool, abre la transacción, y confirma o revierte según
 * cómo termine. El `finally` con release() es lo que impide la fuga: una
 * conexión que no se devuelve al pool queda ocupada para siempre, y con diez
 * fugas el panel deja de responder sin ningún error visible.
 */
export async function enTransaccion(trabajo) {
    const conexion = await pool.connect();
    try {
        await conexion.query('BEGIN');
        const resultado = await trabajo(conexion);
        await conexion.query('COMMIT');
        return resultado;
    } catch (error) {
        await conexion.query('ROLLBACK');
        throw error;
    } finally {
        conexion.release();
    }
}
