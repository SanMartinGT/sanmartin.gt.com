/* =====================================================
   MOSTRAR PRODUCTOS EN OFERTA
===================================================== */

function mostrarProductosEnOferta() {

    const contenedorOfertas =
        document.getElementById("offersProducts");

    const mensajeSinOfertas =
        document.getElementById("offersEmpty");

    // Si el HTML todavía no existe, no hacer nada
    if (!contenedorOfertas) return;

    // Limpiar contenido anterior
    contenedorOfertas.innerHTML = "";

    /*
       Buscar solamente productos que tengan
       una oferta mayor que 0
    */

    const productosEnOferta =
        productos.filter(producto => {

            return (
                producto.oferta &&
                Number(producto.oferta) > 0
            );

        });

    /*
       Si no hay productos en oferta
    */

    if (productosEnOferta.length === 0) {

        if (mensajeSinOfertas) {
            mensajeSinOfertas.style.display = "block";
        }

        return;

    }

    /*
       Ocultar mensaje de "no hay ofertas"
    */

    if (mensajeSinOfertas) {
        mensajeSinOfertas.style.display = "none";
    }


    /*
       Crear las tarjetas
    */

    productosEnOferta.forEach(producto => {

        const tarjeta =
            document.createElement("article");

        tarjeta.className =
            "product offer-product";


        /*
           Calcular descuento
        */

        const precioOriginal =
            Number(producto.precio);

        const porcentajeOferta =
            Number(producto.oferta);

        const precioOferta =
            precioOriginal -
            (
                precioOriginal *
                porcentajeOferta /
                100
            );


        /*
           Obtener inventario
        */

        const stockDisponible =
            inventario[
                String(producto.codigo)
            ] ?? 0;


        /*
           Estado del inventario
        */

        let textoStock = "";

        if (stockDisponible <= 0) {

            textoStock =
                "🔴 Agotado";

        }

        else if (stockDisponible <= 5) {

            textoStock =
                `🟡 Pocas unidades · ${stockDisponible} disponibles`;

        }

        else {

            textoStock =
                `🟢 Disponible · ${stockDisponible} unidades`;

        }


        /*
           Crear tarjeta
        */

        tarjeta.innerHTML = `

            <div class="product-image">

                ${
                    producto.imagen
                    ? `
                        <img
                            src="${producto.imagen}"
                            alt="${producto.nombre}"
                            loading="lazy"
                        >
                    `
                    : `
                        <span class="product-icon">
                            ${producto.icono || "📦"}
                        </span>
                    `
                }

                <span class="offer-badge">
                    🔥 -${porcentajeOferta}%
                </span>

            }


            <!-- ==========================================
                FAVORITO
            =========================================== -->

            <button
                type="button"
                class="btn-favorito-producto ${
                    productoEsFavorito(producto.codigo)
                        ? "activo"
                        : ""
                }"
                data-codigo="${producto.codigo}"
                aria-label="${
                    productoEsFavorito(producto.codigo)
                        ? "Quitar de favoritos"
                        : "Agregar a favoritos"
                }"
                title="${
                productoEsFavorito(producto.codigo)
                    ? "Quitar de favoritos"
                    : "Agregar a favoritos"
                }"
            >
                ${
                    productoEsFavorito(producto.codigo)
                        ? "♥"
                        : "♡"
                }
            </button>

        </div>


            <div class="product-info">

                <div class="product-category">
                    ${producto.categoria}
                </div>


                <h3 class="product-name">
                    ${producto.nombre}
                </h3>


                <div class="product-brand">
                    ${producto.marca || "San Martín"}
                </div>


                <p class="product-description">
                    ${producto.descripcion}
                </p>


                <div class="offer-price">

                    <span class="original-price">
                        Q${precioOriginal.toFixed(2)}
                    </span>

                    <strong class="discount-price">
                        Q${precioOferta.toFixed(2)}
                    </strong>

                </div>


                <div class="product-code">

                    Código:
                    ${producto.codigo || "No disponible"}

                </div>


                <div class="stock">

                    ${textoStock}

                </div>


                <button
                    class="product-whatsapp"
                    type="button"
                >

                    💬 Consultar por WhatsApp

                </button>

                <button
                    class="product-add-cart"
                    type="button"
                    data-codigo="${producto.codigo}"
                    ${stockDisponible <= 0 ? "disabled" : ""}
                >
                    🛒 Agregar al carrito
                </button>

            </div>

        `;


        /*
           Agregar tarjeta
        */

        contenedorOfertas.appendChild(
            tarjeta
        );

        /* =================================================
           ACTIVAR GALERÍA DE PRODUCTO
        ================================================= */

        activarVisorEnProducto(
            tarjeta,
            producto
        );


        /*
           Conectar WhatsApp
        */

        const botonWhatsApp =
            tarjeta.querySelector(
                ".product-whatsapp"
            );


        if (botonWhatsApp) {

            botonWhatsApp.addEventListener(
                "click",
                () => {

                    consultarWhatsApp(
                        producto
                    );

                }
            );

        }

    });

}