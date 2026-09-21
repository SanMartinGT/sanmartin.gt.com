/* =====================================================
   SAN MARTÍN
   CATÁLOGO — 05-07 ORDENAMIENTO
===================================================== */


/* =====================================================
   ORDENAR PRODUCTOS
   -----------------------------------------------------
   Recibe una lista de productos y devuelve una nueva
   lista ordenada según el estado actual.

   Modos disponibles:

   • original
   • precio-asc
   • precio-desc
===================================================== */

function ordenarProductos(listaProductos) {

    /* -------------------------------------------------
       Creamos una copia para no modificar el arreglo
       original de productos.
    ------------------------------------------------- */

    const productosOrdenados = [
        ...listaProductos
    ];


    /* =================================================
       ORDEN ORIGINAL
       -------------------------------------------------
       No modificamos el orden original del catálogo.
    ================================================= */

    if (
        ordenActual === "original"
    ) {

        return productosOrdenados;

    }


    /* =================================================
       PRECIO — MENOR A MAYOR
    ================================================= */

    if (
        ordenActual === "precio-asc"
    ) {

        productosOrdenados.sort(
            (a, b) => {

                const precioA =
                    Number(a.precio) || 0;

                const precioB =
                    Number(b.precio) || 0;

                return precioA - precioB;

            }
        );

    }


    /* =================================================
       PRECIO — MAYOR A MENOR
    ================================================= */

    if (
        ordenActual === "precio-desc"
    ) {

        productosOrdenados.sort(
            (a, b) => {

                const precioA =
                    Number(a.precio) || 0;

                const precioB =
                    Number(b.precio) || 0;

                return precioB - precioA;

            }
        );

    }


    return productosOrdenados;

}


/* =====================================================
   EVENTO — CAMBIAR ORDEN
===================================================== */

if (selectOrdenPrecio) {

    selectOrdenPrecio.addEventListener(
        "change",
        function () {

            ordenActual =
                this.value || "original";


            paginaActual = 1;


            mostrarProductos();

        }
    );

}