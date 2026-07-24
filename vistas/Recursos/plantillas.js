/*
 * Carga el header y footer compartidos (plantillas de
 * "vistas/Componentes/encabezado.html" y "pie-pagina.html") dentro de
 * cualquier página que tenga los contenedores "#encabezado" y/o
 * "#pie-pagina". Es la forma de reutilizar el mismo header/footer en
 * todas las páginas sin PHP (PHP queda solo para la futura conexión a
 * base de datos, ya no se usa require_once para las vistas).
 *
 * Importante: usa fetch(), así que la página debe verse a través de un
 * servidor local -por ejemplo "php -S localhost:8000 -t vistas" o
 * "python3 -m http.server" parado dentro de vistas/- y NO abriéndola
 * directo con doble clic (protocolo file://). Los navegadores bloquean
 * fetch() de archivos locales por seguridad (CORS), así que sin servidor
 * el header/footer simplemente no aparecerían.
 */

async function cargarPlantilla(selectorContenedor, rutaFragmento) {
    const contenedor = document.querySelector(selectorContenedor);
    if (!contenedor) return;

    const respuesta = await fetch(rutaFragmento);
    contenedor.innerHTML = await respuesta.text();
}

document.addEventListener('DOMContentLoaded', () => {
    cargarPlantilla('#encabezado', '../Componentes/encabezado.html');
    cargarPlantilla('#pie-pagina', '../Componentes/pie-pagina.html');
});
