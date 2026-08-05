# `logica/` — el servidor

Acá vive **toda** la programación de servidor. Las vistas (`vistas/`) no
consultan la base directamente: le piden datos a la API que se define acá.

Node.js + Express + PostgreSQL. Última actualización: 2026-08-04.

---

## Arrancar

```
npm install        # una sola vez
npm run iniciar    # http://localhost:3000
npm run dev        # igual, pero se reinicia solo al guardar
```

`npm run dev` es el que conviene mientras se programa.

**El servidor sirve el sitio Y la API en el mismo puerto**, a propósito: así
comparten origen y el navegador no aplica CORS. De paso resuelve un problema
que ya existía — `plantillas.js` inyecta el encabezado y la barra lateral con
`fetch()`, y eso nunca funcionó abriendo el HTML con doble clic (`file://`).

| | |
|---|---|
| Sitio | `http://localhost:3000/` |
| Panel | `http://localhost:3000/paginas/admin/Home-admin.html` |
| API | `http://localhost:3000/api/inventario` |

---

## Por qué Node y no PHP

Esto estuvo escrito en PHP hasta el 2026-08-04. Se cambió por tres razones
concretas, no por moda:

1. **Un solo lenguaje.** El frontend ya está en JavaScript. El equipo no
   aprende un segundo lenguaje ni cambia de cabeza al pasar de un archivo a
   otro.
2. **Los hostings baratos lo corren nativo.** Render, Railway y Fly despliegan
   Node con un `git push`; PHP en esas plataformas necesita Docker.
3. **Deja el camino abierto para eliminar el `fetch()` de las plantillas.** Con
   un motor de plantillas, la barra lateral pasaría a insertarse en el servidor
   y desaparecería el parpadeo al cargar. **Todavía no se hizo** — implica
   convertir las 20 páginas — pero ya es posible.

---

## Guardar datos localmente

Sí, y es lo que hay que hacer ahora: **PostgreSQL instalado en la misma
máquina**. El servidor se conecta a `localhost:5432`, los datos quedan en el
disco y persisten entre reinicios. Cuando se hospede, cambian los valores del
`.env` y no se toca una línea de código.

**Lo que NO sirve para esto es `localStorage` del navegador.** Los datos
vivirían dentro de un navegador concreto: lo que se registre en la computadora
no existiría en el teléfono del galpón, se borraría al limpiar el historial, y
no hay forma de hacer una transacción. Para un inventario es justo lo que no se
quiere.

---

## Estructura

```
logica/
├── servidor.js              Arranque, estáticos y montaje de rutas
├── configuracion/
│   └── conexion.js          Pool de PostgreSQL + ayuda de transacciones
├── comun/
│   └── respuesta.js         Forma única de contestar, errores, async
├── modelos/
│   ├── inventario.js        Consultas de inventario_productos
│   └── ventaManual.js       Registrar una venta y descontar del stock
└── rutas/
    ├── inventario.js        GET  /api/inventario
    └── ventas.js            GET  y POST /api/ventas
```

**El patrón es siempre el mismo y conviene respetarlo:**
`rutas/` valida lo que llega y contesta · `modelos/` es el único que escribe
SQL · `configuracion/` y `comun/` no saben nada del negocio.

Un archivo de `rutas/` **nunca** debe tener un `SELECT` adentro. Si lo tiene,
esa consulta le va a hacer falta a otra pantalla dentro de dos semanas y se va
a terminar copiando y pegando — que es exactamente cómo dos pantallas empiezan
a mostrar números distintos para la misma cosa.

---

## Lo que hay que agregar al `.env`

El `.env` no se sube al repo. Ver `.env.ejemplo` para la lista completa:

```
BD_HOST=localhost
BD_PUERTO=5432
BD_NOMBRE=la_moran
BD_USUARIO=postgres
BD_CLAVE=loquesea
```

Node las lee solo si se arranca con `--env-file=.env`, que ya está en los
scripts de `package.json`. Por eso este proyecto **no necesita `dotenv`** ni
ninguna otra dependencia para esto: las únicas dos son `express` y `pg`.

---

## La transacción que sostiene todo el proyecto

`ventaManual.registrar()` es el archivo más importante de esta carpeta.

Registrar una venta son **tres escrituras que tienen que pasar todas o
ninguna**: la fila en `ventas`, las filas de `detalle_ventas`, y el descuento
en `inventario_productos`. Si el descuento falla y las otras dos ya se
guardaron, el sistema queda diciendo que vendió algo que nunca salió del
inventario, y ese descuadre no se arregla solo.

Cinco decisiones que conviene entender antes de tocarlo:

1. **La forma se valida ANTES de pedir conexión.** Pedir una conexión del pool
   para después descubrir que la cantidad venía en −5 gasta un recurso limitado
   en una petición que nunca iba a prosperar.
2. **`SELECT … FOR UPDATE`, y siempre en orden de id.** El bloqueo evita que
   dos ventas simultáneas lean el mismo stock; el orden fijo evita que se
   bloqueen mutuamente y PostgreSQL mate una por interbloqueo.
3. **El descuento es `cantidad_disponible - $1`, no un valor calculado en
   JavaScript.** Con un valor calculado, dos ventas simultáneas se pisan y se
   pierde una salida.
4. **El precio se copia desde `inventario_productos` dentro del `INSERT`.** No
   viene del formulario: si viniera, cualquiera que sepa abrir las herramientas
   del navegador podría cobrarse un cartón en cero. Y queda congelado en el
   detalle — si el precio sube mañana, esta venta tiene que seguir mostrando lo
   que se cobró hoy.
5. **El total lo suma PostgreSQL, no JavaScript.** El `number` de JS es un
   flotante y no representa exactamente los decimales (`0.1 + 0.2` da
   `0.30000000000000004`); en dinero eso son totales que no cuadran por un
   colón. Los montos viajan como texto de punta a punta y toda la aritmética se
   hace sobre `NUMERIC`, que es exacto. Ver el comentario largo en
   `conexion.js` antes de "arreglar" que los precios lleguen como string.

---

## Nada de datos bancarios

Una venta manual **ya se cobró** en efectivo, en la ruta o en la finca; acá
solo se anota qué salió y por cuánto. No se guarda ni se pide ningún dato de
tarjeta. El cobro en línea queda para más adelante, y por eso el carrito del
sitio está marcado como "Próximamente".

---

## Lo que todavía NO está

- **Autenticación.** El campo `rol` no existe en el esquema, así que hoy
  cualquiera que escriba la URL entra al panel. Es el bloqueo más serio del
  proyecto. **No publicar esto en ningún hosting hasta resolverlo.**
- **El puente entre huevos y cartones.** Recolección cuenta huevos sueltos; el
  inventario vende cartones de 30/15/6/4. Falta decidir la conversión.
- **Recolección, lotes y mortalidad.** Tienen pantalla pero todavía no tienen
  modelo acá. Se agregan siguiendo el mismo patrón que `inventario.js`.
- **Las pantallas siguen mostrando datos de ejemplo.** Falta engancharlas a
  esta API.

---

## Si algo falla

| Lo que ves | Qué es |
|---|---|
| `Falta la variable BD_NOMBRE` | No hay `.env`, o se arrancó con `node` en vez de `npm run iniciar` |
| `¿Está PostgreSQL corriendo?` (503) | PostgreSQL no está instalado o no arrancó |
| `relation "…" does not exist` | Falta correr `basedatos/esquema_postgres.sql` contra la base |
| La página carga sin barra lateral | Se abrió el HTML con doble clic en vez de por el servidor |
