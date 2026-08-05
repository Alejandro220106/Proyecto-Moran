/*
 * Gráficas de movimiento de productos, del tablero
 * (vistas/paginas/admin/Home-admin.html).
 *
 * Dibuja dos, y CADA UNA RESPONDE A UNA PREGUNTA DISTINTA:
 *
 *   1. Mapa de calor — producto contra día de la semana, SIEMPRE la última
 *      semana. No lleva filtro a propósito: su trabajo es mostrar el patrón
 *      semanal (qué sale los jueves, qué no se mueve nunca), y ese patrón solo
 *      existe si las columnas son siempre los siete días. Con un rango variable
 *      las columnas dejarían de ser días de la semana y la gráfica perdería
 *      justo lo que la hace útil.
 *
 *   2. Pequeños múltiplos — una minigráfica por producto, misma escala y un
 *      solo color. ESTA SÍ lleva filtro de rango: es una serie de tiempo, y
 *      mirarla a 3 días o a 12 meses son dos lecturas legítimas.
 *
 * Los productos son CINCO: los cuatro tamaños de cartón y el pollo entero.
 * Los cortes por pieza (pechuga, muslo, alas) no se producen todavía — el
 * catálogo del cliente ya los muestra como "Próximamente".
 *
 * Sin librerías, igual que el resto del proyecto: el mapa es una <table> normal
 * y las minigráficas son SVG armado a mano. Traer una librería de gráficas
 * (Chart.js pesa ~200 KB) para dos formas simples no se paga.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * LOS DATOS DE ACÁ SON INVENTADOS. No corresponden a ninguna recolección ni
 * venta real de La Morán. Están para poder ver y ajustar la pantalla mientras
 * no exista la base de datos, y la pantalla lo dice de forma visible.
 *
 * Cuando exista el backend, lo ÚNICO que cambia es obtenerSerieDiaria(): se le
 * quita la generación de ejemplo y se le deja el fetch. Todo lo demás —el
 * filtro, la agregación, el dibujo— ya trabaja igual con datos reales.
 * ───────────────────────────────────────────────────────────────────────────
 */

(() => {
    'use strict';

    /* ---- Rangos del filtro (solo para los pequeños múltiplos) ---- */
    /*
      LA CUBETA CAMBIA CON EL RANGO. Un año son 365 puntos, y 365 puntos en una
      minigráfica de 200px de ancho son una mancha. Cada rango se agrupa en la
      unidad que sí se puede leer.

      CUIDADO CON LAS CUBETAS INCOMPLETAS: agrupando 30 días por semana, la
      semana más vieja se queda con 2 días y su punto sale artificialmente bajo
      —parece una caída de ventas que nunca ocurrió—. Lo mismo con 365 días por
      mes: dan 13 meses, el más viejo parcial, y "ago" aparecería dos veces.

      Por eso el mes se pide como "4 semanas" de 28 días exactos, y el año se
      recorta a las últimas 12 cubetas con `cubetas`. Es preferible ser exacto
      en el rótulo que redondo: "4 semanas" no engaña a nadie, "1 mes" mostrando
      una semana coja sí.
    */
    const RANGOS = [
        { id: '3d',  etiqueta: '3 días',    dias: 3,   cubeta: 'dia' },
        { id: '7d',  etiqueta: '7 días',    dias: 7,   cubeta: 'dia' },
        { id: '14d', etiqueta: '14 días',   dias: 14,  cubeta: 'dia' },
        { id: '1m',  etiqueta: '4 semanas', dias: 28,  cubeta: 'semana' },
        { id: '1a',  etiqueta: '12 meses',  dias: 365, cubeta: 'mes', cubetas: 12 }
    ];
    const RANGO_INICIAL = '14d';

    const PRODUCTOS = [
        { nombre: 'Cartón 30',    base: 40 },
        { nombre: 'Cartón 15',    base: 24 },
        { nombre: 'Cartón 6',     base: 13 },
        { nombre: 'Cartón 4',     base: 8  },
        { nombre: 'Pollo entero', base: 9  }
    ];

    const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun',
                   'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

    /* ---- Generación del ejemplo ---- */
    /*
      Generador pseudoaleatorio con semilla fija (congruencial lineal).

      LA SEMILLA FIJA ES EL PUNTO: con Math.random() las cifras cambiarían en
      cada recarga, y una gráfica que se mueve sola mientras se la mira es
      imposible de revisar — no se sabría si cambió por el filtro o porque sí.
    */
    function generador(semilla) {
        let estado = semilla;
        return () => {
            estado = (estado * 1103515245 + 12345) % 2147483648;
            return estado / 2147483648;
        };
    }

    /*
      Un año de movimiento por producto.

      El patrón imita lo que pasa en el negocio: los jueves y los domingos son
      días de ruta y sale mucho más que el resto de la semana. Sin ese patrón
      los datos de ejemplo serían ruido plano y el mapa de calor no mostraría
      nada — que es justo lo que la gráfica existe para mostrar.
    */
    function generarSerieDiaria(producto, indice) {
        const azar = generador(20260804 + indice * 7919);
        const hoy = new Date();
        const serie = [];

        for (let atras = 364; atras >= 0; atras--) {
            /* new Date(a, m, d) trabaja en hora local, que es lo que
               corresponde: el día de una venta es el día en Costa Rica, no en
               UTC. Construirlo desde una cadena 'AAAA-MM-DD' lo interpretaría
               como medianoche UTC y en UTC-6 caería en el día anterior. Es la
               misma trampa documentada en fechas-admin.js. */
            const fecha = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - atras);
            const diaSemana = fecha.getDay();            /* 0 domingo … 4 jueves */
            const esRuta = (diaSemana === 4 || diaSemana === 0);

            const factor = esRuta ? 2.6 : 1;
            const ruido = 0.78 + azar() * 0.44;
            serie.push({
                fecha,
                valor: Math.max(0, Math.round(producto.base * factor * ruido))
            });
        }
        return serie;
    }

    /**
     * De dónde salen los datos.
     *
     * Devuelve, por producto, la serie diaria del último año. Tanto el mapa
     * (que usa los últimos 7 días) como los múltiplos (que usan el rango
     * elegido) salen de acá, así que cambiar de filtro no le pide nada nuevo
     * al servidor.
     */
    async function obtenerSerieDiaria() {
        return PRODUCTOS.map((p, i) => ({
            nombre: p.nombre,
            dias: generarSerieDiaria(p, i)
        }));

        /*
        const respuesta = await fetch('../../../logica/api/movimiento-listar.php?dias=365');
        const cuerpo = await respuesta.json();
        if (!cuerpo.ok) throw new Error(cuerpo.error);
        return cuerpo.datos;
        */
    }

    /* ---- Agregación (solo la usan los múltiplos) ---- */
    function agregar(dias, rango) {
        const recorte = dias.slice(-rango.dias);

        if (rango.cubeta === 'dia') {
            return {
                etiquetas: recorte.map((d) => `${d.fecha.getDate()} ${MESES[d.fecha.getMonth()]}`),
                valores: recorte.map((d) => d.valor)
            };
        }

        /* Semanas y meses comparten la mecánica: se agrupa por una clave que
           sale de la fecha y se suman los valores de cada grupo. */
        const grupos = new Map();

        recorte.forEach((d, i) => {
            let clave, etiqueta;

            if (rango.cubeta === 'semana') {
                /* Numeradas hacia atrás desde hoy, no por semana del año: a
                   quien mira le importa "hace tres semanas", no si es la 31 del
                   calendario. */
                const semanasAtras = Math.floor((recorte.length - 1 - i) / 7);
                clave = -semanasAtras;
                etiqueta = semanasAtras === 0 ? 'Esta sem.' : `−${semanasAtras} sem.`;
            } else {
                clave = d.fecha.getFullYear() * 12 + d.fecha.getMonth();
                etiqueta = MESES[d.fecha.getMonth()];
            }

            if (!grupos.has(clave)) grupos.set(clave, { etiqueta, total: 0 });
            grupos.get(clave).total += d.valor;
        });

        let ordenadas = [...grupos.entries()].sort((a, b) => a[0] - b[0]);

        /* Se descartan las cubetas de más por el principio, que son las
           incompletas. Ver el comentario de RANGOS. */
        if (rango.cubetas) ordenadas = ordenadas.slice(-rango.cubetas);

        return {
            etiquetas: ordenadas.map(([, g]) => g.etiqueta),
            valores: ordenadas.map(([, g]) => g.total)
        };
    }

    /* ---- Rampa de color ---- */
    /* Los seis pasos y sus dos colores de texto están declarados en
       graficas-movimiento.css; acá se repiten porque el JS tiene que elegir
       cuál aplicar a cada celda. Si se cambian allá, hay que cambiarlos acá:
       es la única duplicación del componente. */
    const RAMPA = ['#241d12', '#43331a', '#63471f', '#7f5d24', '#b28839', '#e8bd72'];
    const CIFRA_CLARA = '#e6ded0';   /* pasos 0 a 3 */
    const CIFRA_OSCURA = '#191308';  /* pasos 4 y 5 */
    const CRUCE = 4;
    const SERIE = '#2f9e6b';

    /**
     * A qué paso de la rampa le toca un valor.
     *
     * NO ES UNA REGLA DE TRES, y la diferencia importa. Las ventas de esta
     * granja tienen una cola larga: casi todo son cifras chicas y los días de
     * ruta se disparan. Repartiendo el color en proporción directa, la enorme
     * mayoría de las celdas caía en el paso más oscuro y el mapa se volvía un
     * bloque negro con dos manchas claras — o sea, dejaba de mostrar el patrón,
     * que es su único trabajo.
     *
     * Con la raíz cuadrada el reparto se abre y las diferencias entre valores
     * bajos por fin se ven. El paso más oscuro queda para el cero o casi cero.
     *
     * Sigue siendo monótona —más unidades nunca dan un paso más oscuro—, así
     * que el orden que muestra el color es el orden real. Lo que se pierde es
     * la proporción exacta entre dos celdas, y por eso la cifra va SIEMPRE
     * escrita adentro: el color ubica, el número es el dato.
     */
    function pasoDeColor(valor, maximo) {
        if (maximo <= 0) return 0;
        return Math.min(RAMPA.length - 1, Math.floor(Math.sqrt(valor / maximo) * RAMPA.length));
    }

    const NS = 'http://www.w3.org/2000/svg';
    const svgEl = (nombre, atributos = {}) => {
        const nodo = document.createElementNS(NS, nombre);
        for (const clave in atributos) nodo.setAttribute(clave, atributos[clave]);
        return nodo;
    };
    const nf = (n) => n.toLocaleString('es-CR');

    /* ---- Globo de datos ---- */
    let globo = null;

    function prepararGlobo() {
        globo = document.createElement('div');
        globo.className = 'globo-dato';
        globo.setAttribute('role', 'tooltip');
        globo.setAttribute('aria-hidden', 'true');
        document.body.appendChild(globo);
    }

    function mostrarGlobo(elemento, titulo, detalle) {
        globo.innerHTML = '';
        const t = document.createElement('span');
        t.className = 'titulo-globo';
        t.textContent = titulo;
        globo.appendChild(t);
        globo.appendChild(document.createTextNode(detalle));

        const caja = elemento.getBoundingClientRect();
        globo.style.left = (caja.left + caja.width / 2) + 'px';
        globo.style.top = caja.top + 'px';
        globo.classList.add('visible');
        globo.setAttribute('aria-hidden', 'false');
    }

    function ocultarGlobo() {
        globo.classList.remove('visible');
        globo.setAttribute('aria-hidden', 'true');
    }

    /* Se engancha al ratón Y al foco: sin la parte del foco, el valor exacto no
       existe para quien navega con teclado. */
    function engancharGlobo(elemento, titulo, detalle) {
        elemento.setAttribute('tabindex', '0');
        elemento.addEventListener('mouseenter', () => mostrarGlobo(elemento, titulo, detalle));
        elemento.addEventListener('focus', () => mostrarGlobo(elemento, titulo, detalle));
        elemento.addEventListener('mouseleave', ocultarGlobo);
        elemento.addEventListener('blur', ocultarGlobo);
    }

    /* ---- 1. Mapa de calor: SIEMPRE la última semana ---- */
    /*
      No recibe el rango. Las columnas son los siete días de la última semana,
      rotulados con el día que les toca. Se dibuja una sola vez, al cargar.
    */
    function dibujarMapa(crudos) {
        const tabla = document.querySelector('#mapa-calor');
        if (!tabla) return;

        const ultimos = crudos.map((p) => ({ nombre: p.nombre, dias: p.dias.slice(-7) }));
        const maximo = Math.max(...ultimos.flatMap((p) => p.dias.map((d) => d.valor)));

        const thead = document.createElement('thead');
        const filaEnc = document.createElement('tr');
        /* La esquina vacía no encabeza nada; como <th> haría que un lector de
           pantalla anuncie una columna inexistente. */
        filaEnc.appendChild(document.createElement('td'));
        ultimos[0].dias.forEach((d) => {
            const th = document.createElement('th');
            th.scope = 'col';
            th.textContent = DIAS_SEMANA[d.fecha.getDay()];
            filaEnc.appendChild(th);
        });
        thead.appendChild(filaEnc);
        tabla.appendChild(thead);

        const tbody = document.createElement('tbody');

        ultimos.forEach((producto) => {
            const fila = document.createElement('tr');
            const th = document.createElement('th');
            th.scope = 'row';
            th.textContent = producto.nombre;
            fila.appendChild(th);

            producto.dias.forEach((d) => {
                const td = document.createElement('td');
                const paso = pasoDeColor(d.valor, maximo);
                td.style.backgroundColor = RAMPA[paso];
                td.style.color = paso >= CRUCE ? CIFRA_OSCURA : CIFRA_CLARA;

                const cifra = document.createElement('span');
                cifra.className = 'cifra-celda';
                cifra.textContent = nf(d.valor);
                td.appendChild(cifra);

                const cuando = `${DIAS_SEMANA[d.fecha.getDay()]} ${d.fecha.getDate()} ${MESES[d.fecha.getMonth()]}`;
                engancharGlobo(td, `${producto.nombre} · ${cuando}`, `${nf(d.valor)} unidades`);
                fila.appendChild(td);
            });

            tbody.appendChild(fila);
        });

        tabla.appendChild(tbody);
    }

    /* ---- 2. Pequeños múltiplos: los gobierna el filtro ---- */
    function dibujarMultiples(crudos, rango) {
        const contenedor = document.querySelector('#rejilla-multiples');
        if (!contenedor) return;

        contenedor.innerHTML = '';

        const agregados = crudos.map((p) => {
            const { valores } = agregar(p.dias, rango);
            return { nombre: p.nombre, valores };
        });

        /* LA ESCALA ES COMPARTIDA y esto es lo único que hace válida la
           comparación: si cada minigráfica se escalara a su propio máximo, la
           curva del pollo entero se vería igual de alta que la del cartón de
           30, y el lector concluiría lo contrario de lo que dicen los datos. */
        const techo = Math.max(...agregados.flatMap((p) => p.valores));

        const ANCHO = 200;
        const ALTO = 48;
        const MARGEN = 4;

        agregados.forEach((producto) => {
            const serie = producto.valores;
            const ficha = document.createElement('div');
            ficha.className = 'ficha-multiple';

            const total = serie.reduce((a, b) => a + b, 0);

            const rotulo = document.createElement('div');
            rotulo.className = 'nombre-multiple';
            rotulo.textContent = producto.nombre;
            ficha.appendChild(rotulo);

            const cifra = document.createElement('div');
            cifra.className = 'total-multiple';
            cifra.textContent = nf(total) + ' ';
            const unidad = document.createElement('small');
            unidad.textContent = 'en ' + rango.etiqueta;
            cifra.appendChild(unidad);
            ficha.appendChild(cifra);

            const svg = svgEl('svg', {
                viewBox: `0 0 ${ANCHO} ${ALTO}`,
                role: 'img',
                /* La alternativa textual da el dato, no describe el dibujo:
                   "una línea que sube" no le sirve a nadie. */
                'aria-label': `${producto.nombre}: ${total} unidades en ${rango.etiqueta}. Dato de ejemplo.`
            });

            /* Con un solo punto no hay línea que trazar: se dibuja el punto y
               listo. */
            const px = (i) => (serie.length === 1 ? ANCHO / 2 : (i / (serie.length - 1)) * ANCHO);
            const py = (v) => ALTO - MARGEN - (techo ? (v / techo) * (ALTO - MARGEN * 2) : 0);

            if (serie.length > 1) {
                let area = `M0,${ALTO} L${px(0)},${py(serie[0])}`;
                serie.forEach((v, i) => { if (i) area += ` L${px(i)},${py(v)}`; });
                area += ` L${ANCHO},${ALTO} Z`;
                svg.appendChild(svgEl('path', { d: area, fill: SERIE, 'fill-opacity': '0.16' }));

                let linea = `M${px(0)},${py(serie[0])}`;
                serie.forEach((v, i) => { if (i) linea += ` L${px(i)},${py(v)}`; });
                svg.appendChild(svgEl('path', {
                    d: linea, fill: 'none', stroke: SERIE, 'stroke-width': 2,
                    'stroke-linejoin': 'round', 'stroke-linecap': 'round'
                }));
            }

            /* Punto en el último valor: marca dónde termina la serie, que es el
               dato que más se mira. El aro del color del fondo lo despega de la
               línea cuando la curva se dobla sobre sí misma. */
            const ultimo = serie.length - 1;
            svg.appendChild(svgEl('circle', {
                cx: px(ultimo), cy: py(serie[ultimo]), r: 3.5,
                fill: SERIE, stroke: '#1a1a1a', 'stroke-width': 2
            }));

            ficha.appendChild(svg);
            engancharGlobo(ficha, producto.nombre, `${nf(total)} unidades en ${rango.etiqueta}`);
            contenedor.appendChild(ficha);
        });
    }

    /* ---- Filtro de rango ---- */
    function construirFiltro(alCambiar) {
        const caja = document.querySelector('#filtro-rango');
        if (!caja) return;

        RANGOS.forEach((rango) => {
            const boton = document.createElement('button');
            boton.type = 'button';
            boton.className = 'boton-rango';
            boton.textContent = rango.etiqueta;
            boton.dataset.rango = rango.id;

            /* aria-pressed y no solo una clase: la clase pinta el botón, pero
               quien usa lector de pantalla necesita oír cuál está elegido. El
               contenedor lleva role="group" con su nombre, en el HTML. */
            const esInicial = rango.id === RANGO_INICIAL;
            boton.setAttribute('aria-pressed', String(esInicial));
            if (esInicial) boton.classList.add('activo');

            boton.addEventListener('click', () => {
                caja.querySelectorAll('.boton-rango').forEach((b) => {
                    b.classList.remove('activo');
                    b.setAttribute('aria-pressed', 'false');
                });
                boton.classList.add('activo');
                boton.setAttribute('aria-pressed', 'true');
                alCambiar(rango);
            });

            caja.appendChild(boton);
        });
    }

    /* ---- Arranque ---- */
    document.addEventListener('DOMContentLoaded', async () => {
        if (!document.querySelector('#mapa-calor')) return;

        prepararGlobo();

        try {
            const crudos = await obtenerSerieDiaria();

            /* El mapa se dibuja UNA vez: no depende del filtro. */
            dibujarMapa(crudos);

            const pintarMultiples = (rango) => {
                dibujarMultiples(crudos, rango);

                /* Se anuncia el cambio. Sin esto, quien no ve la pantalla pulsa
                   "12 meses" y no se entera de que pasó algo: la gráfica se
                   redibuja en silencio. El elemento lleva role="status" en el
                   HTML, así que el lector lo lee sin robar el foco. */
                const estado = document.querySelector('#estado-rango');
                if (estado) {
                    const unidad = { dia: 'día', semana: 'semana', mes: 'mes' }[rango.cubeta];
                    /* La última cubeta siempre va en curso: la semana o el mes
                       todavía no terminaron. Sin avisarlo, ese punto se lee como
                       una caída. */
                    const encurso = rango.cubeta === 'dia'
                        ? ''
                        : ` El ${unidad} en curso va incompleto.`;
                    estado.textContent =
                        `Mostrando ${rango.etiqueta}, agrupado por ${unidad}.${encurso}`;
                }
            };

            construirFiltro(pintarMultiples);
            pintarMultiples(RANGOS.find((r) => r.id === RANGO_INICIAL));

        } catch (error) {
            /* Si los datos no llegan, se dice — no se deja el hueco en blanco,
               que se lee como "no hubo movimiento" y es una afirmación falsa. */
            const aviso = document.querySelector('#aviso-grafica');
            if (aviso) {
                aviso.innerHTML =
                    '<strong>No se pudieron cargar las gráficas.</strong> ' +
                    'Volvé a cargar la página; si sigue igual, es que el módulo ' +
                    'todavía no está conectado a la base de datos.';
            }
            console.error('[La Morán] Gráficas de movimiento:', error);
        }
    });
})();
