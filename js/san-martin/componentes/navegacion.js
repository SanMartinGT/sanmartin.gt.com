/* =====================================================
   SAN MARTÍN
   NAVEGACIÓN INTERNA — HEADER FIJO
   -----------------------------------------------------
   Calcula automáticamente la altura real del header
   y evita que cualquier sección quede escondida detrás.
===================================================== */


/* =====================================================
   1. ACTUALIZAR ALTURA DEL HEADER
===================================================== */

function actualizarAlturaHeader() {

    const header =
        document.querySelector("header");

    if (!header) {
        return;
    }


    const altura =
        header.getBoundingClientRect().height;


    /*
       Guardamos la altura real del header
       en una variable CSS.
    */

    document.documentElement.style.setProperty(
        "--altura-header",
        `${altura}px`
    );

}


/* =====================================================
   2. CALCULAR AL CARGAR EL DOM
===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    actualizarAlturaHeader
);


/* =====================================================
   3. RECALCULAR AL TERMINAR DE CARGAR
   -----------------------------------------------------
   Esto permite detectar imágenes, fuentes y otros
   elementos que puedan modificar la altura.
===================================================== */

window.addEventListener(
    "load",
    actualizarAlturaHeader
);


/* =====================================================
   4. RECALCULAR CUANDO CAMBIA EL TAMAÑO
===================================================== */

window.addEventListener(
    "resize",
    actualizarAlturaHeader
);


/* =====================================================
   5. OBSERVAR CAMBIOS REALES DEL HEADER
   -----------------------------------------------------
   Especialmente importante en:
   • Tablet
   • Móvil
   • Menú en varias filas
   • Buscador
   • Cambios dinámicos
===================================================== */

const header =
    document.querySelector("header");


if (header && "ResizeObserver" in window) {

    const observadorHeader =
        new ResizeObserver(() => {

            actualizarAlturaHeader();

        });


    observadorHeader.observe(header);

}


/* =====================================================
   6. NAVEGACIÓN INTERNA
===================================================== */

document
    .querySelectorAll('nav a[href^="#"]')
    .forEach(enlace => {

        enlace.addEventListener(
            "click",
            function (evento) {

                const selector =
                    this.getAttribute("href");


                /* -----------------------------------------
                   Ignorar enlaces "#"
                ----------------------------------------- */

                if (
                    !selector ||
                    selector === "#"
                ) {
                    return;
                }


                /* -----------------------------------------
                   Buscar destino
                ----------------------------------------- */

                const destino =
                    document.querySelector(selector);


                if (!destino) {
                    return;
                }


                /* -----------------------------------------
                   Evitar desplazamiento automático
                ----------------------------------------- */

                evento.preventDefault();


                /* -----------------------------------------
                   Actualizar altura antes de calcular
                ----------------------------------------- */

                actualizarAlturaHeader();


                /* -----------------------------------------
                   Obtener header
                ----------------------------------------- */

                const headerActual =
                    document.querySelector("header");


                const alturaHeader =
                    headerActual
                        ? headerActual.getBoundingClientRect().height
                        : 0;


                /* -----------------------------------------
                   Posición absoluta del destino
                ----------------------------------------- */

                const posicion =
                    destino.getBoundingClientRect().top +
                    window.scrollY;


                /* -----------------------------------------
                   Margen visual
                ----------------------------------------- */

                const margen = 15;


                /* -----------------------------------------
                   Posición final
                ----------------------------------------- */

                const posicionFinal =
                    posicion -
                    alturaHeader -
                    margen;


                /* -----------------------------------------
                   Desplazamiento suave
                ----------------------------------------- */

                window.scrollTo({

                    top: Math.max(
                        0,
                        posicionFinal
                    ),

                    behavior: "smooth"

                });


                /* -----------------------------------------
                   Actualizar URL sin provocar
                   un nuevo salto
                ----------------------------------------- */

                history.pushState(
                    null,
                    "",
                    selector
                );

            }
        );

    });


/* =====================================================
   7. CORREGIR ENTRADA DIRECTA A UNA SECCIÓN
   -----------------------------------------------------
   Ejemplo:
   pagina.html#catalogo
   pagina.html#ubicacion
===================================================== */

window.addEventListener(
    "load",
    () => {

        if (!window.location.hash) {
            return;
        }


        const destino =
            document.querySelector(
                window.location.hash
            );


        if (!destino) {
            return;
        }


        setTimeout(() => {

            actualizarAlturaHeader();


            const headerActual =
                document.querySelector("header");


            const alturaHeader =
                headerActual
                    ? headerActual.getBoundingClientRect().height
                    : 0;


            const posicion =
                destino.getBoundingClientRect().top +
                window.scrollY;


            const margen = 15;


            window.scrollTo({

                top: Math.max(
                    0,
                    posicion -
                    alturaHeader -
                    margen
                ),

                behavior: "smooth"

            });

        }, 100);

    }
);