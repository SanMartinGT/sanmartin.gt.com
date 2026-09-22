/* =====================================================
   SAN MARTÍN
   CATÁLOGO — TARJETA DE PRODUCTO
   -----------------------------------------------------
   RESPONSABILIDAD:

   - Crear tarjeta de producto
   - Catálogo normal
   - Tarjetas de Ofertas
   - Precio original
   - Precio con descuento
   - Favoritos
   - Carrito
   - WhatsApp
   - Visor / galería
===================================================== */


/* =====================================================
   CREAR TARJETA DE PRODUCTO
   -----------------------------------------------------
   opciones.modo:

   • catalogo
   • ofertas
   • oferta
===================================================== */

function crearTarjetaProducto(
    producto,
    opciones = {}
) {

    /* =================================================
       VALIDACIÓN
    ================================================= */

    if (!producto) {

        return null;

    }


    /* =================================================
       DETERMINAR MODO
    ================================================= */

    const modo =
        opciones.modo ||
        (
            window.vistaActual ===
            "ofertas"
                ? "ofertas"
                : "catalogo"
        );


    const esOferta =
        modo === "ofertas" ||
        modo === "oferta";


    /* =================================================
       DATOS DEL PRODUCTO
    ================================================= */

    const codigo =
        String(
            producto.codigo ||
            ""
        ).trim();


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


    /* =================================================
       PRECIO ORIGINAL
    ================================================= */

    const precioOriginal =
        Number(
            producto.precio
        );


    const precioOriginalValido =
        Number.isFinite(
            precioOriginal
        ) &&
        precioOriginal >= 0;


    const precioOriginalMostrar =
        precioOriginalValido
            ? precioOriginal.toFixed(2)
            : "0.00";


    /* =================================================
       DESCUENTO
    ================================================= */

    let porcentajeOferta =
        Number(
            producto.oferta
        );


    if (
        !Number.isFinite(
            porcentajeOferta
        ) ||
        porcentajeOferta <= 0
    ) {

        porcentajeOferta = 0;

    }


    porcentajeOferta =
        Math.min(
            100,
            Math.max(
                0,
                porcentajeOferta
            )
        );


    /* =================================================
       PRECIO FINAL
       -------------------------------------------------
       En Ofertas utiliza el sistema centralizado.

       En Catálogo conserva el precio normal.
    ================================================= */

    let precioVenta =
        precioOriginalValido
            ? precioOriginal
            : 0;


    if (
        esOferta &&
        typeof window.obtenerPrecioVenta ===
        "function"
    ) {

        precioVenta =
            Number(
                window.obtenerPrecioVenta(
                    producto,
                    {
                        modo: "ofertas"
                    }
                )
            ) || 0;

    }

    else if (
        esOferta &&
        porcentajeOferta > 0
    ) {

        precioVenta =
            Math.max(
                0,
                precioOriginal -
                (
                    precioOriginal *
                    porcentajeOferta /
                    100
                )
            );

    }


    const precioVentaMostrar =
        precioVenta.toFixed(2);


    /* =================================================
       ¿MOSTRAR OFERTA?
       -------------------------------------------------
       Solamente mostramos el bloque de descuento
       cuando realmente estamos dentro de la vista
       de Ofertas y existe un descuento válido.
    ================================================= */

    const mostrarOferta =
        esOferta &&
        porcentajeOferta > 0;


    /* =================================================
       BLOQUE DE PRECIO
    ================================================= */

    let bloquePrecio = "";


    if (mostrarOferta) {

        bloquePrecio = `

            <div class="product-price product-price-offer">

                <span
                    class="product-price-original"
                    aria-label="Precio original"
                >
                    Q${precioOriginalMostrar}
                </span>


                <span
                    class="product-price-final"
                    aria-label="Precio de oferta"
                >
                    Q${precioVentaMostrar}
                </span>

            </div>

        `;

    }

    else {

        bloquePrecio = `

            <div class="product-price">

                Q${precioVentaMostrar}

            </div>

        `;

    }


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

    }

    else {

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
       BADGE DE OFERTA
       -------------------------------------------------
       Se coloca sobre la imagen.
    ================================================= */

    const badgeOferta =
        mostrarOferta
            ? `

                <span class="product-offer-badge" aria-label="${porcentajeOferta}% de descuento">
                    🔥 ${porcentajeOferta}% OFF
                </span>

              `
            : "";


    /* =================================================
       STOCK
    ================================================= */

    let stockDisponible = 0;


    if (
        typeof inventario !==
        "undefined" &&
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


    if (
        stockDisponible <= 0
    ) {

        estadoStock = `

            <span class="stock stock-agotado">
                🔴 Agotado
            </span>

        `;

    }

    else if (
        stockDisponible <= 5
    ) {

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

       El sistema de favoritos utiliza:

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
       CLASE ADICIONAL PARA OFERTAS
       -------------------------------------------------
       Permite distinguir visualmente una tarjeta de
       oferta sin crear otro componente.
    ================================================= */

    if (esOferta) {

        tarjeta.classList.add(
            "product-en-oferta"
        );

    }


    /* =================================================
       IDENTIFICACIÓN
    ================================================= */

    tarjeta.dataset.codigo =
        codigo;


    if (mostrarOferta) {

        tarjeta.dataset.oferta =
            porcentajeOferta;

        tarjeta.dataset.precioOriginal =
            precioOriginal;

        tarjeta.dataset.precioOferta =
            precioVenta;

    }


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
                 BADGE OFERTA
            ========================================== -->

            ${badgeOferta}


            <!-- =========================================
                 FAVORITOS
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

            ${bloquePrecio}


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
    ===================================================== */

    const botonFavorito =
        tarjeta.querySelector(
            ".btn-favorito-producto"
        );


    if (botonFavorito) {

        botonFavorito.addEventListener(
            "click",
            async function (evento) {

                evento.preventDefault();

                evento.stopPropagation();


                if (
                    typeof cambiarFavorito !==
                    "function"
                ) {

                    console.error(
                        "No se encontró la función cambiarFavorito()."
                    );

                    return;

                }


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
       NO agregamos listener aquí.

       carrito.js controla:

       .product-add-cart
       data-codigo
    ===================================================== */


    /* =====================================================
       RETORNAR TARJETA
    ===================================================== */

    return tarjeta;

}


/* =====================================================
   FUNCIÓN PÚBLICA
===================================================== */

window.crearTarjetaProducto =
    crearTarjetaProducto;