/* =====================================================
   SAN MARTÍN
   CATÁLOGO — 05-10 PAGINACIÓN
   -----------------------------------------------------
   PAGINACIÓN CENTRAL PARA:

   • CATÁLOGO
   • OFERTAS

   Detecta automáticamente la vista activa.

   CATÁLOGO:
       #products
       #pagination
       #catalogo

   OFERTAS:
       #offersProducts
       #offersPagination
       #ofertas
===================================================== */


/* =====================================================
   1. OBTENER VISTA ACTUAL
===================================================== */

function obtenerVistaPaginacion() {

    if (
        window.vistaActual === "ofertas"
    ) {

        return "ofertas";

    }


    return "catalogo";

}


/* =====================================================
   2. OBTENER CONTENEDOR DE PAGINACIÓN
===================================================== */

function obtenerContenedorPaginacionActivo() {

    const vista =
        obtenerVistaPaginacion();


    /* =================================================
       OFERTAS
    ================================================= */

    if (
        vista === "ofertas"
    ) {

        const paginacionOfertas =
            document.getElementById(
                "offersPagination"
            );


        if (
            paginacionOfertas
        ) {

            return paginacionOfertas;

        }

    }


    /* =================================================
       CATÁLOGO
    ================================================= */

    if (
        typeof paginacion !==
        "undefined" &&
        paginacion
    ) {

        return paginacion;

    }


    return document.getElementById(
        "pagination"
    );

}


/* =====================================================
   3. OBTENER DESTINO DE DESPLAZAMIENTO
===================================================== */

function obtenerDestinoPaginacion() {

    const vista =
        obtenerVistaPaginacion();


    /* =================================================
       OFERTAS
    ================================================= */

    if (
        vista === "ofertas"
    ) {

        return (
            document.getElementById(
                "offersProducts"
            )
            ||
            document.getElementById(
                "ofertas"
            )
        );

    }


    /* =================================================
       CATÁLOGO
    ================================================= */

    return (
        document.getElementById(
            "catalogo"
        )
        ||
        document.getElementById(
            "products"
        )
    );

}


/* =====================================================
   4. DESPLAZAMIENTO
   -----------------------------------------------------
   Tiene en cuenta la altura real del header fijo.
===================================================== */

function desplazarDespuesDePaginacion() {

    const destino =
        obtenerDestinoPaginacion();


    if (
        !destino
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
        20;


    const posicion =
        destino.getBoundingClientRect().top +
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
   5. MOSTRAR PAGINACIÓN
   -----------------------------------------------------
   Genera:

       ‹  1  2  3  …  10  ›

   Funciona en catálogo y ofertas.
===================================================== */

function mostrarPaginacion(
    totalPaginas
) {

    const contenedor =
        obtenerContenedorPaginacionActivo();


    /* =================================================
       VERIFICAR CONTENEDOR
    ================================================= */

    if (
        !contenedor
    ) {

        return;

    }


    /* =================================================
       LIMPIAR
    ================================================= */

    contenedor.innerHTML =
        "";


    /* =================================================
       NORMALIZAR TOTAL
    ================================================= */

    const total =
        Math.max(
            0,
            Number(totalPaginas) || 0
        );


    /* =================================================
       SIN PAGINACIÓN
    ================================================= */

    if (
        total <= 1
    ) {

        return;

    }


    /* =================================================
       FUNCIÓN — CREAR BOTÓN
    ================================================= */

    function crearBotonPagina(
        texto,
        pagina,
        opciones = {}
    ) {

        const boton =
            document.createElement(
                "button"
            );


        boton.type =
            "button";


        boton.className =
            "pagination-btn";


        boton.textContent =
            texto;


        /* =============================================
           ACTIVO
        ============================================= */

        if (
            opciones.activo
        ) {

            boton.classList.add(
                "active"
            );


            boton.setAttribute(
                "aria-current",
                "page"
            );

        }


        /* =============================================
           DESHABILITADO
        ============================================= */

        if (
            opciones.deshabilitado
        ) {

            boton.disabled =
                true;

        }


        /* =============================================
           ARIA
        ============================================= */

        if (
            opciones.ariaLabel
        ) {

            boton.setAttribute(
                "aria-label",
                opciones.ariaLabel
            );

        }


        /* =============================================
           EVENTO
        ============================================= */

        if (
            !opciones.deshabilitado
        ) {

            boton.addEventListener(
                "click",
                function () {

                    /* ===============================
                       ACTUALIZAR PÁGINA
                    =============================== */

                    paginaActual =
                        pagina;


                    /* ===============================
                       RENDERIZAR
                    =============================== */

                    if (
                        typeof mostrarProductos ===
                        "function"
                    ) {

                        mostrarProductos();

                    }


                    /* ===============================
                       DESPLAZAR
                    =============================== */

                    requestAnimationFrame(
                        function () {

                            requestAnimationFrame(
                                function () {

                                    desplazarDespuesDePaginacion();

                                }
                            );

                        }
                    );

                }
            );

        }


        return boton;

    }


    /* =================================================
       6. BOTÓN ANTERIOR
    ================================================= */

    const botonAnterior =
        crearBotonPagina(
            "‹",
            Math.max(
                1,
                paginaActual - 1
            ),
            {

                deshabilitado:
                    paginaActual <= 1,

                ariaLabel:
                    "Página anterior"

            }
        );


    botonAnterior.classList.add(
        "pagination-prev"
    );


    contenedor.appendChild(
        botonAnterior
    );


    /* =================================================
       7. AGREGAR NÚMERO
    ================================================= */

    function agregarNumero(
        numero
    ) {

        const boton =
            crearBotonPagina(
                String(numero),
                numero,
                {

                    activo:
                        numero ===
                        paginaActual,

                    ariaLabel:
                        `Ir a la página ${numero}`

                }
            );


        contenedor.appendChild(
            boton
        );

    }


    /* =================================================
       8. AGREGAR ELIPSIS
    ================================================= */

    function agregarElipsis() {

        const elipsis =
            document.createElement(
                "span"
            );


        elipsis.className =
            "pagination-ellipsis";


        elipsis.textContent =
            "…";


        elipsis.setAttribute(
            "aria-hidden",
            "true"
        );


        contenedor.appendChild(
            elipsis
        );

    }


    /* =================================================
       9. SI HAY 7 O MENOS
    ================================================= */

    if (
        total <= 7
    ) {

        for (
            let numero = 1;
            numero <= total;
            numero++
        ) {

            agregarNumero(
                numero
            );

        }

    }

    else {

        /* =============================================
           PRIMERA
        ============================================= */

        agregarNumero(
            1
        );


        /* =============================================
           CALCULAR RANGO
        ============================================= */

        let inicio =
            Math.max(
                2,
                paginaActual - 1
            );


        let fin =
            Math.min(
                total - 1,
                paginaActual + 1
            );


        /* =============================================
           CERCA DEL PRINCIPIO
        ============================================= */

        if (
            paginaActual <= 3
        ) {

            inicio =
                2;

            fin =
                4;

        }


        /* =============================================
           CERCA DEL FINAL
        ============================================= */

        if (
            paginaActual >=
            total - 2
        ) {

            inicio =
                total - 3;

            fin =
                total - 1;

        }


        /* =============================================
           ELIPSIS INICIAL
        ============================================= */

        if (
            inicio > 2
        ) {

            agregarElipsis();

        }


        /* =============================================
           PÁGINAS CENTRALES
        ============================================= */

        for (
            let numero = inicio;
            numero <= fin;
            numero++
        ) {

            agregarNumero(
                numero
            );

        }


        /* =============================================
           ELIPSIS FINAL
        ============================================= */

        if (
            fin <
            total - 1
        ) {

            agregarElipsis();

        }


        /* =============================================
           ÚLTIMA
        ============================================= */

        agregarNumero(
            total
        );

    }


    /* =================================================
       10. BOTÓN SIGUIENTE
    ================================================= */

    const botonSiguiente =
        crearBotonPagina(
            "›",
            Math.min(
                total,
                paginaActual + 1
            ),
            {

                deshabilitado:
                    paginaActual >= total,

                ariaLabel:
                    "Página siguiente"

            }
        );


    botonSiguiente.classList.add(
        "pagination-next"
    );


    contenedor.appendChild(
        botonSiguiente
    );

}


/* =====================================================
   11. API PÚBLICA
===================================================== */

window.obtenerVistaPaginacion =
    obtenerVistaPaginacion;


window.obtenerContenedorPaginacionActivo =
    obtenerContenedorPaginacionActivo;


window.desplazarDespuesDePaginacion =
    desplazarDespuesDePaginacion;


/* =====================================================
   FIN — 05-10 PAGINACIÓN
===================================================== */