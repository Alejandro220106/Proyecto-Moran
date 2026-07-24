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
   de `vistas/Recursos/login.css` (`.tarjeta-login`, `.panel-marca`,
   `.boton-ingresar`, etc.).
2. **Un CSS por página**: cada vista nueva trae su propio archivo de estilos
   en `vistas/Recursos/` (p. ej. `login.html` → `Recursos/login.css`),
   siguiendo la convención que ya existía con `index.php` → `index.css`.
3. **Documentación completa**: todo el HTML y CSS de este proyecto debe
   llevar comentarios que expliquen el porqué de las decisiones no obvias
   (fallbacks, exclusiones, elecciones de layout) — no solo qué hace el
   código, sino por qué se hizo así.

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
  y `<script src="Recursos/plantillas.js" defer></script>` antes de
  `</body>`.
- **Requisito importante**: `fetch()` no funciona abriendo el HTML directo
  con doble clic (`file://`) — los navegadores lo bloquean por CORS. Hay
  que servir `vistas/` con un servidor local, por ejemplo:
  `php -S localhost:8000 -t vistas` o `python3 -m http.server` parado
  dentro de `vistas/`.
- `vistas/index.html` es el ejemplo de referencia de una página que usa
  este mecanismo (antes era `index.php`).

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
