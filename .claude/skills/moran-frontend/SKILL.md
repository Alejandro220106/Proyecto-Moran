---
name: moran-frontend
description: Convenciones de frontend específicas de Proyecto-Morán (Eggs Unlimited / La Morán) — nombres de clase en español, uso de Bootstrap 5, paleta de marca y reglas de activos. Usar al construir o revisar cualquier vista nueva bajo vistas/.
---

# Frontend de Proyecto-Morán

Checklist accionable para construir o revisar pantallas de este proyecto.
Para el contexto narrativo completo (por qué se tomó cada decisión, estado
del proyecto, registro de sesiones) ver `CONTEXTO_PROYECTO.md` en la raíz
del repo — esta skill es el resumen operativo derivado de ese documento.

## Cuándo se activa

Al crear o revisar cualquier archivo bajo `vistas/` (HTML, CSS, o PHP de la
capa de conexión a base de datos).

## Reglas de stack

- Bootstrap 5 vía CDN únicamente (no hay npm/composer ni build tool en el
  repo — no agregar uno sin que el usuario lo pida).
- PHP se usa **solo** para la capa de conexión a base de datos. Las vistas
  nuevas son HTML + CSS estático salvo que necesiten leer/escribir datos.
- Sin framework de JavaScript.

## La regla central: nombres de clase

- Clases utilitarias de Bootstrap → **tal cual las define el framework**,
  en inglés (`row`, `col-md-6`, `form-control`, `btn`, `mb-3`, `w-100`...).
  No traducirlas, no envolverlas en alias en español.
- Cualquier clase nueva que nosotros creemos → **en español**, kebab-case,
  siguiendo el estilo ya usado en `estilos.css` y `login.css`.

Ejemplo canónico (de `vistas/Recursos/login.css`): `.pagina-login`,
`.tarjeta-login`, `.panel-marca`, `.insignia-logo`, `.eslogan-marca`,
`.panel-acceso`, `.campo-usuario`, `.campo-password`, `.boton-ingresar`,
`.enlaces-cuenta`, `.iconos-redes-login`, `.icono-red`.

## Convención de archivos

Cada vista trae su propio CSS en `vistas/Recursos/`, con el mismo nombre
base que la vista (`login.html` → `Recursos/login.css`).

## Header y footer compartidos (obligatorio en toda página no-standalone)

El header/footer de la vista normal de usuario cliente es una única
plantilla compartida para todas las páginas — ya no se usa PHP/`require_once`
para esto. Toda página nueva que no sea standalone (como sí lo es el login)
debe:

1. Incluir `<div id="encabezado"></div>` donde va el header y
   `<div id="pie-pagina"></div>` donde va el footer.
2. Cargar `<script src="Recursos/plantillas.js" defer></script>` antes de
   `</body>`.
3. No editar el header/footer copiándolo por página — el único lugar donde
   se edita el contenido real es `vistas/Componentes/encabezado.html` y
   `vistas/Componentes/pie-pagina.html`.

`plantillas.js` usa `fetch()`, así que la página debe verse a través de un
servidor local (`php -S localhost:8000 -t vistas`, o `python3 -m
http.server` dentro de `vistas/`) — abrirla con doble clic (`file://`) no
funciona, el navegador bloquea `fetch()` por CORS.

Ver `vistas/index.html` como referencia de una página que usa este patrón.

## Paleta de marca (aproximada — ajustar visualmente contra cada diseño)

| Uso | Color |
|---|---|
| Fondo de página oscuro | `#121212` |
| Panel/textura café | `#2b1d16` |
| Panel claro | `#e8e5e0` |
| Acento oxblood/vino | `#5c2020` |
| Texto claro sobre fondo oscuro | `#f2ede3` |
| Header/footer del sitio principal | fondo `#17485e`, acento `#d99a4e` |

## Reglas de activos

- `vistas/Recursos/Imagenes/logo_la_moran_limpio_transparente.png` es el
  **logo canónico** — nunca modificarlo ni regenerarlo, solo referenciarlo.
- Antes de agregar una imagen nueva, revisar si ya existe algo reutilizable
  en `vistas/Recursos/Imagenes/` (por ejemplo `textura-cafe.avif` para
  fondos texturizados café).
- Si se usa un formato de imagen moderno (AVIF/WebP), agregar un
  `background-color` de respaldo por si el navegador no lo soporta.

## Documentación obligatoria

Todo HTML y CSS de este proyecto debe llevar comentarios que expliquen el
**porqué** de las decisiones no obvias (fallbacks, exclusiones respecto al
diseño, elecciones de layout) — esto es un requisito explícito del
proyecto, no el mínimo de comentarios que se usaría por defecto en otros
contextos.

## Flujo de trabajo incremental

El usuario construye el sitio pantalla por pantalla a partir de capturas de
diseño (no hay acceso a Figma en este entorno). No construir pantallas que
no se hayan pedido todavía, incluso si ya se recibió una captura de ellas —
confirmar el orden con el usuario antes de avanzar. Nunca tomar como base
un frame de Figma llamado "REFERENCIA".

## Checklist antes de dar una pantalla por terminada

- [ ] Las clases de Bootstrap quedaron en inglés, sin traducir.
- [ ] Toda clase propia está en español y sigue el patrón kebab-case.
- [ ] El logo no fue modificado, solo referenciado.
- [ ] Si la página no es standalone, incluye `#encabezado`/`#pie-pagina` y
      `Recursos/plantillas.js`, en vez de copiar el header/footer a mano.
- [ ] HTML y CSS están comentados explicando decisiones no obvias.
- [ ] Si la pantalla necesita datos reales (tablas, listados, formularios
      que persisten), se marcó explícitamente como pendiente de la capa de
      conexión a base de datos, en vez de inventar datos falsos como si
      fueran reales.
- [ ] Se actualizó el registro de sesiones en `CONTEXTO_PROYECTO.md`.
