/* =====================================================
   SAN MARTÍN
   CARGA DE MÓDULOS
===================================================== */

(function () {

    const modulos = [
        "js/san-martin/02-inicio.js",
        "js/san-martin/03-ofertas.js",
        "js/san-martin/04-marcas.js",
        "js/san-martin/05-catalogo.js",
        "js/san-martin/componentes/favoritos.js",
        "js/san-martin/componentes/galeria-producto.js",
        "js/san-martin/componentes/whatsapp.js",
        "js/san-martin/componentes/navegacion.js",
        "js/san-martin/01-inventario.js"
    ];

    function cargarModulo(ruta) {

        return new Promise((resolve, reject) => {

            const script = document.createElement("script");

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

    async function cargarModulos() {

        try {

            for (const modulo of modulos) {
                await cargarModulo(modulo);
            }

            console.log(
                "✓ San Martín: módulos cargados correctamente"
            );

        } catch (error) {

            console.error(
                "✕ San Martín: error cargando módulos",
                error
            );

        }

    }

    cargarModulos();

})();