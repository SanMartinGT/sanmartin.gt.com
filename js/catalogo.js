/* =====================================================
   SAN MARTÍN
   CARGADOR PRINCIPAL DEL CATÁLOGO
===================================================== */

(function () {

    const modulos = [

        /* =================================================
           ESTRUCTURA
        ================================================= */

        "js/san-martin/03-ofertas.js",
        "js/san-martin/04-marcas.js",


        /* =================================================
           CATÁLOGO
        ================================================= */

        "js/san-martin/05-01-estado.js",
        "js/san-martin/05-02-referencias.js",
        "js/san-martin/05-03-utilidades.js",
        "js/san-martin/05-04-busqueda.js",
        "js/san-martin/05-05-filtros.js",
        "js/san-martin/05-06-precio.js",
        "js/san-martin/05-07-ordenamiento.js",
        "js/san-martin/05-08-productos.js",
        "js/san-martin/05-09-tarjeta-producto.js",
        "js/san-martin/05-10-paginacion.js",
        "js/san-martin/05-11-eventos.js",


        /* =================================================
           COMPONENTES
        ================================================= */

        "js/san-martin/componentes/favoritos.js",
        "js/san-martin/componentes/galeria-producto.js",
        "js/san-martin/componentes/whatsapp.js",
        "js/san-martin/componentes/navegacion.js",


        /* =================================================
           INVENTARIO
        ================================================= */

        "js/san-martin/01-inventario.js"

    ];


    /* =====================================================
       CARGAR MÓDULO
    ===================================================== */

    function cargarModulo(ruta) {

        return new Promise((resolve, reject) => {

            const script =
                document.createElement("script");

            script.src = ruta;

            script.onload = resolve;

            script.onerror = () => {

                reject(
                    new Error(
                        `No se pudo cargar el módulo: ${ruta}`
                    )
                );

            };

            document.head.appendChild(script);

        });

    }


    /* =====================================================
       CARGAR TODOS LOS MÓDULOS
    ===================================================== */

    async function cargarModulos() {

        try {

            for (const modulo of modulos) {

                await cargarModulo(modulo);

            }

            console.log(
                "✓ San Martín: sistema cargado correctamente"
            );

        } catch (error) {

            console.error(
                "✕ San Martín: error cargando el sistema",
                error
            );

        }

    }


    /* =====================================================
       INICIAR
    ===================================================== */

    cargarModulos();

})();