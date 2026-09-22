/* =====================================================
   SAN MARTÍN
   CATÁLOGO — 05-04 BÚSQUEDA
   -----------------------------------------------------
   RESPONSABILIDAD:

   - Búsqueda inteligente
   - Uso del buscador global #search
   - Compatibilidad con CATÁLOGO y OFERTAS
   - Scroll automático según la vista activa
   - Reinicio de búsqueda
   - Compatibilidad con Enter
===================================================== */


/* =====================================================
   ESTADO DEL SCROLL DE BÚSQUEDA
===================================================== */

let busquedaYaDesplazoCatalogo = false;


/* =====================================================
   BÚSQUEDA INTELIGENTE
   -----------------------------------------------------
   Permite buscar por:

   - Nombre
   - Marca
   - Código
   - Categoría

   Todas las palabras introducidas deben coincidir.
===================================================== */

function coincideBusquedaInteligente(
    producto,
    busqueda
) {

    const textoBusqueda =
        normalizarTexto(
            busqueda
        );


    /* -------------------------------------------------
       Sin búsqueda = todos coinciden
    ------------------------------------------------- */

    if (!textoBusqueda) {

        return true;

    }


    /* -------------------------------------------------
       Información disponible del producto
    ------------------------------------------------- */

    const textoProducto =
        normalizarTexto(`
            ${producto.nombre || ""}
            ${producto.marca || ""}
            ${producto.codigo || ""}
            ${producto.categoria || ""}
        `);


    /* -------------------------------------------------
       Separar búsqueda por palabras
    ------------------------------------------------- */

    const palabras =
        textoBusqueda
            .split(" ")
            .filter(Boolean);


    /* -------------------------------------------------
       Todas las palabras deben coincidir
    ------------------------------------------------- */

    return palabras.every(
        function (palabra) {

            return textoProducto.includes(
                palabra
            );

        }
    );

}


/* =====================================================
   OBTENER VISTA ACTUAL
===================================================== */

function obtenerVistaBusqueda() {

    if (
        window.vistaActual ===
        "ofertas"
    ) {

        return "ofertas";

    }

    return "catalogo";

}


/* =====================================================
   OBTENER DESTINO DEL SCROLL
   -----------------------------------------------------
   CATÁLOGO:
   .price-filter

   OFERTAS:
   #offersProducts

   Si el contenedor de productos no existe,
   utilizamos la sección correspondiente.
===================================================== */

function obtenerDestinoBusqueda() {

    const vista =
        obtenerVistaBusqueda();


    /* =================================================
       VISTA OFERTAS
    ================================================= */

    if (
        vista === "ofertas"
    ) {

        const productosOfertas =
            document.getElementById(
                "offersProducts"
            );


        if (productosOfertas) {

            return productosOfertas;

        }


        const paginaOfertas =
            document.getElementById(
                "ofertas"
            );


        if (paginaOfertas) {

            return paginaOfertas;

        }


        return null;

    }


    /* =================================================
       VISTA CATÁLOGO
    ================================================= */

    const filtroPrecio =
        document.querySelector(
            ".price-filter"
        );


    if (filtroPrecio) {

        return filtroPrecio;

    }


    const catalogo =
        document.getElementById(
            "catalogo"
        );


    if (catalogo) {

        return catalogo;

    }


    return null;

}


/* =====================================================
   DESPLAZAR A LA VISTA ACTIVA
   -----------------------------------------------------
   Tiene en cuenta el header fijo.
===================================================== */

function desplazarAlResultadoBusqueda() {

    const destino =
        obtenerDestinoBusqueda();


    if (!destino) {

        return;

    }


    requestAnimationFrame(
        function () {

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
                destino.getBoundingClientRect().top
                +
                window.scrollY
                -
                alturaHeader
                -
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
    );

}


/* =====================================================
   COMPATIBILIDAD
   -----------------------------------------------------
   Conservamos el nombre anterior para que cualquier
   otro módulo que utilice desplazarAlCatalogo()
   siga funcionando.
===================================================== */

function desplazarAlCatalogo() {

    desplazarAlResultadoBusqueda();

}


/* =====================================================
   INICIAR SCROLL DE UNA NUEVA BÚSQUEDA
   -----------------------------------------------------
   Solo realiza el desplazamiento una vez por búsqueda.
===================================================== */

function iniciarScrollBusqueda() {

    if (
        busquedaYaDesplazoCatalogo
    ) {

        return;

    }


    busquedaYaDesplazoCatalogo =
        true;


    desplazarAlResultadoBusqueda();

}


/* =====================================================
   REINICIAR ESTADO DE BÚSQUEDA
===================================================== */

function reiniciarEstadoBusqueda() {

    busquedaYaDesplazoCatalogo =
        false;

}


/* =====================================================
   CAMBIO DE VISTA
   -----------------------------------------------------
   Cuando pasamos de Catálogo a Ofertas o viceversa,
   permitimos que la siguiente búsqueda vuelva a
   realizar su desplazamiento.
===================================================== */

window.addEventListener(
    "sanMartinVistaCambiada",
    function () {

        reiniciarEstadoBusqueda();

    }
);


/* =====================================================
   EVENTOS DEL BUSCADOR
===================================================== */

if (buscador) {


    /* =================================================
       EVENTO — ESCRIBIR
       -------------------------------------------------
       La búsqueda se actualiza inmediatamente.
    ================================================= */

    buscador.addEventListener(
        "input",
        function () {

            const textoBusqueda =
                buscador.value.trim();


            /* -----------------------------------------
               Notificar búsqueda al sistema
            ----------------------------------------- */

            if (
                typeof notificarBusquedaSanMartin ===
                "function"
            ) {

                notificarBusquedaSanMartin(
                    textoBusqueda
                );

            }


            /* -----------------------------------------
               Búsqueda vacía
            ----------------------------------------- */

            if (!textoBusqueda) {

                reiniciarEstadoBusqueda();

                paginaActual =
                    1;

                mostrarProductos();

                return;

            }


            /* -----------------------------------------
               Nueva búsqueda
            ----------------------------------------- */

            paginaActual =
                1;


            /* -----------------------------------------
               Actualizar resultados
            ----------------------------------------- */

            mostrarProductos();


            /* -----------------------------------------
               Primer desplazamiento
            ----------------------------------------- */

            iniciarScrollBusqueda();

        }
    );


    /* =================================================
       EVENTO — ENTER
    ================================================= */

    buscador.addEventListener(
        "keydown",
        function (evento) {

            if (
                evento.key !== "Enter"
            ) {

                return;

            }


            /* -----------------------------------------
               Evitar comportamiento predeterminado
            ----------------------------------------- */

            evento.preventDefault();


            /* -----------------------------------------
               Obtener búsqueda
            ----------------------------------------- */

            const textoBusqueda =
                buscador.value.trim();


            /* -----------------------------------------
               Si está vacío, no hacemos scroll
            ----------------------------------------- */

            if (!textoBusqueda) {

                reiniciarEstadoBusqueda();

                paginaActual =
                    1;

                mostrarProductos();

                buscador.blur();

                return;

            }


            /* -----------------------------------------
               Primera página
            ----------------------------------------- */

            paginaActual =
                1;


            /* -----------------------------------------
               Actualizar productos
            ----------------------------------------- */

            mostrarProductos();


            /* -----------------------------------------
               Marcar scroll realizado
            ----------------------------------------- */

            busquedaYaDesplazoCatalogo =
                true;


            /* -----------------------------------------
               Desplazar al contenido correspondiente
            ----------------------------------------- */

            requestAnimationFrame(
                function () {

                    desplazarAlResultadoBusqueda();

                }
            );


            /* -----------------------------------------
               Quitar foco del buscador
            ----------------------------------------- */

            buscador.blur();

        }
    );

}


/* =====================================================
   FUNCIONES PÚBLICAS
   -----------------------------------------------------
   Disponibles para otros módulos.
===================================================== */

window.coincideBusquedaInteligente =
    coincideBusquedaInteligente;

window.desplazarAlCatalogo =
    desplazarAlCatalogo;

window.desplazarAlResultadoBusqueda =
    desplazarAlResultadoBusqueda;

window.reiniciarEstadoBusqueda =
    reiniciarEstadoBusqueda;