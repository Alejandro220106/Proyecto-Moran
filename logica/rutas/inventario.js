/*
 * Rutas de inventario.
 *
 * Fijate que acá no hay una sola línea de SQL: estos archivos validan lo que
 * llega, llaman al modelo y contestan. Es el patrón para todo lo de rutas/.
 */

import { Router } from 'express';
import * as inventario from '../modelos/inventario.js';
import { exito, asincrono } from '../comun/respuesta.js';

export const rutasInventario = Router();

/* GET /api/inventario → productos con su estado + cuántos están bajo el mínimo.
   Lo consume la tabla "Productos terminados" de Inventario.html y el aviso de
   stock mínimo (RF-21) que va encima de ella. */
rutasInventario.get('/', asincrono(async (req, res) => {
    const [productos, bajoMinimo] = await Promise.all([
        inventario.listar(),
        inventario.contarBajoMinimo()
    ]);
    exito(res, { productos, bajo_minimo: bajoMinimo });
}));
