/*
 * Utilidades de fecha compartidas por las pantallas del panel.
 *
 * Existe porque la misma lógica hacía falta en Recolección diaria y en
 * Mortalidad, y tiene una sutileza que no conviene tener duplicada: si alguien
 * corrige un error en una copia, la otra se queda con el error.
 *
 * LA SUTILEZA, que es la razón de que estas funciones no sean de una línea:
 *
 *   new Date('2026-08-01')  se interpreta como medianoche UTC.
 *
 * En Costa Rica (UTC-6) eso cae el DÍA ANTERIOR. Verificado: el método directo
 * reporta "Viernes" donde corresponde "Sábado". Lo mismo al revés con
 * toISOString(), que convierte a UTC y devuelve el día equivocado durante las
 * últimas seis horas de cada día — justo cuando se registra el trabajo de la
 * tarde.
 *
 * Por eso las dos funciones arman la fecha con año, mes y día explícitos, que
 * sí se interpretan en la hora local del equipo.
 *
 * Se carga ANTES que el JS de cada pantalla. Los dos <script> llevan "defer",
 * que respeta el orden de aparición, así que basta con ponerlo primero.
 */

/* Índice 0 = domingo, que es lo que devuelve getDay(). */
const DIAS_SEMANA = [
    'Domingo',
    'Lunes',
    'Martes',
    'Miércoles',
    'Jueves',
    'Viernes',
    'Sábado'
];

/* "AAAA-MM-DD" de hoy en hora local, que es el formato que espera un
   <input type="date">. */
function fechaDeHoy() {
    const hoy = new Date();
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const dia = String(hoy.getDate()).padStart(2, '0');

    return `${hoy.getFullYear()}-${mes}-${dia}`;
}

/* Convierte el "AAAA-MM-DD" de un <input type="date"> en el nombre del día. */
function nombreDelDia(valorFecha) {
    if (!valorFecha) return '';

    const [anio, mes, dia] = valorFecha.split('-').map(Number);
    if (!anio || !mes || !dia) return '';

    return DIAS_SEMANA[new Date(anio, mes - 1, dia).getDay()];
}

/*
 * Deja la fecha de hoy puesta en un campo, si está vacío, y la vuelve a poner
 * cuando el formulario se limpia.
 *
 * El reset hace falta porque type="reset" devuelve los campos a su valor del
 * HTML —o sea, vacíos— sin avisarle a nadie. El setTimeout es porque cuando
 * este listener corre, el reset todavía no terminó.
 */
function prepararCampoFecha(campo, alCambiar) {
    if (!campo) return;

    if (!campo.value) campo.value = fechaDeHoy();
    if (alCambiar) alCambiar();

    /* 'change' y no 'input': en el selector de fecha nativo, 'input' se dispara
       con estados a medio escribir (año incompleto, por ejemplo). */
    if (alCambiar) campo.addEventListener('change', alCambiar);

    const formulario = campo.closest('form');
    if (formulario) {
        formulario.addEventListener('reset', () => {
            setTimeout(() => {
                campo.value = fechaDeHoy();
                if (alCambiar) alCambiar();
            }, 0);
        });
    }
}
