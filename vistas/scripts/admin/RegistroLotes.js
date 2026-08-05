/*
 * Registro de lotes (vistas/paginas/admin/RegistroLotes-admin.html).
 *
 * Hace una sola cosa: dejar la fecha de hoy puesta en "Fecha de ingreso" al
 * abrir la pantalla, y volver a ponerla si se limpia el formulario. Lo normal
 * es registrar el lote el mismo día que entra, así que el caso más común no
 * pide ni un clic. "Fecha estimada de salida" queda afuera a propósito: es
 * opcional y a futuro, no tiene un "hoy" que tenga sentido como valor inicial.
 *
 * La lógica de fecha vive en fechas-admin.js, compartida con Recolección
 * diaria y Mortalidad: tiene una sutileza de zona horaria (Costa Rica es
 * UTC-6) que no conviene tener duplicada. Ese archivo se carga antes que este.
 *
 * Sin librerías, igual que el resto del proyecto.
 */

document.addEventListener('DOMContentLoaded', () => {
    prepararCampoFecha(document.querySelector('#fecha-ingreso'));
});
