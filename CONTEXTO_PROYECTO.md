# Contexto del proyecto — Proyecto-Morán / Eggs Unlimited

Última actualización: 2026-07-22

Este documento resume el contexto y las convenciones del proyecto para que
cualquier persona del equipo (o una sesión futura de IA) pueda retomarlo sin
tener que redescubrir estas decisiones. Complementa a `README.md` (que solo
tiene el nombre del proyecto y la lista de integrantes) — no lo reemplaza.

## ¿Qué es este proyecto?

Aplicación **web** (el `README.md` la describe como "de escritorio", pero en
la práctica es un sitio servido con PHP/HTML) para "La Morán", una empresa de
distribución de huevo y pollo que se presenta bajo la marca **"Eggs Unlimited"**
("Any egg, anywhere"). Ver `README.md` para la lista de integrantes del equipo.

## Stack tecnológico y decisiones

- **Bootstrap 5** vía CDN (sin instalar nada, solo `<link>`/`<script>` — no
  hay `composer.json`, `package.json` ni build tool en el repo).
- **PHP se reserva exclusivamente para la capa de conexión a base de datos**
  que se irá agregando más adelante. Las vistas nuevas se construyen en HTML
  + CSS estático (con Bootstrap), no en PHP, salvo que necesiten hablar con
  la base de datos.
- Sin framework de JavaScript. Si una pantalla necesita interactividad se
  resuelve con JS vanilla puntual, no con una librería.
- El header y el footer del sitio (vista normal de usuario cliente) son
  **una sola plantilla compartida** para todas las páginas, y ya no viven en
  PHP. Ver "Header y footer compartidos" abajo para el mecanismo exacto.
  El login (`login.html`) es la excepción: es standalone, sin ese nav
  compartido, según su propio diseño.

## Convenciones de código

1. **Nombres de clase**: las clases utilitarias de Bootstrap se dejan tal
   cual (en inglés — son del framework: `row`, `col-md-6`, `form-control`,
   `btn`, `w-100`, etc.). Cualquier clase que nosotros definamos va **en
   español**, siguiendo el estilo que ya usaba `estilos.css` (`.header`,
   `.menu-navegacion`, `.footer-principal`...). Ejemplo canónico: las clases
   de `vistas/Recursos/Cliente/login.css` (`.tarjeta-login`, `.panel-marca`,
   `.boton-ingresar`, etc.).
2. **Un CSS por página**: cada vista nueva trae su propio archivo de estilos
   en `vistas/Recursos/<ámbito>/` — `Admin/` o `Cliente/` según dónde viva la
   página (p. ej. `Cliente/login.html` → `Cliente/login.css`). Excepción:
   cuando dos páginas tienen el mismo diseño comparten una hoja (p. ej. los
   listados de pollo y huevos usan `productos-listado.css`).
3. **Documentación completa**: todo el HTML y CSS de este proyecto debe
   llevar comentarios que expliquen el porqué de las decisiones no obvias
   (fallbacks, exclusiones, elecciones de layout) — no solo qué hace el
   código, sino por qué se hizo así.

## Estructura de carpetas (dentro de `vistas/`)

```
vistas/
  index.html          <- redirección de entrada a Paginas/Cliente/index.html
  Paginas/
    Admin/            <- las 8 pantallas del panel de administración
    Cliente/          <- las 11 pantallas del sitio público
  Componentes/        <- encabezado.html, pie-pagina.html (plantillas compartidas)
  Recursos/
    Admin/            <- CSS y JS del panel (admin, tokens-admin, Home-admin,
                         Inventario, GestionPedidos, VentasManuales +
                         recoleccion-diaria.js, ventas-manuales.js)
    Cliente/          <- CSS del sitio público (uno por página)
    Imagenes/         <- compartidas por ambos ámbitos
    estilos.css       <- header/footer compartidos: lo usan los dos ámbitos
    plantillas.js     <- idem
```

Las 8 pantallas de `Paginas/Admin/` son: Home-admin (tablero) más los 7
módulos — Inventario, GestionPedidos, BuscarPedidos, Facturas, Proveedores,
RecoleccionDiaria y VentasManuales. Empleados y Reportes existieron hasta el
2026-08-01 y se eliminaron (ver el registro de esa fecha).

El JS específico de una pantalla vive junto a su CSS, en la carpeta del
ámbito. Solo se agrega cuando la pantalla no se puede resolver sin él;
`plantillas.js` sigue siendo el único JS compartido por todo el sitio.

Regla de rutas: **toda página vive a dos niveles** (`Paginas/<ámbito>/`), así
que referencia los recursos con `../../` — `../../Recursos/Admin/...`,
`../../Recursos/Cliente/...`, `../../Recursos/estilos.css`. Esa profundidad
uniforme es lo que hace que funcionen las plantillas compartidas: si alguna
página se anidara a otra profundidad, `plantillas.js` y los enlaces del
header/footer se romperían sólo en esa página.

Consecuencia menos obvia de separar los ámbitos: **el header y el footer
compartidos enlazan a páginas de cliente desde ambos ámbitos**, así que sus
enlaces van con `../Cliente/...` (no con el nombre de archivo pelado). Desde
`Paginas/Cliente/` eso resuelve a la carpeta misma y desde `Paginas/Admin/`
cruza al otro ámbito; una sola forma sirve para los dos. Lo mismo con el logo,
que va con `../../Recursos/Imagenes/...` porque se resuelve contra la página
que inyecta el fragmento, no contra `Componentes/`.

## Header y footer compartidos

Como ya no hay PHP en las vistas, no existe un `require_once` para compartir
el header/footer entre páginas. En su lugar:

- `vistas/Componentes/encabezado.html` y `vistas/Componentes/pie-pagina.html`
  son fragmentos de HTML plano (el mismo markup que antes vivía en
  `Header.php`/`Footer.php`, ya sin PHP).
- `vistas/Recursos/plantillas.js` los carga con `fetch()` e los inyecta en
  cualquier página que tenga contenedores `<div id="encabezado"></div>` y
  `<div id="pie-pagina"></div>`.
- Toda página nueva de la vista normal de usuario cliente (no standalone
  como el login) debe incluir esos dos `<div>` en el lugar correspondiente
  y `<script src="../../Recursos/plantillas.js" defer></script>` antes de
  `</body>`.
- **Requisito importante**: `fetch()` no funciona abriendo el HTML directo
  con doble clic (`file://`) — los navegadores lo bloquean por CORS. Hay
  que servir `vistas/` con un servidor local, por ejemplo:
  `php -S localhost:8000 -t vistas` o `python3 -m http.server` parado
  dentro de `vistas/`. La raíz (`/`) redirige a `Paginas/Cliente/index.html`.
- `vistas/Paginas/Cliente/index.html` es el ejemplo de referencia de una página que
  usa este mecanismo (antes era `index.php`).

Las tres antiguas `Head.php`, `Header.php` y `Footer.php` fueron borradas.

## Activos (`vistas/Recursos/Imagenes/`)

| Archivo | Estado |
|---|---|
| `logo_la_moran_limpio_transparente.png` | **Logo canónico** — el único logo que se usa (header, footer, login). No modificar ni regenerar, solo referenciar. |
| `logo.png` | Legado, sin uso actualmente. |
| `fondo-paja.jpg` | Textura de paja/heno. Franja superior del header (`.linea-superior` en `estilos.css`). |
| `fondo-cafe.jpg` | Textura de madera café oscuro. Panel de marca del login (`.panel-marca` en `login.css`). |
| `fondo-azul.jpg` | Textura de mezclilla azul. Fondo del footer (`.footer-principal` en `estilos.css`, con degradado que la oscurece para el texto). |
| `fondo-verde.jpg` | Textura verde oliva. Fondo del catálogo (`.catalogo` en `catalogo.css`) y, a futuro, paneles de administración. |

Los cuatro `fondo-*.jpg` son fotos de Unsplash (licencia libre, uso comercial sin atribución), optimizadas. Reemplazaron a las imágenes pesadas anteriores (`header-superior.png` 2.9 MB, `fondo-footer.png`, `textura-cafe.avif`), que se eliminaron. Cada fondo lleva un `background-color` de respaldo en su CSS por si la foto no carga. Si más adelante llegan las texturas del Figma, se reemplazan estos archivos manteniendo el mismo nombre.

> Nota: primero se exploró generar estos fondos por código con filtros SVG (`feTurbulence`) por su peso mínimo, pero se optó por fotos reales por fidelidad al diseño. Los SVG candidatos se descartaron.

## Paleta de marca (aproximada)

Tomada a ojo de los diseños compartidos — son valores de partida, no
extracciones exactas de la imagen. Ajustar visualmente si no calzan.

| Uso | Color aprox. |
|---|---|
| Fondo de página (login) | `#121212` |
| Panel de marca / respaldo de la textura café | `#2b1d16` |
| Panel de acceso (tarjeta clara) | `#e8e5e0` |
| Acento oxblood/vino (botones, íconos) | `#5c2020` |
| Texto del eslogan | `#f2ede3` |
| Header/footer del sitio principal (ya existente en `estilos.css`) | fondo `#17485e`, acento `#d99a4e` |

## Flujo de trabajo

El usuario comparte capturas de los diseños de Figma (no hay acceso directo
a Figma en este entorno) y las pantallas se construyen a partir de esas
capturas. Reglas fijas para todas las pantallas: no modificar el logo, no
tomar como base el frame de Figma llamado "REFERENCIA".

## Skill de Claude Code

`.claude/skills/moran-frontend/SKILL.md` tiene el checklist accionable
(reglas de nombres de clase, convención de archivos, paleta, activos,
documentación) para construir o revisar cualquier vista nueva de este
proyecto de forma consistente. Este documento es el contexto narrativo;
la skill es la versión resumida y accionable.

## Diseños recibidos (pendientes de construir)

El 2026-07-22 se recibió, además del login, un lote grande de capturas que
cubre prácticamente toda la aplicación: registro, recuperar/actualizar
contraseña, actualizar datos de usuario, contacto, catálogo de productos
(pollo/huevos), detalle de pedido, pago, y un panel de administración
completo (inicio, inventario, gestión de pedidos, buscar pedidos, facturas,
empleados, reportes, proveedores). Todavía no se construyó ninguna de estas
— quedan para instrucciones futuras, pantalla por pantalla.

Nota arquitectónica a resolver más adelante: varias de esas pantallas
(sobre todo el panel de administración) muestran tablas con datos que
claramente vienen de una base de datos real (inventario, empleados,
facturas, pedidos). Eso implica más lógica de servidor que "solo la
conexión a la base de datos" — probablemente van a necesitar PHP que
también consulte y renderice esos datos, no solo que abra la conexión. Vale
la pena conversar ese límite con el usuario antes de construir el panel de
administración.

## Registro de sesiones

- **2026-07-22**: se construyó la primera pantalla (`vistas/login.html` +
  `vistas/Recursos/login.css`), este documento de contexto, y la skill
  `moran-frontend`. Decisiones de texto resueltas: se corrigió el typo del
  diseño ("Olvidaste la constraseña?" → "¿Olvidaste la contraseña?") y se
  excluyó la etiqueta "login" de la esquina superior (artefacto del nombre
  del frame de Figma, no parte real de la pantalla). Se recibió además el
  lote completo de diseños restantes (ver sección anterior), pendiente de
  definir el orden de construcción.
- **2026-07-22 (2)**: se borraron `Head.php`, `Header.php` y `Footer.php`.
  El header/footer del sitio ahora son plantillas HTML compartidas
  (`Componentes/encabezado.html` y `pie-pagina.html`) cargadas por
  `Recursos/plantillas.js` vía `fetch()` — ver sección "Header y footer
  compartidos". `index.php` se convirtió a `index.html` usando este mismo
  mecanismo, para no dejarlo roto.
- **2026-07-24**: se definieron los fondos texturizados con **fotos reales**
  (Unsplash, licencia libre): `fondo-paja.jpg` (header), `fondo-cafe.jpg`
  (login), `fondo-azul.jpg` (footer), `fondo-verde.jpg` (catálogo). Se
  eliminaron las imágenes pesadas anteriores y se cableó cada fondo en su
  CSS. Se construyó la primera pantalla post-login: el **catálogo**
  (`catalogo.html` + `Recursos/catalogo.css`), con las categorías POLLO y
  HUEVOS sobre el fondo verde. Las fotos de producto quedaron como
  marcadores temporales (pendientes de las imágenes reales del equipo/Figma).
  También se construyó el **listado de huevos** (`productos-huevos.html` +
  `Recursos/productos-huevos.css`), destino del botón MOSTRAR de Huevos:
  hero con banda verde de calidad y lista de presentaciones (30/15/6/4) con
  botón ORDENAR, sobre el fondo de madera café.
- **2026-07-24 (2)**: se agregó el **listado de pollo** (`productos-pollo.html`,
  gemelo del de huevos: pechuga/muslo/alas/entero). Como ambos listados
  comparten el mismo diseño, su CSS se unificó en **`productos-listado.css`**
  (se eliminó `productos-huevos.css`). Los botones MOSTRAR del catálogo ya
  enlazan a cada listado. Las fotos de portada y de producto siguen como
  marcadores hasta tener las imágenes reales.
- **2026-07-24 (3)**: se reorganizó la estructura — todas las páginas HTML
  se movieron a `vistas/Paginas/` y sus rutas a recursos pasaron a `../`.
  `plantillas.js` y el logo de los componentes también usan `../`. Se dejó
  un `vistas/index.html` de redirección hacia `Paginas/index.html` para que
  la raíz siga cargando. Ver "Estructura de carpetas".
- **2026-07-24 (4)**: se agregó el **detalle del pedido**
  (`detalle-pedido.html` + `Recursos/detalle-pedido.css`): cantidad, método
  de pago, indicación, puntos de entrega (principal/alternativo/preferencia
  y hasta 4 adicionales, cada uno con su cantidad) y botón AGREGAR AL
  CARRITO, sobre el fondo verde. Los botones ORDENAR de los listados ya
  enlazan aquí. Sin `action` todavía (pendiente de la capa de BD).
- **2026-07-24 (5)**: se agregó la pantalla de **pago** (`pago.html` +
  `Recursos/pago.css`): dos tablas de productos (huevos/pollo) con
  cantidad, método de pago (efectivo/tarjeta), número de tarjeta, CVV,
  guardar información y botón CANCELAR FACTURA, sobre el fondo verde. El
  botón AGREGAR AL CARRITO del detalle ya enlaza aquí. Se corrigieron
  typos del diseño (TARGETA→tarjeta, CVI→CVV, CANSELAR→cancelar). Flujo
  navegable completo: catálogo → listado → detalle → pago.
- **2026-07-26**: `productos-huevos.html` ahora muestra **las dos listas
  juntas**: huevos a la izquierda, pollo a la derecha (copiado de
  `productos-pollo.html`, que se dejó intacto por ahora). Se agregaron las
  clases `.contenedor-dos-listas` / `.columna-lista` / `.subtitulo-columna`
  en `productos-listado.css` para el layout de dos columnas (se apilan en
  pantallas angostas vía `flex-wrap`); `.lista-productos` sigue funcionando
  igual que siempre para el listado standalone de pollo. Header/footer sin
  cambios.
- **2026-07-26 (2)**: se agregó la pantalla de **registro**
  (`registro.html` + `Recursos/registro.css`). A diferencia de `login.html`
  (standalone), esta sí usa el header/footer compartidos. Se reordenaron
  los campos del diseño de referencia por tipo de dato (identidad: usuario,
  correo, teléfono | seguridad: contraseña, confirmar contraseña) en vez
  del agrupamiento original sin lógica clara, y el botón REGISTRARSE quedó
  de ancho completo en el panel derecho para un blanco de clic mayor. El
  enlace "Registrarse" de `login.html` ya apunta aquí. Sin `action` ni
  JavaScript todavía (a propósito, pendiente de validación de contraseñas
  y envío); los campos ya tienen id/name listos para engancharlo. Se
  probó con Playwright headless (desktop y 375px): el formulario se apila
  correctamente en móvil sin overflow propio.

  **Hallazgo, no atribuible a esta sesión**: al probar se vio que el commit
  `486d452` ("eliminar logos sin uso") borró por error
  `logo_la_moran_limpio_transparente.png`, el logo canónico marcado en este
  mismo documento como "no modificar ni regenerar". Esto rompe el logo en
  header/footer/login de **todo el sitio** (404), no solo en esta pantalla.
  Pendiente de que el equipo decida restaurarlo desde el historial de git.
- **2026-07-26 (3)**: se revisó `Contraseña-login.html` +
  `Recursos/Contraseña-login.css` (pantalla de recuperar contraseña, ya
  creada por un compañero) para alinearla con la convención del proyecto:
  se agregó el comentario de documentación que faltaba, se corrigió el
  `<title>` (decía "Crear cuenta", copiado de otra pantalla), se
  renombraron los ids de camelCase a kebab-case en español
  (`formEnviarCodigo` → `formulario-enviar-codigo`, `nuevaPassword` →
  `nueva-contrasena`, etc.), se capa `form-control`/`.btn` de Bootstrap
  sobre los campos y botones (antes sin clases), y se alinearon los
  colores ámbar y el estilo de los campos (borde sin relleno, labels en
  mayúscula) con `registro.css`, por ser pantallas hermanas del mismo
  flujo de cuenta. El enlace "¿Olvidaste la contraseña?" de `login.html`
  ya apunta aquí, y se agregó "Volver a iniciar sesión" de regreso. Los
  dos paneles (enviar código / digitar código + nueva contraseña) se
  muestran siempre juntos por ahora; mostrar/ocultar según el paso queda
  para la futura capa de JavaScript, igual que el envío real del código.
  Nombre de archivo con mayúscula y "ñ" (`Contraseña-login`), inconsistente
  con el resto (`login.html`, `registro.html`, todo en minúsculas sin
  acentos) — se dejó igual a propósito por no tocar el estado de git en
  esta sesión; pendiente de que el equipo decida si renombrarlo.
- **2026-07-26 (4)**: se revisó `Actualizar-Datos.html` +
  `Recursos/Actualizar-Datos.css` (actualizar datos de usuario, ya creada
  por un compañero) con el mismo criterio que `Contraseña-login`: se
  agregó el comentario de documentación, se corrigió el `<title>` (decía
  "Actualizar-Datos-Usuario", ahora "Actualizar datos"), se renombraron
  los ids de camelCase (`formActualizarDatos` → `formulario-actualizar-datos`,
  `btnActualizar` → `boton-actualizar`), se capa `form-control`/`.btn` de
  Bootstrap sobre campos/botón, y se alinearon los colores ámbar con
  `registro.css`/`Contraseña-login.css`. **Conexión**: se agregó el enlace
  "ACTUALIZAR DATOS" al header compartido (`encabezado.html`, junto a
  CERRAR SESIÓN) porque no existía ningún punto de entrada a esta
  pantalla — confirmado con el usuario antes de tocar un componente
  compartido por todo el sitio. Se probó con Playwright: el header con 6
  ítems no desborda a 1280px, y la navegación catálogo → actualizar datos
  funciona.

  **Hallazgo, no atribuible a esta sesión**: `Contacto.html` reutiliza
  `Recursos/Actualizar-Datos.css` pero usa sus propias clases
  (`.pagina-contacto`, `.contenedor-contacto`, `.grupo-mensaje`), que no
  existen en ese archivo — la pantalla de contacto queda prácticamente sin
  estilo. Su `<title>` también quedó copiado como "Actualizar-Datos-Usuario".
  No se tocó porque no fue parte de lo pedido en esta sesión; pendiente de
  revisión igual que las demás.
- **2026-07-26 (5)**: se revisó `Contacto.html` + se creó
  `Recursos/Contacto.css` (antes reutilizaba `Actualizar-Datos.css` por
  error, con clases —`.pagina-contacto`, `.contenedor-contacto`,
  `.grupo-mensaje`— que no existían ahí, así que quedaba casi sin estilo;
  ver hallazgo de la entrada anterior). El nuevo `Contacto.css` mantiene el
  layout de 4 columnas y el mensaje ocupando la fila 2 junto a "Empresa"
  (decisión ya tomada por el compañero que armó el HTML, no se rediseñó),
  solo se alinearon los colores ámbar, se agregaron variables `:root` y se
  reemplazaron los selectores por id (`#btnEnviar`) por clases
  (`.boton-enviar`) capadas sobre `.btn`/`.form-control` de Bootstrap. El
  `<title>` y el `href` del CSS ya habían sido corregidos por el usuario
  antes de esta revisión. **Conexión**: el enlace "CONTACTO" del header
  compartido, que ya existía apuntando a "#", ahora apunta a
  `Contacto.html` (no fue necesario tocar la estructura del nav, a
  diferencia de "ACTUALIZAR DATOS"). Se probó con Playwright: navegación
  catálogo → contacto sin errores de consola, layout de 4 columnas y
  apilado en móvil correctos.
- **2026-07-26 (6)**: se revisó `Home-admin.html` +
  `Recursos/Home-admin.css` (panel de administración, ya creado por un
  compañero) con el mismo criterio de estilo que las demás pantallas:
  comentario de documentación, ids en kebab-case (`modInventario` →
  `modulo-inventario`, `btnNuevoPedido` → `boton-nuevo-pedido`,
  `totalPedidos` → `total-pedidos`, etc.), variables `:root` y colores
  ámbar alineados (`#d89a45`/`#bf8539` → `#d99a4e`/`#c4863a`). Se agregó
  `.btn` de Bootstrap a los botones de "Accesos rápidos" (sí son botones
  convencionales); las tarjetas de módulo quedaron como `<button>` sin
  `.btn` porque son tarjetas de grid, no botones típicos, y Bootstrap las
  encogería al ancho del contenido. **Sin conexión esta vez** (a
  diferencia de Actualizar-Datos/Contacto): esta sesión solo pidió estilo,
  no enlazarla; además CONTEXTO_PROYECTO.md ya anotaba que el panel de
  administración probablemente necesite su propia capa de autenticación
  antes de conectarlo al sitio, así que se dejó sin punto de entrada a
  propósito. Se probó con Playwright (desktop y 375px): sin errores de
  consola, el grid `auto-fit` ya existente se adapta solo sin necesidad de
  media queries adicionales.
- **2026-07-26 (7)**: se revisó `Inventario.html` + `Recursos/Inventario.css`
  (módulo de inventario del panel admin, ya creado por un compañero) con el
  mismo criterio que `Home-admin`: comentario de documentación, ids en
  kebab-case (`btnActualizarProductos` → `boton-actualizar-productos`,
  `tablaLotes` → `tabla-lotes`, etc.), variables `:root` y colores ámbar
  alineados. Se renombró `.btn-tabla` → `.boton-tabla` (el resto del sitio
  siempre usa "boton-" completo, nunca la abreviatura "btn-", que además
  se presta a confundirse con la clase `.btn` de Bootstrap) y se agregó
  `.btn` de Bootstrap sobre los botones "Actualizar"/"Ver" (sí son botones
  convencionales, a diferencia de las tarjetas de módulo de Home-admin). Se
  escoparon los selectores de tabla sueltos (`table`, `th`, `td`, `thead`,
  `tbody tr:hover`) bajo `.tarjeta` para no depender de que sean los únicos
  elementos `<table>` del sitio. De paso se restauró una transición de
  hover (`transition: background-color 0.2s`) que se había perdido sin
  querer en esta misma revisión y en la de `Home-admin.css`. Sin conexión
  (mismo motivo que Home-admin: panel admin todavía no se conecta al
  resto del sitio). Se probó con Playwright: sin errores de consola; en
  375px las tablas anchas hacen scroll horizontal dentro de su tarjeta,
  comportamiento ya diseñado (`overflow-x:auto` + `min-width:650px`), no
  una regresión.
- **2026-07-26 (8)**: se conectó la tarjeta "Inventario" de `Home-admin.html`
  a `Inventario.html` (antes era un `<button>` sin acción, igual que el
  resto de módulos que aún no tienen página). Como ya es un `<a>`, se
  agregó `display:block` y `text-decoration:none` a `.tarjeta-modulo` en
  `Home-admin.css` para que se vea igual sin importar si la tarjeta es
  `<button>` o `<a>` — confirmado con Playwright que el clic navega y que
  visualmente es idéntica a las demás. Las otras 6 tarjetas de módulo
  siguen como `<button>` sin conexión porque sus páginas no existen
  todavía.
- **2026-07-27**: se revisó `GestionPedidos-admin.html` +
  `Recursos/GestionPedidos.css` (módulo de gestión de pedidos del panel
  admin, ya creado por un compañero) con el mismo criterio que
  Inventario/Home-admin: el comentario superior estaba copiado de
  `Contacto.html` (decía "Contacto (vista del cliente)..."), se corrigió;
  ids en kebab-case, colores ámbar alineados, `.btn-tabla` → `.boton-tabla`,
  `form-control`/`form-select`/`.btn` de Bootstrap sobre campos y botones.
  **Conexión**: la tarjeta "Gestión de pedidos" de `Home-admin.html` pasa
  de `<button>` a `<a href="GestionPedidos-admin.html">`, igual que se hizo
  con Inventario.

  **Mejoras pensando en el JS futuro** (confirmadas con el usuario antes
  de aplicarlas): los botones "Ver"/"Editar" de cada fila usaban atributos
  distintos para el mismo pedido (`data-pedido`/`data-editar`); ahora
  ambos comparten `data-pedido-id` + un `data-accion="ver"/"editar"`, para
  que un solo listener delegado en `<tbody>` alcance. El panel de detalle
  (`#panel-detalle-pedido`, renombrado de `#detallePedido` para no
  chocar conceptualmente con el `detalle-pedido.html` del cliente) ahora
  lleva `role="dialog"` + `aria-modal="true"` + `aria-labelledby`, y el
  botón de cerrar (✕) lleva `aria-label`, para que sea accesible en cuanto
  el JS lo muestre/oculte. También se limpió el CSS del modal: la regla
  `.detalle-pedido{flex-direction:column}` estaba duplicada en dos bloques
  separados (se fusionó en uno) y se quitó un `::before` que no tenía
  ningún efecto visual (sin fondo, sin z-index, inerte).

  Se probó con Playwright: navegación Home-admin → Gestión de pedidos sin
  errores de consola, y se simuló mostrar el panel de detalle (quitando
  `.oculto` como hará el futuro JS) para confirmar que se ve consistente
  y que los atributos ARIA quedan bien puestos.
- **2026-07-27 (2)**: se unificaron los dos listados de productos en uno
  solo. `productos-huevos.html` (que ya mostraba huevos y pollo juntos
  desde el 2026-07-26) se renombró a **`productos.html`** —nombre neutro,
  ya que ahora cubre ambas categorías— y se **eliminó**
  `productos-pollo.html`, que había quedado redundante. Los dos botones
  MOSTRAR de `catalogo.html` (categoría Pollo y categoría Huevos) ahora
  enlazan al mismo `productos.html`. `productos-listado.css` no se
  renombró (ya tenía nombre genérico) pero se actualizaron sus
  comentarios.

  También se agregaron **precio** y **disponibilidad** a cada tarjeta de
  producto — las dos mejoras de UX de la sesión anterior que el usuario
  confirmó como correctas (el listado no tenía ningún precio visible en
  todo el sitio hasta ahora). Disponibilidad usa un chip de color
  (`.disponibilidad.disponible` verde, `.pocas-unidades` ámbar,
  `.agotado` gris), mismo criterio visual que los estados de
  `GestionPedidos.css` en el panel admin. Un producto "Agotado" (ej.
  Muslo) deshabilita su botón ORDENAR (`<button disabled>` en vez de
  `<a href>`) para no dejar iniciar un pedido que no se puede cumplir —
  mejora de UX que no depende de JavaScript. Precio y disponibilidad son
  marcadores del diseño; en producción vendrán de la base de datos (ligado
  al mismo dato que alimenta `Inventario.html` en el panel admin).

  Se probó con Playwright: los dos botones MOSTRAR del catálogo navegan a
  `productos.html`, el botón del producto agotado queda `disabled`, sin
  errores de consola, y el layout se ve correcto en desktop y 375px.
- **2026-07-27 (3)**: se agregaron a `productos.html` los ganchos para el
  JavaScript que todavía no se agrega, solo donde hay un caso de uso real
  (no en todo lo tocable): cada tarjeta y su botón ORDENAR llevan
  `data-producto-id` (`huevos-30`, `pollo-muslo`, etc.), el precio lleva
  `data-precio` en crudo (sin "₡" ni separador, para que un futuro
  carrito pueda sumar sin parsear texto), y la disponibilidad lleva
  `data-disponibilidad` con el mismo valor que su clase (la clase es
  estilo, el data-* es un valor estable para JS). El enlace ORDENAR ahora
  manda `?producto=<id>` en la URL hacia `detalle-pedido.html`, para que
  esa pantalla (todavía no lo hace) pueda mostrar más adelante a qué
  producto corresponde el pedido — hoy `detalle-pedido.html` no muestra
  ningún contexto de qué se ordenó, uno de los huecos de UX detectados.

  El botón "Agotado" se dejó como `<button disabled>` real (no `<a>` con
  `aria-disabled`) a propósito: es la única forma de que quede
  genuinamente sin poder darle clic sin necesitar JS todavía. Cuando el
  inventario cambie, el futuro JS va a tener que reemplazar ese elemento
  por un `<a>` (o viceversa) en vez de solo alternar un atributo — no se
  buscó forzar un único tipo de elemento para no debilitar esa protección
  mientras no hay JS. Documentado en el comentario del HTML.

  Se probó con Playwright: los 8 `data-producto-id` están presentes,
  `data-precio`/`data-disponibilidad` se leen bien, y el query param
  llega correctamente a `detalle-pedido.html` al hacer clic en ORDENAR.
- **2026-07-27 (4)** (rama `Alejandro`): se construyeron los **5 módulos
  admin que faltaban**: `BuscarPedidos-admin.html`, `Facturas-admin.html`,
  `Empleados-admin.html`, `Reportes-admin.html`, `Proveedores-admin.html`.
  Para no repetir en cada uno los mismos tokens/tablas/botones que ya tenían
  Home-admin/Inventario/GestionPedidos, se creó un **sistema de diseño admin
  compartido en `Recursos/admin.css`** (fondo `#161616`, panel `#202020`,
  ámbar `#d99a4e`, chips `.estado`, `.tabla-admin`, `.panel-admin`,
  `.boton-ambar/.exito/.peligro`, `.campo-admin`, etc.); las 5 páginas nuevas
  lo usan. Las tarjetas de módulo de `Home-admin.html` (Buscar pedidos,
  Facturas, Empleados, Reportes, Proveedores) pasaron de `<button>` a `<a>`
  y ya enlazan a sus páginas: el panel queda navegable de punta a punta.
  Todo son marcadores (filas de ejemplo, sin `action`), solo frontend.
  Incoherencias detectadas y no tocadas para no pisar el trabajo del
  compañero: las 3 páginas admin previas repiten estilos que ahora viven en
  `admin.css` (se podrían migrar a él), y usan nombres distintos para el
  mismo encabezado (`.encabezado-admin/-pagina/-pedidos`, unificado como
  `.encabezado-modulo` en lo nuevo).
- **2026-07-27 (5)** (rama `Alejandro`): se conectó la navegación del panel
  admin en ambos sentidos — se agregó un enlace "← Volver al panel" a las 7
  páginas de módulo (el header compartido apunta a las vistas de cliente, no
  al panel). `.enlace-volver` vive en `admin.css` y se repite en
  `Inventario.css`/`GestionPedidos.css` (esas 2 no cargan `admin.css`).
- **2026-07-28** (rama `Alejandro`): se conectaron los enlaces del
  header/footer compartidos (antes en `href="#"`): NUESTROS PRODUCTOS y
  Servicios → `productos.html`, CARRITO DE COMPRAS → `pago.html`, CERRAR
  SESIÓN → `login.html` (CONTACTO y ACTUALIZAR DATOS ya los había conectado
  el compañero). Quedan en `#` a propósito: "SOBRE NOSOTROS" (no existe la
  página) y los 4 íconos de redes (sin URLs reales todavía).
- **2026-07-28 (2)** (rama `Alejandro`): tres cambios en la vista de cliente.
  1. **Disponibilidad real del pollo**: hoy el negocio solo vende **pollo
     entero**, así que esa tarjeta va de primera y es la única con ORDENAR
     activo. Pechuga, muslo y alas pasan a **"Próximamente"** (chip azul
     `.disponibilidad.proximamente`, botón `disabled` con
     `.boton-proximamente`, foto atenuada con `.imagen-atenuada`).
  2. **Precio como variable del administrador**: los productos
     "Próximamente" no muestran monto inventado — se ven con `—` y
     `data-precio=""` vacío, listo para que el admin lo defina. Tampoco
     anuncian cantidad (no hay stock que ofrecer). Los huevos y el pollo
     entero conservan sus precios marcador.
  3. **Redes sociales**: la única red real del negocio es
     **instagram.com/lamoran837/**. Se quitaron del footer LinkedIn,
     Facebook y YouTube (anunciaban redes inexistentes con enlaces muertos)
     y queda solo Instagram, con ícono SVG inline (mismo criterio que
     `login.html`), `target="_blank"` y `rel="noopener noreferrer"`.

  Además, las 8 tarjetas de producto ya tienen **foto real** en vez del
  marcador punteado: `Imagenes/producto-<data-producto-id>.jpg` (84 KB en
  total, cuadradas 240×240). Son de **stock libre (Unsplash/Pexels) y
  provisionales**: se reemplazan por las fotos reales del negocio
  manteniendo el mismo nombre de archivo, sin tocar el HTML. El hero
  ("Foto de portada") sigue con su marcador. Salvedad: no existen fotos de
  **alas crudas** con licencia libre (todo lo indexado es pollo frito), así
  que `producto-pollo-alas.jpg` es la aproximación menos fiel y conviene
  cambiarla por una foto propia.
- **2026-07-28 (3)** (rama `Alejandro`): tres arreglos visuales.
  1. **Logo cortado**: medía 160px con `top:-35px`, así que terminaba 53px
     por debajo del header (157px = 85 de paja + 72 de barra blanca) y esa
     parte quedaba tapada por el contenido. Ahora es 130px con `top:-63px`
     (va de 22px a 152px, cabe completo) y `.header` lleva
     `position:relative` + `z-index:5`.
  2. **Portada del hero**: se reemplazó el marcador punteado por
     `portada-productos.jpg` (1600×460, 64 KB). Se eliminó la regla
     `.marcador-foto` de `productos-listado.css`, que quedó sin uso
     (`catalogo.html` tiene la suya propia en `catalogo.css`).
  3. **Contraste de botones inertes**: Bootstrap le baja la opacidad a 0.65
     a todo botón `:disabled`, y sobre el fondo oscuro el texto
     "Próximamente" quedaba casi ilegible. Se fija `opacity:1` y el par
     #6b6b6b/#ffffff, que da ~5.3:1 (WCAG AA) sin perder el aspecto apagado.
- **2026-07-28 (4)** (rama `Alejandro`): se creó **`Sobre-Nosotros.html`** +
  `Recursos/Sobre-Nosotros.css` (familia visual de `Contacto.css`: fondo
  oscuro, tarjeta, acento ámbar). Con eso se activaron los **3 enlaces que
  seguían en `#`** (header, footer/INFORMACIÓN y footer/nav inferior): ya no
  queda ningún enlace muerto en la navegación del sitio.

  Contenido: solo información que consta en el propio proyecto — el eslogan
  del footer, los productos que realmente se venden (huevos 30/15/6/4 y
  pollo entero, con los cortes marcados como próximamente) y los datos de
  contacto e Instagram del footer. **No se inventó historia del negocio**
  (año de fundación, tamaño, premios). El párrafo de "Quiénes somos" es un
  texto de arranque breve y está marcado en el HTML con un comentario para
  que la familia Morán lo reemplace por su historia real.
- **2026-07-28 (5)** (rama `Alejandro`): pasada de correcciones sobre **las 8
  pantallas del panel de administración**, a partir de una auditoría con los
  cuatro agentes de revisión (`revisor-accesibilidad`, `revisor-css`,
  `revisor-convenciones`, `revisor-datos-falsos`) más hallazgos de producto.

  **Legibilidad (lo más grave).** Todos los botones ámbar del panel tenían
  texto blanco sobre `#d99a4e`: **2.42:1**, muy por debajo del 4.5:1 de WCAG
  AA, y afectaba prácticamente cada acción de las 8 pantallas. Se cambió el
  texto a `#111111` (**7.81:1**, 6.13:1 en hover) conservando el ámbar de
  marca — el mismo criterio que ya usaba el chip `.estado.pendiente`. El verde
  y el rojo se dejaron en blanco porque sí cumplen (4.53:1). Además: el chip
  "En preparación" pasó de `#3d8bfd` a `#1a5fc4` (3.33:1 → 6.04:1); el
  buscador de Gestión de pedidos no redefinía `::placeholder` y heredaba el de
  Bootstrap, pensado para fondo claro, quedando en **1.06:1** (invisible); y
  los placeholders de los campos admin pasaron de `#8a8a8a` a `#9a9a9a`
  (4.16:1 → 5.10:1).

  **Navegación.** El panel **no se alcanzaba desde ninguna página**: había que
  escribir la URL. Se agregó un enlace "Panel administrativo" en el login,
  explícitamente **provisional** — cuando exista la capa de autenticación debe
  ser el rol quien decida el destino, y ese enlace se quita. Los 5 botones de
  "Accesos rápidos" del tablero eran `<button>` inertes de cuando los módulos
  no existían; ahora son `<a>` al formulario real de cada módulo vía
  fragmento (`#formulario-empleado`, `#formulario-nueva-factura`,
  `#formulario-proveedor`).

  **`tokens-admin.css` (nuevo).** Los mismos colores estaban declarados cuatro
  veces (`admin.css`, `Home-admin.css`, `Inventario.css`, `GestionPedidos.css`),
  y en dos casos con nombres distintos para el mismo valor
  (`--fondo-admin`/`--fondo-inventario`/`--fondo-pedidos` eran los tres
  `#161616`). Ahora los tokens viven en una sola hoja que cargan las 8
  pantallas antes de su CSS propio; como no tiene ninguna regla de clase, no
  puede pisarle estilos a nadie. Los valores eran idénticos, así que el cambio
  es un no-op visual.

  **Otros.** Los íconos de los módulos pasaron de emoji a **SVG inline** (el
  emoji lo dibuja la fuente del sistema: cambia de forma entre plataformas y
  no hereda el color de marca). Se borró de `admin.css` el código muerto
  `.resumen-admin`/`.tarjeta-indicador`, que se escribió y nunca se conectó.
  Las cifras de resumen de Gestión de pedidos eran `<h3>` bajo un `<h1>`, un
  salto de jerarquía; ahora son `<span class="cifra-resumen">`, como ya hacía
  Home-admin. Las tablas de Inventario tenían el `overflow-x:auto` sólo dentro
  del media query de 650px: con datos reales desbordarían mucho antes, así que
  pasó a ser incondicional.

  **Fuera del panel** (el footer es compartido, así que aplica a todo el
  sitio): el input de suscripción no tenía etiqueta y llevaba `outline:none`
  sin reemplazo — quien navega con teclado no veía el foco. Se le puso
  `aria-label`, un indicador de foco propio (el subrayado ámbar se engrosa y
  aclara) y se aclaró su placeholder (4.27:1 → 6.16:1).

  **Datos de ejemplo.** Las filas de Gestión de pedidos decían "Juan Pérez",
  "8888-8888" y "₡12 500". Estaban marcadas como provisionales en un
  comentario HTML, pero el comentario protege al desarrollador, no a quien
  mira la pantalla: en una demo pasaban por pedidos reales. Ahora dicen
  "Cliente de ejemplo 1/2", `0000-0000`, `00/00/0000` y `₡0` — coherente
  además con que el precio es una variable que gestiona el administrador.

  **Pendiente, a propósito.** No se migraron `Home-admin`, `Inventario` y
  `GestionPedidos` al sistema de clases de `admin.css`. Hoy conviven seis
  nombres para el botón ámbar y cuatro para el encabezado de módulo, pero
  `admin.css` usa paddings, bordes y tamaños distintos, así que la migración
  **cambia el aspecto real de esas tres pantallas** y necesita revisión visual,
  que en este entorno no se puede hacer. Tampoco se tocó que el panel cargue
  el header del cliente (logo, carrito, "Sobre nosotros"), ni el solape entre
  "Buscar pedidos" y "Gestión de pedidos": son decisiones de producto.
- **2026-07-28 (6)** (rama `Alejandro`): **pase de aplanado del panel admin** —
  menos animación, más estático.

  Se quitaron las **9 transiciones** declaradas en las cuatro hojas del panel y
  la **elevación de las tarjetas de módulo** (`transform: translateY(-5px)` +
  `box-shadow`): en un panel de trabajo, que el contenido se mueva cada vez que
  el cursor pasa por encima distrae más de lo que ayuda. El hover ahora solo
  marca el borde en ámbar, instantáneo.

  Detalle que no es obvio: **quitar las transiciones propias no alcanzaba**.
  Bootstrap le aplica las suyas a `.btn`, `.form-control` y `.form-select`
  (~0.15s en color, borde y sombra), y el panel usa las tres (46 `.btn`, 39
  `.form-control`, 9 `.form-select`). Hay un `transition: none` acotado a
  `.pagina-admin` / `.pagina-inventario` / `.pagina-pedidos`, para no tocar las
  vistas de cliente, que sí conservan sus efectos.

  **Radios.** Convivían cinco valores sueltos (20px de pastilla en los chips,
  12px, 10px, 6px y 5px), heredados de ir construyendo pantalla por pantalla.
  Se reducen a dos variables en `tokens-admin.css`: `--radio-panel: 4px` y
  `--radio-control: 3px`. Están como variables a propósito: la "redondez" de
  todo el panel se ajusta desde ahí en una línea.

  **Pendiente y explícito**: la parte de "fiel al Figma" de este pedido **no se
  pudo verificar** — las capturas del apartado de administración no están
  disponibles en el entorno de trabajo. Lo aplicado son criterios de
  minimalismo generales (sin movimiento, radios planos y unificados), no una
  comparación contra el diseño original. Los `--radio-*`, el `border-left`
  ámbar de los títulos de sección y los íconos SVG de los módulos son los
  puntos donde más conviene contrastar contra el Figma.
- **2026-07-28 (7)** (rama `Alejandro`): **separación de ámbitos admin/cliente**.
  Las páginas y el CSS quedaron divididos en `Paginas/Admin/` +
  `Paginas/Cliente/` y `Recursos/Admin/` + `Recursos/Cliente/`. `estilos.css`,
  `plantillas.js` e `Imagenes/` siguen compartidos en la raíz de `Recursos/`,
  porque los usan los dos ámbitos. 35 archivos movidos con `git mv` (el
  historial se conserva como renombres, no como borrar+crear).

  Lo que hizo falta corregir, y por qué:

  1. **Profundidad**: las páginas pasaron de un nivel a dos, así que todo
     `../Recursos/...` pasó a `../../Recursos/<ámbito>/...` en las 19 páginas.
  2. **`plantillas.js`**: hace `fetch()` con rutas relativas a **la página que
     lo carga**, no a sí mismo. Aunque el archivo no se movió, sus dos rutas
     de fragmento tuvieron que pasar a `../../Componentes/...`.
  3. **Enlaces del header/footer compartidos**: es el punto que menos se ve
     venir. Los fragmentos se inyectan en páginas de **ambos** ámbitos, así
     que sus 6 enlaces (que apuntan todos a páginas de cliente) no podían
     seguir siendo nombres de archivo pelados: desde `Paginas/Admin/` habrían
     buscado `Paginas/Admin/login.html`. Ahora van con `../Cliente/...`, que
     resuelve igual desde los dos ámbitos. El logo de los fragmentos tuvo el
     mismo problema y pasó a `../../Recursos/Imagenes/...`.
  4. **Fondos**: las 5 hojas de cliente con `url("Imagenes/...")` bajaron un
     nivel respecto a `Recursos/Imagenes/`, así que pasaron a `url("../Imagenes/...")`.
  5. **Cruce entre ámbitos**: el único que existe es el enlace del login al
     panel, que ahora va con `../Admin/Home-admin.html`.
  6. La redirección de `vistas/index.html` apunta a `Paginas/Cliente/index.html`,
     y los comentarios de cabecera de las 11 hojas que citaban la ruta de su
     página se actualizaron.

  La regla nueva a mantener: **todas las páginas viven a la misma
  profundidad** (`Paginas/<ámbito>/`). Las plantillas compartidas dependen de
  eso; una página anidada a otra profundidad rompería el header/footer sólo en
  esa página.
- **2026-07-29** (rama `Alejandro`): se llevó el rediseño "etiqueta de finca"
  (variación **A1** de 4, aprobada por el usuario sobre una maqueta
  exploratoria que vivió fuera del repo, en un artifact aparte) al catálogo
  real: `vistas/Paginas/Cliente/productos.html` y
  `vistas/Recursos/Cliente/productos-listado.css`. Las tarjetas de producto
  pasan de "panel translúcido sobre la madera" a imitar una etiqueta de kraft
  colgada del producto: ojal perforado, rotación alterna leve, sello circular
  de tinta para el precio y cinta de esquina para la disponibilidad. Del hero
  de portada solo la foto quedó fuera del rediseño; la banda de texto
  ("Productos frescos de alta calidad") sí recibió la paleta y tipografía
  kraft, aunque vive anidada dentro de esa misma sección.

  Se hizo con un flujo de implementar + auditar en paralelo (accesibilidad,
  convenciones, CSS, enlaces, datos falsos) antes de darlo por bueno, y
  aparecieron dos fallas de contraste reales que la maqueta original no tenía
  por qué prever, porque ahí yo controlaba el fondo — acá el fondo real de la
  sección es una foto (`fondo-cafe.jpg`), no un color plano:
  1. El sello de categoría ("Huevos"/"Pollo") usaba un fondo traslúcido
     (`rgba(246,236,217,.35)`) pensado para verse bien sobre un color de
     fondo controlado; contra los tonos reales y muy oscuros de la foto medía
     apenas 1.5–1.8:1. Pasó a `--kraft-hueso` sólido: 9.63:1.
  2. El sello de precio vacío ("—" de pechuga/muslo/alas) apilaba dos
     opacidades sobre el mismo elemento (`opacity:.6` del sello +
     `opacity:.85` de la tarjeta completa), multiplicándose a ~0.51 efectivo
     y cayendo a ~3.2:1 contra la foto real — el mismo tipo de problema que
     ya había dado el `opacity:.65` de Bootstrap en botones `:disabled` en
     este proyecto, esta vez autoinfligido. Se quitó la opacidad del sello
     (el borde punteado ya distingue el estado); con solo la atenuación de la
     tarjeta completa, el contraste real sube a ~7.8:1.

  --kraft-ocre (cinta "Pocas unidades") quedó en `#875c1a`, no en el `#a9762c`
  de la maqueta original (ese tono fallaba WCAG AA con texto claro encima:
  3.37:1 contra el 5.01:1 del valor corregido) — verificado antes de aplicar
  y confirmado después por la auditoría.

  Se preservó tal cual todo lo real: los 8 `data-producto-id`, los 4 `href`
  de ORDENAR hacia `detalle-pedido.html?producto=...`, los `alt` descriptivos,
  `data-precio` (vacío en los 3 "próximamente") y `data-disponibilidad`. Los
  productos "próximamente" no llevan ningún `<a>`/`<button>`: no hay nada que
  pedir todavía, así que no se renderiza un control con apariencia de
  interactivo que en realidad no lleve a ningún lado (antes de este rediseño
  se resolvía con un `<button disabled>`).
- **2026-08-01** (rama `Alejandro`): reestructuración del panel a partir del
  rediseño de la base de datos. **La documentación de esquema y
  requerimientos se mantiene fuera del repo a pedido del equipo**, así que
  acá solo queda lo que se decidió y por qué, no su contenido.

  **1. Se eliminó el módulo de empleados.** El módulo se descartó por
  completo y se está quitando también de la base de datos, así que salió del
  frontend: se borró `Empleados-admin.html` con su tarjeta de módulo, su
  contador del resumen y su acceso rápido en `Home-admin.html`.

  Se eliminó **también `Reportes-admin.html`**, que no estaba en el pedido
  original. En el tablero se llamaba "Reportes", pero por dentro era el
  historial de puestos de esos mismos empleados: seleccionar colaborador,
  ficha con puesto y departamento, tabla de movimientos de puesto. Sin
  empleados no le quedaba ningún dato que mostrar, y dejarla habría sido
  justamente el enlace muerto que se quería evitar. Confirmado con el usuario
  antes de borrarla. Si más adelante hacen falta reportes, el requerimiento
  real habla de **reportes de ventas**, que se calculan agregando sobre las
  ventas registradas — no hace falta una pantalla de historial de personal.

  **2. Dos pantallas nuevas**, ambas en el ámbito admin porque son registro
  interno, no vistas de cliente:

  - **`RecoleccionDiaria-admin.html`**. Cubre un hueco real: hasta ahora los
    huevos y los pollos existían en el sitio como **aves** (los lotes de
    Inventario) o como **producto terminado** listo para vender (el catálogo),
    pero no había dónde registrar el paso de una cosa a la otra. Campos:
    fecha, día, lote de origen, producto (huevos/pollos) y cantidad.

    Dos decisiones que conviene no revertir sin pensarlo:
    **el lote no estaba en el pedido original** y se agregó porque el
    registro no se puede guardar sin él — la recolección sale siempre de un
    lote concreto, y en el caso de los pollos hay que descontarlos de ese
    lote además de sumarlos al inventario. Y **el día no se digita**: se
    deriva de la fecha en `recoleccion-diaria.js`, para que no pueda quedar
    contradiciendo a la fecha.

  - **`VentasManuales-admin.html`** + `VentasManuales.css` +
    `ventas-manuales.js`. Registro interno de las ventas que pasan por fuera
    del sitio (WhatsApp, ruta, mostrador), que hoy no dejan ningún rastro.
    Campos: fecha y hora, nombre de cliente opcional, líneas de producto con
    cantidad, y monto.

    **Está diseñada para el celular**, y ese es el motivo de casi todo lo que
    tiene distinto: se usa parado en la ruta, con una mano, apenas se entrega
    el pedido. Campos de 48px de alto mínimo (el objetivo táctil que
    recomiendan Apple y Google), letra de 16px —no es estético: Safari en iOS
    hace zoom automático en cualquier campo con letra menor y deja la página
    descuadrada—, una sola columna por defecto y el layout ancho recién a
    partir de 700px. Es al revés que las otras hojas del panel, que arrancan
    anchas y se apilan al final.

    El **monto se digita, no se calcula**: el precio lo administra el
    administrador y vive en la base de datos, así que hasta que exista esa
    capa el sitio no tiene de dónde sacarlo sin inventarlo. El JS deja
    anotado cómo pasar a calcularlo cuando el dato exista. El **nombre del
    cliente es opcional** a propósito: obligarlo haría que se registren
    clientes falsos para poder guardar ventas de mostrador.

  **3. Detalle de las fechas en JavaScript.** Los dos scripts arman las
  fechas a mano en vez de usar `new Date('AAAA-MM-DD')` o `toISOString()`.
  No es preferencia de estilo: `new Date('2026-08-01')` se interpreta como
  medianoche **UTC**, y en Costa Rica (UTC-6) eso cae el día anterior, así
  que el día de la semana sale corrido. Verificado: el método directo
  reporta "Viernes" donde corresponde "Sábado". Lo mismo con
  `toISOString()`, que devolvería el día equivocado durante las últimas 6
  horas de cada día — justo cuando se registra la recolección de la tarde.

  **4. Datos de ejemplo visibles.** Las tablas de ambas pantallas llevan un
  aviso `.nota-ejemplo` **visible en pantalla**, no solo un comentario HTML.
  Es la misma lección de la sesión del 2026-07-28: un comentario protege a
  quien lee el código, no a quien mira la pantalla en una demo.

  **5. Auditoría con los cuatro agentes revisores**, y lo que encontró.

  **El hallazgo más grave no era de las pantallas nuevas sino de todo el
  panel: los botones no tenían indicador de foco de teclado, y encima se
  volvían invisibles al enfocarse.** Bootstrap declara
  `.btn:focus-visible { background-color: var(--bs-btn-hover-bg); … outline: 0 }`
  pero define esas variables **solo dentro de las variantes** `.btn-primary`,
  `.btn-danger`, etc. En este panel ningún botón usa una variante: todos son
  `.btn` más una clase propia. Con las variables sin definir, cada declaración
  queda inválida en tiempo de cómputo y cae a `unset` —no al valor de la regla
  que perdió en la cascada—, así que el botón terminaba con fondo
  transparente, borde transparente, `outline: 0` y `box-shadow: none`. Y gana
  Bootstrap, porque `.btn:focus-visible` es (0,2,0) contra el (0,1,0) de
  `.boton-ambar`. Con `:hover` no pasa: ahí sí hay reglas propias que empatan
  en especificidad y ganan por ir después. Verificado descargando el CSS real
  de Bootstrap 5.3.3 y confirmando que ninguna página admin usa una sola clase
  `btn-*`. Corregido en `admin.css` con un anillo ámbar y la reposición del
  fondo por familia de botón.

  **Aviso: `Home-admin.css`, `Inventario.css` y `GestionPedidos.css` tienen el
  mismo problema y NO se corrigieron.** Esas tres páginas no cargan
  `admin.css`, así que necesitan su propia copia del bloque `:focus-visible`.
  Quedó fuera del alcance de esta sesión.

  Otras correcciones aplicadas, todas verificadas calculando el contraste real
  con la fórmula de luminancia de WCAG, no a ojo:
  - **La flecha del `<select>` era invisible**: `.campo-admin` cambiaba el
    fondo del control pero no su `background-image`, así que seguía el chevron
    de Bootstrap dibujado en `#343a40`, que sobre el `#2a2a2a` del campo da
    **1.25:1**. Reemplazado por uno claro: 7.64:1.
  - **`--campo-borde` pasó de `#444444` a `#757575`** (1.67:1 → **3.54:1**).
    El borde es lo único que delimita el campo: su relleno contra el panel es
    1.04:1, o sea invisible. Es un token, así que arregla las 8 pantallas.
  - **`color-scheme: dark`** en `.pagina-admin`: sin eso el navegador dibuja
    en paleta clara lo que pinta él —el ícono del calendario de
    `<input type="date">` y su panel emergente—, y quedaba claro sobre oscuro.
  - **El campo readonly perdía su estilo justo al enfocarse**: `.campo-admin:focus`
    tiene la misma especificidad y va después, así que le devolvía el fondo y
    el blanco, dejándolo idéntico a uno editable. Se repite el selector con
    `:focus` y se le agrega borde punteado, porque el salto de fondo es de
    1.09:1 y por sí solo no se percibe.
  - **Al quitar una línea de producto el foco se caía al `<body>`**: el botón
    que se acaba de tocar desaparece con la línea. Ahora pasa al botón de la
    línea de arriba, o al de agregar.
  - **Las tablas con scroll no eran alcanzables con teclado**: un `<div>` que
    scrollea y no es enfocable no se puede desplazar sin mouse en Firefox ni
    Safari. Llevan `tabindex="0"` + `role="region"` + `aria-label`.
  - Dos clases (`.campo-producto`, `.campo-cantidad`) estaban aplicadas en el
    HTML **sin existir en ninguna hoja** del ámbito admin; `.campo-cantidad`
    además colisionaba de nombre con una del ámbito cliente que significa otra
    cosa. Se quitaron: el grid ya coloca por posición. **De ahí salió la regla
    de acotar toda la hoja de página bajo la clase de su `<main>`.**

  **6. Convenciones nuevas que quedan establecidas** (no estaban escritas):
  - **El JS de una pantalla vive junto a su CSS**, en la carpeta del ámbito, y
    **usa la misma grafía que su CSS hermano**: `VentasManuales.css` va con
    `VentasManuales.js`, no con `ventas-manuales.js`. `plantillas.js` no sirve
    de precedente porque es una sola palabra. Se agrega solo cuando la
    pantalla no se puede resolver sin él.
  - **Los `name` de los campos usan el nombre de la columna de la base de
    datos** (`fecha`, `cantidad`, `id_lote`, `tipo_producto`, `fecha_venta`,
    `comprador_nombre`), no el patrón `entidad_campo` de las tres páginas
    admin anteriores. Esas se escribieron antes de que existiera el esquema;
    ahora que existe, que el formulario y la tabla se llamen igual ahorra una
    capa de traducción en el PHP que viene.
  - **La hoja propia de una página acota sus reglas** bajo la clase de su
    `<main>` (`.pagina-venta-manual`), para que un nombre repetido no pueda
    alcanzar a otra pantalla.

  **7. Pendientes detectados y no tocados** (son decisiones de producto o de
  esquema, no de frontend):
  - Los estados de pedido del frontend (`pendiente / preparacion /
    entregado / cancelado`, en 9 lugares de 2 páginas) **no coinciden** con
    los que define la base de datos, donde "en preparación" no existe. Hay
    que decidir cuál de los dos manda antes de conectar.
  - `Facturas-admin.html` no tiene tabla detrás: folio, estado y totales no
    tienen dónde guardarse. La factura se deriva de las ventas, no se
    almacena.
  - No existe ninguna pantalla para **dar de alta un lote**, siendo un
    requerimiento de prioridad alta, y la tabla de lotes de Inventario no
    muestra varios campos que el esquema sí define.
  - Los puntos de entrega de `detalle-pedido.html` (hasta 7, cada uno con su
    cantidad) no calzan con lo que la base de datos puede guardar (dos
    campos de texto, sin cantidad).
  - La tabla "Componentes" de Inventario no existe en el esquema.
  - No hay forma de distinguir un administrador de un cliente en los datos
    de usuario, así que el enlace "Panel administrativo" del login sigue
    siendo provisional y todavía no hay a qué conectarlo.
  - **`productos.html` muestra precios concretos al cliente** (₡3 500,
    ₡1 800, ₡900, ₡650, ₡5 500). Están anotados como marcador en un
    comentario, pero es una pantalla de cliente y el comentario no lo ve
    nadie. Contradice la regla de que el precio es una variable del
    administrador y nunca un monto fijo. Lo mismo con "Disponible" y "Pocas
    unidades", que son existencias inventadas sin marcar.
  - `Home-admin.css`, `Inventario.css` y `GestionPedidos.css` necesitan el
    bloque `:focus-visible` del punto 5.
  - `catalogo.html` quedó **huérfana**: ninguna página del sitio la enlaza.
  - Los 4 íconos de login social de `login.html` siguen en `href="#"`.

  **8. El módulo de inventario no se tocó**, a la espera del detalle de los
  cambios que pidió Franklin. La estructura actual quedó relevada: 4 tablas
  de solo lectura (productos terminados, lotes, insumos, componentes), sin un
  solo formulario ni input, o sea sin ninguna forma de dar de alta, editar ni
  mover existencias.

  **9. Nota de entorno**: en esta máquina no hay Playwright ni ningún
  navegador headless, a diferencia de las sesiones anteriores. Todo se
  verificó sirviendo `vistas/` con `python -m http.server` y comprobando
  códigos HTTP, balance de etiquetas, sintaxis de JS y ratios de contraste
  por cálculo — pero **no hubo revisión visual en navegador**.
- **2026-08-02** (rama `Alejandro`): **entraron las primeras fotos reales del
  negocio**, en reemplazo de las de stock (Unsplash/Pexels) que estaban desde
  el 2026-07-28.

  La familia mandó 45 fotos por WhatsApp (11 MB, 1600×1200 sin optimizar). Se
  catalogaron las 45 con tres agentes en paralelo y después se verificó a mano
  cada finalista antes de asignarlo.

  **Se sustituyeron 6 imágenes**: los cuatro cartones de huevos, el pollo
  entero y la portada del catálogo.

  **Verificación que no se puede saltar: el conteo.** Cada tarjeta anuncia
  "Cantidad: 30 / 15 / 6 / 4", así que la foto tiene que mostrar exactamente
  esa cantidad. Se contaron los huevos de cada foto candidata antes de
  asignarla, y **se descartó una candidata que parecía un cartón de 15 pero
  era uno de 30 recortado por el encuadre** — usarla habría sido tergiversar
  el producto, del mismo tipo que inventar un precio. Los cuatro cartones
  finales dan exacto: 6×5, 5×3, 3×2 y 2×2.

  **El pollo entero cambió de concepto, no solo de archivo.** La foto de stock
  era un pollo crudo estilizado sobre tabla de cortar con hierbas; la real
  muestra los pollos **empacados en bolsa**, que es lo que el cliente
  efectivamente recibe. El `alt` se actualizó en consecuencia, igual que el de
  la portada (decía "Canasta con huevos" y ya no hay ninguna canasta). De paso
  se unificó "Bandeja de 30" → "Cartón de 30", inconsistencia que ya se había
  detectado antes.

  **Herramienta**: se usó **Pillow**, no ImageMagick, que no está instalado en
  este equipo. El script aplica `exif_transpose` antes de recortar — sin eso
  las fotos verticales de celular se procesan acostadas, porque la rotación
  vive en los metadatos y no en los píxeles.

  **El recorte tuvo en cuenta que la foto se ve en un círculo.** Desde el
  rediseño "etiqueta de finca", `.foto-etiqueta` es de 64×64 con
  `border-radius: 50%`, así que las cuatro esquinas se pierden. Las 22 fotos
  de huevos están tomadas sobre un mantel de hule rojo muy estampado
  (girasoles y gallinas), que a ese tamaño le come el contraste al producto;
  se recortó cerrado a propósito para que el cartón llene el círculo y el
  mantel quede casi todo fuera. **Si en algún momento se repiten esas fotos
  sobre madera clara o un paño liso, el catálogo entero mejora.**

  **Lo que NO se cambió, y por qué:**
  - `producto-pollo-pechuga`, `-muslo` y `-alas` siguen siendo de stock: entre
    las 45 fotos no hay ninguna de esos cortes, lógico porque el negocio no los
    vende (están como "Próximamente"). No se inventó un reemplazo.
  - Los cuatro `fondo-*.jpg` siguen siendo las texturas de Unsplash. Las fotos
    de la finca sirven como imagen, no como fondo parejo con texto encima.

  **Falso positivo de la auditoría, anotado para que no se repita**: el
  revisor de datos falsos reportó que `producto-pollo-alas.jpg` muestra alas
  **cocidas** mientras el `alt` dice "crudas". Se verificó mirando la foto: son
  crudas (piel pálida, cortes de preparación, sin dorar). El tono cálido de la
  sartén y el tamaño chico inducen el error. No se cambió nada.

  **Sobró material sin usar**: 15 fotos muy buenas de pollitos de engorde y de
  gallinas ponedoras en el corral. No entran en ningún puesto del catálogo,
  que solo tiene fotos de producto, pero serían ideales para `Sobre-Nosotros`,
  que hoy **reutiliza dos fotos de producto** en vez de tener imágenes propias
  de la finca. Queda propuesto, no hecho.

  **Los 11 MB de originales** quedaron en
  `vistas/Recursos/Imagenes/Imágenes reales del negocio/`, **excluidos de git**
  (`.git/info/exclude`). Conviene sacarlos de `vistas/` del todo: lo que vive
  ahí se despliega con el sitio.
- **2026-08-02 (2)** (rama `Alejandro`): se **rediseñó `Sobre-Nosotros.html`**
  por completo. El usuario eligió la dirección **"inmersivo nocturno"** entre
  seis propuestas presentadas en un artifact aparte (las otras cinco fueron:
  etiqueta de finca, cartón de huevos, rótulo de zinc, editorial fotográfico y
  bitácora de finca).

  **Por qué se rehízo.** La página reutilizaba las miniaturas cuadradas del
  catálogo (240×240) estirándolas a ~550px de ancho: ampliadas 2,3 veces se
  veían blandas y dejaban asomar el mantel de las fotos de producto. Además el
  layout era un panel centrado con dos tarjetitas, que no aprovechaba nada de
  la fotografía real que ya existía.

  **Imágenes propias**, recortadas del original a la resolución que de verdad
  necesitan: `sobre-granja.jpg` (1600×800, el corral con las ponedoras — foto
  que no se usaba en ninguna parte), `sobre-huevos.jpg` y `sobre-pollo.jpg`
  (1200×700). Calidad 88.

  **El diseño**: portada a sangre con la foto del corral, el título y el
  eslogan encima sobre un velo en degradado, y el resto del contenido en
  columna debajo. Conserva el fondo oscuro y el ámbar de marca que ya usan
  `Contacto.css` y `registro.css`.

  **El detalle que puede volver la página ilegible en silencio.** El texto de
  la portada va sobre la foto, así que su legibilidad depende de cuán denso sea
  el velo justo donde cae el bloque de texto. Lo contraintuitivo es que **el
  caso exigente es la pantalla chica, no la grande**: el bloque de texto tiene
  alto fijo, así que en una portada corta ocupa una fracción mayor y arranca
  proporcionalmente más arriba, donde el velo todavía es claro. Con los topes
  iniciales el eslogan ámbar daba **4.81:1 en móvil** (pasaba AA, sin margen) y
  6.54:1 en escritorio. Se adelantó el tope denso del 66% al 55% y ahora el
  peor caso es **6.48:1**. El cálculo quedó escrito en el CSS: si alguien
  cambia el alto del bloque de texto, hay que rehacerlo.

  **Dos bugs heredados que esta página arrastraba** y se corrigieron de paso:
  - `.boton-sobre` ponía texto blanco sobre el ámbar `#d99a4e`: **2.42:1**. Es
    el mismo error que el panel admin corrigió el 2026-07-28, pero esta página
    de cliente se había quedado atrás. Ahora usa `#111111` (7.81:1).
  - Los botones no tenían indicador de foco por el bug de Bootstrap ya
    documentado (`.btn:focus-visible` usa variables que solo existen dentro de
    las variantes `.btn-*`). Se repuso a mano, igual que en `admin.css`.

  **Nombres**: se conservaron `.pagina-sobre`, `.titulo-sobre`,
  `.eslogan-sobre`, `.texto-sobre`, `.datos-sobre`, `.etiqueta-dato`,
  `.acciones-sobre` y los dos `.boton-sobre*`. Se renombraron
  `.tarjeta-sobre` → `.pieza-sobre`, `.cuerpo-tarjeta` → `.cuerpo-pieza` y
  `.subtitulo-sobre` → `.rotulo-sobre`; son nuevas `.escena-sobre`,
  `.texto-escena` y `.cuerpo-sobre`. Verificado que ninguna choca con otra hoja
  del proyecto.

  **Sin revisión visual**: sigue sin haber navegador en este equipo. Todo se
  midió por cálculo y se comprobó sirviendo el sitio, pero nadie vio la página
  renderizada.
- **2026-08-02 (3)** (rama `Alejandro`): se **rediseñó el footer compartido**.
  El usuario eligió la dirección **"editorial en columnas"** entre seis
  propuestas presentadas en un artifact aparte (las otras cinco: banda compacta,
  membrete en papel, banda kraft, pizarrón de mostrador y acciones directas).

  **Alcance**: el footer se inyecta en **18 de las 19 páginas**, incluidas las
  ocho del panel admin. Es el componente de mayor alcance del sitio.

  **El hallazgo que motivó la mitad del trabajo: el footer repetía sus
  enlaces.** Tenía OCHO enlaces para sólo CUATRO destinos.
  - `productos.html` aparecía **cuatro veces**: "Nuestros Productos", "Pedido de
    pollo", "Pedido de huevos" y "NUESTROS PRODUCTOS". Los dos "pedidos" no
    llevaban a pedir nada distinto: iban al mismo listado. La sección que los
    agrupaba se llamaba "SERVICIOS", que prometía algo que no existe.
  - `Sobre-Nosotros.html` aparecía **dos veces**.
  - El menú inferior ("CERRAR SESIÓN", "NUESTROS PRODUCTOS", "SOBRE NOSOTROS")
    repetía **entero** enlaces que el header ya tiene en todas las páginas, así
    que se quitó completo. Cerrar sesión sigue en el header, que es donde
    corresponde: es una acción de sesión, no navegación de pie.

  Ahora hay **cinco enlaces y cinco destinos distintos**, y se sumó Contacto,
  que el footer no ofrecía.

  **Otros cambios de fondo**:
  - Correo y teléfono pasaron de texto suelto a enlaces `mailto:` y `tel:`. En
    el celular, tocar el número llama.
  - El eslogan dejó de ser un `<h2>` de 32px en mayúsculas y pasó a ser un `<p>`
    serif en itálica, la misma voz que el login y Sobre Nosotros. De paso deja
    de meter un `<h2>` ajeno en la jerarquía de encabezados de cada página.
  - El formulario de suscripción ganó **etiqueta visible**. Antes se resolvía
    con `aria-label` sobre el placeholder: servía al lector de pantalla, pero no
    a quien mira, porque el placeholder desaparece apenas se empieza a escribir.
  - **Foco de teclado**: ni los enlaces del footer ni los del header tenían
    indicador propio; dependían del anillo por defecto del navegador, que sobre
    el azul del footer daba **3.09:1** en Chrome —pasaba raspando— y no está
    garantizado en Firefox ni Safari. Ahora los dos lo declaran explícito.

  **Se soltó la textura `fondo-azul.jpg`** y quedó azul sólido `#12333f`. Pesaba
  **332 KB**, el 15% de todas las imágenes del sitio, para una franja que el
  degradado oscurecía tanto que la trama casi no se leía. **El archivo quedó sin
  usar**: se puede borrar.

  **Error propio que vale anotar**: los primeros ratios que se escribieron en
  los comentarios estaban calculados contra el azul viejo (`#17485e`), no contra
  el nuevo. Uno de esos errores llegó a justificar una decisión equivocada —se
  había introducido un ámbar propio `#e0a95c` "porque el de marca no llega a
  4.5:1", cuando sobre el azul nuevo el de marca da **5.53:1** y cumple de
  sobra. Se volvió al ámbar de siempre. Moraleja: al cambiar un color de fondo
  hay que **recalcular todos los ratios contra el fondo nuevo**, no arrastrar
  los del anterior.

  **Efecto secundario del cambio, detectado por la auditoría y corregido.** Al
  quitar el `<h2>` del eslogan, las páginas que solo tenían `<h1>` pasaron a
  saltar del nivel 1 a los `<h3>` del footer. Afectaba a `Contacto.html` y
  `Actualizar-Datos.html`. Se corrigió **en el origen**, no en el componente
  compartido: cada una lleva ahora un `<h2>` con la nueva clase utilitaria
  `.solo-lectores`. Va oculto porque visible sería redundante con el título
  ("Contáctenos" seguido de "Formulario de contacto"), pero existe para quien
  navega por encabezados. Subir los rótulos del footer a `<h2>` habría sido peor:
  arreglaba esas dos páginas y perforaba la jerarquía de las que sí tienen `h2`.

  **Cinco páginas más con problemas de encabezados previos**, corregidas en la
  misma tanda a pedido del usuario. Todas con `.solo-lectores`, porque en las
  cinco un título visible habría cambiado un diseño ya aprobado:
  - `catalogo.html`, `detalle-pedido.html` y `pago.html`: `<h1>` oculto, que no
    tenían.
  - `Contraseña-login.html`: los dos `<h2>` que tenía son **los dos pasos del
    mismo trámite**, así que ninguno servía como título de la página —promover
    uno habría dejado al otro colgando como si fuera su subsección—. Lleva un
    `<h1>` que los cubre a ambos.
  - `pago.html` además tenía **dos tablas indistinguibles**: las dos con
    encabezados "Producto" y "Cantidad", sin nada que dijera cuál era la de
    huevos y cuál la de pollo. Un lector de pantalla las anunciaba como dos
    tablas iguales. Se les puso `<caption>` oculto.

  Quedan **18 de 19 páginas con la jerarquía correcta**.

  **La que falta es `index.html`, y su problema no son los encabezados: la
  página está vacía.** El `<main>` no tiene contenido y su hoja
  (`Recursos/Cliente/index.css`) es un archivo de cero bytes. Es la raíz del
  sitio —`vistas/index.html` redirige ahí—, así que es lo primero que ve quien
  entra, y hoy muestra solo el header y el footer con un hueco en medio. Se le
  puso un `<h1>` oculto para que el documento tenga tema, pero **no se le
  inventó un `<h2>` para tapar el salto**: un encabezado que no titula nada es
  maquillaje. Lo que falta es construir la portada, y eso es una decisión de
  producto. Anotado en el comentario de cabecera del propio archivo.

  **Cuidado con los finales de línea (Windows).** Al reconstruir `estilos.css`
  concatenando el bloque del header (que venía del disco, en CRLF) con el bloque
  nuevo (escrito en LF), el archivo quedó mezclado: 86 líneas CRLF y 225 LF. Se
  normalizó todo a CRLF y se verificó que **las 86 líneas del header quedaran
  byte a byte idénticas** a las del commit anterior. Es exactamente el riesgo
  que anota la sección de entorno: un diff enorme que parece un cambio y no lo
  es.
