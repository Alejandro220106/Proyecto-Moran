/*
 * Consultas sobre inventario_productos.
 *
 * Este archivo es el ÚNICO lugar del proyecto donde se escribe SQL de
 * inventario. Si una pantalla necesita algo que no está acá, se agrega una
 * función — no se escribe la consulta en la ruta. Ver logica/LEEME.md.
 */

import { consultar } from '../configuracion/conexion.js';

/**
 * Todos los productos con su estado de stock ya calculado.
 *
 * EL ESTADO SE CALCULA EN SQL, NO EN JAVASCRIPT, y no es un capricho: la misma
 * regla la necesitan el aviso de stock mínimo (RF-21), el catálogo y las
 * gráficas del tablero. Calculada en un solo lugar, no puede pasar que una
 * pantalla diga "bajo" y otra "suficiente" para la misma fila.
 *
 * Los tres estados son los mismos que ya dibuja estilos/admin/Inventario.css:
 * agotado / bajo / suficiente.
 */
export async function listar() {
    const { rows } = await consultar(`
        SELECT
            id_inventario_producto,
            nombre_producto,
            tipo_producto,
            cantidad_disponible,
            stock_minimo,
            precio_unitario,
            CASE
                WHEN cantidad_disponible = 0             THEN 'agotado'
                WHEN cantidad_disponible <= stock_minimo THEN 'bajo'
                ELSE                                          'suficiente'
            END AS estado
        FROM inventario_productos
        ORDER BY tipo_producto, nombre_producto
    `);
    return rows;
}

/**
 * Cuántos productos están en su mínimo o por debajo.
 *
 * Es el número del aviso resumen de Inventario. Se cuenta en la base y no
 * trayendo todas las filas para contarlas acá: la condición está indexada
 * (idx_inventario_bajo_minimo) justo para esto.
 */
export async function contarBajoMinimo() {
    const { rows } = await consultar(
        `SELECT COUNT(*)::int AS total
           FROM inventario_productos
          WHERE cantidad_disponible <= stock_minimo`
    );
    return rows[0].total;
}

/** Un producto por id, o null si no existe. */
export async function porId(id) {
    const { rows } = await consultar(
        `SELECT id_inventario_producto, nombre_producto,
                cantidad_disponible, stock_minimo, precio_unitario
           FROM inventario_productos
          WHERE id_inventario_producto = $1`,
        [id]
    );
    return rows[0] ?? null;
}
