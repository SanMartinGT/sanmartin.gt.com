/* =====================================================
   SAN MARTÍN
   CARRITO Y CHECKOUT
   -----------------------------------------------------
   RESPONSABILIDAD:

   - Carrito de compras
   - Precios normales
   - Precios de oferta
   - Precio realmente cobrado
   - Descuentos
   - Persistencia en localStorage
   - Control de stock
   - Checkout
   - Pedidos
   - Direcciones
===================================================== */


/* =====================================================
   CONFIGURACIÓN
===================================================== */

const CLAVE_CARRITO =
    "sanmartin_carrito_v1";

const COSTO_ENVIO =
    0;


/* =====================================================
   ESTADO
===================================================== */

let carrito =
    leerCarrito();

let direccionesCheckout =
    [];

let pedidoEnProceso =
    false;


/* =====================================================
   REFERENCIAS DOM
===================================================== */

const btnAbrirCarrito =
    document.getElementById(
        "btnAbrirCarrito"
    );

const btnCerrarCarrito =
    document.getElementById(
        "btnCerrarCarrito"
    );

const carritoPanel =
    document.getElementById(
        "carritoPanel"
    );

const carritoCantidad =
    document.getElementById(
        "carritoCantidad"
    );

const carritoItems =
    document.getElementById(
        "carritoItems"
    );

const carritoVacio =
    document.getElementById(
        "carritoVacio"
    );

const carritoContenido =
    document.getElementById(
        "carritoContenido"
    );

const carritoSubtotal =
    document.getElementById(
        "carritoSubtotal"
    );

const carritoEnvio =
    document.getElementById(
        "carritoEnvio"
    );

const carritoTotal =
    document.getElementById(
        "carritoTotal"
    );

const btnVaciarCarrito =
    document.getElementById(
        "btnVaciarCarrito"
    );

const checkoutForm =
    document.getElementById(
        "checkoutForm"
    );

const checkoutDireccion =
    document.getElementById(
        "checkoutDireccion"
    );

const checkoutMensaje =
    document.getElementById(
        "checkoutMensaje"
    );

const btnRealizarPedido =
    document.getElementById(
        "btnRealizarPedido"
    );


/* =====================================================
   LEER CARRITO
   -----------------------------------------------------
   Recupera el carrito desde localStorage.

   Mantiene compatibilidad con carritos anteriores
   que todavía no tenían precioOferta.
===================================================== */

function leerCarrito() {

    try {

        const datos =
            JSON.parse(
                localStorage.getItem(
                    CLAVE_CARRITO
                )
            );


        if (
            !Array.isArray(datos)
        ) {

            return [];

        }


        return datos

            .filter(
                function (item) {

                    return (
                        item &&
                        item.codigo != null &&
                        Number(item.cantidad) > 0 &&
                        Number(item.precio) >= 0
                    );

                }
            )

            .map(
                function (item) {

                    const precio =
                        Number(
                            item.precio
                        );


                    const precioOriginal =
                        Number(
                            item.precioOriginal
                        );


                    const precioOferta =
                        Number(
                            item.precioOferta
                        );


                    const oferta =
                        Number(
                            item.oferta
                        );


                    const precioNormalFinal =
                        Number.isFinite(
                            precioOriginal
                        ) &&
                        precioOriginal >= 0

                            ? Number(
                                precioOriginal.toFixed(2)
                            )

                            : Number(
                                precio.toFixed(2)
                            );


                    const precioOfertaFinal =
                        Number.isFinite(
                            precioOferta
                        ) &&
                        precioOferta > 0 &&
                        precioOferta <
                            precioNormalFinal

                            ? Number(
                                precioOferta.toFixed(2)
                            )

                            : 0;


                    const ofertaFinal =
                        Number.isFinite(
                            oferta
                        ) &&
                        oferta > 0

                            ? Math.min(
                                100,
                                Math.max(
                                    0,
                                    oferta
                                )
                            )

                            : 0;


                    const precioAplicado =
                        Number(
                            precio.toFixed(2)
                        );


                    const descuentoUnitario =
                        Math.max(
                            0,
                            Number(
                                (
                                    precioNormalFinal -
                                    precioAplicado
                                ).toFixed(2)
                            )
                        );


                    return {

                        codigo:
                            String(
                                item.codigo
                            ),

                        nombre:
                            String(
                                item.nombre ||
                                "Producto"
                            ),

                        marca:
                            String(
                                item.marca ||
                                "San Martín"
                            ),

                        imagen:
                            String(
                                item.imagen ||
                                ""
                            ),

                        /* ---------------------------------
                           PRECIO NORMAL
                        --------------------------------- */

                        precioOriginal:
                            precioNormalFinal,


                        /* ---------------------------------
                           PRECIO DE OFERTA
                        --------------------------------- */

                        precioOferta:
                            precioOfertaFinal,


                        /* ---------------------------------
                           PORCENTAJE DE OFERTA
                        --------------------------------- */

                        oferta:
                            ofertaFinal,


                        /* ---------------------------------
                           PRECIO REALMENTE COBRADO
                        --------------------------------- */

                        precio:
                            precioAplicado,


                        /* ---------------------------------
                           DESCUENTO POR UNIDAD
                        --------------------------------- */

                        descuentoUnitario:
                            descuentoUnitario,


                        /* ---------------------------------
                           DESCUENTO TOTAL
                        --------------------------------- */

                        descuentoTotal:
                            Number(
                                (
                                    descuentoUnitario *
                                    Math.max(
                                        1,
                                        Math.floor(
                                            Number(
                                                item.cantidad
                                            )
                                        )
                                    )
                                ).toFixed(2)
                            ),


                        cantidad:
                            Math.max(
                                1,
                                Math.floor(
                                    Number(
                                        item.cantidad
                                    )
                                )
                            )

                    };

                }
            );

    }

    catch (error) {

        console.warn(
            "No se pudo leer el carrito guardado:",
            error
        );

        return [];

    }

}


/* =====================================================
   GUARDAR CARRITO
===================================================== */

function guardarCarrito() {

    localStorage.setItem(
        CLAVE_CARRITO,
        JSON.stringify(
            carrito
        )
    );

}


/* =====================================================
   ESCAPAR HTML
===================================================== */

function escaparHTMLCarrito(
    valor
) {

    return String(
        valor ?? ""
    )

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}


/* =====================================================
   FORMATO DE DINERO
===================================================== */

function dinero(
    valor
) {

    return `Q${Number(
        valor || 0
    ).toFixed(2)}`;

}


/* =====================================================
   STOCK ACTUAL
===================================================== */

function obtenerStockActual(
    codigo
) {

    if (
        typeof inventario ===
        "undefined"
    ) {

        return null;

    }


    const stock =
        inventario[
            String(codigo)
        ];


    return Number.isFinite(
        Number(stock)
    )

        ? Number(stock)

        : null;

}


/* =====================================================
   OBTENER PRECIO DE VENTA
   -----------------------------------------------------
   Utiliza el sistema centralizado de ofertas cuando
   existe.

   Si no existe, utiliza un cálculo de respaldo.
===================================================== */

function obtenerPrecioVenta(
    producto
) {

    if (!producto) {

        return null;

    }


    /* =================================================
       SISTEMA CENTRALIZADO
    ================================================= */

    if (
        typeof window.obtenerPrecioVenta ===
        "function" &&
        window.obtenerPrecioVenta !==
        obtenerPrecioVenta
    ) {

        const precio =
            Number(
                window.obtenerPrecioVenta(
                    producto,
                    {
                        modo:
                            "ofertas"
                    }
                )
            );


        if (
            Number.isFinite(
                precio
            ) &&
            precio >= 0
        ) {

            return Number(
                precio.toFixed(2)
            );

        }

    }


    /* =================================================
       RESPALDO
    ================================================= */

    const precioNormal =
        Number(
            producto.precio
        );


    const porcentajeOferta =
        Number(
            producto.oferta ||
            0
        );


    if (
        !Number.isFinite(
            precioNormal
        ) ||
        precioNormal < 0
    ) {

        return null;

    }


    if (
        Number.isFinite(
            porcentajeOferta
        ) &&
        porcentajeOferta > 0
    ) {

        const descuento =
            Math.min(
                100,
                Math.max(
                    0,
                    porcentajeOferta
                )
            );


        return Number(
            Math.max(
                0,
                precioNormal -
                (
                    precioNormal *
                    descuento /
                    100
                )
            ).toFixed(2)
        );

    }


    return Number(
        precioNormal.toFixed(2)
    );

}


/* =====================================================
   OBTENER INFORMACIÓN COMPLETA DEL PRECIO
   -----------------------------------------------------
   Devuelve:

   - precioOriginal
   - precioOferta
   - oferta
   - precioVenta
   - descuentoUnitario
===================================================== */

function obtenerInformacionPrecio(
    producto
) {

    if (!producto) {

        return null;

    }


    const precioOriginal =
        Number(
            producto.precio
        );


    if (
        !Number.isFinite(
            precioOriginal
        ) ||
        precioOriginal < 0
    ) {

        return null;

    }


    let oferta =
        Number(
            producto.oferta ||
            0
        );


    if (
        !Number.isFinite(
            oferta
        ) ||
        oferta <= 0
    ) {

        oferta = 0;

    }


    oferta =
        Math.min(
            100,
            Math.max(
                0,
                oferta
            )
        );


    const precioVenta =
        oferta > 0

            ? obtenerPrecioVenta(
                producto
            )

            : Number(
                precioOriginal.toFixed(2)
            );


    if (
        precioVenta === null
    ) {

        return null;

    }


    const precioOferta =
        oferta > 0 &&
        precioVenta <
            precioOriginal

            ? Number(
                precioVenta.toFixed(2)
            )

            : 0;


    const descuentoUnitario =
        precioOferta > 0

            ? Number(
                (
                    precioOriginal -
                    precioOferta
                ).toFixed(2)
            )

            : 0;


    return {

        precioOriginal:
            Number(
                precioOriginal.toFixed(2)
            ),

        precioOferta,

        oferta,

        precioVenta:
            Number(
                precioVenta.toFixed(2)
            ),

        descuentoUnitario

    };

}


/* =====================================================
   ACTUALIZAR INFORMACIÓN DE DESCUENTO DE UN ITEM
===================================================== */

function actualizarDatosDescuentoItem(
    item
) {

    if (!item) {

        return;

    }


    const precioOriginal =
        Number(
            item.precioOriginal ??
            item.precio
        );


    const precioAplicado =
        Number(
            item.precio
        );


    const cantidad =
        Math.max(
            1,
            Number(
                item.cantidad
            ) || 1
        );


    item.precioOriginal =
        Number.isFinite(
            precioOriginal
        )
            ? Number(
                precioOriginal.toFixed(2)
            )
            : Number(
                precioAplicado.toFixed(2)
            );


    item.precio =
        Number.isFinite(
            precioAplicado
        )
            ? Number(
                precioAplicado.toFixed(2)
            )
            : 0;


    item.precioOferta =
        Number.isFinite(
            Number(
                item.precioOferta
            )
        ) &&
        Number(
            item.precioOferta
        ) > 0 &&
        Number(
            item.precioOferta
        ) <
            item.precioOriginal

            ? Number(
                Number(
                    item.precioOferta
                ).toFixed(2)
            )

            : 0;


    item.oferta =
        Number.isFinite(
            Number(
                item.oferta
            )
        )
            ? Math.min(
                100,
                Math.max(
                    0,
                    Number(
                        item.oferta
                    )
                )
            )
            : 0;


    item.descuentoUnitario =
        Math.max(
            0,
            Number(
                (
                    item.precioOriginal -
                    item.precio
                ).toFixed(2)
            )
        );


    item.descuentoTotal =
        Number(
            (
                item.descuentoUnitario *
                cantidad
            ).toFixed(2)
        );

}


/* =====================================================
   ACTUALIZAR TODOS LOS DESCUENTOS
===================================================== */

function actualizarDescuentosCarrito() {

    carrito.forEach(
        function (item) {

            actualizarDatosDescuentoItem(
                item
            );

        }
    );

}


/* =====================================================
   SUBTOTAL
   -----------------------------------------------------
   El subtotal utiliza SIEMPRE el precio aplicado.
===================================================== */

function obtenerSubtotalCarrito() {

    return carrito.reduce(
        function (
            acumulado,
            item
        ) {

            return (
                acumulado +
                (
                    Number(
                        item.precio
                    ) *
                    Number(
                        item.cantidad
                    )
                )
            );

        },
        0
    );

}


/* =====================================================
   SUBTOTAL ANTES DE DESCUENTOS
===================================================== */

function obtenerSubtotalAntesDescuentos() {

    return carrito.reduce(
        function (
            acumulado,
            item
        ) {

            const precioNormal =
                Number(
                    item.precioOriginal ??
                    item.precio
                );


            return (
                acumulado +
                (
                    precioNormal *
                    item.cantidad
                )
            );

        },
        0
    );

}


/* =====================================================
   DESCUENTO TOTAL DEL CARRITO
===================================================== */

function obtenerDescuentoTotalCarrito() {

    return carrito.reduce(
        function (
            acumulado,
            item
        ) {

            const precioNormal =
                Number(
                    item.precioOriginal ??
                    item.precio
                );


            const precioAplicado =
                Number(
                    item.precio
                );


            const descuento =
                Math.max(
                    0,
                    (
                        precioNormal -
                        precioAplicado
                    ) *
                    item.cantidad
                );


            return (
                acumulado +
                descuento
            );

        },
        0
    );

}


/* =====================================================
   CANTIDAD TOTAL
===================================================== */

function obtenerCantidadCarrito() {

    return carrito.reduce(
        function (
            acumulado,
            item
        ) {

            return (
                acumulado +
                item.cantidad
            );

        },
        0
    );

}


/* =====================================================
   ACTUALIZAR CONTADOR
===================================================== */

function actualizarContadorCarrito() {

    if (
        !carritoCantidad
    ) {

        return;

    }


    carritoCantidad.textContent =
        String(
            obtenerCantidadCarrito()
        );

}


/* =====================================================
   MENSAJE CHECKOUT
===================================================== */

function mostrarMensajeCheckout(
    mensaje = "",
    tipo = ""
) {

    if (
        !checkoutMensaje
    ) {

        return;

    }


    checkoutMensaje.textContent =
        mensaje;


    checkoutMensaje.dataset.tipo =
        tipo;

}


/* =====================================================
   RENDERIZAR CARRITO
===================================================== */

function renderizarCarrito() {

    actualizarDescuentosCarrito();

    actualizarContadorCarrito();


    if (
        !carritoItems ||
        !carritoVacio ||
        !carritoContenido
    ) {

        return;

    }


    const estaVacio =
        carrito.length === 0;


    carritoVacio.hidden =
        !estaVacio;


    carritoContenido.hidden =
        estaVacio;


    if (
        estaVacio
    ) {

        carritoItems.innerHTML =
            "";

        actualizarTotalesCarrito();

        return;

    }


    carritoItems.innerHTML =
        carrito.map(
            function (item) {

                const stock =
                    obtenerStockActual(
                        item.codigo
                    );


                const llegoAlMaximo =
                    stock !== null &&
                    item.cantidad >= stock;


                const imagen =
                    item.imagen

                        ? `
                            <img
                                src="${escaparHTMLCarrito(
                                    item.imagen
                                )}"
                                alt="${escaparHTMLCarrito(
                                    item.nombre
                                )}"
                            >
                          `

                        : `
                            <span aria-hidden="true">
                                📦
                            </span>
                          `;


                const esOferta =
                    item.precioOferta > 0 &&
                    item.precioOferta <
                        item.precioOriginal;


                const precioHTML =
                    esOferta

                        ? `
                            <div class="carrito-precio">

                                <del>
                                    ${dinero(
                                        item.precioOriginal
                                    )}
                                </del>

                                <strong>
                                    ${dinero(
                                        item.precioOferta
                                    )}
                                </strong>

                                <small>
                                    -${Number(
                                        item.oferta
                                    )}% 
                                </small>

                            </div>
                          `

                        : `
                            <div class="carrito-precio">

                                <strong>
                                    ${dinero(
                                        item.precio
                                    )}
                                </strong>

                            </div>
                          `;


                return `

                    <article
                        class="carrito-item"
                        data-codigo="${escaparHTMLCarrito(
                            item.codigo
                        )}"
                    >

                        <div class="carrito-item-imagen">

                            ${imagen}

                        </div>


                        <div class="carrito-item-info">

                            <h4>
                                ${escaparHTMLCarrito(
                                    item.nombre
                                )}
                            </h4>


                            <p>
                                ${escaparHTMLCarrito(
                                    item.marca
                                )}
                            </p>


                            <p>
                                Código:
                                ${escaparHTMLCarrito(
                                    item.codigo
                                )}
                            </p>


                            ${precioHTML}


                            ${
                                esOferta
                                    ? `
                                        <small>
                                            Ahorras
                                            ${dinero(
                                                item.descuentoUnitario
                                            )}
                                            por unidad
                                        </small>
                                      `
                                    : ""
                            }

                        </div>


                        <div class="carrito-item-acciones">

                            <div>

                                <button
                                    type="button"
                                    class="carrito-restar"
                                    data-codigo="${escaparHTMLCarrito(
                                        item.codigo
                                    )}"
                                    aria-label="Restar una unidad"
                                >
                                    −
                                </button>


                                <span
                                    aria-label="Cantidad"
                                >
                                    ${item.cantidad}
                                </span>


                                <button
                                    type="button"
                                    class="carrito-sumar"
                                    data-codigo="${escaparHTMLCarrito(
                                        item.codigo
                                    )}"
                                    aria-label="Sumar una unidad"
                                    ${
                                        llegoAlMaximo
                                            ? "disabled"
                                            : ""
                                    }
                                >
                                    +
                                </button>

                            </div>


                            <strong>
                                ${dinero(
                                    item.precio *
                                    item.cantidad
                                )}
                            </strong>


                            <button
                                type="button"
                                class="carrito-eliminar"
                                data-codigo="${escaparHTMLCarrito(
                                    item.codigo
                                )}"
                            >
                                Eliminar
                            </button>

                        </div>

                    </article>

                `;

            }
        ).join("");


    /* =================================================
       RESTAR
    ================================================= */

    carritoItems
        .querySelectorAll(
            ".carrito-restar"
        )
        .forEach(
            function (boton) {

                boton.addEventListener(
                    "click",
                    function () {

                        cambiarCantidad(
                            boton.dataset.codigo,
                            -1
                        );

                    }
                );

            }
        );


    /* =================================================
       SUMAR
    ================================================= */

    carritoItems
        .querySelectorAll(
            ".carrito-sumar"
        )
        .forEach(
            function (boton) {

                boton.addEventListener(
                    "click",
                    function () {

                        cambiarCantidad(
                            boton.dataset.codigo,
                            1
                        );

                    }
                );

            }
        );


    /* =================================================
       ELIMINAR
    ================================================= */

    carritoItems
        .querySelectorAll(
            ".carrito-eliminar"
        )
        .forEach(
            function (boton) {

                boton.addEventListener(
                    "click",
                    function () {

                        eliminarDelCarrito(
                            boton.dataset.codigo
                        );

                    }
                );

            }
        );


    actualizarTotalesCarrito();

}


/* =====================================================
   TOTALES
===================================================== */

function actualizarTotalesCarrito() {

    const subtotal =
        Number(
            obtenerSubtotalCarrito()
                .toFixed(2)
        );


    const total =
        Number(
            (
                subtotal +
                COSTO_ENVIO
            ).toFixed(2)
        );


    if (
        carritoSubtotal
    ) {

        carritoSubtotal.textContent =
            dinero(
                subtotal
            );

    }


    if (
        carritoEnvio
    ) {

        carritoEnvio.textContent =
            dinero(
                COSTO_ENVIO
            );

    }


    if (
        carritoTotal
    ) {

        carritoTotal.textContent =
            dinero(
                total
            );

    }

}


/* =====================================================
   AGREGAR PRODUCTO AL CARRITO
   -----------------------------------------------------
   precioFinal:
   Precio exacto que debe conservar el carrito.

   informacionPrecio:
   Información completa del precio.
===================================================== */

function agregarProductoAlCarrito(
    producto,
    precioFinal = null,
    informacionPrecio = null
) {

    if (
        !producto ||
        producto.codigo == null
    ) {

        return;

    }


    const codigo =
        String(
            producto.codigo
        );


    const stock =
        obtenerStockActual(
            codigo
        );


    if (
        stock === null
    ) {

        alert(
            "El inventario aún se está cargando. Intenta de nuevo en un momento."
        );

        return;

    }


    if (
        stock <= 0
    ) {

        alert(
            "Este producto está agotado."
        );

        return;

    }


    const precio =
        Number(
            precioFinal ??
            producto.precio
        );


    if (
        !Number.isFinite(
            precio
        ) ||
        precio < 0
    ) {

        alert(
            "Este producto no tiene un precio válido."
        );

        return;

    }


    const itemExistente =
        carrito.find(
            function (item) {

                return (
                    item.codigo ===
                    codigo
                );

            }
        );


    const precioOriginal =
        Number(
            informacionPrecio?.precioOriginal ??
            producto.precio
        );


    const precioOferta =
        Number(
            informacionPrecio?.precioOferta ??
            0
        );


    const oferta =
        Number(
            informacionPrecio?.oferta ??
            producto.oferta ??
            0
        );


    /* =================================================
       PRODUCTO YA EXISTENTE
    ================================================= */

    if (
        itemExistente
    ) {

        if (
            itemExistente.cantidad >=
            stock
        ) {

            alert(
                `Solo hay ${stock} unidad(es) disponible(s) de este producto.`
            );

            return;

        }


        itemExistente.cantidad +=
            1;


        /*
           Conservamos los precios originales del
           momento en que el producto entró al carrito.
        */

        actualizarDatosDescuentoItem(
            itemExistente
        );

    }


    /* =================================================
       PRODUCTO NUEVO
    ================================================= */

    else {

        const itemNuevo = {

            codigo,

            nombre:
                producto.nombre ||
                "Producto",

            marca:
                producto.marca ||
                "San Martín",

            imagen:
                producto.imagen ||
                "",


            /* -----------------------------------------
               PRECIO REALMENTE COBRADO
            ----------------------------------------- */

            precio:
                Number(
                    precio.toFixed(2)
                ),


            /* -----------------------------------------
               PRECIO NORMAL
            ----------------------------------------- */

            precioOriginal:
                Number.isFinite(
                    precioOriginal
                )
                    ? Number(
                        precioOriginal.toFixed(2)
                    )
                    : Number(
                        precio.toFixed(2)
                    ),


            /* -----------------------------------------
               PRECIO DE OFERTA
            ----------------------------------------- */

            precioOferta:
                Number.isFinite(
                    precioOferta
                ) &&
                precioOferta > 0 &&
                precioOferta <
                    precioOriginal

                    ? Number(
                        precioOferta.toFixed(2)
                    )

                    : 0,


            /* -----------------------------------------
               PORCENTAJE
            ----------------------------------------- */

            oferta:
                Number.isFinite(
                    oferta
                ) &&
                oferta > 0

                    ? Math.min(
                        100,
                        Math.max(
                            0,
                            oferta
                        )
                    )

                    : 0,


            cantidad:
                1

        };


        actualizarDatosDescuentoItem(
            itemNuevo
        );


        carrito.push(
            itemNuevo
        );

    }


    guardarCarrito();

    renderizarCarrito();

}


/* =====================================================
   BOTONES AGREGAR AL CARRITO
===================================================== */

function conectarBotonesAgregarCarrito() {

    document.addEventListener(
        "click",
        function (evento) {

            if (
                !(evento.target instanceof Element)
            ) {

                return;

            }


            const boton =
                evento.target.closest(
                    ".product-add-cart"
                );


            if (!boton) {

                return;

            }


            evento.preventDefault();

            evento.stopPropagation();


            if (
                typeof productos ===
                "undefined"
            ) {

                console.error(
                    "No se encontró el listado de productos."
                );

                return;

            }


            const producto =
                productos.find(
                    function (item) {

                        return (
                            String(
                                item.codigo
                            ) ===
                            String(
                                boton.dataset.codigo
                            )
                        );

                    }
                );


            if (!producto) {

                alert(
                    "No fue posible encontrar este producto."
                );

                return;

            }


            /* =================================================
               OBTENER PRECIO SEGÚN LA VISTA
            ================================================= */

            const esVistaOfertas =
                window.vistaActual ===
                "ofertas";


            const informacionPrecio =
                esVistaOfertas

                    ? obtenerInformacionPrecio(
                        producto
                    )

                    : {

                        precioOriginal:
                            Number(
                                producto.precio
                            ),

                        precioOferta:
                            0,

                        oferta:
                            0,

                        precioVenta:
                            Number(
                                producto.precio
                            ),

                        descuentoUnitario:
                            0

                    };


            if (
                !informacionPrecio
            ) {

                alert(
                    "No fue posible determinar el precio de este producto."
                );

                return;

            }


            /* =================================================
               PRECIO QUE SE GUARDA
               -------------------------------------------------
               Si existe oferta válida, se guarda únicamente
               el precio de oferta como precio aplicado.
            ================================================= */

            const precio =
                esVistaOfertas

                    ? informacionPrecio.precioVenta

                    : Number(
                        producto.precio
                    );


            if (
                !Number.isFinite(
                    precio
                ) ||
                precio < 0
            ) {

                alert(
                    "Este producto no tiene un precio válido."
                );

                return;

            }


            agregarProductoAlCarrito(
                producto,
                precio,
                informacionPrecio
            );

        }
    );

}


/* =====================================================
   CAMBIAR CANTIDAD
===================================================== */

function cambiarCantidad(
    codigo,
    cambio
) {

    const item =
        carrito.find(
            function (producto) {

                return (
                    producto.codigo ===
                    String(codigo)
                );

            }
        );


    if (!item) {

        return;

    }


    const nuevaCantidad =
        item.cantidad +
        cambio;


    const stock =
        obtenerStockActual(
            item.codigo
        );


    if (
        nuevaCantidad <= 0
    ) {

        eliminarDelCarrito(
            item.codigo
        );

        return;

    }


    if (
        stock !== null &&
        nuevaCantidad > stock
    ) {

        alert(
            `Solo hay ${stock} unidad(es) disponible(s) de este producto.`
        );

        return;

    }


    item.cantidad =
        nuevaCantidad;


    actualizarDatosDescuentoItem(
        item
    );


    guardarCarrito();

    renderizarCarrito();

}


/* =====================================================
   ELIMINAR PRODUCTO
===================================================== */

function eliminarDelCarrito(
    codigo
) {

    carrito =
        carrito.filter(
            function (item) {

                return (
                    item.codigo !==
                    String(codigo)
                );

            }
        );


    guardarCarrito();

    renderizarCarrito();

}


/* =====================================================
   VACIAR CARRITO
===================================================== */

function vaciarCarrito() {

    if (
        carrito.length === 0
    ) {

        return;

    }


    if (
        !confirm(
            "¿Deseas vaciar todo el carrito?"
        )
    ) {

        return;

    }


    carrito = [];


    guardarCarrito();

    renderizarCarrito();

    mostrarMensajeCheckout(
        ""
    );

}


/* =====================================================
   CARGAR DIRECCIONES
===================================================== */

async function cargarDireccionesCheckout() {

    if (
        !checkoutDireccion
    ) {

        return;

    }


    checkoutDireccion.innerHTML =
        "<option value=\"\">Cargando direcciones...</option>";


    direccionesCheckout =
        [];


    const {

        data: {
            user
        },

        error:
            errorUsuario

    } =
        await supabaseClient.auth.getUser();


    if (
        errorUsuario ||
        !user
    ) {

        checkoutDireccion.innerHTML =
            "<option value=\"\">Inicia sesión para elegir una dirección</option>";


        mostrarMensajeCheckout(
            "Inicia sesión antes de confirmar tu pedido.",
            "error"
        );

        return;

    }


    const {
        data,
        error
    } =
        await supabaseClient

            .from(
                "direcciones"
            )

            .select(
                "id, nombre_direccion, nombre_receptor, telefono, departamento, municipio, direccion, referencia, principal"
            )

            .eq(
                "usuario_id",
                user.id
            )

            .order(
                "principal",
                {
                    ascending:
                        false
                }
            )

            .order(
                "id",
                {
                    ascending:
                        false
                }
            );


    if (
        error
    ) {

        console.error(
            "Error cargando direcciones para checkout:",
            error
        );


        checkoutDireccion.innerHTML =
            "<option value=\"\">No fue posible cargar tus direcciones</option>";


        mostrarMensajeCheckout(
            "No fue posible cargar tus direcciones. Intenta nuevamente.",
            "error"
        );

        return;

    }


    direccionesCheckout =
        data || [];


    if (
        direccionesCheckout.length ===
        0
    ) {

        checkoutDireccion.innerHTML =
            "<option value=\"\">No tienes una dirección guardada</option>";


        mostrarMensajeCheckout(
            "Guarda una dirección en Mi cuenta antes de confirmar el pedido.",
            "error"
        );

        return;

    }


    checkoutDireccion.innerHTML =
        '<option value="">Selecciona una dirección</option>';


    direccionesCheckout.forEach(
        function (direccion) {

            const opcion =
                document.createElement(
                    "option"
                );


            opcion.value =
                String(
                    direccion.id
                );


            opcion.textContent =
                `${direccion.nombre_direccion} — ${direccion.direccion}, ${direccion.municipio}`;


            if (
                direccion.principal
            ) {

                opcion.selected =
                    true;

            }


            checkoutDireccion.appendChild(
                opcion
            );

        }
    );


    mostrarMensajeCheckout(
        ""
    );

}


/* =====================================================
   ABRIR CARRITO
===================================================== */

function abrirCarrito() {

    if (
        !carritoPanel
    ) {

        return;

    }


    carritoPanel.hidden =
        false;


    renderizarCarrito();

    cargarDireccionesCheckout();

}


/* =====================================================
   CERRAR CARRITO
===================================================== */

function cerrarCarrito() {

    if (
        carritoPanel
    ) {

        carritoPanel.hidden =
            true;

    }

}


/* =====================================================
   PEDIR INICIO DE SESIÓN
===================================================== */

function pedirInicioSesion() {

    if (
        typeof mostrarVistaCuenta ===
        "function"
    ) {

        mostrarVistaCuenta(
            "login"
        );

    }


    document
        .getElementById(
            "cuenta"
        )
        ?.scrollIntoView({
            behavior:
                "smooth",
            block:
                "start"
        });

}


/* =====================================================
   VALIDAR INVENTARIO
===================================================== */

async function validarInventarioAntesDeComprar() {

    const codigos =
        carrito.map(
            function (item) {

                return item.codigo;

            }
        );


    const {
        data,
        error
    } =
        await supabaseClient

            .from(
                "inventario"
            )

            .select(
                "codigo, stock"
            )

            .in(
                "codigo",
                codigos
            );


    if (
        error
    ) {

        throw new Error(
            "No fue posible validar el inventario."
        );

    }


    const inventarioActual =
        new Map(
            (data || []).map(
                function (item) {

                    return [
                        String(
                            item.codigo
                        ),
                        Number(
                            item.stock ||
                            0
                        )
                    ];

                }
            )
        );


    const sinExistencias =
        carrito.find(
            function (item) {

                const stock =
                    inventarioActual.get(
                        item.codigo
                    );


                return (
                    stock == null ||
                    item.cantidad >
                        stock
                );

            }
        );


    if (
        sinExistencias
    ) {

        throw new Error(
            `El producto “${sinExistencias.nombre}” ya no tiene la cantidad solicitada.`
        );

    }

}


/* =====================================================
   CREAR PEDIDO
===================================================== */

async function crearPedido(
    evento
) {

    evento.preventDefault();


    if (
        pedidoEnProceso
    ) {

        return;

    }


    if (
        carrito.length === 0
    ) {

        mostrarMensajeCheckout(
            "Agrega al menos un producto al carrito.",
            "error"
        );

        return;

    }


    const {

        data: {
            user
        },

        error:
            errorUsuario

    } =
        await supabaseClient.auth.getUser();


    if (
        errorUsuario ||
        !user
    ) {

        mostrarMensajeCheckout(
            "Debes iniciar sesión para realizar el pedido.",
            "error"
        );


        pedirInicioSesion();

        return;

    }


    const direccionId =
        checkoutDireccion?.value;


    const direccion =
        direccionesCheckout.find(
            function (item) {

                return (
                    String(
                        item.id
                    ) ===
                    String(
                        direccionId
                    )
                );

            }
        );


    if (!direccion) {

        mostrarMensajeCheckout(
            "Selecciona una dirección de entrega.",
            "error"
        );

        return;

    }


    pedidoEnProceso =
        true;


    if (
        btnRealizarPedido
    ) {

        btnRealizarPedido.disabled =
            true;

        btnRealizarPedido.textContent =
            "Procesando pedido...";

    }


    mostrarMensajeCheckout(
        "Validando inventario...",
        ""
    );


    try {

        /* =================================================
           ACTUALIZAR DESCUENTOS
        ================================================= */

        actualizarDescuentosCarrito();


        guardarCarrito();


        /* =================================================
           VALIDAR INVENTARIO
        ================================================= */

        await validarInventarioAntesDeComprar();


        /* =================================================
           CALCULAR TOTALES
        ================================================= */

        const subtotal =
            Number(
                obtenerSubtotalCarrito()
                    .toFixed(2)
            );


        const subtotalAntesDescuentos =
            Number(
                obtenerSubtotalAntesDescuentos()
                    .toFixed(2)
            );


        const descuentoTotal =
            Number(
                obtenerDescuentoTotalCarrito()
                    .toFixed(2)
            );


        const total =
            Number(
                (
                    subtotal +
                    COSTO_ENVIO
                ).toFixed(2)
            );


        /* =================================================
           CREAR PEDIDO
        ================================================= */

        const {
            data: pedido,
            error:
                errorPedido
        } =
            await supabaseClient

                .from(
                    "pedidos"
                )

                .insert({

                    usuario_id:
                        user.id,

                    estado:
                        "pendiente",

                    subtotal,

                    subtotal_antes_descuentos:
                        subtotalAntesDescuentos,

                    descuento_total:
                        descuentoTotal,

                    costo_envio:
                        COSTO_ENVIO,

                    total,

                    cantidad_productos:
                        obtenerCantidadCarrito(),

                    metodo_pago:
                        "contra_entrega",

                    nombre_direccion:
                        direccion.nombre_direccion,

                    nombre_receptor:
                        direccion.nombre_receptor,

                    telefono:
                        direccion.telefono,

                    departamento:
                        direccion.departamento,

                    municipio:
                        direccion.municipio,

                    direccion:
                        direccion.direccion,

                    referencia:
                        direccion.referencia ||
                        ""

                })

                .select(
                    "id"
                )

                .single();


        if (
            errorPedido ||
            !pedido
        ) {

            console.error(
                "Error creando pedido:",
                errorPedido
            );


            throw new Error(
                "No fue posible crear el pedido."
            );

        }


        /* =================================================
           ITEMS DEL PEDIDO
           -------------------------------------------------
           Se conserva:

           - precio normal
           - precio oferta
           - precio cobrado
           - porcentaje
           - descuento unitario
           - descuento total
           - subtotal
        ================================================= */

        const itemsPedido =
            carrito.map(
                function (item) {

                    const precioNormal =
                        Number(
                            item.precioOriginal ??
                            item.precio
                        );


                    const precioOferta =
                        Number(
                            item.precioOferta ??
                            0
                        );


                    const precioAplicado =
                        Number(
                            item.precio
                        );


                    const descuentoUnitario =
                        Math.max(
                            0,
                            Number(
                                (
                                    precioNormal -
                                    precioAplicado
                                ).toFixed(2)
                            )
                        );


                    const descuentoTotalItem =
                        Number(
                            (
                                descuentoUnitario *
                                item.cantidad
                            ).toFixed(2)
                        );


                    const subtotalItem =
                        Number(
                            (
                                precioAplicado *
                                item.cantidad
                            ).toFixed(2)
                        );


                    return {

                        pedido_id:
                            pedido.id,

                        producto_codigo:
                            item.codigo,

                        producto_nombre:
                            item.nombre,

                        producto_marca:
                            item.marca,

                        producto_imagen:
                            item.imagen ||
                            null,


                        /* ---------------------------------
                           PRECIO NORMAL
                        --------------------------------- */

                        precio_normal:
                            Number(
                                precioNormal.toFixed(2)
                            ),


                        /* ---------------------------------
                           PRECIO DE OFERTA
                        --------------------------------- */

                        precio_oferta:
                            precioOferta > 0
                                ? Number(
                                    precioOferta.toFixed(2)
                                )
                                : null,


                        /* ---------------------------------
                           PRECIO REALMENTE COBRADO
                        --------------------------------- */

                        precio:
                            Number(
                                precioAplicado.toFixed(2)
                            ),


                        /* ---------------------------------
                           PORCENTAJE DE OFERTA
                        --------------------------------- */

                        oferta:
                            Number(
                                item.oferta || 0
                            ),


                        /* ---------------------------------
                           DESCUENTO UNITARIO
                        --------------------------------- */

                        descuento_unitario:
                            descuentoUnitario,


                        /* ---------------------------------
                           DESCUENTO TOTAL
                        --------------------------------- */

                        descuento_total:
                            descuentoTotalItem,


                        cantidad:
                            item.cantidad,


                        subtotal:
                            subtotalItem

                    };

                }
            );


        /* =================================================
           GUARDAR ITEMS
        ================================================= */

        const {
            error:
                errorItems
        } =
            await supabaseClient

                .from(
                    "pedido_items"
                )

                .insert(
                    itemsPedido
                );


        if (
            errorItems
        ) {

            console.error(
                "Error creando items del pedido:",
                errorItems
            );


            throw new Error(
                "El pedido no pudo guardar sus productos."
            );

        }


        /* =================================================
           NÚMERO DE PEDIDO
        ================================================= */

        const numeroPedido =
            typeof obtenerNumeroPedido ===
            "function"

                ? obtenerNumeroPedido(
                    pedido.id
                )

                : String(
                    pedido.id
                ).padStart(
                    6,
                    "0"
                );


        /* =================================================
           LIMPIAR CARRITO
        ================================================= */

        carrito = [];


        guardarCarrito();

    renderizarCarrito();


        /* =================================================
           MENSAJE FINAL
        ================================================= */

        mostrarMensajeCheckout(
            `Pedido #${numeroPedido} creado. Te contactaremos para confirmar la entrega.`,
            "exito"
        );


        /* =================================================
           ACTUALIZAR MIS PEDIDOS
        ================================================= */

        if (
            typeof cargarMisPedidos ===
            "function"
        ) {

            cargarMisPedidos();

        }

    }

    catch (error) {

        console.error(
            "Error en checkout:",
            error
        );


        mostrarMensajeCheckout(
            error.message ||
            "Ocurrió un error al crear el pedido.",
            "error"
        );

    }

    finally {

        pedidoEnProceso =
            false;


        if (
            btnRealizarPedido
        ) {

            btnRealizarPedido.disabled =
                false;

            btnRealizarPedido.textContent =
                "Confirmar pedido";

        }

    }

}


/* =====================================================
   EVENTOS
===================================================== */

if (
    btnAbrirCarrito
) {

    btnAbrirCarrito.addEventListener(
        "click",
        abrirCarrito
    );

}


if (
    btnCerrarCarrito
) {

    btnCerrarCarrito.addEventListener(
        "click",
        cerrarCarrito
    );

}


if (
    btnVaciarCarrito
) {

    btnVaciarCarrito.addEventListener(
        "click",
        vaciarCarrito
    );

}


if (
    checkoutForm
) {

    checkoutForm.addEventListener(
        "submit",
        crearPedido
    );

}


/* =====================================================
   INICIALIZACIÓN
===================================================== */

conectarBotonesAgregarCarrito();

actualizarDescuentosCarrito();

guardarCarrito();

renderizarCarrito();