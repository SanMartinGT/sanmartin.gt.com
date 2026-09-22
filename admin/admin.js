/* =====================================================
   SAN MARTÍN
   CARGADOR PRINCIPAL DEL PANEL DE ADMINISTRACIÓN
===================================================== */

(function () {

    const modulos = [

        /* =================================================
           BASE
        ================================================= */

        "../admin/00-configuracion.js",
        "../admin/01-pedidos-estado.js",
        "../admin/02-elementos-dom.js",


        /* =================================================
           CATÁLOGO E INVENTARIO
        ================================================= */

        "../admin/03-autenticacion-inventario.js",
        "../admin/04-utilidades.js",


        /* =================================================
           PEDIDOS Y SESIÓN
        ================================================= */

        "../admin/05-pedidos.js",
        "../admin/06-sesion.js",
        "../admin/07-inicio.js"

    ];


    /* =====================================================
       CARGAR UN MÓDULO
    ===================================================== */

    function cargarModulo(ruta) {

        return new Promise((resolve, reject) => {

            const script =
                document.createElement("script");


            script.src = ruta;
            script.async = false;


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
       CARGAR TODOS LOS MÓDULOS EN ORDEN
    ===================================================== */

    async function cargarModulos() {

        try {

            for (const modulo of modulos) {

                await cargarModulo(modulo);

            }


            console.log(
                "✓ San Martín: panel administrativo cargado correctamente"
            );

        } catch (error) {

            console.error(
                "✕ San Martín: error cargando el panel administrativo",
                error
            );


            const mensaje =
                document.getElementById(
                    "loginMessage"
                );


            if (mensaje) {

                mensaje.textContent =
                    "No se pudo cargar el panel. Revisa los archivos JavaScript.";

            }

        }

    }


    cargarModulos();

})();