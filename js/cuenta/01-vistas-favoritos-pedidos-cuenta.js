/* =====================================================
   SAN MARTÍN
   01-vistas-favoritos-pedidos-cuenta.js

   CONTROL DE VISTAS
   FAVORITOS
   PEDIDOS
===================================================== */


/* =====================================================
   MOSTRAR UNA VISTA PRINCIPAL DE CUENTA
===================================================== */

function mostrarVistaCuenta(vista) {

    const menuCuenta =
        document.querySelector(".cuenta-menu");


    /* =================================================
       OCULTAR TODAS LAS VISTAS PRINCIPALES
    ================================================= */

    if (cuentaAcceso) {
        cuentaAcceso.hidden = true;
    }

    if (formularioLogin) {
        formularioLogin.hidden = true;
    }

    if (formularioRegistro) {
        formularioRegistro.hidden = true;
    }

    if (formularioRecuperacion) {
        formularioRecuperacion.hidden = true;
    }

    if (cuentaUsuario) {
        cuentaUsuario.hidden = true;
    }


    /* =================================================
       OCULTAR TODAS LAS SUBVISTAS
    ================================================= */

    if (misDatos) {
        misDatos.hidden = true;
    }

    if (misDirecciones) {
        misDirecciones.hidden = true;
    }

    if (misPedidos) {
        misPedidos.hidden = true;
    }

    if (misFavoritos) {
        misFavoritos.hidden = true;
    }


    /* =================================================
       RESTABLECER VISTAS INTERNAS DE PEDIDOS
    ================================================= */

    if (listaPedidosVista) {
        listaPedidosVista.hidden = false;
    }

    if (detallePedidoVista) {
        detallePedidoVista.hidden = true;
    }


    if (contenidoDetallePedido) {
        contenidoDetallePedido.innerHTML = "";
    }


    /* =================================================
       OCULTAR MENÚ DE CUENTA

       Se volverá a mostrar solamente cuando
       la vista sea "usuario".
    ================================================= */

    if (menuCuenta) {
        menuCuenta.hidden = true;
    }


    /* =================================================
       MOSTRAR VISTA SOLICITADA
    ================================================= */

    switch (vista) {


        /* =============================================
           ACCESO
        ============================================= */

        case "acceso":

            if (cuentaAcceso) {
                cuentaAcceso.hidden = false;
            }

            break;


        /* =============================================
           LOGIN
        ============================================= */

        case "login":

            if (formularioLogin) {
                formularioLogin.hidden = false;
            }

            break;


        /* =============================================
           REGISTRO
        ============================================= */

        case "registro":

            if (formularioRegistro) {
                formularioRegistro.hidden = false;
            }

            break;


        /* =============================================
           RECUPERACIÓN
        ============================================= */

        case "recuperacion":

            if (formularioRecuperacion) {
                formularioRecuperacion.hidden = false;
            }

            break;


        /* =============================================
           USUARIO AUTENTICADO
        ============================================= */

        case "usuario":

            if (cuentaUsuario) {
                cuentaUsuario.hidden = false;
            }

            /*
             * IMPORTANTE:
             *
             * Cada vez que la cuenta del usuario
             * vuelva a mostrarse, el menú principal
             * debe quedar visible.
             */

            if (menuCuenta) {
                menuCuenta.hidden = false;
            }

            break;


        /* =============================================
           VISTA DESCONOCIDA
        ============================================= */

        default:

            console.warn(
                "Vista de cuenta desconocida:",
                vista
            );

            break;

    }

}


/* =====================================================
   MOSTRAR UNA SUBVISTA DE LA CUENTA
=====================================================

   Subvistas disponibles:

   - menu
   - favoritos
   - pedidos
   - datos
   - direcciones

   Esta función evita que cada módulo tenga que
   manipular manualmente todos los elementos .hidden.
===================================================== */

function mostrarSubvistaCuenta(subvista) {

    const menuCuenta =
        document.querySelector(".cuenta-menu");


    /* =================================================
       LA CUENTA PRINCIPAL DEBE ESTAR VISIBLE
    ================================================= */

    if (cuentaUsuario) {
        cuentaUsuario.hidden = false;
    }


    /* =================================================
       OCULTAR TODAS LAS SUBVISTAS
    ================================================= */

    if (misDatos) {
        misDatos.hidden = true;
    }

    if (misDirecciones) {
        misDirecciones.hidden = true;
    }

    if (misPedidos) {
        misPedidos.hidden = true;
    }

    if (misFavoritos) {
        misFavoritos.hidden = true;
    }


    /* =================================================
       ESTADO NORMAL DE PEDIDOS
    ================================================= */

    if (listaPedidosVista) {
        listaPedidosVista.hidden = false;
    }

    if (detallePedidoVista) {
        detallePedidoVista.hidden = true;
    }


    if (contenidoDetallePedido) {
        contenidoDetallePedido.innerHTML = "";
    }


    /* =================================================
       MENSAJES
    ================================================= */

    if (mensajeCuenta) {
        mensajeCuenta.textContent = "";
    }


    if (mensajePedidos) {
        mensajePedidos.textContent = "";
    }


    /* =================================================
       MOSTRAR SUBVISTA
    ================================================= */

    switch (subvista) {


        /* =============================================
           MENÚ PRINCIPAL
        ============================================= */

        case "menu":

            if (menuCuenta) {
                menuCuenta.hidden = false;
            }

            break;


        /* =============================================
           FAVORITOS
        ============================================= */

        case "favoritos":

            if (menuCuenta) {
                menuCuenta.hidden = true;
            }

            if (misFavoritos) {
                misFavoritos.hidden = false;
            }

            break;


        /* =============================================
           PEDIDOS
        ============================================= */

        case "pedidos":

            if (menuCuenta) {
                menuCuenta.hidden = true;
            }

            if (misPedidos) {
                misPedidos.hidden = false;
            }

            break;


        /* =============================================
           DATOS
        ============================================= */

        case "datos":

            if (menuCuenta) {
                menuCuenta.hidden = true;
            }

            if (misDatos) {
                misDatos.hidden = false;
            }

            break;


        /* =============================================
           DIRECCIONES
        ============================================= */

        case "direcciones":

            if (menuCuenta) {
                menuCuenta.hidden = true;
            }

            if (misDirecciones) {
                misDirecciones.hidden = false;
            }

            break;


        /* =============================================
           SUBVISTA DESCONOCIDA
        ============================================= */

        default:

            console.warn(
                "Subvista de cuenta desconocida:",
                subvista
            );

            if (menuCuenta) {
                menuCuenta.hidden = false;
            }

            break;

    }

}


/* =====================================================
   MOSTRAR MIS FAVORITOS
===================================================== */


/* =====================================================
   OBTENER PRODUCTOS FAVORITOS
===================================================== */

function obtenerProductosFavoritos() {

    if (
        typeof productos === "undefined" ||
        typeof productoEsFavorito !== "function"
    ) {
        return [];
    }


    return productos.filter(
        producto =>
            productoEsFavorito(
                producto.codigo
            )
    );

}


/* =====================================================
   ESTADO VACÍO DE FAVORITOS
===================================================== */

function mostrarEstadoVacioFavoritos() {

    if (!listaFavoritos) {
        return;
    }


    listaFavoritos.innerHTML = `

        <div class="favoritos-vacios">

            <span aria-hidden="true">
                ♡
            </span>

            <h4>
                Aún no tienes favoritos
            </h4>

            <p>
                Guarda productos con el corazón del catálogo
                y aparecerán aquí.
            </p>

        </div>

    `;

}


/* =====================================================
   ABRIR PRODUCTO DESDE FAVORITOS
===================================================== */

function abrirProductoDesdeFavoritos(
    producto
) {

    if (!producto) {
        return;
    }


    const buscadorCatalogo =
        document.getElementById(
            "search"
        );


    if (buscadorCatalogo) {

        buscadorCatalogo.value =
            String(
                producto.codigo
            );


        buscadorCatalogo.dispatchEvent(
            new Event(
                "input",
                {
                    bubbles: true
                }
            )
        );

    }


    document
        .getElementById("catalogo")
        ?.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

}


/* =====================================================
   RENDERIZAR MIS FAVORITOS
===================================================== */

function renderizarMisFavoritos() {

    if (!listaFavoritos) {
        return;
    }


    const productosFavoritos =
        obtenerProductosFavoritos();


    /* =================================================
       SIN FAVORITOS
    ================================================= */

    if (
        productosFavoritos.length === 0
    ) {

        mostrarEstadoVacioFavoritos();

        return;

    }


    /* =================================================
       LIMPIAR LISTA
    ================================================= */

    listaFavoritos.innerHTML = "";


    /* =================================================
       CREAR TARJETAS
    ================================================= */

    productosFavoritos.forEach(
        producto => {

            const tarjeta =
                document.createElement(
                    "article"
                );


            tarjeta.className =
                "tarjeta-favorito";


            const precio =
                Number(
                    producto.precio
                );


            tarjeta.innerHTML = `

                <div class="tarjeta-favorito-imagen">

                    ${
                        producto.imagen

                            ? `

                                <img
                                    src="${producto.imagen}"
                                    alt="${producto.nombre}"
                                >

                              `

                            : `

                                <span aria-hidden="true">
                                    ${
                                        producto.icono ||
                                        "📦"
                                    }
                                </span>

                              `
                    }


                    <button
                        type="button"
                        class="btn-favorito-producto activo"
                        data-codigo="${producto.codigo}"
                        aria-label="Quitar de favoritos"
                        title="Quitar de favoritos"
                    >
                        ♥
                    </button>

                </div>


                <div class="tarjeta-favorito-contenido">

                    <p class="tarjeta-favorito-categoria">

                        ${
                            producto.categoria ||
                            "Producto"
                        }

                    </p>


                    <h4>
                        ${producto.nombre}
                    </h4>


                    <p class="tarjeta-favorito-marca">

                        ${
                            producto.marca ||
                            "San Martín"
                        }

                    </p>


                    <p class="tarjeta-favorito-precio">

                        ${
                            Number.isFinite(
                                precio
                            )

                                ? `Q${precio.toFixed(2)}`

                                : "Precio por consultar"

                        }

                    </p>


                    <p class="tarjeta-favorito-codigo">

                        Código:
                        ${producto.codigo}

                    </p>


                    <button
                        type="button"
                        class="btn-ver-favorito"
                    >
                        Ver en el catálogo
                    </button>

                </div>

            `;


            /* =========================================
               BOTÓN QUITAR FAVORITO
            ========================================= */

            const botonQuitar =
                tarjeta.querySelector(
                    ".btn-favorito-producto"
                );


            botonQuitar?.addEventListener(
                "click",
                async () => {

                    await cambiarFavorito(
                        producto,
                        botonQuitar
                    );

                }
            );


            /* =========================================
               BOTÓN VER PRODUCTO
            ========================================= */

            tarjeta
                .querySelector(
                    ".btn-ver-favorito"
                )
                ?.addEventListener(
                    "click",
                    () => {

                        abrirProductoDesdeFavoritos(
                            producto
                        );

                    }
                );


            listaFavoritos.appendChild(
                tarjeta
            );

        }
    );

}


/* =====================================================
   CARGAR MIS FAVORITOS
===================================================== */

async function cargarMisFavoritos() {

    if (!listaFavoritos) {
        return;
    }


    listaFavoritos.innerHTML = `

        <p class="favoritos-cargando">
            Cargando tus favoritos...
        </p>

    `;


    if (
        typeof cargarFavoritosUsuario !==
        "function"
    ) {

        listaFavoritos.innerHTML = `

            <p class="favoritos-error">
                No fue posible cargar tus favoritos.
            </p>

        `;

        return;

    }


    try {

        await cargarFavoritosUsuario();

        renderizarMisFavoritos();

    } catch (error) {

        console.error(
            "Error cargando favoritos:",
            error
        );


        listaFavoritos.innerHTML = `

            <p class="favoritos-error">
                No fue posible cargar tus favoritos.
            </p>

        `;

    }

}


/* =====================================================
   BOTÓN MIS FAVORITOS
===================================================== */

if (btnMisFavoritos) {

    btnMisFavoritos.addEventListener(
        "click",
        async () => {

            mostrarSubvistaCuenta(
                "favoritos"
            );


            await cargarMisFavoritos();

        }
    );

}


/* =====================================================
   VOLVER A MI CUENTA DESDE FAVORITOS
===================================================== */

if (btnVolverCuentaFavoritos) {

    btnVolverCuentaFavoritos.addEventListener(
        "click",
        () => {

            mostrarSubvistaCuenta(
                "menu"
            );

        }
    );

}


/* =====================================================
   ACTUALIZAR FAVORITOS EN TIEMPO REAL
===================================================== */

document.addEventListener(
    "favoritos:actualizados",
    () => {

        if (
            misFavoritos &&
            !misFavoritos.hidden
        ) {

            renderizarMisFavoritos();

        }

    }
);


/* =====================================================
   MOSTRAR MIS PEDIDOS
===================================================== */

if (btnMisPedidos) {

    btnMisPedidos.addEventListener(
        "click",
        async () => {

            mostrarSubvistaCuenta(
                "pedidos"
            );


            await cargarMisPedidos();

        }
    );

}


/* =====================================================
   CARGAR MIS PEDIDOS
===================================================== */

async function cargarMisPedidos() {

    if (!listaPedidos) {
        return;
    }


    listaPedidos.innerHTML = `

        <p>
            Cargando tus pedidos...
        </p>

    `;


    /* =================================================
       OBTENER USUARIO
    ================================================= */

    const {

        data: {
            user
        },

        error:
            errorUsuario

    } =
        await supabaseAuth.auth.getUser();


    if (
        errorUsuario ||
        !user
    ) {

        listaPedidos.innerHTML = `

            <p>
                Tu sesión ha expirado.
                Inicia sesión nuevamente.
            </p>

        `;

        return;

    }


    /* =================================================
       OBTENER PEDIDOS
    ================================================= */

    const {

        data: pedidos,

        error

    } =
        await supabaseAuth

            .from("pedidos")

            .select(`
                id,
                estado,
                subtotal,
                costo_envio,
                total,
                cantidad_productos,
                metodo_pago,
                nombre_direccion,
                nombre_receptor,
                telefono,
                departamento,
                municipio,
                direccion,
                referencia,
                creado_en,
                actualizado_en
            `)

            .eq(
                "usuario_id",
                user.id
            )

            .order(
                "id",
                {
                    ascending: false
                }
            );


    /* =================================================
       ERROR
    ================================================= */

    if (error) {

        console.error(
            "Error cargando pedidos:",
            error
        );


        listaPedidos.innerHTML = `

            <p>
                No fue posible cargar tus pedidos.
            </p>

        `;

        return;

    }


    /* =================================================
       SIN PEDIDOS
    ================================================= */

    if (
        !pedidos ||
        pedidos.length === 0
    ) {

        listaPedidos.innerHTML = `

            <div class="sin-pedidos">

                <div class="sin-pedidos-icono">
                    📦
                </div>

                <h3>
                    Todavía no tienes pedidos
                </h3>

                <p>
                    Cuando realices una compra,
                    tus pedidos aparecerán aquí.
                </p>

            </div>

        `;

        return;

    }


    /* =================================================
       RENDERIZAR PEDIDOS
    ================================================= */

    listaPedidos.innerHTML =

        pedidos

            .map(
                pedido => {

                    const estado =
                        obtenerEstadoPedido(
                            pedido.estado
                        );


                    const numeroPedido =
                        obtenerNumeroPedido(
                            pedido.id
                        );


                    return `

                        <div
                            class="tarjeta-pedido"
                            data-id="${pedido.id}"
                        >

                            <div
                                class="tarjeta-pedido-cabecera"
                            >

                                <div>

                                    <h4>
                                        Pedido #

                                        ${escaparHTML(
                                            numeroPedido
                                        )}

                                    </h4>


                                    <p>

                                        ${escaparHTML(
                                            formatearFecha(
                                                pedido.creado_en
                                            )
                                        )}

                                    </p>

                                </div>


                                <div
                                    class="pedido-estado"
                                >

                                    ${estado.icono}

                                    ${escaparHTML(
                                        estado.texto
                                    )}

                                </div>

                            </div>


                            <div
                                class="tarjeta-pedido-info"
                            >

                                <div>

                                    <span>
                                        Productos
                                    </span>

                                    <strong>

                                        ${Number(
                                            pedido.cantidad_productos ||
                                            0
                                        )}

                                    </strong>

                                </div>


                                <div>

                                    <span>
                                        Total
                                    </span>

                                    <strong>

                                        ${formatearPrecio(
                                            pedido.total
                                        )}

                                    </strong>

                                </div>

                            </div>


                            <button
                                type="button"
                                class="btn-ver-pedido"
                                data-id="${pedido.id}"
                            >
                                Ver detalles
                            </button>

                        </div>

                    `;

                }
            )

            .join("");


    activarBotonesPedidos();

}


/* =====================================================
   ACTIVAR BOTONES DE PEDIDOS
===================================================== */

function activarBotonesPedidos() {

    document
        .querySelectorAll(
            ".btn-ver-pedido"
        )
        .forEach(
            boton => {

                boton.addEventListener(
                    "click",
                    async () => {

                        const id =
                            boton.dataset.id;


                        await mostrarDetallePedido(
                            id
                        );

                    }
                );

            }
        );

}


/* =====================================================
   MOSTRAR DETALLE DE PEDIDO
===================================================== */

async function mostrarDetallePedido(
    pedidoId
) {

    if (!contenidoDetallePedido) {
        return;
    }


    contenidoDetallePedido.innerHTML = `

        <p>
            Cargando pedido...
        </p>

    `;


    if (listaPedidosVista) {
        listaPedidosVista.hidden = true;
    }


    if (detallePedidoVista) {
        detallePedidoVista.hidden = false;
    }


    /* =================================================
       OBTENER USUARIO
    ================================================= */

    const {

        data: {
            user
        },

        error:
            errorUsuario

    } =
        await supabaseAuth.auth.getUser();


    if (
        errorUsuario ||
        !user
    ) {

        contenidoDetallePedido.innerHTML = `

            <p>
                Tu sesión ha expirado.
                Inicia sesión nuevamente.
            </p>

        `;

        return;

    }


    /* =================================================
       OBTENER PEDIDO
    ================================================= */

    const {

        data: pedido,

        error:
            errorPedido

    } =
        await supabaseAuth

            .from("pedidos")

            .select(`
                id,
                estado,
                subtotal,
                costo_envio,
                total,
                cantidad_productos,
                metodo_pago,
                nombre_direccion,
                nombre_receptor,
                telefono,
                departamento,
                municipio,
                direccion,
                referencia,
                creado_en,
                actualizado_en
            `)

            .eq(
                "id",
                pedidoId
            )

            .eq(
                "usuario_id",
                user.id
            )

            .single();


    /* =================================================
       ERROR DEL PEDIDO
    ================================================= */

    if (
        errorPedido ||
        !pedido
    ) {

        console.error(
            "Error obteniendo pedido:",
            errorPedido
        );


        contenidoDetallePedido.innerHTML = `

            <p>
                No fue posible encontrar este pedido.
            </p>

        `;

        return;

    }


    /* =================================================
       OBTENER PRODUCTOS DEL PEDIDO
    ================================================= */

    const {

        data: items,

        error:
            errorItems

    } =
        await supabaseAuth

            .from("pedido_items")

            .select(`
                id,
                producto_codigo,
                producto_nombre,
                producto_marca,
                producto_imagen,
                precio,
                cantidad,
                subtotal
            `)

            .eq(
                "pedido_id",
                pedido.id
            )

            .order(
                "id",
                {
                    ascending: true
                }
            );


    /* =================================================
       ERROR DE ITEMS
    ================================================= */

    if (errorItems) {

        console.error(
            "Error cargando productos del pedido:",
            errorItems
        );


        contenidoDetallePedido.innerHTML = `

            <p>
                No fue posible cargar los productos
                de este pedido.
            </p>

        `;

        return;

    }


    /* =================================================
       ESTADO
    ================================================= */

    const estado =
        obtenerEstadoPedido(
            pedido.estado
        );


    /* =================================================
       NÚMERO DE PEDIDO
    ================================================= */

    const numeroPedido =
        obtenerNumeroPedido(
            pedido.id
        );


    /* =================================================
       PRODUCTOS
    ================================================= */

    let productosHTML = "";


    if (
        !items ||
        items.length === 0
    ) {

        productosHTML = `

            <p>
                Este pedido no contiene productos.
            </p>

        `;

    } else {

        productosHTML =

            items

                .map(
                    item => {

                        const imagen =
                            item.producto_imagen
                                ? escaparHTML(
                                    item.producto_imagen
                                )
                                : "";


                        return `

                            <div
                                class="pedido-item"
                            >

                                <div
                                    class="pedido-item-imagen"
                                >

                                    ${
                                        imagen

                                            ? `

                                                <img
                                                    src="${imagen}"
                                                    alt="${escaparHTML(
                                                        item.producto_nombre
                                                    )}"
                                                >

                                              `

                                            : `

                                                <div>
                                                    📦
                                                </div>

                                              `
                                    }

                                </div>


                                <div
                                    class="pedido-item-info"
                                >

                                    <h5>

                                        ${escaparHTML(
                                            item.producto_nombre
                                        )}

                                    </h5>


                                    ${
                                        item.producto_marca

                                            ? `

                                                <p>

                                                    ${escaparHTML(
                                                        item.producto_marca
                                                    )}

                                                </p>

                                              `

                                            : ""
                                    }


                                    ${
                                        item.producto_codigo

                                            ? `

                                                <small>

                                                    Código:
                                                    ${escaparHTML(
                                                        item.producto_codigo
                                                    )}

                                                </small>

                                              `

                                            : ""
                                    }

                                </div>


                                <div
                                    class="pedido-item-cantidad"
                                >

                                    <span>
                                        Cantidad
                                    </span>

                                    <strong>

                                        ${Number(
                                            item.cantidad ||
                                            0
                                        )}

                                    </strong>

                                </div>


                                <div
                                    class="pedido-item-precio"
                                >

                                    <span>
                                        Precio
                                    </span>

                                    <strong>

                                        ${formatearPrecio(
                                            item.precio
                                        )}

                                    </strong>

                                </div>


                                <div
                                    class="pedido-item-subtotal"
                                >

                                    <span>
                                        Subtotal
                                    </span>

                                    <strong>

                                        ${formatearPrecio(
                                            item.subtotal
                                        )}

                                    </strong>

                                </div>

                            </div>

                        `;

                    }
                )

                .join("");

    }


    /* =================================================
       MÉTODO DE PAGO
    ================================================= */

    const metodoPago =
        pedido.metodo_pago ||
        "No especificado";


    /* =================================================
       DIRECCIÓN
    ================================================= */

    const direccionCompletaHTML = `

        ${
            pedido.nombre_receptor
                ? escaparHTML(
                    pedido.nombre_receptor
                )
                : ""
        }


        ${
            pedido.telefono
                ? `

                    <br>

                    Teléfono:
                    ${escaparHTML(
                        pedido.telefono
                    )}

                  `
                : ""
        }


        ${
            pedido.municipio ||
            pedido.departamento

                ? `

                    <br>

                    ${escaparHTML(
                        pedido.municipio ||
                        ""
                    )}

                    ${
                        pedido.departamento

                            ? ", " +
                              escaparHTML(
                                  pedido.departamento
                              )

                            : ""
                    }

                  `

                : ""
        }


        ${
            pedido.direccion

                ? `

                    <br>

                    ${escaparHTML(
                        pedido.direccion
                    )}

                  `

                : ""
        }


        ${
            pedido.referencia

                ? `

                    <br>

                    Referencia:
                    ${escaparHTML(
                        pedido.referencia
                    )}

                  `

                : ""
        }

    `;


    /* =================================================
       RENDERIZAR DETALLE
    ================================================= */

    contenidoDetallePedido.innerHTML = `

        <div
            class="detalle-pedido"
        >


            <!-- =====================================
                 CABECERA
            ====================================== -->

            <div
                class="detalle-pedido-cabecera"
            >

                <div>

                    <h3>

                        Pedido #

                        ${escaparHTML(
                            numeroPedido
                        )}

                    </h3>


                    <p>

                        Realizado el

                        ${escaparHTML(
                            formatearFecha(
                                pedido.creado_en
                            )
                        )}

                    </p>

                </div>


                <div
                    class="detalle-pedido-estado"
                >

                    ${estado.icono}

                    ${escaparHTML(
                        estado.texto
                    )}

                </div>

            </div>


            <!-- =====================================
                 PRODUCTOS
            ====================================== -->

            <div
                class="detalle-pedido-seccion"
            >

                <h4>
                    🛒 Productos
                </h4>


                <div
                    class="lista-pedido-items"
                >

                    ${productosHTML}

                </div>

            </div>


            <!-- =====================================
                 RESUMEN
            ====================================== -->

            <div
                class="detalle-pedido-seccion"
            >

                <h4>
                    💰 Resumen del pedido
                </h4>


                <div
                    class="pedido-totales"
                >

                    <div>

                        <span>
                            Subtotal
                        </span>

                        <strong>

                            ${formatearPrecio(
                                pedido.subtotal
                            )}

                        </strong>

                    </div>


                    <div>

                        <span>
                            Envío
                        </span>

                        <strong>

                            ${formatearPrecio(
                                pedido.costo_envio
                            )}

                        </strong>

                    </div>


                    <div
                        class="pedido-total-final"
                    >

                        <span>
                            Total
                        </span>

                        <strong>

                            ${formatearPrecio(
                                pedido.total
                            )}

                        </strong>

                    </div>

                </div>

            </div>


            <!-- =====================================
                 DIRECCIÓN
            ====================================== -->

            <div
                class="detalle-pedido-seccion"
            >

                <h4>
                    📍 Dirección de entrega
                </h4>


                <div
                    class="pedido-direccion"
                >

                    ${
                        pedido.nombre_direccion

                            ? `

                                <strong>

                                    ${escaparHTML(
                                        pedido.nombre_direccion
                                    )}

                                </strong>

                              `

                            : ""
                    }


                    <p>

                        ${direccionCompletaHTML}

                    </p>

                </div>

            </div>


            <!-- =====================================
                 PAGO
            ====================================== -->

            <div
                class="detalle-pedido-seccion"
            >

                <h4>
                    💳 Método de pago
                </h4>


                <p>

                    ${escaparHTML(
                        metodoPago
                    )}

                </p>

            </div>


            <!-- =====================================
                 ESTADO
            ====================================== -->

            <div
                class="detalle-pedido-seccion"
            >

                <h4>
                    📦 Estado del pedido
                </h4>


                <p
                    class="pedido-estado-detalle"
                >

                    ${estado.icono}

                    ${escaparHTML(
                        estado.texto
                    )}

                </p>

            </div>


        </div>

    `;

}


/* =====================================================
   VOLVER A MIS PEDIDOS
===================================================== */

if (btnVolverListaPedidos) {

    btnVolverListaPedidos.addEventListener(
        "click",
        () => {

            if (detallePedidoVista) {
                detallePedidoVista.hidden = true;
            }

            if (listaPedidosVista) {
                listaPedidosVista.hidden = false;
            }

            if (contenidoDetallePedido) {
                contenidoDetallePedido.innerHTML = "";
            }

        }
    );

}


/* =====================================================
   VOLVER A MI CUENTA DESDE PEDIDOS
===================================================== */

if (btnVolverCuentaPedidos) {

    btnVolverCuentaPedidos.addEventListener(
        "click",
        () => {

            mostrarSubvistaCuenta(
                "menu"
            );

        }
    );

}