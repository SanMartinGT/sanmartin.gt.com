/* =====================================================
   SAN MARTÍN
   CATÁLOGO — 05-06 PRECIO
===================================================== */


/* =====================================================
   VALIDAR VALOR DE PRECIO
   -----------------------------------------------------
   Convierte el contenido del input en número válido.

   Devuelve:

   • número → si es válido
   • null   → si está vacío o no es válido
===================================================== */

function obtenerPrecioValido(valor) {

    if (
        valor === null ||
        valor === undefined ||
        String(valor).trim() === ""
    ) {

        return null;

    }


    const numero =
        Number(valor);


    if (
        !Number.isFinite(numero) ||
        numero < 0
    ) {

        return null;

    }


    return numero;

}


/* =====================================================
   MOSTRAR MENSAJE DE PRECIO
===================================================== */

function mostrarMensajePrecio() {

    if (!mensajePrecio) {
        return;
    }


    /* -------------------------------------------------
       Mínimo y máximo
    ------------------------------------------------- */

    if (
        precioMinimo !== null &&
        precioMaximo !== null
    ) {

        mensajePrecio.textContent =
            `Productos entre Q${precioMinimo.toFixed(2)} y Q${precioMaximo.toFixed(2)}`;

        return;

    }


    /* -------------------------------------------------
       Solo mínimo
    ------------------------------------------------- */

    if (
        precioMinimo !== null
    ) {

        mensajePrecio.textContent =
            `Productos desde Q${precioMinimo.toFixed(2)}`;

        return;

    }


    /* -------------------------------------------------
       Solo máximo
    ------------------------------------------------- */

    if (
        precioMaximo !== null
    ) {

        mensajePrecio.textContent =
            `Productos hasta Q${precioMaximo.toFixed(2)}`;

        return;

    }


    /* -------------------------------------------------
       Sin filtro
    ------------------------------------------------- */

    mensajePrecio.textContent = "";

}


/* =====================================================
   APLICAR FILTRO DE PRECIO
===================================================== */

function aplicarFiltroPrecio() {


    /* =================================================
       OBTENER VALORES
    ================================================= */

    const minimo =
        precioMinInput
            ? obtenerPrecioValido(
                precioMinInput.value
            )
            : null;


    const maximo =
        precioMaxInput
            ? obtenerPrecioValido(
                precioMaxInput.value
            )
            : null;


    /* =================================================
       DETECTAR VALORES INVÁLIDOS
       -------------------------------------------------
       Si el usuario escribió algo pero no pudo
       convertirse correctamente a número.
    ================================================= */

    const minimoEscrito =
        precioMinInput &&
        String(
            precioMinInput.value
        ).trim() !== "";


    const maximoEscrito =
        precioMaxInput &&
        String(
            precioMaxInput.value
        ).trim() !== "";


    if (
        (minimoEscrito && minimo === null)
        ||
        (maximoEscrito && maximo === null)
    ) {

        if (mensajePrecio) {

            mensajePrecio.textContent =
                "Ingresa valores de precio válidos.";

        }

        return;

    }


    /* =================================================
       VALIDAR RANGO
    ================================================= */

    if (
        minimo !== null &&
        maximo !== null &&
        minimo > maximo
    ) {

        if (mensajePrecio) {

            mensajePrecio.textContent =
                "El precio mínimo no puede ser mayor que el precio máximo.";

        }

        return;

    }


    /* =================================================
       GUARDAR ESTADO
    ================================================= */

    precioMinimo = minimo;

    precioMaximo = maximo;


    /* =================================================
       PRIMERA PÁGINA
    ================================================= */

    paginaActual = 1;


    /* =================================================
       ACTUALIZAR PRODUCTOS
    ================================================= */

    mostrarProductos();


    /* =================================================
       MENSAJE
    ================================================= */

    mostrarMensajePrecio();

}


/* =====================================================
   BOTÓN — APLICAR PRECIO
===================================================== */

if (aplicarPrecio) {

    aplicarPrecio.addEventListener(
        "click",
        function () {

            aplicarFiltroPrecio();

        }
    );

}


/* =====================================================
   BOTÓN — LIMPIAR PRECIO
===================================================== */

if (limpiarPrecio) {

    limpiarPrecio.addEventListener(
        "click",
        function () {


            /* -----------------------------------------
               Limpiar estado
            ----------------------------------------- */

            precioMinimo = null;

            precioMaximo = null;


            /* -----------------------------------------
               Limpiar inputs
            ----------------------------------------- */

            if (precioMinInput) {

                precioMinInput.value = "";

            }


            if (precioMaxInput) {

                precioMaxInput.value = "";

            }


            /* -----------------------------------------
               Limpiar mensaje
            ----------------------------------------- */

            if (mensajePrecio) {

                mensajePrecio.textContent = "";

            }


            /* -----------------------------------------
               Primera página
            ----------------------------------------- */

            paginaActual = 1;


            /* -----------------------------------------
               Actualizar productos
            ----------------------------------------- */

            mostrarProductos();

        }
    );

}


/* =====================================================
   ENTER EN PRECIO MÍNIMO
===================================================== */

if (precioMinInput) {

    precioMinInput.addEventListener(
        "keydown",
        function (evento) {

            if (
                evento.key !== "Enter"
            ) {
                return;
            }


            evento.preventDefault();


            if (aplicarPrecio) {

                aplicarPrecio.click();

            }


            this.blur();

        }
    );

}


/* =====================================================
   ENTER EN PRECIO MÁXIMO
===================================================== */

if (precioMaxInput) {

    precioMaxInput.addEventListener(
        "keydown",
        function (evento) {

            if (
                evento.key !== "Enter"
            ) {
                return;
            }


            evento.preventDefault();


            if (aplicarPrecio) {

                aplicarPrecio.click();

            }


            this.blur();

        }
    );

}