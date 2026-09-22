/* =====================================================
   SAN MARTÍN
   OFERTAS Y EVENTOS — 03-OFERTAS.JS
   -----------------------------------------------------
   RESPONSABILIDAD:

   - Carrusel de promociones
   - Navegación hacia #ofertas
   - Vista interna de ofertas
   - Activación del modo OFERTAS
   - Desactivación del modo OFERTAS
   - Uso del buscador global #search
   - Cálculo del precio final de oferta
   - Comunicación con los demás módulos
   - Compatibilidad con navegación interna
   - Compatibilidad con historial del navegador
===================================================== */


/* =====================================================
   1. ESTADO GLOBAL DE LA VISTA
===================================================== */

window.vistaActual =
    window.vistaActual || "catalogo";


/* =====================================================
   2. REFERENCIAS DEL DOM
===================================================== */

const ofertasView =
    document.getElementById("ofertas");


const ofertasProducts =
    document.getElementById("offersProducts");


const ofertasEmpty =
    document.getElementById("offersEmpty");


const promociones =
    document.getElementById("promociones");


const promotionsTrack =
    document.getElementById("promotionsTrack");


const previousPromotion =
    document.querySelector(
        ".promo-arrow-prev"
    );


const nextPromotion =
    document.querySelector(
        ".promo-arrow-next"
    );


/* =====================================================
   3. CARRUSEL DE PROMOCIONES
===================================================== */

if (
    promotionsTrack &&
    previousPromotion &&
    nextPromotion
) {

    function moverPromociones(
        direccion
    ) {

        const ancho =
            promotionsTrack.clientWidth;


        if (
            !ancho
        ) {

            return;

        }


        promotionsTrack.scrollBy({

            left:
                direccion *
                ancho,

            behavior:
                "smooth"

        });

    }


    previousPromotion.addEventListener(
        "click",
        function () {

            moverPromociones(-1);

        }
    );


    nextPromotion.addEventListener(
        "click",
        function () {

            moverPromociones(1);

        }
    );

}


/* =====================================================
   4. OBTENER PRODUCTOS EN OFERTA
===================================================== */

function obtenerProductosEnOferta() {

    if (
        !Array.isArray(
            window.productos
        )
    ) {

        return [];

    }


    return window.productos.filter(
        function (producto) {

            if (
                !producto ||
                typeof producto !== "object"
            ) {

                return false;

            }


            const porcentajeOferta =
                Number(
                    producto.oferta
                );


            return (
                Number.isFinite(
                    porcentajeOferta
                ) &&
                porcentajeOferta > 0
            );

        }
    );

}


/* =====================================================
   5. CALCULAR PRECIO DE OFERTA
===================================================== */

function obtenerPrecioOferta(
    producto
) {

    if (
        !producto
    ) {

        return 0;

    }


    const precioOriginal =
        Number(
            producto.precio
        );


    const porcentajeOferta =
        Number(
            producto.oferta
        );


    if (
        !Number.isFinite(
            precioOriginal
        ) ||
        precioOriginal <= 0
    ) {

        return 0;

    }


    if (
        !Number.isFinite(
            porcentajeOferta
        ) ||
        porcentajeOferta <= 0
    ) {

        return precioOriginal;

    }


    const porcentajeSeguro =
        Math.min(
            100,
            Math.max(
                0,
                porcentajeOferta
            )
        );


    const precioFinal =
        precioOriginal -
        (
            precioOriginal *
            porcentajeSeguro /
            100
        );


    return Math.max(
        0,
        precioFinal
    );

}


/* =====================================================
   6. PRECIO DE VENTA SEGÚN LA VISTA
===================================================== */

window.obtenerPrecioVenta =
    function (
        producto,
        opciones = {}
    ) {

        const modo =
            opciones.modo ||
            window.vistaActual;


        if (
            modo === "ofertas" ||
            modo === "oferta"
        ) {

            return obtenerPrecioOferta(
                producto
            );

        }


        return Number(
            producto?.precio
        ) || 0;

    };


/* =====================================================
   7. VERIFICAR SI ESTÁ EN OFERTA
===================================================== */

window.productoEstaEnOferta =
    function (
        producto
    ) {

        if (
            !producto
        ) {

            return false;

        }


        const oferta =
            Number(
                producto.oferta
            );


        return (
            Number.isFinite(
                oferta
            ) &&
            oferta > 0
        );

    };


/* =====================================================
   8. OBTENER PORCENTAJE DE OFERTA
===================================================== */

window.obtenerPorcentajeOferta =
    function (
        producto
    ) {

        if (
            !producto
        ) {

            return 0;

        }


        const oferta =
            Number(
                producto.oferta
            );


        if (
            !Number.isFinite(
                oferta
            ) ||
            oferta <= 0
        ) {

            return 0;

        }


        return Math.min(
            100,
            Math.max(
                0,
                oferta
            )
        );

    };


/* =====================================================
   9. NOTIFICAR CAMBIO DE VISTA
   -----------------------------------------------------
   Otros módulos pueden escuchar:

       sanMartinVistaCambiada
===================================================== */

function notificarCambioDeVista() {

    window.dispatchEvent(
        new CustomEvent(
            "sanMartinVistaCambiada",
            {
                detail: {
                    vista:
                        window.vistaActual
                }
            }
        )
    );

}


/* =====================================================
   10. MOSTRAR VISTA DE OFERTAS
===================================================== */

function mostrarVistaOfertas(
    opciones = {}
) {

    const {

        desplazar = true,

        actualizarURL = true,

        limpiarBusqueda = false

    } = opciones;


    /* =================================================
       CAMBIAR ESTADO
    ================================================= */

    window.vistaActual =
        "ofertas";


    window.modoVista =
        "ofertas";


    window.modoCatalogo =
        "ofertas";


    /* =================================================
       REFERENCIAS
    ================================================= */

    const catalogo =
        document.getElementById(
            "catalogo"
        );


    const marcas =
        document.getElementById(
            "marcas"
        );


    const hero =
        document.getElementById(
            "inicio"
        );


    /* =================================================
       MOSTRAR OFERTAS
    ================================================= */

    if (
        ofertasView
    ) {

        ofertasView.hidden =
            false;

        ofertasView.classList.add(
            "vista-activa"
        );

    }


    /* =================================================
       OCULTAR VISTAS PRINCIPALES
    ================================================= */

    if (
        hero
    ) {

        hero.hidden =
            true;

    }


    if (
        promociones
    ) {

        promociones.hidden =
            true;

    }


    if (
        marcas
    ) {

        marcas.hidden =
            true;

    }


    if (
        catalogo
    ) {

        catalogo.hidden =
            true;

    }


    /* =================================================
       BUSCADOR GLOBAL
    ================================================= */

    const buscador =
        document.getElementById(
            "search"
        );


    if (
        limpiarBusqueda &&
        buscador
    ) {

        buscador.value =
            "";

    }


    if (
        buscador
    ) {

        buscador.placeholder =
            "Buscar producto en oferta...";

    }


    /* =================================================
       REINICIAR PAGINACIÓN
    ================================================= */

    if (
        typeof paginaActual !==
        "undefined"
    ) {

        paginaActual =
            1;

    }


    /* =================================================
       NOTIFICAR A LOS MÓDULOS
    ================================================= */

    notificarCambioDeVista();


    /* =================================================
       RENDERIZAR
    ================================================= */

    if (
        typeof mostrarProductos ===
        "function"
    ) {

        mostrarProductos();

    }


    /* =================================================
       ACTUALIZAR URL
    ================================================= */

    if (
        actualizarURL &&
        window.location.hash !== "#ofertas"
    ) {

        history.pushState(
            null,
            "",
            "#ofertas"
        );

    }


    /* =================================================
       DESPLAZAR
    ================================================= */

    if (
        desplazar
    ) {

        requestAnimationFrame(
            function () {

                requestAnimationFrame(
                    function () {

                        desplazarAOfertas();

                    }

                );

            }
        );

    }

}


/* =====================================================
   11. OCULTAR VISTA DE OFERTAS
===================================================== */

function ocultarVistaOfertas(
    opciones = {}
) {

    const {

        actualizarURL = true,

        desplazar = true

    } = opciones;


    /* =================================================
       CAMBIAR ESTADO
    ================================================= */

    window.vistaActual =
        "catalogo";


    window.modoVista =
        "catalogo";


    window.modoCatalogo =
        "catalogo";


    /* =================================================
       REFERENCIAS
    ================================================= */

    const catalogo =
        document.getElementById(
            "catalogo"
        );


    const marcas =
        document.getElementById(
            "marcas"
        );


    const hero =
        document.getElementById(
            "inicio"
        );


    /* =================================================
       OCULTAR OFERTAS
    ================================================= */

    if (
        ofertasView
    ) {

        ofertasView.hidden =
            true;

        ofertasView.classList.remove(
            "vista-activa"
        );

    }


    /* =================================================
       MOSTRAR VISTAS PRINCIPALES
    ================================================= */

    if (
        hero
    ) {

        hero.hidden =
            false;

    }


    if (
        promociones
    ) {

        promociones.hidden =
            false;

    }


    if (
        marcas
    ) {

        marcas.hidden =
            false;

    }


    if (
        catalogo
    ) {

        catalogo.hidden =
            false;

    }


    /* =================================================
       RESTAURAR BUSCADOR
    ================================================= */

    const buscador =
        document.getElementById(
            "search"
        );


    if (
        buscador
    ) {

        buscador.placeholder =
            "Buscar producto...";

    }


    /* =================================================
       NOTIFICAR CAMBIO
    ================================================= */

    notificarCambioDeVista();


    /* =================================================
       ACTUALIZAR URL
    ================================================= */

    if (
        actualizarURL &&
        window.location.hash === "#ofertas"
    ) {

        history.pushState(
            null,
            "",
            "#inicio"
        );

    }


    /* =================================================
       VOLVER AL INICIO
    ================================================= */

    if (
        desplazar
    ) {

        requestAnimationFrame(
            function () {

                desplazarAElemento(
                    hero ||
                    catalogo
                );

            }

        );

    }

}


/* =====================================================
   12. DESPLAZAR A OFERTAS
===================================================== */

function desplazarAOfertas() {

    if (
        !ofertasView
    ) {

        return;

    }


    desplazarAElemento(
        ofertasView
    );

}


/* =====================================================
   13. DESPLAZAMIENTO GENÉRICO
===================================================== */

function desplazarAElemento(
    elemento
) {

    if (
        !elemento
    ) {

        return;

    }


    const header =
        document.querySelector(
            "header"
        );


    const alturaHeader =
        header
            ? header.getBoundingClientRect().height
            : 0;


    const margen =
        15;


    const posicion =
        elemento.getBoundingClientRect().top +
        window.scrollY -
        alturaHeader -
        margen;


    window.scrollTo({

        top:
            Math.max(
                0,
                posicion
            ),

        behavior:
            "smooth"

    });

}


/* =====================================================
   14. API PÚBLICA
===================================================== */

window.abrirOfertas =
    function (
        opciones = {}
    ) {

        mostrarVistaOfertas(
            opciones
        );

    };


window.cerrarOfertas =
    function (
        opciones = {}
    ) {

        ocultarVistaOfertas(
            opciones
        );

    };


/* =====================================================
   15. ENLACES #OFERTAS
===================================================== */

document.addEventListener(
    "click",
    function (evento) {

        const enlace =
            evento.target.closest(
                'a[href="#ofertas"]'
            );


        if (
            !enlace
        ) {

            return;

        }


        if (
            evento.defaultPrevented
        ) {

            return;

        }


        evento.preventDefault();


        mostrarVistaOfertas({

            desplazar:
                true,

            actualizarURL:
                true,

            limpiarBusqueda:
                true

        });

    }
);


/* =====================================================
   16. BOTONES VOLVER
===================================================== */

document.addEventListener(
    "click",
    function (evento) {

        const boton =
            evento.target.closest(
                "[data-volver-inicio]"
            );


        if (
            !boton
        ) {

            return;

        }


        evento.preventDefault();


        ocultarVistaOfertas({

            actualizarURL:
                true,

            desplazar:
                true

        });

    }
);


/* =====================================================
   17. HISTORIAL
===================================================== */

window.addEventListener(
    "popstate",
    function () {

        sincronizarVistaConHash();

    }
);


/* =====================================================
   18. HASHCHANGE
===================================================== */

window.addEventListener(
    "hashchange",
    function () {

        sincronizarVistaConHash();

    }
);


/* =====================================================
   19. SINCRONIZAR CON HASH
===================================================== */

function sincronizarVistaConHash() {

    const hash =
        window.location.hash;


    if (
        hash === "#ofertas"
    ) {

        mostrarVistaOfertas({

            desplazar:
                true,

            actualizarURL:
                false,

            limpiarBusqueda:
                false

        });


        return;

    }


    if (
        window.vistaActual ===
        "ofertas"
    ) {

        ocultarVistaOfertas({

            actualizarURL:
                false,

            desplazar:
                false

        });

    }

}


/* =====================================================
   20. ENTRADA DIRECTA A #OFERTAS
===================================================== */

window.addEventListener(
    "load",
    function () {

        if (
            window.location.hash !==
            "#ofertas"
        ) {

            return;

        }


        setTimeout(
            function () {

                mostrarVistaOfertas({

                    desplazar:
                        true,

                    actualizarURL:
                        false,

                    limpiarBusqueda:
                        false

                });

            },
            100
        );

    }
);


/* =====================================================
   21. API DE OFERTAS
===================================================== */

window.sanMartinOfertas =
    {

        obtenerProductos:
            obtenerProductosEnOferta,

        obtenerPrecio:
            obtenerPrecioOferta,

        estaEnOferta:
            window.productoEstaEnOferta,

        obtenerPorcentaje:
            window.obtenerPorcentajeOferta,

        abrir:
            window.abrirOfertas,

        cerrar:
            window.cerrarOfertas

    };


/* =====================================================
   FIN — 03-OFERTAS.JS
===================================================== */