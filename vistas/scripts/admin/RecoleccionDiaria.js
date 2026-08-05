/*
 * Recolección diaria (vistas/paginas/admin/RecoleccionDiaria-admin.html).
 *
 * Hace dos cosas, las dos sobre el mismo par de campos:
 *   1. Deja la fecha de hoy puesta al abrir la página.
 *   2. Mantiene el campo "Día" en sincronía con la fecha elegida.
 *
 * El día NO es un campo que se digite ni que se guarde: es un dato derivado de
 * la fecha. Se muestra porque a quien registra le sirve confirmar de un vistazo
 * que eligió el día correcto, pero se calcula acá para que no pueda quedar
 * contradiciendo a la fecha.
 *
 * Las funciones de fecha VIVEN EN fechas-admin.js, compartido con Mortalidad.
 * Estaban acá hasta que hizo falta la misma lógica en la segunda pantalla: esa
 * lógica tiene una sutileza de zona horaria (Costa Rica es UTC-6, y
 * new Date('AAAA-MM-DD') se interpreta como medianoche UTC, o sea el día
 * anterior) que no conviene tener duplicada, porque el día que alguien corrija
 * una copia la otra se queda con el error. fechas-admin.js se carga antes que
 * este archivo; los dos <script> llevan "defer", que respeta el orden.
 *
 * Sin librerías, igual que el resto del proyecto.
 */

document.addEventListener('DOMContentLoaded', () => {
    const campoFecha = document.querySelector('#fecha-recoleccion');
    const campoDia = document.querySelector('#dia-recoleccion');

    /* Si algún día se reutiliza este script en otra página, que no reviente. */
    if (!campoFecha || !campoDia) return;

    const sincronizarDia = () => {
        campoDia.value = nombreDelDia(campoFecha.value);
    };

    /* prepararCampoFecha pone la fecha de hoy si el campo está vacío, engancha
       el listener de 'change' y repone la fecha cuando el formulario se limpia
       (un type="reset" deja el campo vacío sin avisarle a nadie). */
    prepararCampoFecha(campoFecha, sincronizarDia);
});
