/* =====================================================
   PEDIDOS — CARGAR
===================================================== */

async function cargarPedidosAdmin() {

    if (
        typeof ordersTable === "undefined" ||
        !ordersTable
    ) {

        return;

    }


    ordersTable.innerHTML = "";


    const {
        data: pedidos,
        error
    } =
        await supabaseClient
            .from("pedidos")
            .select("*")
            .order(
                "id",
                {
                    ascending: false
                }
            );


    if (error) {

        console.error(
            "Error cargando pedidos:",
            error
        );


        mostrarEstado(
            "❌ No se pudieron cargar los pedidos."
        );


        return;

    }


    pedidosAdmin =
        pedidos || [];


    await cargarItemsPedidos();

    mostrarPedidosAdmin();

    actualizarEstadisticasPedidos();

}


/* =====================================================
   CARGAR ITEMS DE PEDIDOS
===================================================== */

async function cargarItemsPedidos() {

    if (
        !pedidosAdmin.length
    ) {

        return;

    }


    const idsPedidos =
        pedidosAdmin.map(
            pedido =>
                pedido.id
        );


    const {
        data: items,
        error
    } =
        await supabaseClient
            .from("pedido_items")
            .select("*")
            .in(
                "pedido_id",
                idsPedidos
            )
            .order(
                "id",
                {
                    ascending: true
                }
            );


    if (error) {

        console.error(
            "Error cargando productos de pedidos:",
            error
        );


        pedidosAdmin =
            pedidosAdmin.map(
                pedido => ({

                    ...pedido,

                    items: []

                })
            );


        return;

    }


    const itemsPorPedido = {};


    (items || []).forEach(
        item => {

            if (
                !itemsPorPedido[
                    item.pedido_id
                ]
            ) {

                itemsPorPedido[
                    item.pedido_id
                ] = [];

            }


            itemsPorPedido[
                item.pedido_id
            ].push(
                item
            );

        }
    );


    pedidosAdmin =
        pedidosAdmin.map(
            pedido => ({

                ...pedido,

                items:
                    itemsPorPedido[
                        pedido.id
                    ] || []

            })
        );

}


/* =====================================================
   MOSTRAR PEDIDOS
===================================================== */

function mostrarPedidosAdmin() {

    if (
        typeof ordersTable === "undefined" ||
        !ordersTable
    ) {

        return;

    }


    ordersTable.innerHTML = "";


    ordersCount.textContent =
        `${pedidosAdmin.length} ${
            pedidosAdmin.length === 1
                ? "pedido"
                : "pedidos"
        }`;


    if (
        pedidosAdmin.length === 0
    ) {

        ordersEmpty.classList.remove(
            "hidden"
        );

        ordersTableContainer.classList.add(
            "hidden"
        );

        return;

    }


    ordersEmpty.classList.add(
        "hidden"
    );

    ordersTableContainer.classList.remove(
        "hidden"
    );


    pedidosAdmin.forEach(
        pedido => {

            const fila =
                document.createElement(
                    "tr"
                );


            const cantidad =
                Number(
                    pedido.cantidad_productos || 0
                );


            const fecha =
                formatearFechaPedido(
                    pedido.creado_en
                );


            fila.innerHTML = `

                <td>

                    <strong>
                        ${escaparHTML(
                            obtenerNumeroPedidoAdmin(
                                pedido.id
                            )
                        )}
                    </strong>

                </td>


                <td>

                    <strong>
                        ${escaparHTML(
                            pedido.nombre_receptor ||
                            "Cliente"
                        )}
                    </strong>

                    <small>
                        ${escaparHTML(
                            pedido.nombre_direccion ||
                            ""
                        )}
                    </small>

                </td>


                <td>

                    ${escaparHTML(
                        pedido.telefono ||
                        "—"
                    )}

                </td>


                <td>

                    ${cantidad}

                </td>


                <td>

                    <strong>
                        Q ${formatearDinero(
                            pedido.total
                        )}
                    </strong>

                </td>


                <td>

                    ${escaparHTML(
                        formatearMetodoPago(
                            pedido.metodo_pago
                        )
                    )}

                </td>


                <td>

                    ${crearEstadoPedido(
                        pedido.estado
                    )}

                </td>


                <td>

                    <small>
                        ${escaparHTML(
                            fecha
                        )}
                    </small>

                </td>


                <td>

                    <button
                        type="button"
                        class="order-view-button"
                        data-order-id="${escaparAtributo(
                            pedido.id
                        )}"
                    >
                        👁️ Ver
                    </button>

                    <button
                        type="button"
                        class="order-status-button"
                        data-order-id="${escaparAtributo(
                            pedido.id
                        )}"
                    >
                        ✏️ Cambiar estado
                    </button>

                </td>

            `;


            ordersTable.appendChild(
                fila
            );

        }
    );

}


/* =====================================================
   ESTADÍSTICAS DE PEDIDOS
===================================================== */

function actualizarEstadisticasPedidos() {

    const pendientes =
        pedidosAdmin.filter(
            pedido =>
                String(
                    pedido.estado || ""
                ).toLowerCase() ===
                "pendiente"
        ).length;


    const ventas =
        pedidosAdmin.reduce(
            (
                total,
                pedido
            ) =>
                total +
                Number(
                    pedido.total || 0
                ),
            0
        );


    if (
        typeof pendingOrdersCount !== "undefined" &&
        pendingOrdersCount
    ) {

        pendingOrdersCount.textContent =
            pendientes;

    }


    const pendingOrdersSummary =
        document.getElementById(
            "pendingOrdersSummary"
        );


    if (
        pendingOrdersSummary
    ) {

        pendingOrdersSummary.textContent =
            pendientes;

    }


    if (
        typeof totalOrdersCount !== "undefined" &&
        totalOrdersCount
    ) {

        totalOrdersCount.textContent =
            pedidosAdmin.length;

    }


    if (
        typeof totalOrdersAmount !== "undefined" &&
        totalOrdersAmount
    ) {

        totalOrdersAmount.textContent =
            `Q ${formatearDinero(ventas)}`;

    }

}


/* =====================================================
   ESTADO DEL PEDIDO
===================================================== */

function crearEstadoPedido(
    estado
) {

    const estadoNormalizado =
        String(
            estado || "pendiente"
        )
        .toLowerCase();


    const configuraciones = {

        pendiente: {
            clase:
                "order-status-pending",
            texto:
                "🕐 Pendiente"
        },

        confirmado: {
            clase:
                "order-status-confirmed",
            texto:
                "✅ Confirmado"
        },

        preparando: {
            clase:
                "order-status-preparing",
            texto:
                "📦 Preparando"
        },

        en_camino: {
            clase:
                "order-status-shipped",
            texto:
                "🚚 En camino"
        },

        /* Mantiene legibles los pedidos guardados con el estado anterior. */
        enviado: {
            clase:
                "order-status-shipped",
            texto:
                "🚚 En camino"
        },

        entregado: {
            clase:
                "order-status-delivered",
            texto:
                "✅ Entregado"
        },

        cancelado: {
            clase:
                "order-status-cancelled",
            texto:
                "❌ Cancelado"
        }

    };


    const configuracion =
        configuraciones[
            estadoNormalizado
        ] || {

            clase:
                "order-status-pending",

            texto:
                escaparHTML(
                    estado ||
                    "Pendiente"
                )

        };


    return `

        <span
            class="order-status ${configuracion.clase}"
        >
            ${configuracion.texto}
        </span>

    `;

}


/* =====================================================
   VER PEDIDO
===================================================== */

function abrirPedidoAdmin(
    pedidoId
) {

    const pedido =
        pedidosAdmin.find(
            item =>
                Number(item.id) ===
                Number(pedidoId)
        );


    if (!pedido) {

        return;

    }


    pedidoSeleccionado =
        pedido;


    orderModalTitle.textContent =
        obtenerNumeroPedidoAdmin(
            pedido.id
        );


    orderModalDate.textContent =
        formatearFechaPedido(
            pedido.creado_en
        );


    orderDetailContent.innerHTML =
        generarDetallePedido(
            pedido
        );


    orderModal.classList.remove(
        "hidden"
    );


    document.body.classList.add(
        "modal-open"
    );

}


/* =====================================================
   DETALLE DEL PEDIDO
===================================================== */

function generarDetallePedido(
    pedido
) {

    const items =
        Array.isArray(
            pedido.items
        )
            ? pedido.items
            : [];


    const productosHTML =
        items.length
            ? items.map(
                item => `

                    <div
                        class="order-product-item"
                    >

                        <div
                            class="order-product-image"
                        >

                            ${
                                item.producto_imagen
                                    ? `
                                        <img
                                            src="${escaparAtributo(
                                                item.producto_imagen
                                            )}"
                                            alt="${escaparAtributo(
                                                item.producto_nombre ||
                                                "Producto"
                                            )}"
                                            onerror="this.style.display='none';"
                                        >
                                      `
                                    : `
                                        <span>
                                            🖼️
                                        </span>
                                      `
                            }

                        </div>


                        <div
                            class="order-product-info"
                        >

                            <strong>
                                ${escaparHTML(
                                    item.producto_nombre ||
                                    "Producto"
                                )}
                            </strong>


                            ${
                                item.producto_marca
                                    ? `
                                        <small>
                                            ${escaparHTML(
                                                item.producto_marca
                                            )}
                                        </small>
                                      `
                                    : ""
                            }


                            <span>
                                Código:
                                ${escaparHTML(
                                    item.producto_codigo ||
                                    "—"
                                )}
                            </span>

                        </div>


                        <div
                            class="order-product-quantity"
                        >

                            × ${Number(
                                item.cantidad || 0
                            )}

                        </div>


                        <div
                            class="order-product-price"
                        >

                            Q ${formatearDinero(
                                item.subtotal
                            )}

                        </div>

                    </div>

                `
            ).join("")
            : `

                <div class="order-no-items">
                    No hay productos registrados.
                </div>

            `;


    return `

        <div class="order-detail-grid">


            <!-- CLIENTE -->

            <section
                class="order-detail-card"
            >

                <h3>
                    👤 Cliente
                </h3>

                <p>
                    <strong>
                        ${escaparHTML(
                            pedido.nombre_receptor ||
                            "—"
                        )}
                    </strong>
                </p>

                <p>
                    📞 ${escaparHTML(
                        pedido.telefono ||
                        "—"
                    )}
                </p>

            </section>


            <!-- ENTREGA -->

            <section
                class="order-detail-card"
            >

                <h3>
                    📍 Entrega
                </h3>

                <p>
                    <strong>
                        ${escaparHTML(
                            pedido.nombre_direccion ||
                            "Dirección"
                        )}
                    </strong>
                </p>

                <p>
                    ${escaparHTML(
                        pedido.direccion ||
                        "—"
                    )}
                </p>

                <p>
                    ${escaparHTML(
                        [
                            pedido.municipio,
                            pedido.departamento
                        ]
                        .filter(Boolean)
                        .join(", ")
                    )}
                </p>


                ${
                    pedido.referencia
                        ? `
                            <p>
                                <strong>
                                    Referencia:
                                </strong>

                                ${escaparHTML(
                                    pedido.referencia
                                )}
                            </p>
                          `
                        : ""
                }

            </section>


            <!-- PAGO -->

            <section
                class="order-detail-card"
            >

                <h3>
                    💳 Pago
                </h3>

                <p>
                    ${escaparHTML(
                        formatearMetodoPago(
                            pedido.metodo_pago
                        )
                    )}
                </p>

                <p>
                    <strong>Estado:</strong>
                    <span class="order-status-editor">
                        ${crearSelectorEstadoPedido(
                            pedido
                        )}

                        <button
                            type="button"
                            id="guardarEstadoPedidoButton"
                            class="order-save-status-button"
                            onclick="guardarEstadoPedidoSeleccionado()"
                        >
                            💾 Guardar estado
                        </button>
                    </span>
                </p>

            </section>

        </div>


        <!-- PRODUCTOS -->

        <section
            class="order-detail-products"
        >

            <h3>
                🛍️ Productos
            </h3>


            <div
                class="order-products-list"
            >

                ${productosHTML}

            </div>

        </section>


        <!-- TOTALES -->

        <section
            class="order-totals"
        >

            <div>

                <span>
                    Subtotal
                </span>

                <strong>
                    Q ${formatearDinero(
                        pedido.subtotal
                    )}
                </strong>

            </div>


            <div>

                <span>
                    Envío
                </span>

                <strong>
                    Q ${formatearDinero(
                        pedido.costo_envio
                    )}
                </strong>

            </div>


            <div
                class="order-total-final"
            >

                <span>
                    TOTAL
                </span>

                <strong>
                    Q ${formatearDinero(
                        pedido.total
                    )}
                </strong>

            </div>

        </section>

    `;

}


/* =====================================================
   EVENTOS DE PEDIDOS
===================================================== */

if (
    typeof ordersTable !== "undefined" &&
    ordersTable
) {

    ordersTable.addEventListener(
        "click",
        evento => {

            const boton =
                evento.target.closest(
                    ".order-view-button, .order-status-button"
                );


            if (!boton) {

                return;

            }


            abrirPedidoAdmin(
                boton.dataset.orderId
            );

        }
    );

}


/* =====================================================
   CERRAR MODAL PEDIDO
===================================================== */

function cerrarModalPedido() {

    if (
        typeof orderModal !== "undefined" &&
        orderModal
    ) {

        orderModal.classList.add(
            "hidden"
        );

    }


    document.body.classList.remove(
        "modal-open"
    );


    pedidoSeleccionado =
        null;

}


if (
    typeof closeOrderModal !== "undefined" &&
    closeOrderModal
) {

    closeOrderModal.addEventListener(
        "click",
        cerrarModalPedido
    );

}


if (
    typeof closeOrderButton !== "undefined" &&
    closeOrderButton
) {

    closeOrderButton.addEventListener(
        "click",
        cerrarModalPedido
    );

}


if (
    typeof orderModalOverlay !== "undefined" &&
    orderModalOverlay
) {

    orderModalOverlay.addEventListener(
        "click",
        cerrarModalPedido
    );

}


/* =====================================================
   ESC — CERRAR PEDIDO
===================================================== */

document.addEventListener(
    "keydown",
    evento => {

        if (
            evento.key === "Escape" &&
            typeof orderModal !== "undefined" &&
            orderModal &&
            !orderModal.classList.contains(
                "hidden"
            )
        ) {

            cerrarModalPedido();

        }

    }
);


/* =====================================================
   ACTUALIZAR PEDIDOS
===================================================== */

if (
    typeof refreshOrdersButton !== "undefined" &&
    refreshOrdersButton
) {

    refreshOrdersButton.addEventListener(
        "click",
        async () => {

            refreshOrdersButton.disabled =
                true;

            refreshOrdersButton.textContent =
                "⏳ Cargando...";


            try {

                await cargarPedidosAdmin();

            } finally {

                refreshOrdersButton.disabled =
                    false;

                refreshOrdersButton.textContent =
                    "🔄 Actualizar pedidos";

            }

        }
    );

}


/* =====================================================
   NÚMERO DE PEDIDO
===================================================== */

function obtenerNumeroPedidoAdmin(
    id
) {

    return `SM-${String(
        id
    ).padStart(
        6,
        "0"
    )}`;

}


/* =====================================================
   FECHA DEL PEDIDO
===================================================== */

function formatearFechaPedido(
    fecha
) {

    if (!fecha) {

        return "—";

    }


    const fechaObj =
        new Date(
            fecha
        );


    if (
        Number.isNaN(
            fechaObj.getTime()
        )
    ) {

        return "—";

    }


    return fechaObj.toLocaleString(
        "es-GT",
        {
            dateStyle:
                "medium",

            timeStyle:
                "short"
        }
    );

}


/* =====================================================
   DINERO
===================================================== */

function formatearDinero(
    cantidad
) {

    return Number(
        cantidad || 0
    )
    .toLocaleString(
        "es-GT",
        {
            minimumFractionDigits:
                2,

            maximumFractionDigits:
                2
        }
    );

}


/* =====================================================
   MÉTODO DE PAGO
===================================================== */

function formatearMetodoPago(
    metodo
) {

    const valores = {

        contra_entrega:
            "Contra entrega"

    };


    const metodoNormalizado =
        String(
            metodo || ""
        )
        .toLowerCase();


    return valores[
        metodoNormalizado
    ] ||
        metodo ||
        "—";

}


/* =====================================================
   IMPRESIÓN / PDF
===================================================== */

if (
    typeof printOrderButton !== "undefined" &&
    printOrderButton
) {

    printOrderButton.addEventListener(
        "click",
        () => {

            if (
                !pedidoSeleccionado
            ) {

                return;

            }


            imprimirComprobantePedido(
                pedidoSeleccionado
            );

        }
    );

}

/* =====================================================
   FACTURA / COMPROBANTE PROFESIONAL
===================================================== */

/* =====================================================
   TOTAL EN LETRAS
===================================================== */

function numeroALetrasSanMartin(numero) {

    numero = Number(numero || 0);

    const entero = Math.floor(numero);
    const centavos = Math.round(
        (numero - entero) * 100
    );

    const unidades = [
        "",
        "uno",
        "dos",
        "tres",
        "cuatro",
        "cinco",
        "seis",
        "siete",
        "ocho",
        "nueve"
    ];

    const especiales = [
        "diez",
        "once",
        "doce",
        "trece",
        "catorce",
        "quince",
        "dieciséis",
        "diecisiete",
        "dieciocho",
        "diecinueve"
    ];

    const decenas = [
        "",
        "",
        "veinte",
        "treinta",
        "cuarenta",
        "cincuenta",
        "sesenta",
        "setenta",
        "ochenta",
        "noventa"
    ];

    const centenas = [
        "",
        "ciento",
        "doscientos",
        "trescientos",
        "cuatrocientos",
        "quinientos",
        "seiscientos",
        "setecientos",
        "ochocientos",
        "novecientos"
    ];


    function convertirMenorMil(n) {

        if (n === 0) {
            return "";
        }


        if (n === 100) {
            return "cien";
        }


        if (n < 10) {
            return unidades[n];
        }


        if (n < 20) {
            return especiales[n - 10];
        }


        if (n < 30) {

            if (n === 20) {
                return "veinte";
            }

            return "veinti" + unidades[n - 20];

        }


        if (n < 100) {

            const d =
                Math.floor(n / 10);

            const u =
                n % 10;

            return decenas[d] +
                (
                    u
                        ? " y " + unidades[u]
                        : ""
                );

        }


        const c =
            Math.floor(n / 100);

        const resto =
            n % 100;

        return centenas[c] +
            (
                resto
                    ? " " + convertirMenorMil(resto)
                    : ""
            );

    }


    function convertirNumero(n) {

        if (n === 0) {
            return "cero";
        }


        if (n < 1000) {
            return convertirMenorMil(n);
        }


        if (n < 1000000) {

            const miles =
                Math.floor(n / 1000);

            const resto =
                n % 1000;

            const textoMiles =
                miles === 1
                    ? "mil"
                    : convertirNumero(miles) + " mil";

            return textoMiles +
                (
                    resto
                        ? " " + convertirMenorMil(resto)
                        : ""
                );

        }


        if (n < 1000000000) {

            const millones =
                Math.floor(n / 1000000);

            const resto =
                n % 1000000;

            const textoMillones =
                millones === 1
                    ? "un millón"
                    : convertirNumero(millones) + " millones";

            return textoMillones +
                (
                    resto
                        ? " " + convertirNumero(resto)
                        : ""
                );

        }


        return String(n);

    }


    const textoEntero =
        convertirNumero(entero)
        .replace(/\buno\b/g, "un")
        .toUpperCase();


    const textoCentavos =
        String(
            centavos
        ).padStart(
            2,
            "0"
        );


    return (
        textoEntero +
        " QUETZALES CON " +
        textoCentavos +
        "/100"
    );

}


/* =====================================================
   FORMATEAR ESTADO
===================================================== */

function formatearEstadoFacturaSanMartin(
    estado
) {

    const estados = {

        pendiente: "Pendiente",
        confirmado: "Confirmado",
        preparando: "Preparando",
        en_camino: "En camino",
        enviado: "En camino",
        entregado: "Entregado",
        cancelado: "Cancelado"

    };


    const normalizado =
        String(
            estado || ""
        )
        .toLowerCase();


    return estados[
        normalizado
    ] ||
        estado ||
        "Pendiente";

}


/* =====================================================
   LOGOTIPOS DE MARCAS
===================================================== */

/*
   IMPORTANTE:

   Cambia solamente estas rutas por las rutas reales
   de los 8 logotipos que quieras mostrar.

   Ejemplo:

   imagenes/marcas/scribe.png
   imagenes/marcas/maped.png

*/

const MARCAS_FACTURA_SAN_MARTIN = [

    "imagenes/tucan.png",
    "imagenes/bic.webp",
    "imagenes/bretton.webp",
    "imagenes/fast.webp",
    "imagenes/maped.webp",
    "imagenes/pelikan.webp",
    "imagenes/pritt.webp",
    "imagenes/yplus.webp"

];


/* =====================================================
   IMAGEN DE MARCA SEGURA
===================================================== */

function crearLogoMarcaFactura(
    ruta,
    indice
) {

    const src =
        new URL(
            ruta,
            window.location.href
        ).href;


    return `

        <div class="brand-logo">

            <img
                src="${escaparAtributo(src)}"
                alt="Marca ${indice + 1}"
                onerror="this.parentElement.style.display='none';"
            >

        </div>

    `;

}



/* =====================================================
   IMPRESIÓN / PDF
===================================================== */
function imprimirComprobantePedido(
    pedido
) {

    const items =
        Array.isArray(
            pedido.items
        )
            ? pedido.items
            : [];


    /*
       Máximo de 25 productos por página.
    */

    const MAX_PRODUCTOS_POR_PAGINA = 19;


    /*
       Si el pedido tiene más de 25 productos,
       se divide automáticamente en páginas.
    */

    const paginas = [];


    for (
        let i = 0;
        i < items.length;
        i += MAX_PRODUCTOS_POR_PAGINA
    ) {

        paginas.push(
            items.slice(
                i,
                i + MAX_PRODUCTOS_POR_PAGINA
            )
        );

    }


    if (!paginas.length) {

        paginas.push([]);

    }


    const numeroPedido =
        obtenerNumeroPedidoAdmin(
            pedido.id
        );


    const estado =
        formatearEstadoFacturaSanMartin(
            pedido.estado
        );


    const fechaPedido =
        formatearFechaPedido(
            pedido.creado_en
        );


    /*
       Fecha y hora REAL de impresión.
    */

    const fechaImpresion =
        formatearFechaPedido(
            new Date()
        );


    const total =
        Number(
            pedido.total || 0
        );


    const totalEnLetras =
        numeroALetrasSanMartin(
            total
        );


    /*
       Dirección completa del cliente.
    */

    const direccionCliente = [

        pedido.direccion,
        pedido.municipio,
        pedido.departamento

    ]
    .filter(Boolean)
    .join(", ");


    /*
       Referencia.
    */

    const referencia =
        pedido.referencia ||
        "—";


    /*
       Medida del producto.

       Se intenta obtener desde diferentes
       nombres de posibles columnas.
    */

    function obtenerMedidaItem(item) {

        return (

            item.medida ||
            item.unidad ||
            item.unidad_medida ||
            "Unidad"

        );

    }


    /*
       Código del producto.
    */

    function obtenerCodigoItem(item) {

        return (

            item.producto_codigo ||
            item.codigo ||
            item.sku ||
            "—"

        );

    }


    /*
       Generar filas de productos.
    */

    function generarProductosHTML(
        productos
    ) {

        return productos.map(
            item => {

                const cantidad =
                    Number(
                        item.cantidad || 0
                    );


                /*
                   Precio normal histórico.

                   Este es el precio que tenía
                   el producto antes de aplicar
                   la oferta.
                */

                const precioNormal =
                    Number(
                        item.precio_normal ??
                        item.precio ??
                        0
                    );


                /*
                   Precio de oferta histórico.

                   Puede ser NULL cuando el producto
                   no tenía oferta.
                */

                const precioOferta =
                    Number(
                        item.precio_oferta ?? 0
                    );


                /*
                   Precio realmente cobrado.

                   Este es el precio que debe utilizarse
                   para calcular el total.
                */

                const precioFinal =
                    Number(
                        item.precio ??
                        precioOferta ??
                        precioNormal ??
                        0
                    );


                /*
                   Descuento por unidad.

                   Si no existe en la base de datos,
                   se calcula automáticamente.
                */

                const descuentoUnitario =
                    Math.max(
                        0,
                        Number(
                            item.descuento_unitario ??
                            (
                                precioNormal -
                                precioFinal
                            )
                        )
                    );


                /*
                   Descuento total del producto.

                   Si no existe en la base de datos,
                   se calcula con cantidad.
                */

                const descuentoTotal =
                    Math.max(
                        0,
                        Number(
                            item.descuento_total ??
                            (
                                descuentoUnitario *
                                cantidad
                            )
                        )
                    );


                /*
                   Porcentaje de oferta.

                   Primero utiliza el valor guardado
                   en la base de datos.

                   Si no existe, lo calcula.
                */

                const porcentajeOferta =
                    Number(
                        item.oferta ??
                        (
                            precioNormal > 0 &&
                            descuentoUnitario > 0
                                ? (
                                    (
                                        descuentoUnitario /
                                        precioNormal
                                    ) * 100
                                )
                                : 0
                        )
                    );


                /*
                   Total del producto.

                   Utiliza el subtotal histórico
                   guardado en pedido_items.
                */

                const subtotal =
                    Number(
                        item.subtotal ??
                        (
                            cantidad *
                            precioFinal
                        ) ??
                        0
                    );


                /*
                   Determinar si el producto
                   realmente tuvo una oferta.
                */

                const tieneOferta =
                    descuentoUnitario > 0 &&
                    precioNormal > precioFinal;


                return `

                    <tr>

                        <td class="codigo">

                            ${escaparHTML(
                                obtenerCodigoItem(
                                    item
                                )
                            )}

                        </td>


                        <td class="cantidad">

                            ${cantidad}

                        </td>


                        <td class="medida">

                            ${escaparHTML(
                                obtenerMedidaItem(
                                    item
                                )
                            )}

                        </td>


                        <td class="producto">

                            <strong>

                                ${escaparHTML(
                                    item.producto_nombre ||
                                    "Producto"
                                )}

                            </strong>


                            ${
                                item.producto_marca
                                    ? `
                                        <span class="marca-producto">

                                            ${escaparHTML(
                                                item.producto_marca
                                            )}

                                        </span>
                                      `
                                    : ""
                            }

                        </td>


                        <!-- =========================
                             PRECIO NORMAL
                        ========================== -->

                        <td class="numero">

                            ${
                                tieneOferta
                                    ? `
                                        <span class="precio-normal-tachado">

                                            Q ${formatearDinero(
                                                precioNormal
                                            )}

                                        </span>
                                      `
                                    : `
                                        Q ${formatearDinero(
                                            precioNormal
                                        )}
                                      `
                            }

                        </td>


                        <!-- =========================
                             OFERTA
                        ========================== -->

                        <td class="numero oferta">

                            ${
                                tieneOferta
                                    ? `
                                        <strong class="precio-oferta">

                                            Q ${formatearDinero(
                                                precioOferta > 0
                                                    ? precioOferta
                                                    : precioFinal
                                            )}

                                        </strong>
                                      `
                                    : `
                                        <span class="sin-oferta">
                                            —
                                        </span>
                                      `
                            }

                        </td>


                        <!-- =========================
                             DESCUENTO
                        ========================== -->

                        <td class="numero descuento">

                            ${
                                tieneOferta
                                    ? `
                                        <strong class="porcentaje-oferta">

                                            ${porcentajeOferta.toFixed(0)}%

                                        </strong>

                                        <span class="descuento-unitario">

                                            -Q ${formatearDinero(
                                                descuentoUnitario
                                            )}

                                        </span>
                                      `
                                    : `
                                        <span class="sin-oferta">
                                            —
                                        </span>
                                      `
                            }

                        </td>


                        <!-- =========================
                             PRECIO FINAL
                        ========================== -->

                        <td class="numero precio-final">

                            <strong>

                                Q ${formatearDinero(
                                    precioFinal
                                )}

                            </strong>

                        </td>


                        <!-- =========================
                             TOTAL
                        ========================== -->

                        <td class="numero total-producto">

                            Q ${formatearDinero(
                                subtotal
                            )}

                        </td>

                    </tr>

                `;

            }
        ).join("");

    }


    /*
       Generar logos de las 8 marcas.
    */

    const marcasHTML =
        MARCAS_FACTURA_SAN_MARTIN
            .slice(
                0,
                8
            )
            .map(
                (
                    ruta,
                    indice
                ) =>
                    crearLogoMarcaFactura(
                        ruta,
                        indice
                    )
            )
            .join("");


    /*
       Generar todas las páginas.
    */

    const paginasHTML =
        paginas.map(
            (
                productos,
                indicePagina
            ) => {

                const esUltimaPagina =
                    indicePagina ===
                    paginas.length - 1;


                return `

                    <section class="factura-page">

                        <!-- =================================
                             ENCABEZADO
                        ================================== -->

                        <header class="factura-header">


                            <!-- IZQUIERDA -->

                            <div class="empresa-info">

                                <div class="empresa-nombre">
                                    San Martín
                                </div>


                                <div>
                                    5ta calle 7-01,
                                    Colonia Belén,
                                    Av. La Brigada,
                                    Zona 7 de Mixco,
                                    Cdad. de Guatemala.
                                </div>


                                <div>
                                    Tel: 49027035
                                </div>


                                <div>
                                    Horario:
                                    Lunes a Domingo:
                                    7:00 AM - 8:00 PM
                                </div>

                            </div>


                            <!-- CENTRO -->

                            <div class="logo-central">

                                <img
                                    src="${escaparAtributo(
                                        LOGO_FACTURA_URL
                                    )}"
                                    alt="Logotipo San Martín"
                                >


                                <div class="logo-nombre">
                                    San Martín
                                </div>


                                <div class="logo-subtitulo">
                                    Papelería y Librería
                                </div>

                            </div>


                            <!-- DERECHA -->

                            <div class="documento-info">

                                <div class="documento-titulo">
                                    ${
                                        pedido.tipo_documento ||
                                        "PEDIDO"
                                    }
                                </div>


                                <div class="documento-linea">

                                    Serie:
                                    <strong>
                                        ${
                                            pedido.serie ||
                                            "SM"
                                        }
                                    </strong>

                                </div>


                                <div class="documento-linea">

                                    No.:
                                    <strong>
                                        ${escaparHTML(
                                            numeroPedido
                                        )}
                                    </strong>

                                </div>


                                <div class="documento-linea">

                                    Ref.:
                                    <strong>
                                        ${escaparHTML(
                                            referencia
                                        )}
                                    </strong>

                                </div>


                                <div class="estado-factura">

                                    ${escaparHTML(
                                        estado
                                    )}

                                </div>

                            </div>

                        </header>


                        <!-- =================================
                             INFORMACIÓN DEL DOCUMENTO
                        ================================== -->

                        <section class="informacion-documento">

                            <div class="info-linea">

                                <span>
                                    Fecha de impresión:
                                </span>

                                <strong>
                                    ${escaparHTML(
                                        fechaImpresion
                                    )}
                                </strong>

                            </div>


                            <div class="info-linea">

                                <span>
                                    Fecha del pedido:
                                </span>

                                <strong>
                                    ${escaparHTML(
                                        fechaPedido
                                    )}
                                </strong>

                            </div>


                            <div class="info-linea">

                                <span>
                                    Cliente:
                                </span>

                                <strong>
                                    ${escaparHTML(
                                        pedido.nombre_receptor ||
                                        "—"
                                    )}
                                </strong>

                            </div>


                            <div class="info-linea">

                                <span>
                                    Dirección:
                                </span>

                                <strong>
                                    ${escaparHTML(
                                        direccionCliente ||
                                        "—"
                                    )}
                                </strong>

                            </div>


                            <div class="info-doble">

                                <div>

                                    <span>
                                        No. de pedido:
                                    </span>

                                    <strong>
                                        ${escaparHTML(
                                            numeroPedido
                                        )}
                                    </strong>

                                </div>


                                <div>

                                    <span>
                                        Teléfono:
                                    </span>

                                    <strong>
                                        ${escaparHTML(
                                            pedido.telefono ||
                                            "—"
                                        )}
                                    </strong>

                                </div>

                            </div>


                            <div class="info-linea">

                                <span>
                                    Forma de pago:
                                </span>

                                <strong>
                                    ${escaparHTML(
                                        formatearMetodoPago(
                                            pedido.metodo_pago
                                        )
                                    )}
                                </strong>

                            </div>


                            ${
                                pedido.referencia
                                    ? `
                                        <div class="info-linea">

                                            <span>
                                                Referencia:
                                            </span>

                                            <strong>
                                                ${escaparHTML(
                                                    pedido.referencia
                                                )}
                                            </strong>

                                        </div>
                                      `
                                    : ""
                            }

                        </section>


                        <!-- =================================
                             PRODUCTOS
                        ================================== -->

                        <section class="productos-seccion">

                            <table>

                                <thead>

                                    <tr>

                                        <th class="codigo">
                                            Código
                                        </th>

                                        <th class="cantidad">
                                            Cant.
                                        </th>

                                        <th class="medida">
                                            Medida
                                        </th>

                                        <th class="producto">
                                            Nombre del producto
                                        </th>

                                        <th class="numero">
                                            Precio normal
                                        </th>

                                        <th class="numero">
                                            Oferta
                                        </th>

                                        <th class="numero">
                                            Desc.
                                        </th>

                                        <th class="numero">
                                            Precio final
                                        </th>

                                        <th class="numero">
                                            Total
                                        </th>

                                    </tr>

                                </thead>


                                <tbody>

                                    ${
                                        generarProductosHTML(
                                            productos
                                        )
                                    }

                                </tbody>

                            </table>

                        </section>


                        ${
                            !esUltimaPagina
                                ? `
                                    <div class="continuacion">

                                        Continúa en la siguiente página...

                                    </div>
                                  `
                                : ""
                        }


                        ${
                            esUltimaPagina
                                ? `

                                    <!-- =========================
                                         TOTALES
                                    ========================== -->

                                    <section class="totales-area">


                                        <div class="total-letras">

                                            <div class="total-letras-titulo">
                                                TOTAL EN LETRAS
                                            </div>


                                            <div class="total-letras-texto">

                                                ${escaparHTML(
                                                    totalEnLetras
                                                )}

                                            </div>

                                        </div>


                                        <div class="totales-numericos">


                                            <div class="total-fila">

                                                <span>
                                                    Subtotal
                                                </span>

                                                <strong>
                                                    Q ${formatearDinero(
                                                        pedido.subtotal
                                                    )}
                                                </strong>

                                            </div>


                                            <div class="total-fila">

                                                <span>
                                                    Envío
                                                </span>

                                                <strong>
                                                    Q ${formatearDinero(
                                                        pedido.costo_envio
                                                    )}
                                                </strong>

                                            </div>


                                            <div class="total-final">

                                                <span>
                                                    TOTAL
                                                </span>

                                                <strong>
                                                    Q ${formatearDinero(
                                                        pedido.total
                                                    )}
                                                </strong>

                                            </div>

                                        </div>

                                    </section>


                                    <!-- =========================
                                         MARCAS
                                    ========================== -->

                                    <section class="marcas-seccion">

                                        <div class="marcas-titulo">
                                            Marcas que encontrarás en San Martín
                                        </div>


                                        <div class="marcas-grid">

                                            ${marcasHTML}

                                        </div>

                                    </section>


                                    <!-- =========================
                                         PIE
                                    ========================== -->

                                    <footer class="factura-footer">

                                        <div class="gracias">
                                            Gracias por comprar en
                                            San Martín.
                                        </div>


                                        <div class="footer-web">
                                            sanmartingt.github.io/sanmartin.gt.com/
                                        </div>


                                        <div class="footer-email">
                                            sanmartinlibreriaapeleria@gmail.com
                                        </div>

                                    </footer>

                                  `
                                : ""
                        }


                        <div class="numero-pagina">

                            Página
                            ${indicePagina + 1}
                            de
                            ${paginas.length}

                        </div>

                    </section>

                `;

            }
        ).join("");


    /*
       Abrir ventana.
    */

    const ventana =
        window.open(
            "",
            "_blank",
            "width=1000,height=800"
        );


    if (!ventana) {

        alert(
            "El navegador bloqueó la ventana de impresión. Permite ventanas emergentes para este sitio."
        );

        return;

    }


    ventana.document.write(`

        <!DOCTYPE html>

        <html lang="es">

        <head>

            <meta charset="UTF-8">


            <meta
                name="viewport"
                content="width=device-width, initial-scale=1.0"
            >


            <title>

                San Martín -
                ${escaparHTML(
                    numeroPedido
                )}

            </title>


            <style>

                * {
                    box-sizing: border-box;
                }


                @page {

                    size: A4;

                    margin: 10mm;

                }


                html,
                body {

                    margin: 0;

                    padding: 0;

                    background: #ffffff;

                    color: #222;

                    font-family:
                        Arial,
                        Helvetica,
                        sans-serif;

                }


                body {

                    font-size: 11px;

                }


                .factura-page {

                    position: relative;

                    width: 100%;

                    min-height: 277mm;

                    padding:
                        3mm
                        1mm
                        12mm
                        1mm;

                    page-break-after:
                        always;

                }


                .factura-page:last-child {

                    page-break-after:
                        auto;

                }


                /* =====================================
                   ENCABEZADO
                ====================================== */

                .factura-header {

                    display: grid;

                    grid-template-columns:
                        1fr
                        180px
                        1fr;

                    align-items:
                        center;

                    gap:
                        15px;

                    padding-bottom:
                        12px;

                    border-bottom:
                        2px solid #173f35;

                }


                .empresa-info {

                    line-height:
                        1.45;

                    color:
                        #444;

                }


                .empresa-nombre {

                    font-size:
                        20px;

                    font-weight:
                        800;

                    color:
                        #173f35;

                    margin-bottom:
                        5px;

                }


                .empresa-info div {

                    margin-bottom:
                        2px;

                }


                .logo-central {

                    text-align:
                        center;

                }


                .logo-central img {

                    width:
                        80px;

                    height:
                        70px;

                    object-fit:
                        contain;

                    display:
                        block;

                    margin:
                        0 auto 4px;

                }


                .logo-nombre {

                    font-size:
                        16px;

                    font-weight:
                        800;

                    color:
                        #173f35;

                }


                .logo-subtitulo {

                    font-size:
                        10px;

                    color:
                        #555;

                    margin-top:
                        2px;

                }


                .documento-info {

                    text-align:
                        right;

                    line-height:
                        1.55;

                    color:
                        #444;

                }


                .documento-titulo {

                    font-size:
                        16px;

                    font-weight:
                        800;

                    color:
                        #173f35;

                    margin-bottom:
                        4px;

                }


                .documento-linea strong {

                    color:
                        #111;

                }


                .estado-factura {

                    display:
                        inline-block;

                    margin-top:
                        5px;

                    padding:
                        4px 10px;

                    border:
                        1px solid #173f35;

                    border-radius:
                        20px;

                    color:
                        #173f35;

                    font-weight:
                        700;

                }


                /* =====================================
                   INFORMACIÓN
                ====================================== */

                .informacion-documento {

                    margin-top:
                        13px;

                    border:
                        1px solid #d9d9d9;

                    border-radius:
                        6px;

                    padding:
                        10px 12px;

                    background:
                        #fafafa;

                }


                .info-linea {

                    display:
                        grid;

                    grid-template-columns:
                        145px
                        1fr;

                    gap:
                        10px;

                    padding:
                        3px 0;

                }


                .info-linea span,
                .info-doble span {

                    color:
                        #666;

                }


                .info-linea strong,
                .info-doble strong {

                    color:
                        #222;

                    font-weight:
                        600;

                }


                .info-doble {

                    display:
                        grid;

                    grid-template-columns:
                        1fr 1fr;

                    gap:
                        20px;

                    padding:
                        3px 0;

                }


                .info-doble > div {

                    display:
                        grid;

                    grid-template-columns:
                        100px 1fr;

                    gap:
                        8px;

                }


                /* =====================================
                   PRODUCTOS
                ====================================== */

                .productos-seccion {

                    margin-top:
                        15px;

                }


                table {

                    width:
                        100%;

                    border-collapse:
                        collapse;

                    table-layout:
                        fixed;

                }


                th {

                    background:
                        #173f35;

                    color:
                        #ffffff;

                    font-size:
                        8px;

                    text-transform:
                        uppercase;

                    padding:
                        8px 4px;

                    border:
                        1px solid #173f35;

                    white-space:
                        nowrap;

                }


                td {

                    border:
                        1px solid #dcdcdc;

                    padding:
                        7px 4px;

                    vertical-align:
                        middle;

                    font-size:
                        8.8px;

                }


                tbody tr:nth-child(even) {

                    background:
                        #fafafa;

                }


                .codigo {

                    width:
                        58px;

                    text-align:
                        center;

                }


                .cantidad {

                    width:
                        42px;

                    text-align:
                        center;

                }


                .medida {

                    width:
                        55px;

                    text-align:
                        center;

                }


                .producto {

                    width:
                        auto;

                    text-align:
                        left;

                }


                /*
                   Columnas monetarias.

                   Se redujeron ligeramente para que
                   las nuevas columnas puedan entrar
                   manteniendo el diseño original.
                */

                .numero {

                    width:
                        66px;

                    text-align:
                        right;

                    white-space:
                        nowrap;

                }


                /*
                   Precio normal.
                */

                .precio-normal-tachado {

                    color:
                        #777;

                    text-decoration:
                        line-through;

                }


                /*
                   Precio de oferta.
                */

                .oferta {

                    color:
                        #173f35;

                }


                .precio-oferta {

                    color:
                        #173f35;

                    font-weight:
                        800;

                }


                /*
                   Descuento.
                */

                .descuento {

                    text-align:
                        center;

                }


                .porcentaje-oferta {

                    display:
                        block;

                    color:
                        #173f35;

                    font-weight:
                        800;

                }


                .descuento-unitario {

                    display:
                        block;

                    margin-top:
                        2px;

                    color:
                        #777;

                    font-size:
                        7px;

                }


                .sin-oferta {

                    color:
                        #aaa;

                }


                /*
                   Precio final.
                */

                .precio-final {

                    font-weight:
                        700;

                }


                /*
                   Total del producto.
                */

                .total-producto {

                    font-weight:
                        700;

                }


                .marca-producto {

                    display:
                        block;

                    margin-top:
                        2px;

                    color:
                        #777;

                    font-size:
                        8px;

                }


                /* =====================================
                   CONTINUACIÓN
                ====================================== */

                .continuacion {

                    margin-top:
                        15px;

                    padding:
                        8px;

                    text-align:
                        center;

                    border:
                        1px dashed #aaa;

                    color:
                        #666;

                    font-style:
                        italic;

                }


                /* =====================================
                   TOTALES
                ====================================== */

                .totales-area {

                    display:
                        grid;

                    grid-template-columns:
                        1fr
                        250px;

                    gap:
                        25px;

                    margin-top:
                        18px;

                    align-items:
                        stretch;

                }


                .total-letras {

                    border:
                        1px solid #d7d7d7;

                    border-radius:
                        6px;

                    padding:
                        12px;

                }


                .total-letras-titulo {

                    font-size:
                        9px;

                    font-weight:
                        800;

                    color:
                        #666;

                    margin-bottom:
                        7px;

                }


                .total-letras-texto {

                    font-size:
                        11px;

                    font-weight:
                        700;

                    line-height:
                        1.5;

                    text-transform:
                        uppercase;

                }


                .totales-numericos {

                    border:
                        1px solid #d7d7d7;

                    border-radius:
                        6px;

                    padding:
                        8px 12px;

                }


                .total-fila {

                    display:
                        flex;

                    justify-content:
                        space-between;

                    padding:
                        5px 0;

                    border-bottom:
                        1px solid #eeeeee;

                }


                .total-final {

                    display:
                        flex;

                    justify-content:
                        space-between;

                    align-items:
                        center;

                    margin-top:
                        6px;

                    padding:
                        10px 0 3px;

                    color:
                        #173f35;

                    font-size:
                        17px;

                    font-weight:
                        800;

                }


                /* =====================================
                   MARCAS
                ====================================== */

                .marcas-seccion {

                    margin-top:
                        22px;

                    padding-top:
                        10px;

                    border-top:
                        1px solid #ddd;

                }


                .marcas-titulo {

                    text-align:
                        center;

                    font-size:
                        9px;

                    color:
                        #777;

                    margin-bottom:
                        8px;

                }


                .marcas-grid {

                    display:
                        grid;

                    grid-template-columns:
                        repeat(
                            8,
                            1fr
                        );

                    align-items:
                        center;

                    gap:
                        8px;

                }


                .brand-logo {

                    height:
                        34px;

                    display:
                        flex;

                    align-items:
                        center;

                    justify-content:
                        center;

                }


                .brand-logo img {

                    max-width:
                        65px;

                    max-height:
                        30px;

                    object-fit:
                        contain;

                }


                /* =====================================
                   PIE
                ====================================== */

                .factura-footer {

                    margin-top:
                        14px;

                    padding-top:
                        10px;

                    border-top:
                        1px solid #ddd;

                    text-align:
                        center;

                    line-height:
                        1.55;

                    color:
                        #666;

                }


                .gracias {

                    font-size:
                        11px;

                    color:
                        #333;

                    font-weight:
                        600;

                }


                .footer-marca {

                    margin-top:
                        3px;

                    font-weight:
                        800;

                    color:
                        #173f35;

                }


                .footer-web,
                .footer-email {

                    font-size:
                        9px;

                }


                .numero-pagina {

                    position:
                        absolute;

                    bottom:
                        2mm;

                    right:
                        2mm;

                    font-size:
                        8px;

                    color:
                        #888;

                }


                /* =====================================
                   IMPRESIÓN
                ====================================== */

                @media print {

                    html,
                    body {

                        width:
                            210mm;

                        background:
                            #fff;

                    }


                    .factura-page {

                        min-height:
                            277mm;

                    }

                }

            </style>

        </head>


        <body>

            ${paginasHTML}


            <script>

                window.onload = function() {

                    setTimeout(
                        function() {

                            window.print();

                        },
                        400
                    );

                };

            <\/script>


        </body>

        </html>

    `);


    ventana.document.close();

}