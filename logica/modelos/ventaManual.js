/*
 * Registrar una venta que YA OCURRIÓ y descontarla del inventario.
 *
 * Es el archivo central del proyecto: con el alcance vigente —inventariar los
 * productos y registrar las compras ya hechas— esto es literalmente lo que el
 * sistema hace. Si esto no funciona, el inventario nunca se mueve.
 *
 * NO TOCA DATOS BANCARIOS. Una venta manual es una venta de ruta o de finca que
 * ya se cobró en efectivo; acá solo se anota qué salió y por cuánto. El cobro
 * en línea queda para más adelante y por eso el carrito está en "Próximamente".
 */

import { enTransaccion, consultar } from '../configuracion/conexion.js';
import { ErrorDeNegocio } from '../comun/respuesta.js';

/**
 * @param {Array<{id_producto:number, cantidad:number}>} lineas
 * @param {string|null} comprador  Nombre suelto, opcional a propósito: la base
 *        lo permite nulo para que nadie invente un nombre por cumplir.
 * @returns {Promise<{id_venta:number, monto_total:string}>}
 */
export async function registrar(lineas, comprador = null) {
    if (!Array.isArray(lineas) || lineas.length === 0) {
        throw new ErrorDeNegocio('Una venta sin productos no es una venta.', 400);
    }

    /*
      LA FORMA SE VALIDA ANTES DE PEDIR CONEXIÓN, y el orden importa más de lo
      que parece: pedirle una conexión al pool para después descubrir que la
      cantidad venía en −5 gasta una conexión —que son un recurso limitado— en
      una petición que nunca iba a prosperar. Con varias peticiones malas
      seguidas se agota el pool y el panel deja de responder para todos.

      Acá solo se revisa lo que se puede saber sin la base: que sean enteros
      positivos. Que el producto exista y que alcance el stock son preguntas
      que solo la base contesta, y esas sí van adentro de la transacción.

      Se ordena por id en el mismo paso. Si una transacción bloquea el producto
      3 y después el 7, y otra lo hace al revés, quedan esperándose mutuamente y
      PostgreSQL mata una por interbloqueo. Tomando siempre los bloqueos en el
      mismo orden, eso no puede pasar.
    */
    const pedidas = lineas.map((linea) => {
        const idProducto = Number(linea?.id_producto);
        const cantidad = Number(linea?.cantidad);

        if (!Number.isInteger(idProducto) || idProducto <= 0 ||
            !Number.isInteger(cantidad) || cantidad <= 0) {
            throw new ErrorDeNegocio(
                'Cada línea necesita un producto válido y una cantidad entera mayor que cero.', 400
            );
        }
        return { id: idProducto, cantidad };
    }).sort((a, b) => a.id - b.id);

    /*
      TODO VA EN UNA TRANSACCIÓN. Registrar una venta son tres escrituras —la
      venta, su detalle y el descuento de inventario— y tienen que pasar todas
      o ninguna.

      Si el descuento falla y las otras dos ya se guardaron, el sistema queda
      diciendo que vendió algo que nunca salió del inventario, y ese descuadre
      no se arregla solo: alguien tiene que ir a buscarlo a mano.
    */
    return enTransaccion(async (con) => {

        /* ---- 1. Lo que solo la base puede contestar ---- */
        /*
          FOR UPDATE bloquea cada fila hasta que termine la transacción. Sin
          eso, dos personas registrando ventas del mismo producto a la vez leen
          el mismo stock y las dos creen que alcanza.

          Se recorre `pedidas`, que ya viene ordenada por id — ver el comentario
          de arriba sobre interbloqueos.
        */
        for (const p of pedidas) {
            const { rows } = await con.query(
                `SELECT nombre_producto, cantidad_disponible
                   FROM inventario_productos
                  WHERE id_inventario_producto = $1
                  FOR UPDATE`,
                [p.id]
            );
            const producto = rows[0];

            if (!producto) {
                throw new ErrorDeNegocio(`El producto #${p.id} no existe.`, 400);
            }

            if (producto.cantidad_disponible < p.cantidad) {
                /* Se revisa acá además del CHECK de la base para poder decir
                   CUÁL producto faltó y cuánto había. El CHECK protege el dato;
                   este mensaje protege a la persona. */
                throw new ErrorDeNegocio(
                    `No hay suficiente ${producto.nombre_producto}: ` +
                    `se quieren registrar ${p.cantidad} y quedan ${producto.cantidad_disponible}.`,
                    409
                );
            }
        }

        /* ---- 2. La venta, con el total todavía en cero ---- */
        /*
          EL PRECIO NO VIENE DEL FORMULARIO. Si viniera, cualquiera que sepa
          abrir las herramientas del navegador podría cobrarse un cartón en
          cero. Se lee de la base al insertar el detalle (paso 3).

          Y EL TOTAL NO SE SUMA EN JAVASCRIPT. El number de JS es un flotante y
          no representa exactamente los decimales; sumando precios da totales
          que no cuadran por un colón. Se inserta en 0 y en el paso 4 lo calcula
          PostgreSQL sobre NUMERIC, que sí es exacto.
        */
        const { rows: creada } = await con.query(
            `INSERT INTO ventas (id_cliente, comprador_nombre, monto_total, tipo_venta)
             VALUES (NULL, $1, 0, 'manual')
             RETURNING id_venta`,
            [comprador?.trim() || null]
        );
        const idVenta = creada[0].id_venta;

        /* ---- 3. Detalle y descuento ---- */
        for (const p of pedidas) {
            /* El precio se copia desde inventario en el mismo INSERT: queda
               CONGELADO en el detalle. Si mañana sube, esta venta tiene que
               seguir mostrando lo que se cobró hoy. */
            await con.query(
                `INSERT INTO detalle_ventas
                        (id_venta, id_inventario_producto, cantidad, precio_unitario)
                 SELECT $1, id_inventario_producto, $2, precio_unitario
                   FROM inventario_productos
                  WHERE id_inventario_producto = $3`,
                [idVenta, p.cantidad, p.id]
            );

            /* La resta va sobre el valor que tenga la fila, no sobre uno
               calculado acá. Con `SET cantidad = <valor leído> - n`, dos ventas
               simultáneas se pisarían y se perdería una salida. */
            await con.query(
                `UPDATE inventario_productos
                    SET cantidad_disponible = cantidad_disponible - $1
                  WHERE id_inventario_producto = $2`,
                [p.cantidad, p.id]
            );
        }

        /* ---- 4. El total, calculado por PostgreSQL ---- */
        const { rows: total } = await con.query(
            `UPDATE ventas
                SET monto_total = (SELECT COALESCE(SUM(cantidad * precio_unitario), 0)
                                     FROM detalle_ventas
                                    WHERE id_venta = $1)
              WHERE id_venta = $1
              RETURNING monto_total`,
            [idVenta]
        );

        return { id_venta: idVenta, monto_total: total[0].monto_total };
    });
}

/**
 * Las últimas ventas manuales, para la tabla de historial.
 *
 * Va con `consultar` y NO con `enTransaccion`: es una sola lectura, y envolver
 * un SELECT suelto en BEGIN/COMMIT son dos viajes de ida y vuelta a la base
 * que no compran nada. La transacción se reserva para cuando hay varias
 * escrituras que tienen que pasar juntas.
 */
export async function ultimas(limite = 20) {
    const { rows } = await consultar(
            `SELECT v.id_venta, v.fecha_venta, v.comprador_nombre, v.monto_total,
                    COUNT(d.id_detalle)::int AS lineas
               FROM ventas v
               LEFT JOIN detalle_ventas d ON d.id_venta = v.id_venta
              WHERE v.tipo_venta = 'manual'
              GROUP BY v.id_venta
              ORDER BY v.fecha_venta DESC
              LIMIT $1`,
        [limite]
    );
    return rows;
}
