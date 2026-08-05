/*
 * Mortalidad (vistas/paginas/admin/Mortalidad-admin.html).
 *
 * Hace una sola cosa: dejar la fecha de hoy puesta al abrir la pantalla, y
 * volver a ponerla si se limpia el formulario. Lo normal es registrar la baja
 * del día, así que el caso más común no pide ni un clic.
 *
 * La lógica de fecha vive en fechas-admin.js, compartida con Recolección
 * diaria: tiene una sutileza de zona horaria (Costa Rica es UTC-6) que no
 * conviene tener duplicada. Ese archivo se carga antes que este.
 *
 * Sin librerías, igual que el resto del proyecto.
 */

document.addEventListener('DOMContentLoaded', () => {
    prepararCampoFecha(document.querySelector('#fecha-mortalidad'));
});
