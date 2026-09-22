/* =====================================================
   SAN MARTÍN
   CATÁLOGO — 05-07 ORDENAMIENTO
   -----------------------------------------------------
   RESPONSABILIDAD:

   - Orden original
   - Precio menor a mayor
   - Precio mayor a menor
   - Compatibilidad con CATÁLOGO
   - Compatibilidad con OFERTAS
   - En OFERTAS utiliza el precio final descontado
===================================================== */


/* =====================================================
   OBTENER PRECIO PARA ORDENAMIENTO
   -----------------------------------------------------
   CATÁLOGO:
   utiliza producto.precio

   OFERTAS:
   utiliza el precio final después del descuento.
===================================================== */

function obtenerPrecioOrdenamiento(
    producto,
    modo
) {

    if (!producto) {

        return 0;

    }


    /* =================================================
       OFERTAS
    ================================================= */

    if (
        modo === "ofertas" ||
        modo === "oferta"
    ) {

        if (
            typeof window.obtenerPrecioVenta ===
            "function"
        ) {

            return Number(
                window.obtenerPrecioVenta(
                    producto,
                    {
                        modo: "ofertas"
                    }
                )
            ) || 0;

        }


        /* ---------------------------------------------
           Respaldo por si el módulo de ofertas
           todavía no está disponible.
        --------------------------------------------- */

        const precioOriginal =
            Number(
                producto.precio
            ) || 0;


        const porcentajeOferta =
            Number(
                producto.oferta
            ) || 0;


        if (
            porcentajeOferta <= 0
        ) {

            return precioOriginal;

        }


        return Math.max(
            0,
            precioOriginal -
            (
                precioOriginal *
                porcentajeOferta /
                100
            )
        );

    }


    /* =================================================
       CATÁLOGO
    ================================================= */

    return Number(
        producto.precio
    ) || 0;

}


/* =====================================================
   ORDENAR PRODUCTOS
   -----------------------------------------------------
   Modos disponibles:

   • original
   • precio-asc
   • precio-desc

   opciones.modo:

   • catalogo
   • ofertas
===================================================== */

function ordenarProductos(
    listaProductos,
    opciones = {}
) {

    /* -------------------------------------------------
       Validación
    ------------------------------------------------- */

    if (
        !Array.isArray(
            listaProductos
        )
    ) {

        return [];

    }


    /* -------------------------------------------------
       Copia para no modificar el arreglo original.
    ------------------------------------------------- */

    const productosOrdenados = [
        ...listaProductos
    ];


    /* -------------------------------------------------
       Determinar vista.
    ------------------------------------------------- */

    const modo =
        opciones.modo ||
        (
            window.vistaActual ===
            "ofertas"
                ? "ofertas"
                : "catalogo"
        );


    /* =================================================
       ORDEN ORIGINAL
       -------------------------------------------------
       Conserva exactamente el orden recibido.
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
            function (a, b) {

                const precioA =
                    obtenerPrecioOrdenamiento(
                        a,
                        modo
                    );


                const precioB =
                    obtenerPrecioOrdenamiento(
                        b,
                        modo
                    );


                return (
                    precioA -
                    precioB
                );

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
            function (a, b) {

                const precioA =
                    obtenerPrecioOrdenamiento(
                        a,
                        modo
                    );


                const precioB =
                    obtenerPrecioOrdenamiento(
                        b,
                        modo
                    );


                return (
                    precioB -
                    precioA
                );

            }
        );

    }


    return productosOrdenados;

}


/* =====================================================
   EVENTO — CAMBIAR ORDEN
===================================================== */

if (
    selectOrdenPrecio
) {

    selectOrdenPrecio.addEventListener(
        "change",
        function () {

            ordenActual =
                this.value ||
                "original";


            paginaActual =
                1;


            mostrarProductos();

        }
    );

}


/* =====================================================
   FUNCIÓN PÚBLICA
===================================================== */

window.ordenarProductos =
    ordenarProductos;