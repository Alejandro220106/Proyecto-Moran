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
    Admin/            <- CSS del panel (admin, tokens-admin, Home-admin,
                         Inventario, GestionPedidos)
    Cliente/          <- CSS del sitio público (uno por página)
    Imagenes/         <- compartidas por ambos ámbitos
    estilos.css       <- header/footer compartidos: lo usan los dos ámbitos
    plantillas.js     <- idem
```

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
