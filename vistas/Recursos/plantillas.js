/*
 * Carga los fragmentos compartidos dentro de cualquier página que tenga su
 * contenedor: el header ("#encabezado"), el footer ("#pie-pagina") y, en las
 * ocho pantallas del panel de administración, la barra lateral de módulos
 * ("#lateral-admin"). Es la forma de reutilizar el mismo markup en todas las
 * páginas sin PHP (PHP queda solo para la futura conexión a base de datos, ya
 * no se usa require_once para las vistas).
 *
 * Cada carga es independiente: si un contenedor no existe en la página, esa
 * plantilla simplemente no se pide. Por eso las vistas de cliente no traen la
 * barra lateral aunque compartan este mismo archivo.
 *
 * Importante: usa fetch(), así que la página debe verse a través de un
 * servidor local -por ejemplo "php -S localhost:8000 -t vistas" o
 * "python -m http.server" parado dentro de vistas/- y NO abriéndola
 * directo con doble clic (protocolo file://). Los navegadores bloquean
 * fetch() de archivos locales por seguridad (CORS), así que sin servidor
 * los fragmentos simplemente no aparecerían.
 */

async function cargarPlantilla(selectorContenedor, rutaFragmento) {
    const contenedor = document.querySelector(selectorContenedor);
    if (!contenedor) return false;

    const respuesta = await fetch(rutaFragmento);
    contenedor.innerHTML = await respuesta.text();
    return true;
}

/*
 * Marca en la barra lateral el módulo que está abierto.
 *
 * Hace falta porque el fragmento de la barra es EL MISMO para las ocho
 * pantallas del panel: no puede saber en cuál se está inyectando. Así que se
 * compara el nombre del archivo abierto con el de cada enlace.
 *
 * Se compara solo el nombre del archivo y no la ruta completa a propósito: la
 * ruta de la página es absoluta desde la raíz del servidor y la del enlace es
 * relativa ("../Admin/Inventario.html"), así que nunca coincidirían tal cual.
 */
function marcarModuloActivo() {
    const barra = document.querySelector('.lateral-admin');
    if (!barra) return;

    const archivoActual = decodeURIComponent(
        window.location.pathname.split('/').pop() || ''
    );
    if (!archivoActual) return;

    /* Incluye el enlace "Panel" además de los módulos: si no, al estar parado en
       el tablero no se marcaría nada y la barra parecería no saber dónde está. */
    barra.querySelectorAll('.lista-lateral a, .marca-lateral').forEach((enlace) => {
        const destino = decodeURIComponent(
            enlace.getAttribute('href').split('/').pop()
        );

        if (destino === archivoActual) {
            enlace.classList.add('activo');
            /* aria-current es lo que le dice al lector de pantalla cuál es la
               página actual. Sin esto el resalte sería solo visual. */
            enlace.setAttribute('aria-current', 'page');
        }
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    cargarPlantilla('#encabezado', '../../Componentes/encabezado.html');
    cargarPlantilla('#pie-pagina', '../../Componentes/pie-pagina.html');

    /* Se espera a que la barra esté en el DOM antes de buscar sus enlaces:
       marcarModuloActivo() opera sobre markup que acaba de inyectarse, así que
       llamarla sin await no encontraría nada. */
    const hayBarra = await cargarPlantilla('#lateral-admin', '../../Componentes/lateral-admin.html');
    if (hayBarra) marcarModuloActivo();
});
