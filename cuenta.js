/* =====================================================
   SAN MARTÍN
   CARGADOR PRINCIPAL DE CUENTA Y AUTENTICACIÓN
===================================================== */

(function () {

    const scriptActual =
        document.currentScript;


    const rutaModulos =
        new URL(
            "js/cuenta/",
            scriptActual.src
        ).href;


    const modulos = [

        "00-configuracion-dom-cuenta.js",
        "01-vistas-favoritos-pedidos-cuenta.js",
        "02-autenticacion-perfil-cuenta.js",
        "03-direcciones-cuenta.js",
        "04-utilidades-pedidos-cuenta.js",
        "05-sesion-ventana-cuenta.js",
        "06-inicio-cuenta.js"

    ];


    function cargarModulo(nombre) {

        return new Promise((resolve, reject) => {

            const script =
                document.createElement("script");


            script.src =
                `${rutaModulos}${nombre}`;

            script.async = false;
            script.onload = resolve;


            script.onerror = () => {

                reject(
                    new Error(
                        `No se pudo cargar el módulo: ${nombre}`
                    )
                );

            };


            document.head.appendChild(script);

        });

    }


    async function cargarModulos() {

        try {

            for (const modulo of modulos) {

                await cargarModulo(modulo);

            }


            console.log(
                "✓ San Martín: cuenta de cliente cargada correctamente"
            );

        } catch (error) {

            console.error(
                "✕ San Martín: error cargando cuenta de cliente",
                error
            );

        }

    }


    cargarModulos();

})();