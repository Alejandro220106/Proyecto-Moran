/*
 * Recolección diaria (vistas/Paginas/Admin/RecoleccionDiaria-admin.html).
 *
 * Hace dos cosas, las dos sobre el mismo par de campos:
 *   1. Deja la fecha de hoy puesta al abrir la página.
 *   2. Mantiene el campo "Día" en sincronía con la fecha elegida.
 *
 * El día NO es un campo que se digite ni que se guarde: es un dato derivado
 * de la fecha. Se muestra porque a quien registra le sirve confirmar de un
 * vistazo que eligió el día correcto, pero se calcula acá para que no pueda
 * quedar contradiciendo a la fecha.
 *
 * Sin librerías, igual que el resto del proyecto (plantillas.js).
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

/*
 * Convierte el "AAAA-MM-DD" de un <input type="date"> en el nombre del día.
 *
 * Ojo con el detalle de zona horaria: new Date('2026-08-01') se interpreta
 * como medianoche UTC, y en Costa Rica (UTC-6) eso cae el día ANTERIOR, así
 * que el día de la semana saldría corrido. Por eso se parte el texto y se
 * construye la fecha con año/mes/día explícitos, que sí se interpreta en la
 * hora local del equipo.
 */
function nombreDelDia(valorFecha) {
    if (!valorFecha) return '';

    const [anio, mes, dia] = valorFecha.split('-').map(Number);
    if (!anio || !mes || !dia) return '';

    return DIAS_SEMANA[new Date(anio, mes - 1, dia).getDay()];
}

/* "AAAA-MM-DD" de hoy en hora local, que es el formato que espera el input.
   Se arma a mano por el mismo motivo de arriba: toISOString() convierte a UTC
   y en Costa Rica devolvería el día equivocado durante las últimas 6 horas de
   cada día — justo cuando se registra la recolección de la tarde. */
function fechaDeHoy() {
    const hoy = new Date();
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const dia = String(hoy.getDate()).padStart(2, '0');

    return `${hoy.getFullYear()}-${mes}-${dia}`;
}

document.addEventListener('DOMContentLoaded', () => {
    const campoFecha = document.querySelector('#fecha-recoleccion');
    const campoDia = document.querySelector('#dia-recoleccion');

    /* Si algún día se reutiliza este script en otra página, que no reviente. */
    if (!campoFecha || !campoDia) return;

    const sincronizarDia = () => {
        campoDia.value = nombreDelDia(campoFecha.value);
    };

    /* El caso normal es registrar lo del día, así que se arranca en hoy. */
    if (!campoFecha.value) {
        campoFecha.value = fechaDeHoy();
    }
    sincronizarDia();

    /* 'change' y no 'input': en el selector de fecha nativo, 'input' se dispara
       con estados a medio escribir (año incompleto, por ejemplo) y el día
       parpadearía mientras se digita. */
    campoFecha.addEventListener('change', sincronizarDia);

    /* El botón "Limpiar" es un type="reset", que devuelve los campos a su
       valor del HTML —o sea, vacíos— sin avisarle a nadie. Hay que volver a
       poner la fecha de hoy y recalcular el día, o el formulario quedaría en
       un estado que el usuario no eligió. El setTimeout es porque el reset
       todavía no terminó cuando este listener corre. */
    const formulario = document.querySelector('#formulario-recoleccion');
    if (formulario) {
        formulario.addEventListener('reset', () => {
            setTimeout(() => {
                campoFecha.value = fechaDeHoy();
                sincronizarDia();
            }, 0);
        });
    }
});
