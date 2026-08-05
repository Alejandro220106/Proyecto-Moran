# Proyecto-Morán

Sitio web y sistema de inventario para **Avícola La Morán**, una granja avícola
familiar de La Vega de Florencia, San Carlos, Alajuela, Costa Rica. El negocio
se presenta bajo la marca *Eggs Unlimited*.

Proyecto integrador de la Universidad Técnica Nacional.

> Hasta el 2026-08-04 este archivo describía el proyecto como una "aplicación
> de escritorio". Nunca lo fue: es una aplicación **web**, y ahora corre sobre
> un servidor Node.

---

## Qué hace

El sistema sirve **por ahora** para dos cosas:

1. **Inventariar los productos** de la granja.
2. **Registrar las ventas que ya ocurrieron** — ventas de ruta y de finca,
   anotadas después de haberse cobrado en efectivo.

**No es una tienda en línea.** Nadie compra desde el sitio: el carrito está
marcado como "Próximamente" y no se procesa ningún dato bancario. La parte
pública funciona como vitrina —catálogo, historia del negocio, contacto— y el
producto real es el panel de administración.

Los productos son cinco: cartones de huevos de 30, 15, 6 y 4 unidades, y pollo
entero. Los cortes por pieza todavía no se producen.

### Módulos del panel

| Ámbito | Módulos |
|---|---|
| **Granja** | Recolección diaria · Inventario · Registro de lotes · Mortalidad |
| **Ventas** | Ventas manuales · Gestión de pedidos · Buscar pedidos |
| **Administración** | Facturas · Proveedores |

---

## Cómo levantarlo

Hace falta **Node.js 20.6+** y **PostgreSQL 14+**.

```
npm install
copy .env.ejemplo .env      # y llenarlo con los datos de tu base
npm run dev
```

Después, <http://localhost:3000>.

**Los pasos completos, incluida la creación de la base de datos, están en
[REQUISITOS.md](REQUISITOS.md)**, que además trae una tabla de problemas
frecuentes.

---

## Cómo está organizado

```
vistas/                  Todo lo que ve el navegador
├── index.html           Redirige al catálogo
├── paginas/admin/       Las 10 pantallas del panel
├── paginas/cliente/     Las 10 pantallas públicas
├── componentes/         Fragmentos compartidos (barra lateral, pie, encabezado)
├── estilos/             base.css + una hoja por pantalla
├── scripts/             plantillas.js + el JavaScript del panel
└── imagenes/

logica/                  El servidor
├── servidor.js          Sirve el sitio y la API en el mismo puerto
├── configuracion/       Conexión a PostgreSQL
├── modelos/             El único lugar donde se escribe SQL
├── rutas/               La API bajo /api/
└── comun/               Formato único de respuesta y manejo de errores

basedatos/               El esquema SQL (NO está en el repositorio)
```

### Decisiones de stack

- **Sin framework de frontend y sin paso de compilación.** Bootstrap 5 entra
  por CDN; el HTML y el CSS del repositorio son exactamente los que llegan al
  navegador.
- **Sin librería de gráficas.** El mapa de calor del tablero es una `<table>` y
  las minigráficas son SVG escrito a mano.
- **Solo dos dependencias**: `express` y `pg`.
- **PostgreSQL**, con el esquema completo ya diseñado.

Ver [CONTEXTO_PROYECTO.md](CONTEXTO_PROYECTO.md) para el detalle de por qué se
tomó cada decisión.

---

## Estado actual

**Lo que funciona:** las 20 pantallas están construidas y son responsivas; el
servidor sirve el sitio y expone la API de inventario y de ventas manuales, con
el descuento de stock resuelto dentro de una transacción.

**Lo que falta:**

- **Autenticación.** Es el bloqueo más serio: falta el campo `rol` en el
  esquema, así que hoy cualquiera que escriba la URL entra al panel.
  **No publicar el proyecto en internet hasta resolverlo.**
- Enganchar las pantallas a la API. Todavía muestran datos de ejemplo, siempre
  marcados como tales de forma visible.
- Decidir la conversión entre huevos sueltos —que es como se recolectan— y
  cartones, que es como se venden.
- Los modelos de recolección, lotes y mortalidad.

---

## Integrantes

- Luis Alejandro Arce Araya
- Daniel Rivera Miranda
- Jose Gamboa Solís
- Franklin Castillo Morán
