/* =====================================================
   SAN MARTÍN
   CATÁLOGO — 05-04 BÚSQUEDA
===================================================== */

let busquedaYaDesplazoCatalogo = false;

function coincideBusquedaInteligente(
    producto,
    busqueda
) {

    const textoBusqueda =
        normalizarTexto(busqueda);


    /* -------------------------------------------------
       Si no existe búsqueda, todos los productos
       coinciden.
    ------------------------------------------------- */

    if (!textoBusqueda) {

        return true;

    }


    /* -------------------------------------------------
       Construimos todo el texto disponible
       del producto.
    ------------------------------------------------- */

    const textoProducto =
        normalizarTexto(`
            ${producto.nombre || ""}
            ${producto.marca || ""}
            ${producto.codigo || ""}
            ${producto.categoria || ""}
        `);


    /* -------------------------------------------------
       Separamos la búsqueda en palabras.
    ------------------------------------------------- */

    const palabras =
        textoBusqueda
            .split(" ")
            .filter(Boolean);


    /* -------------------------------------------------
       Todas las palabras deben aparecer dentro
       de la información del producto.
    ------------------------------------------------- */

    return palabras.every(
        palabra =>
            textoProducto.includes(palabra)
    );

}

/* =====================================================
   SCROLL AL FILTRO DE PRECIO
   -----------------------------------------------------
   Desplaza al usuario directamente hasta el apartado
   "Filtrar por precio".

   No utiliza #catalogo como destino porque queremos
   que el usuario llegue directamente a los filtros.
===================================================== */

function desplazarAlCatalogo() {

    const destino =
        document.querySelector(
            ".price-filter"
        );


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


            const posicion =
                destino.getBoundingClientRect().top
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
    );

}

/* =====================================================
   INICIO DE UNA NUEVA BÚSQUEDA
   -----------------------------------------------------
   Determina si debemos realizar el primer scroll.

   El scroll solamente se realiza cuando:

   • La búsqueda deja de estar vacía.
   • Todavía no se ha desplazado el catálogo.

   Después del primer desplazamiento se marca:

   busquedaYaDesplazoCatalogo = true;
===================================================== */

function iniciarScrollBusqueda() {

    if (
        busquedaYaDesplazoCatalogo
    ) {

        return;

    }


    busquedaYaDesplazoCatalogo =
        true;


    desplazarAlCatalogo();

}


/* =====================================================
   EVENTOS DEL BUSCADOR
===================================================== */

if (buscador) {


    /* =================================================
       EVENTO — ESCRIBIR EN EL BUSCADOR
       -------------------------------------------------
       La búsqueda se actualiza inmediatamente mientras
       el usuario escribe.

       El catálogo solamente hace scroll una vez:
       al comenzar la búsqueda.
    ================================================= */

    buscador.addEventListener(
        "input",
        function () {

            const textoBusqueda =
                buscador.value.trim();


            /* -----------------------------------------
               Si el usuario borró completamente
               la búsqueda, preparamos el sistema
               para una nueva búsqueda.
            ----------------------------------------- */

            if (!textoBusqueda) {

                busquedaYaDesplazoCatalogo =
                    false;

                paginaActual = 1;

                mostrarProductos();

                return;

            }


            /* -----------------------------------------
               Actualizar resultados.
            ----------------------------------------- */

            paginaActual = 1;

            mostrarProductos();


            /* -----------------------------------------
               Primera letra / primer contenido:
               realizar un único desplazamiento.
            ----------------------------------------- */

            iniciarScrollBusqueda();

        }
    );


    /* =================================================
       EVENTO — ENTER EN EL BUSCADOR
       -------------------------------------------------
       Enter funciona como confirmación explícita
       de la búsqueda.

       • Primera página
       • Actualiza productos
       • Desplaza al catálogo
       • Cierra teclado en móviles
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
               Evitar envío/comportamiento predeterminado.
            ----------------------------------------- */

            evento.preventDefault();


            /* -----------------------------------------
               Primera página.
            ----------------------------------------- */

            paginaActual = 1;


            /* -----------------------------------------
               Actualizar productos.
            ----------------------------------------- */

            mostrarProductos();


            /* -----------------------------------------
               Marcar que el catálogo ya recibió
               el desplazamiento.
            ----------------------------------------- */

            busquedaYaDesplazoCatalogo =
                true;


            /* -----------------------------------------
               Desplazar después de actualizar el DOM.
            ----------------------------------------- */

            desplazarAlCatalogo();


            /* -----------------------------------------
               Quitar el foco del buscador.

               Esto es especialmente importante en
               teléfonos para permitir que el teclado
               virtual desaparezca después de Enter.
            ----------------------------------------- */

            buscador.blur();

        }
    );

}