/*
 * Forma única de contestar desde las rutas.
 *
 * POR QUÉ IMPORTA QUE SEA UNA SOLA
 * El JavaScript de las pantallas tiene que saber, sin mirar, si lo que llegó
 * salió bien o mal. Si cada ruta contesta a su manera, cada pantalla termina
 * con su propio manejo de errores, y basta que una se olvide para que un fallo
 * se muestre como una tabla vacía en vez de como un aviso.
 *
 * Todas las respuestas tienen la misma forma:
 *   { "ok": true,  "datos": ... }
 *   { "ok": false, "error": "mensaje para mostrarle a la persona" }
 */

export const exito = (res, datos, codigo = 200) =>
    res.status(codigo).json({ ok: true, datos });

/*
 * El mensaje que se pasa acá SE LE MUESTRA A LA PERSONA, así que tiene que
 * decir qué pasó y qué hacer. Nunca se manda el mensaje crudo de PostgreSQL:
 * no le sirve a nadie y de paso filtra nombres de tablas y columnas.
 */
export const error = (res, mensaje, codigo = 400) =>
    res.status(codigo).json({ ok: false, error: mensaje });

/*
 * Errores de negocio, con su código HTTP a cuestas.
 *
 * Se distinguen de un fallo nuestro porque los lanza el modelo a propósito:
 * "no hay suficiente stock" no es una falla del sistema, es una respuesta.
 * Sin esta distinción, todo error termina en 500 y el frontend no puede saber
 * si vale la pena reintentar ni qué mensaje mostrar.
 *
 *   400 — lo que mandaron no tiene sentido (falta un campo, cantidad en cero)
 *   409 — tiene sentido pero choca con la realidad (no alcanza el stock)
 *   500 — se rompió algo de nuestro lado
 */
export class ErrorDeNegocio extends Error {
    constructor(mensaje, codigo = 400) {
        super(mensaje);
        this.name = 'ErrorDeNegocio';
        this.codigo = codigo;
    }
}

/**
 * Envuelve un manejador async para que sus rechazos lleguen al manejador de
 * errores de Express.
 *
 * NO ES CEREMONIA: Express 4 no atrapa promesas rechazadas. Sin esto, un
 * `await` que falla dentro de una ruta deja la petición colgada para siempre
 * —el navegador se queda cargando— y el error nunca aparece en ningún lado.
 */
export const asincrono = (manejador) => (req, res, next) =>
    Promise.resolve(manejador(req, res, next)).catch(next);

/**
 * Manejador de errores final. Va registrado el último en servidor.js.
 *
 * Separa el detalle técnico (a la consola, para quien programa) del mensaje
 * que se muestra (para quien está registrando una venta). No son la misma
 * frase y no le sirven a la misma persona.
 */
export function manejadorDeErrores(err, req, res, next) {
    if (err instanceof ErrorDeNegocio) {
        return error(res, err.message, err.codigo);
    }

    /*
      Errores de express.json(). NO son fallas nuestras: el cliente mandó algo
      que no se puede leer, así que van en 4xx. Sin este bloque terminaban en
      500 y el frontend concluía que el servidor está roto cuando el problema
      está de su lado — y encima 500 invita a reintentar, que acá nunca va a
      funcionar porque el cuerpo va a seguir estando mal.
    */
    if (err.type === 'entity.parse.failed') {
        return error(res, 'El cuerpo de la petición no es JSON válido.', 400);
    }
    if (err.type === 'entity.too.large') {
        return error(res, 'La petición es demasiado grande.', 413);
    }

    console.error('[La Morán]', req.method, req.originalUrl, '→', err);

    /* Si la base no está corriendo, decirlo con esas palabras: es el error más
       frecuente en desarrollo y "error interno" hace perder media hora. */
    if (err.code === 'ECONNREFUSED') {
        return error(res, 'No se pudo conectar con la base de datos. ¿Está PostgreSQL corriendo?', 503);
    }

    return error(res, 'Ocurrió un error inesperado. Volvé a intentarlo.', 500);
}
