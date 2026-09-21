/* =====================================================
   SAN MARTÍN
   CATÁLOGO — 05-10 PAGINACIÓN
===================================================== */


/* =====================================================
   MOSTRAR PAGINACIÓN
   -----------------------------------------------------
   Genera los controles:

   ‹   1   2   3   ...   10   ›

   También utiliza una paginación inteligente cuando
   existen muchas páginas.
===================================================== */

function mostrarPaginacion(totalPaginas) {


    /* =================================================
       VERIFICAR CONTENEDOR
    ================================================= */

    if (!paginacion) {
        return;
    }


    /* =================================================
       LIMPIAR PAGINACIÓN ANTERIOR
    ================================================= */

    paginacion.innerHTML = "";


    /* =================================================
       SI NO HAY PAGINACIÓN NECESARIA
    ================================================= */

    if (
        totalPaginas <= 1
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
            document.createElement("button");


        boton.type = "button";


        boton.className =
            "pagination-btn";


        boton.textContent =
            texto;


        /* ---------------------------------------------
           Página activa
        --------------------------------------------- */

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


        /* ---------------------------------------------
           Botón deshabilitado
        --------------------------------------------- */

        if (
            opciones.deshabilitado
        ) {

            boton.disabled = true;

        }


        /* ---------------------------------------------
           Accesibilidad
        --------------------------------------------- */

        if (
            opciones.ariaLabel
        ) {

            boton.setAttribute(
                "aria-label",
                opciones.ariaLabel
            );

        }


        /* ---------------------------------------------
           Evento
        --------------------------------------------- */

        if (
            !opciones.deshabilitado
        ) {

            boton.addEventListener(
                "click",
                function () {

                    paginaActual =
                        pagina;


                    mostrarProductos();


                    /* ---------------------------------
                       Desplazamiento hacia catálogo
                    --------------------------------- */

                    const catalogo =
                        document.getElementById(
                            "catalogo"
                        );


                    if (catalogo) {

                        const header =
                            document.querySelector(
                                "header"
                            );


                        const alturaHeader =
                            header
                                ? header.offsetHeight
                                : 0;


                        const posicion =
                            catalogo
                                .getBoundingClientRect()
                                .top
                            +
                            window.scrollY
                            -
                            alturaHeader
                            -
                            20;


                        window.scrollTo({

                            top: Math.max(
                                0,
                                posicion
                            ),

                            behavior: "smooth"

                        });

                    }

                }
            );

        }


        return boton;

    }


    /* =================================================
       BOTÓN ANTERIOR
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


    paginacion.appendChild(
        botonAnterior
    );


    /* =================================================
       FUNCIÓN — AGREGAR NÚMERO
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


        paginacion.appendChild(
            boton
        );

    }


    /* =================================================
       FUNCIÓN — AGREGAR ELIPSIS
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


        paginacion.appendChild(
            elipsis
        );

    }


    /* =================================================
       POCAS PÁGINAS
       -------------------------------------------------
       Si existen 7 o menos páginas mostramos
       todas.
    ================================================= */

    if (
        totalPaginas <= 7
    ) {

        for (
            let pagina = 1;
            pagina <= totalPaginas;
            pagina++
        ) {

            agregarNumero(
                pagina
            );

        }

    }

    else {


        /* =============================================
           PRIMERA PÁGINA
        ============================================= */

        agregarNumero(1);


        /* =============================================
           CALCULAR LÍMITES
        ============================================= */

        let inicio =
            Math.max(
                2,
                paginaActual - 1
            );


        let fin =
            Math.min(
                totalPaginas - 1,
                paginaActual + 1
            );


        /* ---------------------------------------------
           Ajustar cuando estamos cerca del inicio
        --------------------------------------------- */

        if (
            paginaActual <= 3
        ) {

            inicio = 2;

            fin = 4;

        }


        /* ---------------------------------------------
           Ajustar cuando estamos cerca del final
        --------------------------------------------- */

        if (
            paginaActual >=
            totalPaginas - 2
        ) {

            inicio =
                totalPaginas - 3;

            fin =
                totalPaginas - 1;

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
            let pagina = inicio;
            pagina <= fin;
            pagina++
        ) {

            agregarNumero(
                pagina
            );

        }


        /* =============================================
           ELIPSIS FINAL
        ============================================= */

        if (
            fin <
            totalPaginas - 1
        ) {

            agregarElipsis();

        }


        /* =============================================
           ÚLTIMA PÁGINA
        ============================================= */

        agregarNumero(
            totalPaginas
        );

    }


    /* =================================================
       BOTÓN SIGUIENTE
    ================================================= */

    const botonSiguiente =
        crearBotonPagina(
            "›",
            Math.min(
                totalPaginas,
                paginaActual + 1
            ),
            {
                deshabilitado:
                    paginaActual >=
                    totalPaginas,

                ariaLabel:
                    "Página siguiente"
            }
        );


    botonSiguiente.classList.add(
        "pagination-next"
    );


    paginacion.appendChild(
        botonSiguiente
    );

}