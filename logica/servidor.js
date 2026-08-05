/*
 * Servidor de Avícola La Morán.
 *
 * Hace dos cosas:
 *   1. Sirve el sitio estático de vistas/ (HTML, CSS, JS, imágenes).
 *   2. Expone la API bajo /api/, que es la que habla con PostgreSQL.
 *
 * POR QUÉ AMBAS COSAS EN EL MISMO PROCESO
 * Porque así el sitio y la API viven en el mismo origen, y el navegador no
 * aplica CORS. Separándolos habría que configurar cabeceras de origen cruzado
 * en cada respuesta, para un panel que usan tres personas de la misma familia.
 *
 * De paso resuelve el problema que ya existía: plantillas.js usa fetch() para
 * inyectar el encabezado y la barra lateral, y eso no funciona abriendo el HTML
 * con doble clic (file://). Con este servidor, `npm run iniciar` y listo.
 *
 * Arranque:
 *   npm install        (una sola vez)
 *   npm run iniciar    → http://localhost:3000
 *   npm run dev        → igual, pero se reinicia solo al guardar
 */

import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { rutasInventario } from './rutas/inventario.js';
import { rutasVentas } from './rutas/ventas.js';
import { manejadorDeErrores, error } from './comun/respuesta.js';
import { pool } from './configuracion/conexion.js';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.join(AQUI, '..');
const PUERTO = Number(process.env.PUERTO || 3000);

const app = express();

/* Límite chico a propósito: el cuerpo más grande que recibe este panel es una
   venta con unas pocas líneas. Sin límite, cualquiera puede mandar un JSON de
   cientos de megas y tumbar el proceso. */
app.use(express.json({ limit: '64kb' }));

/* El sitio estático. vistas/ se sirve tal cual: las rutas relativas de las
   páginas (../../estilos/…) siguen funcionando igual que con cualquier
   servidor de archivos. */
app.use(express.static(path.join(RAIZ, 'vistas')));

/* La API. Todo lo que toca la base cuelga de /api/. */
app.use('/api/inventario', rutasInventario);
app.use('/api/ventas', rutasVentas);

/* Una ruta /api/ que no existe tiene que contestar JSON, no el HTML de una
   página. Si contestara HTML, el fetch() del frontend intentaría parsearlo como
   JSON y el error que vería la persona sería un críptico "Unexpected token <". */
app.use('/api', (req, res) => error(res, 'Ese recurso no existe.', 404));

/* Va el ÚLTIMO: Express reconoce el manejador de errores por sus cuatro
   parámetros y solo lo usa para lo que no atendió nadie más. */
app.use(manejadorDeErrores);

const servidor = app.listen(PUERTO, () => {
    console.log(`[La Morán] Sitio en   http://localhost:${PUERTO}/`);
    console.log(`[La Morán] Panel en   http://localhost:${PUERTO}/paginas/admin/Home-admin.html`);
    console.log(`[La Morán] API en     http://localhost:${PUERTO}/api/inventario`);
});

/*
  Apagado ordenado. Sin esto, Ctrl+C corta el proceso de golpe y deja
  conexiones abiertas del lado de PostgreSQL hasta que expiran solas. En
  desarrollo, reiniciando muchas veces, se llega al límite de conexiones y la
  base empieza a rechazar sin motivo aparente.
*/
for (const senal of ['SIGINT', 'SIGTERM']) {
    process.on(senal, () => {
        console.log('\n[La Morán] Cerrando…');
        servidor.close(async () => {
            await pool.end();
            process.exit(0);
        });
    });
}
