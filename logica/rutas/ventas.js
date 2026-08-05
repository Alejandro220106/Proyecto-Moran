/*
 * Rutas de ventas manuales.
 *
 * Lo consume el formulario de paginas/admin/VentasManuales-admin.html.
 *
 * NO SE MANEJAN DATOS BANCARIOS. Una venta manual ya se cobró en efectivo en
 * la ruta o en la finca; acá solo se anota qué salió. Nada de tarjetas.
 */

import { Router } from 'express';
import * as ventaManual from '../modelos/ventaManual.js';
import { exito, asincrono, ErrorDeNegocio } from '../comun/respuesta.js';

export const rutasVentas = Router();

/*
  POST /api/ventas
  Cuerpo:
    {
      "comprador": "Texto libre o nada",
      "lineas": [ { "id_producto": 3, "cantidad": 2 } ]
    }

  Los errores del modelo ya vienen con su código (400 si lo enviado no tiene
  sentido, 409 si choca con el stock); el manejador de errores los traduce.
*/
rutasVentas.post('/', asincrono(async (req, res) => {
    const { lineas, comprador } = req.body ?? {};

    if (!Array.isArray(lineas) || lineas.length === 0) {
        throw new ErrorDeNegocio('La venta no trae ningún producto.', 400);
    }

    const venta = await ventaManual.registrar(lineas, comprador ?? null);
    exito(res, venta, 201);
}));

/* GET /api/ventas → las últimas ventas manuales, para la tabla de historial. */
rutasVentas.get('/', asincrono(async (req, res) => {
    exito(res, await ventaManual.ultimas());
}));
