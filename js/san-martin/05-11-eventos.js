/* =====================================================
   SAN MARTÍN
   CATÁLOGO — 05-11 EVENTOS
===================================================== */


/* =====================================================
   INICIALIZAR CATÁLOGO
   -----------------------------------------------------
   Este módulo funciona como punto final de
   inicialización del sistema de catálogo.
===================================================== */

function inicializarCatalogo() {


    /* =================================================
       VERIFICAR ELEMENTOS PRINCIPALES
    ================================================= */

    const elementosFaltantes = [];


    if (!contenedorProductos) {

        elementosFaltantes.push(
            "#products"
        );

    }


    if (!buscador) {

        elementosFaltantes.push(
            "#search"
        );

    }


    if (!paginacion) {

        elementosFaltantes.push(
            "#pagination"
        );

    }


    /* =================================================
       INFORMAR ELEMENTOS FALTANTES
    ================================================= */

    if (
        elementosFaltantes.length > 0
    ) {

        console.warn(
            "San Martín: elementos del catálogo no encontrados:",
            elementosFaltantes
        );

    }


    /* =================================================
       ESTADO INICIAL
    ================================================= */

    paginaActual = 1;


    categoriaActual =
        categoriaActual || "Todos";


    marcaActual =
        marcaActual || "Todas";


    ordenActual =
        ordenActual || "original";


    /* =================================================
       SINCRONIZAR CATEGORÍA INICIAL
    ================================================= */

    if (
        mobileCategoryFilter
    ) {

        mobileCategoryFilter.value =
            categoriaActual;

    }


    if (
        botonesFiltro
    ) {

        botonesFiltro.forEach(
            boton => {

                boton.classList.remove(
                    "active"
                );

            }
        );


        const botonActivo =
            document.querySelector(
                `[data-category="${CSS.escape(
                    categoriaActual
                )}"]`
            );


        if (botonActivo) {

            botonActivo.classList.add(
                "active"
            );

        }

    }


    /* =================================================
       SINCRONIZAR ORDEN
    ================================================= */

    if (
        selectOrdenPrecio
    ) {

        selectOrdenPrecio.value =
            ordenActual;

    }


    /* =================================================
       MOSTRAR MARCAS
    ================================================= */

    if (
        typeof mostrarMarcas ===
        "function"
    ) {

        mostrarMarcas();

    }


    /* =================================================
       MOSTRAR PRODUCTOS
    ================================================= */

    if (
        typeof mostrarProductos ===
        "function"
    ) {

        mostrarProductos();

    }

}


/* =====================================================
   INICIALIZACIÓN
   -----------------------------------------------------
   Como este módulo se carga después de todos los
   módulos del catálogo, podemos inicializar el sistema
   al terminar la carga.
===================================================== */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        inicializarCatalogo,
        {
            once: true
        }
    );

}

else {

    inicializarCatalogo();

}