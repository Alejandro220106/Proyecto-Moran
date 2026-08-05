# Requisitos y puesta en marcha

Qué hay que tener instalado y qué pasos seguir para levantar Proyecto-Morán
desde cero. Si algo de acá falla, mirá la tabla de problemas frecuentes al
final.

Última actualización: 2026-08-04.

---

## 1. Qué hay que instalar

| Programa | Versión mínima | Para qué | Dónde |
|---|---|---|---|
| **Node.js** | 20.6.0 | Correr el servidor | <https://nodejs.org> (elegir LTS) |
| **PostgreSQL** | 14 | La base de datos | <https://www.postgresql.org/download/windows/> |
| **Git** | cualquiera reciente | Bajar y subir cambios | <https://git-scm.com> |

**La versión de Node no es un número al azar.** El proyecto lee el archivo
`.env` con la opción `--env-file`, que Node trae recién desde la 20.6. Con una
versión anterior el servidor arranca pero no encuentra las credenciales de la
base y falla con "Falta la variable BD_NOMBRE".

Para comprobar qué tenés:

```
node --version      # tiene que decir v20.6.0 o más
psql --version      # si dice "no se reconoce", falta PostgreSQL o su PATH
```

**Al instalar PostgreSQL en Windows**, marcá la casilla que agrega las
herramientas de línea de comandos al PATH; si no, `psql` no va a funcionar
desde la terminal aunque la base sí esté corriendo. La contraseña que te pida
para el usuario `postgres` es la que después va en el `.env`.

No hace falta XAMPP, Apache ni PHP. El proyecto se servía con PHP hasta el
2026-08-04 y ya no.

---

## 2. Puesta en marcha

### Paso 1 — Bajar el proyecto

```
git clone https://github.com/Alejandro220106/Proyecto-Moran.git
cd Proyecto-Moran
```

### Paso 2 — Instalar las dependencias

```
npm install
```

Crea la carpeta `node_modules/`, que **no se sube al repo**: se reconstruye con
este comando cuando haga falta.

### Paso 3 — Crear la base de datos

```
psql -U postgres -c "CREATE DATABASE la_moran;"
psql -U postgres -d la_moran -f basedatos/esquema_postgres.sql
```

> **Ojo: `basedatos/` no está en el repositorio.** Está en `.gitignore` por
> decisión del proyecto, así que si clonaste no vas a tener
> `esquema_postgres.sql`. Pedíselo a Alejandro por fuera de git.

### Paso 4 — Configurar el `.env`

Copiá la plantilla y llenala con tus datos:

```
copy .env.ejemplo .env
```

Y editá `.env`:

```
BD_HOST=localhost
BD_PUERTO=5432
BD_NOMBRE=la_moran
BD_USUARIO=postgres
BD_CLAVE=la_que_pusiste_al_instalar
```

**El `.env` nunca se sube al repositorio.** Contiene contraseñas y ya está en
`.gitignore`. La plantilla `.env.ejemplo` sí se sube, pero siempre vacía.

### Paso 5 — Levantar el servidor

```
npm run dev
```

Y abrir <http://localhost:3000>.

| Dónde | Qué es |
|---|---|
| <http://localhost:3000/> | El sitio (redirige al catálogo) |
| <http://localhost:3000/paginas/admin/Home-admin.html> | El panel |
| <http://localhost:3000/api/inventario> | La API, para probar que la base responde |

---

## 3. Los dos comandos para correrlo

| Comando | Cuándo |
|---|---|
| `npm run dev` | Mientras se programa. Se reinicia solo al guardar un archivo |
| `npm run iniciar` | Para dejarlo corriendo. No se reinicia solo |

**No abras los `.html` con doble clic.** Sin servidor, la barra lateral y el
pie de página no cargan: se inyectan con `fetch()`, y el navegador bloquea eso
en archivos locales por seguridad (CORS). Hay que entrar siempre por
`http://localhost:3000`.

---

## 4. Dependencias

Solo dos, a propósito:

| Paquete | Para qué |
|---|---|
| `express` | El servidor web y el ruteo |
| `pg` | Hablar con PostgreSQL |

**El frontend no tiene ninguna.** Bootstrap 5 entra por CDN con una etiqueta
`<link>`, y no hay React, ni jQuery, ni librería de gráficas — el mapa de calor
es una `<table>` normal y las minigráficas son SVG escrito a mano. No hay paso
de compilación: el HTML y el CSS que ves en `vistas/` son exactamente los que
llegan al navegador.

Tampoco hace falta `dotenv`: Node lee el `.env` por su cuenta con `--env-file`,
que ya está puesto en los scripts de `package.json`.

---

## 5. Qué NO viene en el repositorio

Tres cosas están en `.gitignore` a propósito y hay que conseguirlas aparte:

| Qué | Por qué | Cómo obtenerlo |
|---|---|---|
| `basedatos/` | Decisión del proyecto | Pedírselo a Alejandro |
| `Documentos del proyecto/` | Documentación interna del integrador | Pedírselo a Alejandro |
| `.env` | Tiene contraseñas | Crearlo desde `.env.ejemplo` |
| `node_modules/` | Se reconstruye | `npm install` |

---

## 6. Antes de trabajar en el proyecto

- **Las carpetas van todas en minúscula** (`paginas/`, `estilos/`, `scripts/`).
  El repositorio tiene `core.ignorecase=false` justamente para que git note un
  renombrado que solo cambia mayúsculas — en Windows no se notaría, pero en un
  servidor Linux las rutas sí distinguen y una mayúscula de más rompe la página.
- **Los finales de línea son CRLF.**
- **Las clases de Bootstrap van en inglés; las nuestras en español**,
  kebab-case.
- **Ningún dato de ejemplo puede parecer real.** Las tablas y gráficas del
  panel muestran cifras inventadas mientras no haya base conectada, y todas
  llevan un aviso visible que lo dice.

Ver `CONTEXTO_PROYECTO.md` para el detalle de por qué se tomó cada decisión.

---

## 7. Advertencia antes de publicarlo en internet

**El panel de administración no tiene autenticación.** Cualquiera que escriba
la URL entra y puede ver y modificar todo. Falta el campo `rol` en el esquema
de la base, y sin él no hay forma de distinguir un cliente de un administrador.

Mientras el proyecto corra solo en la máquina de cada quien esto no es un
problema. **No lo subas a ningún hosting hasta resolverlo.**

---

## 8. Problemas frecuentes

| Lo que ves | Qué pasa |
|---|---|
| `Falta la variable BD_NOMBRE` | No existe el `.env`, o arrancaste con `node` en vez de `npm run dev` |
| `¿Está PostgreSQL corriendo?` (503) | PostgreSQL no está instalado o el servicio está detenido |
| `relation "inventario_productos" does not exist` | Falta correr el esquema (paso 3) |
| `password authentication failed` | La `BD_CLAVE` del `.env` no coincide con la de PostgreSQL |
| `psql: no se reconoce como un comando` | PostgreSQL no quedó en el PATH; reinstalá marcando esa opción |
| La página carga sin barra lateral ni pie | Abriste el HTML con doble clic en vez de por `localhost:3000` |
| `EADDRINUSE :::3000` | Ya hay algo en el puerto 3000. Cerralo, o usá `PUERTO=3001` en el `.env` |
| `npm : no se reconoce` | Falta Node.js, o hay que reabrir la terminal después de instalarlo |
