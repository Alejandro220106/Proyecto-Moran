/*
 * Ventas manuales (vistas/paginas/admin/VentasManuales-admin.html).
 *
 * Se encarga de tres cosas:
 *   1. Dejar puesta la fecha y hora actuales al abrir la página.
 *   2. Agregar y quitar líneas de producto.
 *   3. Mantener los ids de cada línea renumerados, para que las etiquetas
 *      sigan apuntando a su campo.
 *
 * El punto 3 es el que más fácil se pasa por alto: si se duplica una línea
 * tal cual, quedan dos campos con el mismo id y los <label for="..."> del
 * duplicado apuntan al campo de la primera línea. Visualmente no se nota,
 * pero al tocar la etiqueta se enfoca el campo equivocado y el lector de
 * pantalla lee mal el formulario. Por eso cada vez que se agrega o se quita
 * una línea se renumeran todas.
 *
 * Sin librerías, igual que el resto del proyecto (plantillas.js).
 */

document.addEventListener('DOMContentLoaded', () => {
    const contenedorLineas = document.querySelector('#lineas-productos');
    const botonAgregar = document.querySelector('#boton-agregar-producto');
    const campoFecha = document.querySelector('#fecha-venta');

    if (!contenedorLineas || !botonAgregar) return;

    /*
     * "AAAA-MM-DDTHH:MM" en hora local, que es lo que espera datetime-local.
     * Se arma a mano y no con toISOString(): ese método convierte a UTC, y en
     * Costa Rica (UTC-6) devolvería una hora seis horas adelantada — una venta
     * de las 7 de la noche quedaría registrada a la 1 de la mañana del día
     * siguiente.
     */
    function ahoraLocal() {
        const ahora = new Date();
        const dosDigitos = (n) => String(n).padStart(2, '0');

        return `${ahora.getFullYear()}-${dosDigitos(ahora.getMonth() + 1)}-${dosDigitos(ahora.getDate())}` +
               `T${dosDigitos(ahora.getHours())}:${dosDigitos(ahora.getMinutes())}`;
    }

    /* Lo normal es registrar la venta apenas ocurre, así que se arranca en el
       momento actual. Se puede corregir a mano si se registra más tarde. */
    if (campoFecha && !campoFecha.value) {
        campoFecha.value = ahoraLocal();
    }

    /*
     * Renumera ids, atributos "for" y el texto accesible del botón de quitar,
     * y decide si ese botón va habilitado.
     *
     * Se recorre todo en vez de llevar un contador que solo suba: si se
     * agregan tres líneas y se borra la del medio, un contador dejaría los
     * números salteados (1, 3, 4) y el siguiente agregado podría repetir uno.
     * Recorrer y reasignar siempre deja la numeración correcta.
     */
    function renumerarLineas() {
        const lineas = contenedorLineas.querySelectorAll('.linea-producto');

        lineas.forEach((linea, indice) => {
            const numero = indice + 1;

            const selectProducto = linea.querySelector('select');
            const inputCantidad = linea.querySelector('input');
            const etiquetas = linea.querySelectorAll('label');
            const botonQuitar = linea.querySelector('[data-accion="quitar-linea"]');

            if (selectProducto) selectProducto.id = `producto-${numero}`;
            if (inputCantidad) inputCantidad.id = `cantidad-${numero}`;

            /* Las etiquetas van en el mismo orden que los campos: producto y
               después cantidad. */
            if (etiquetas[0]) etiquetas[0].setAttribute('for', `producto-${numero}`);
            if (etiquetas[1]) etiquetas[1].setAttribute('for', `cantidad-${numero}`);

            if (botonQuitar) {
                /* Una venta sin ningún producto no tiene sentido, así que con
                   una sola línea no se puede quitar. */
                botonQuitar.disabled = lineas.length === 1;

                /* El texto visible dice solo "Quitar" para no ocupar ancho en el
                   celular, pero con varias líneas iguales eso deja al lector de
                   pantalla anunciando "Quitar, Quitar, Quitar" sin decir cuál.
                   El aria-label agrega el número. */
                botonQuitar.setAttribute('aria-label', `Quitar el producto ${numero} de la venta`);
            }
        });
    }

    botonAgregar.addEventListener('click', () => {
        const lineas = contenedorLineas.querySelectorAll('.linea-producto');
        const nuevaLinea = lineas[lineas.length - 1].cloneNode(true);

        /* El clon trae los valores de la línea copiada; se vacían para que la
           línea nueva empiece limpia y no parezca que ya se eligió algo. */
        const selectNuevo = nuevaLinea.querySelector('select');
        const inputNuevo = nuevaLinea.querySelector('input');
        if (selectNuevo) selectNuevo.value = '';
        if (inputNuevo) inputNuevo.value = '1';

        contenedorLineas.appendChild(nuevaLinea);
        renumerarLineas();

        /* Se enfoca el producto recién agregado: en el celular evita tener que
           buscar y tocar el campo nuevo, que es justo el que se va a llenar. */
        if (selectNuevo) selectNuevo.focus();
    });

    /*
     * Un solo listener en el contenedor en vez de uno por botón: las líneas se
     * crean después de que este código corre, así que un listener puesto ahora
     * sobre cada botón no alcanzaría a las líneas futuras.
     */
    contenedorLineas.addEventListener('click', (evento) => {
        const botonQuitar = evento.target.closest('[data-accion="quitar-linea"]');
        if (!botonQuitar || botonQuitar.disabled) return;

        const linea = botonQuitar.closest('.linea-producto');
        if (!linea) return;

        /* Se guarda ANTES de borrar: después de remove() la línea ya no tiene
           hermanos a los que preguntarle. */
        const lineaAnterior = linea.previousElementSibling;

        linea.remove();
        renumerarLineas();

        /* El botón que se acaba de tocar desapareció junto con su línea, así que
           el foco se cae al <body>: con teclado habría que tabular desde el
           principio de la página otra vez, y el lector de pantalla no anuncia
           nada de lo que pasó. Se lo manda al botón de quitar de la línea de
           arriba, y si no hay (se borró la primera, o quedó una sola y su botón
           está deshabilitado) al de agregar, que siempre está disponible. */
        const destino = (lineaAnterior &&
                         lineaAnterior.querySelector('[data-accion="quitar-linea"]:not([disabled])'))
                        || botonAgregar;
        destino.focus();
    });

    /* Deja el estado inicial correcto (con una sola línea, el botón de quitar
       arranca deshabilitado). */
    renumerarLineas();
});

/*
 * PENDIENTE PARA CUANDO EXISTA LA BASE DE DATOS
 *
 * El monto total hoy se digita a mano porque el precio de cada producto lo
 * administra el administrador y todavía no hay de dónde leerlo; poner un
 * precio acá sería inventarlo. Cuando la capa de datos exista, cada opción del
 * selector puede traer su precio y el monto pasa a calcularse solo sumando
 * cantidad × precio de cada línea, dejando el campo editable solo para
 * corregir (descuentos, redondeos de ruta).
 */
