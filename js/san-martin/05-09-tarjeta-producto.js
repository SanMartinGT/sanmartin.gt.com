/* =====================================================
   SAN MARTÍN
   CATÁLOGO — TARJETA DE PRODUCTO
   FAVORITOS + CARRITO + WHATSAPP + VISOR
===================================================== */


/* =====================================================
   CREAR TARJETA DE PRODUCTO
===================================================== */

function crearTarjetaProducto(producto) {

    /* =================================================
       VALIDACIÓN
    ================================================= */

    if (!producto) {
        return null;
    }


    /* =================================================
       DATOS DEL PRODUCTO
    ================================================= */

    const codigo =
        String(producto.codigo || "").trim();

    const nombre =
        producto.nombre ||
        "Producto sin nombre";

    const marca =
        producto.marca ||
        "";

    const categoria =
        producto.categoria ||
        "";

    const descripcion =
        producto.descripcion ||
        "";

    const precio =
        Number(producto.precio);

    const precioMostrar =
        Number.isFinite(precio)
            ? precio.toFixed(2)
            : "0.00";


    /* =================================================
       IMAGEN
    ================================================= */

    const imagen =
        producto.imagen ||
        producto.imagenUrl ||
        producto.image ||
        "";

    let contenidoImagen = "";


    if (imagen) {

        contenidoImagen = `

            <img
                src="${imagen}"
                alt="${nombre}"
                loading="lazy"
            >

        `;

    } else {

        contenidoImagen = `

            <div
                class="product-image-placeholder"
                aria-label="Sin imagen disponible"
            >
                🛍️
            </div>

        `;

    }


    /* =================================================
       STOCK
    ================================================= */

    let stockDisponible = 0;


    if (
        typeof inventario !== "undefined" &&
        inventario
    ) {

        stockDisponible =
            Number(
                inventario[codigo]
            ) || 0;

    }


    /* =================================================
       ESTADO DEL STOCK
    ================================================= */

    let estadoStock = "";


    if (stockDisponible <= 0) {

        estadoStock = `

            <span class="stock stock-agotado">
                🔴 Agotado
            </span>

        `;

    }

    else if (stockDisponible <= 5) {

        estadoStock = `

            <span class="stock stock-pocas">
                🟡 Pocas unidades ·
                ${stockDisponible}
                disponibles
            </span>

        `;

    }

    else {

        estadoStock = `

            <span class="stock stock-disponible">
                🟢 Disponible ·
                ${stockDisponible}
                unidades
            </span>

        `;

    }


    /* =================================================
       FAVORITO ACTUAL
    ================================================= */

    let esFavorito = false;


    if (
        typeof productoEsFavorito ===
        "function"
    ) {

        esFavorito =
            productoEsFavorito(
                codigo
            );

    }


    /*
       IMPORTANTE:

       El sistema de favoritos utiliza la clase:

       .activo

       No .active
    */

    const claseFavorito =
        esFavorito
            ? "activo"
            : "";


    const etiquetaFavorito =
        esFavorito
            ? "Quitar de favoritos"
            : "Agregar a favoritos";


    const iconoFavorito =
        esFavorito
            ? "♥"
            : "♡";


    /* =================================================
       CREAR ARTICLE
    ================================================= */

    const tarjeta =
        document.createElement(
            "article"
        );


    tarjeta.className =
        "product";


    /* =================================================
       IDENTIFICACIÓN DEL PRODUCTO
    ================================================= */

    tarjeta.dataset.codigo =
        codigo;


    /* =================================================
       HTML DE LA TARJETA
    ================================================= */

    tarjeta.innerHTML = `

        <div class="product-image">


            <!-- =========================================
                 IMAGEN
            ========================================== -->

            ${contenidoImagen}


            <!-- =========================================
                 FAVORITOS

                 IMPORTANTE:
                 data-codigo es obligatorio.

                 El archivo favoritos.js utiliza:

                 boton.dataset.codigo
            ========================================== -->

            <button
                type="button"
                class="btn-favorito-producto ${claseFavorito}"
                data-codigo="${codigo}"
                aria-label="${etiquetaFavorito}"
                title="${etiquetaFavorito}"
            >
                ${iconoFavorito}
            </button>


        </div>


        <div class="product-info">


            <!-- =========================================
                 CATEGORÍA
            ========================================== -->

            ${
                categoria
                    ? `
                        <span class="product-category">
                            ${categoria}
                        </span>
                      `
                    : ""
            }


            <!-- =========================================
                 NOMBRE
            ========================================== -->

            <h3 class="product-name">
                ${nombre}
            </h3>


            <!-- =========================================
                 MARCA
            ========================================== -->

            ${
                marca
                    ? `
                        <p class="product-brand">
                            ${marca}
                        </p>
                      `
                    : ""
            }


            <!-- =========================================
                 DESCRIPCIÓN
            ========================================== -->

            ${
                descripcion
                    ? `
                        <p class="product-description">
                            ${descripcion}
                        </p>
                      `
                    : ""
            }


            <!-- =========================================
                 PRECIO
            ========================================== -->

            <div class="product-price">

                Q${precioMostrar}

            </div>


            <!-- =========================================
                 CÓDIGO
            ========================================== -->

            ${
                codigo
                    ? `
                        <div class="product-code">
                            Código: ${codigo}
                        </div>
                      `
                    : ""
            }


            <!-- =========================================
                 STOCK
            ========================================== -->

            <div class="product-stock">

                ${estadoStock}

            </div>


            <!-- =========================================
                 ACCIONES
            ========================================== -->

            <div class="product-actions">


                <!-- =====================================
                     WHATSAPP
                ====================================== -->

                <button
                    type="button"
                    class="btn-whatsapp-producto"
                    aria-label="Consultar ${nombre} por WhatsApp"
                >
                    Consultar
                </button>


                <!-- =====================================
                     CARRITO

                     carrito.js detecta:

                     .product-add-cart

                     y:

                     data-codigo
                ====================================== -->

                <button
                    type="button"
                    class="product-add-cart"
                    data-codigo="${codigo}"
                    aria-label="Agregar ${nombre} al carrito"
                    ${
                        stockDisponible <= 0
                            ? "disabled"
                            : ""
                    }
                >
                    🛒 Agregar
                </button>


            </div>


        </div>

    `;


    /* =====================================================
       BOTÓN FAVORITOS
       -----------------------------------------------------
       AQUÍ SE CONECTA EL CORAZÓN
    ===================================================== */

    const botonFavorito =
        tarjeta.querySelector(
            ".btn-favorito-producto"
        );


    if (botonFavorito) {

        botonFavorito.addEventListener(
            "click",
            async function (evento) {

                /* =========================================
                   EVITAR QUE EL CLICK SE PROPAGUE
                ========================================== */

                evento.preventDefault();

                evento.stopPropagation();


                /* =========================================
                   COMPROBAR FUNCIÓN DE FAVORITOS
                ========================================== */

                if (
                    typeof cambiarFavorito !==
                    "function"
                ) {

                    console.error(
                        "No se encontró la función cambiarFavorito()."
                    );

                    return;
                }


                /* =========================================
                   ENVIAR PRODUCTO + BOTÓN
                ========================================== */

                await cambiarFavorito(
                    producto,
                    botonFavorito
                );

            }
        );

    }


    /* =====================================================
       VISOR / GALERÍA
    ===================================================== */

    if (
        typeof activarVisorEnProducto ===
        "function"
    ) {

        activarVisorEnProducto(
            tarjeta,
            producto
        );

    }


    /* =====================================================
       BOTÓN WHATSAPP
    ===================================================== */

    const botonWhatsApp =
        tarjeta.querySelector(
            ".btn-whatsapp-producto"
        );


    if (
        botonWhatsApp &&
        typeof consultarWhatsApp ===
        "function"
    ) {

        botonWhatsApp.addEventListener(
            "click",
            function (evento) {

                evento.preventDefault();

                evento.stopPropagation();


                consultarWhatsApp(
                    producto
                );

            }
        );

    }


    /* =====================================================
       CARRITO
       -----------------------------------------------------
       NO agregamos aquí otro listener.

       carrito.js ya controla:

       .product-add-cart
       data-codigo

       Así evitamos agregar el producto dos veces.
    ===================================================== */


    /* =====================================================
       RETORNAR TARJETA
    ===================================================== */

    return tarjeta;

}