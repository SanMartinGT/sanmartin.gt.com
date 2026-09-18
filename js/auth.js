/* =====================================================
   SAN MARTÍN
   AUTENTICACIÓN DE CLIENTES
===================================================== */


/* =====================================================
   CONFIGURACIÓN SUPABASE
===================================================== */

const supabaseAuth = supabaseClient;


/* =====================================================
   ELEMENTOS DEL HTML
===================================================== */

/* =====================================================
   CUENTA / AUTENTICACIÓN
===================================================== */

const cuentaAcceso =
    document.getElementById("cuentaAcceso");

const formularioLogin =
    document.getElementById("formularioLogin");

const formularioRegistro =
    document.getElementById("formularioRegistro");

const formularioRecuperacion =
    document.getElementById("formularioRecuperacion");

const cuentaUsuario =
    document.getElementById("cuentaUsuario");


/* =====================================================
   BOTONES DE AUTENTICACIÓN
===================================================== */

const mostrarLogin =
    document.getElementById("mostrarLogin");

const mostrarRegistro =
    document.getElementById("mostrarRegistro");

const mostrarRecuperacion =
    document.getElementById("mostrarRecuperacion");

const volverCuenta =
    document.getElementById("volverCuenta");

const volverCuentaRegistro =
    document.getElementById("volverCuentaRegistro");

const volverLogin =
    document.getElementById("volverLogin");

const btnCerrarSesion =
    document.getElementById("btnCerrarSesion");


/* =====================================================
   FORMULARIOS DE AUTENTICACIÓN
===================================================== */

const loginForm =
    document.getElementById("loginForm");

const registroForm =
    document.getElementById("registroForm");

const recuperacionForm =
    document.getElementById("recuperacionForm");


/* =====================================================
   MENSAJES DE AUTENTICACIÓN
===================================================== */

const mensajeLogin =
    document.getElementById("mensajeLogin");

const mensajeRegistro =
    document.getElementById("mensajeRegistro");

const mensajeRecuperacion =
    document.getElementById("mensajeRecuperacion");

const nombreUsuario =
    document.getElementById("nombreUsuario");

const mensajeCuenta =
    document.getElementById("mensajeCuenta");

/* =====================================================
   MIS FAVORITOS
===================================================== */

const btnMisFavoritos =
    document.getElementById("btnMisFavoritos");

const misFavoritos =
    document.getElementById("misFavoritos");

const listaFavoritos =
    document.getElementById("listaFavoritos");

const btnVolverCuentaFavoritos =
    document.getElementById("btnVolverCuentaFavoritos");

/* =====================================================
   MIS DATOS
===================================================== */

const misDatos =
    document.getElementById("misDatos");

const formularioMisDatos =
    document.getElementById("formularioMisDatos");

const btnMisDatos =
    document.getElementById("btnMisDatos");

const btnVolverCuenta =
    document.getElementById("btnVolverCuenta");

const mensajeMisDatos =
    document.getElementById("mensajeMisDatos");

const datosNombre =
    document.getElementById("datosNombre");

const datosApellido =
    document.getElementById("datosApellido");

const datosEmail =
    document.getElementById("datosEmail");

const datosTelefono =
    document.getElementById("datosTelefono");


/* =====================================================
   MIS PEDIDOS
===================================================== */

const btnMisPedidos =
    document.getElementById("btnMisPedidos");

const misPedidos =
    document.getElementById("misPedidos");

const listaPedidosVista =
    document.getElementById("listaPedidosVista");

const detallePedidoVista =
    document.getElementById("detallePedidoVista");

const listaPedidos =
    document.getElementById("listaPedidos");

const contenidoDetallePedido =
    document.getElementById("contenidoDetallePedido");

const btnVolverCuentaPedidos =
    document.getElementById("btnVolverCuentaPedidos");

const btnVolverListaPedidos =
    document.getElementById("btnVolverListaPedidos");

const mensajePedidos =
    document.getElementById("mensajePedidos");


/* =====================================================
   MIS DIRECCIONES
===================================================== */

const btnMisDirecciones =
    document.getElementById("btnMisDirecciones");

const misDirecciones =
    document.getElementById("misDirecciones");

const listaDirecciones =
    document.getElementById("listaDirecciones");

const btnAgregarDireccion =
    document.getElementById("btnAgregarDireccion");

const formularioDireccionContainer =
    document.getElementById(
        "formularioDireccionContainer"
    );

const tituloFormularioDireccion =
    document.getElementById(
        "tituloFormularioDireccion"
    );

const formularioDireccion =
    document.getElementById(
        "formularioDireccion"
    );

const direccionId =
    document.getElementById("direccionId");

const direccionNombre =
    document.getElementById("direccionNombre");

const direccionReceptor =
    document.getElementById("direccionReceptor");

const direccionTelefono =
    document.getElementById("direccionTelefono");

const direccionDepartamento =
    document.getElementById("direccionDepartamento");

const direccionMunicipio =
    document.getElementById("direccionMunicipio");

const direccionCompleta =
    document.getElementById("direccionCompleta");

const direccionReferencia =
    document.getElementById("direccionReferencia");

const direccionPrincipal =
    document.getElementById("direccionPrincipal");

const btnCancelarDireccion =
    document.getElementById(
        "btnCancelarDireccion"
    );

const btnVolverCuentaDirecciones =
    document.getElementById(
        "btnVolverCuentaDirecciones"
    );

const mensajeDireccion =
    document.getElementById("mensajeDireccion");


/* =====================================================
   MOSTRAR UNA VISTA DE CUENTA
===================================================== */

function mostrarVistaCuenta(vista) {

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
       ACCESO
    ================================================= */

    if (vista === "acceso") {

        if (cuentaAcceso) {
            cuentaAcceso.hidden = false;
        }

    }


    /* =================================================
       LOGIN
    ================================================= */

    if (vista === "login") {

        if (formularioLogin) {
            formularioLogin.hidden = false;
        }

    }


    /* =================================================
       REGISTRO
    ================================================= */

    if (vista === "registro") {

        if (formularioRegistro) {
            formularioRegistro.hidden = false;
        }

    }


    /* =================================================
       RECUPERACIÓN
    ================================================= */

    if (vista === "recuperacion") {

        if (formularioRecuperacion) {
            formularioRecuperacion.hidden = false;
        }

    }


    /* =================================================
       USUARIO
    ================================================= */

    if (vista === "usuario") {

        if (cuentaUsuario) {
            cuentaUsuario.hidden = false;
        }

    }

}

/* =====================================================
   MOSTRAR MIS FAVORITOS
===================================================== */

function obtenerProductosFavoritos() {

    if (
        typeof productos === "undefined" ||
        typeof productoEsFavorito !== "function"
    ) {
        return [];
    }

    return productos.filter(producto =>
        productoEsFavorito(producto.codigo)
    );

}


function mostrarEstadoVacioFavoritos() {

    if (!listaFavoritos) {
        return;
    }

    listaFavoritos.innerHTML = `
        <div class="favoritos-vacios">
            <span aria-hidden="true">♡</span>

            <h4>Aún no tienes favoritos</h4>

            <p>
                Guarda productos con el corazón del catálogo
                y aparecerán aquí.
            </p>
        </div>
    `;

}


function abrirProductoDesdeFavoritos(producto) {

    const buscadorCatalogo =
        document.getElementById("search");

    if (buscadorCatalogo) {
        buscadorCatalogo.value = String(producto.codigo);

        buscadorCatalogo.dispatchEvent(
            new Event("input", { bubbles: true })
        );
    }

    document.getElementById("catalogo")?.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

}


function renderizarMisFavoritos() {

    if (!listaFavoritos) {
        return;
    }

    const productosFavoritos =
        obtenerProductosFavoritos();

    if (productosFavoritos.length === 0) {
        mostrarEstadoVacioFavoritos();
        return;
    }

    listaFavoritos.innerHTML = "";

    productosFavoritos.forEach(producto => {

        const tarjeta =
            document.createElement("article");

        tarjeta.className = "tarjeta-favorito";

        const precio =
            Number(producto.precio);

        tarjeta.innerHTML = `
            <div class="tarjeta-favorito-imagen">
                ${
                    producto.imagen
                        ? `<img src="${producto.imagen}" alt="${producto.nombre}">`
                        : `<span aria-hidden="true">${producto.icono || "📦"}</span>`
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
                    ${producto.categoria || "Producto"}
                </p>

                <h4>${producto.nombre}</h4>

                <p class="tarjeta-favorito-marca">
                    ${producto.marca || "San Martín"}
                </p>

                <p class="tarjeta-favorito-precio">
                    ${
                        Number.isFinite(precio)
                            ? `Q${precio.toFixed(2)}`
                            : "Precio por consultar"
                    }
                </p>

                <p class="tarjeta-favorito-codigo">
                    Código: ${producto.codigo}
                </p>

                <button
                    type="button"
                    class="btn-ver-favorito"
                >
                    Ver en el catálogo
                </button>
            </div>
        `;

        const botonQuitar =
            tarjeta.querySelector(".btn-favorito-producto");

        botonQuitar?.addEventListener(
            "click",
            async () => {
                await cambiarFavorito(
                    producto,
                    botonQuitar
                );
            }
        );

        tarjeta
            .querySelector(".btn-ver-favorito")
            ?.addEventListener(
                "click",
                () => {
                    abrirProductoDesdeFavoritos(producto);
                }
            );

        listaFavoritos.appendChild(tarjeta);

    });

}


async function cargarMisFavoritos() {

    if (!listaFavoritos) {
        return;
    }

    listaFavoritos.innerHTML =
        '<p class="favoritos-cargando">Cargando tus favoritos...</p>';

    if (typeof cargarFavoritosUsuario !== "function") {
        listaFavoritos.innerHTML =
            '<p class="favoritos-error">No fue posible cargar tus favoritos.</p>';

        return;
    }

    await cargarFavoritosUsuario();

    renderizarMisFavoritos();

}


if (btnMisFavoritos) {

    btnMisFavoritos.addEventListener(
        "click",
        async () => {

            cuentaUsuario.hidden = false;
            misFavoritos.hidden = false;
            misDatos.hidden = true;
            misDirecciones.hidden = true;
            misPedidos.hidden = true;

            document.querySelector(".cuenta-menu").hidden = true;

            mensajeCuenta.textContent = "";

            await cargarMisFavoritos();

        }
    );

}


if (btnVolverCuentaFavoritos) {

    btnVolverCuentaFavoritos.addEventListener(
        "click",
        () => {

            misFavoritos.hidden = true;

            document.querySelector(".cuenta-menu").hidden = false;

        }
    );

}


document.addEventListener(
    "favoritos:actualizados",
    () => {

        if (misFavoritos && !misFavoritos.hidden) {
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

            if (cuentaUsuario) {
                cuentaUsuario.hidden = false;
            }

            if (misDatos) {
                misDatos.hidden = true;
            }

            if (misDirecciones) {
                misDirecciones.hidden = true;
            }

            if (misPedidos) {
                misPedidos.hidden = false;
            }

            if (listaPedidosVista) {
                listaPedidosVista.hidden = false;
            }

            if (detallePedidoVista) {
                detallePedidoVista.hidden = true;
            }

            if (misFavoritos) {
                misFavoritos.hidden = true;
            }


            const menuCuenta =
                document.querySelector(
                    ".cuenta-menu"
                );


            if (menuCuenta) {
                menuCuenta.hidden = true;
            }


            if (mensajeCuenta) {
                mensajeCuenta.textContent = "";
            }


            if (mensajePedidos) {
                mensajePedidos.textContent = "";
            }


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


    const {
        data: { user },
        error: errorUsuario
    } =
        await supabaseAuth.auth.getUser();


    if (errorUsuario || !user) {

        listaPedidos.innerHTML = `
            <p>
                Tu sesión ha expirado.
                Inicia sesión nuevamente.
            </p>
        `;

        return;

    }


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


    if (!pedidos || pedidos.length === 0) {

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


    listaPedidos.innerHTML =
        pedidos
            .map(pedido => {

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

                        <div class="tarjeta-pedido-cabecera">

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


                            <div class="pedido-estado">

                                ${estado.icono}

                                ${escaparHTML(
                                    estado.texto
                                )}

                            </div>

                        </div>


                        <div class="tarjeta-pedido-info">

                            <div>

                                <span>
                                    Productos
                                </span>

                                <strong>
                                    ${Number(
                                        pedido.cantidad_productos || 0
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

            })
            .join("");


    activarBotonesPedidos();

}


/* =====================================================
   ACTIVAR BOTONES DE PEDIDOS
===================================================== */

function activarBotonesPedidos() {

    document
        .querySelectorAll(".btn-ver-pedido")
        .forEach(boton => {

            boton.addEventListener(
                "click",
                async () => {

                    const id =
                        boton.dataset.id;

                    await mostrarDetallePedido(id);

                }
            );

        });

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

        data: { user },

        error: errorUsuario

    } =
        await supabaseAuth.auth.getUser();


    if (errorUsuario || !user) {

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

        error: errorPedido

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


    if (errorPedido || !pedido) {

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

        error: errorItems

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


    if (!items || items.length === 0) {

        productosHTML = `
            <p>
                Este pedido no contiene productos.
            </p>
        `;

    } else {

        productosHTML =
            items
                .map(item => {

                    const imagen =
                        item.producto_imagen
                            ? escaparHTML(
                                item.producto_imagen
                            )
                            : "";


                    return `

                        <div class="pedido-item">

                            <div class="pedido-item-imagen">

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


                            <div class="pedido-item-info">

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


                            <div class="pedido-item-cantidad">

                                <span>
                                    Cantidad
                                </span>

                                <strong>
                                    ${Number(
                                        item.cantidad || 0
                                    )}
                                </strong>

                            </div>


                            <div class="pedido-item-precio">

                                <span>
                                    Precio
                                </span>

                                <strong>
                                    ${formatearPrecio(
                                        item.precio
                                    )}
                                </strong>

                            </div>


                            <div class="pedido-item-subtotal">

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

                })
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

        ${pedido.nombre_receptor
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
                        pedido.municipio || ""
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

        <div class="detalle-pedido">


            <!-- CABECERA -->

            <div class="detalle-pedido-cabecera">

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


                <div class="detalle-pedido-estado">

                    ${estado.icono}

                    ${escaparHTML(
                        estado.texto
                    )}

                </div>

            </div>


            <!-- PRODUCTOS -->

            <div class="detalle-pedido-seccion">

                <h4>
                    🛒 Productos
                </h4>

                <div class="lista-pedido-items">

                    ${productosHTML}

                </div>

            </div>


            <!-- RESUMEN -->

            <div class="detalle-pedido-seccion">

                <h4>
                    💰 Resumen del pedido
                </h4>


                <div class="pedido-totales">

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


                    <div class="pedido-total-final">

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


            <!-- DIRECCIÓN -->

            <div class="detalle-pedido-seccion">

                <h4>
                    📍 Dirección de entrega
                </h4>

                <div class="pedido-direccion">

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


            <!-- PAGO -->

            <div class="detalle-pedido-seccion">

                <h4>
                    💳 Método de pago
                </h4>

                <p>
                    ${escaparHTML(
                        metodoPago
                    )}
                </p>

            </div>


            <!-- ESTADO -->

            <div class="detalle-pedido-seccion">

                <h4>
                    📦 Estado del pedido
                </h4>

                <p class="pedido-estado-detalle">

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

            if (misPedidos) {
                misPedidos.hidden = true;
            }

            if (listaPedidosVista) {
                listaPedidosVista.hidden = false;
            }

            if (detallePedidoVista) {
                detallePedidoVista.hidden = true;
            }

            if (contenidoDetallePedido) {
                contenidoDetallePedido.innerHTML = "";
            }


            const menuCuenta =
                document.querySelector(
                    ".cuenta-menu"
                );


            if (menuCuenta) {
                menuCuenta.hidden = false;
            }


            if (mensajePedidos) {
                mensajePedidos.textContent = "";
            }

        }
    );

}


/* =====================================================
   BOTONES DE NAVEGACIÓN
===================================================== */

if (mostrarLogin) {

    mostrarLogin.addEventListener(
        "click",
        () => {

            limpiarMensajes();

            mostrarVistaCuenta(
                "login"
            );

        }
    );

}


if (mostrarRegistro) {

    mostrarRegistro.addEventListener(
        "click",
        () => {

            limpiarMensajes();

            mostrarVistaCuenta(
                "registro"
            );

        }
    );

}


if (mostrarRecuperacion) {

    mostrarRecuperacion.addEventListener(
        "click",
        () => {

            limpiarMensajes();

            mostrarVistaCuenta(
                "recuperacion"
            );

        }
    );

}


if (volverCuenta) {

    volverCuenta.addEventListener(
        "click",
        () => {

            limpiarMensajes();

            mostrarVistaCuenta(
                "acceso"
            );

        }
    );

}


if (volverCuentaRegistro) {

    volverCuentaRegistro.addEventListener(
        "click",
        () => {

            limpiarMensajes();

            mostrarVistaCuenta(
                "acceso"
            );

        }
    );

}


if (volverLogin) {

    volverLogin.addEventListener(
        "click",
        () => {

            limpiarMensajes();

            mostrarVistaCuenta(
                "login"
            );

        }
    );

}


/* =====================================================
   REGISTRO DE CLIENTE
===================================================== */

if (registroForm) {

    registroForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();

            limpiarMensajes();


            const nombre =
                document
                    .getElementById(
                        "registroNombre"
                    )
                    ?.value
                    .trim() || "";


            const apellido =
                document
                    .getElementById(
                        "registroApellido"
                    )
                    ?.value
                    .trim() || "";


            const email =
                document
                    .getElementById(
                        "registroEmail"
                    )
                    ?.value
                    .trim() || "";


            const telefono =
                document
                    .getElementById(
                        "registroTelefono"
                    )
                    ?.value
                    .trim() || "";


            const password =
                document
                    .getElementById(
                        "registroPassword"
                    )
                    ?.value || "";


            const passwordConfirm =
                document
                    .getElementById(
                        "registroPasswordConfirm"
                    )
                    ?.value || "";


            const newsletter =
                document.querySelector(
                    'input[name="newsletter"]:checked'
                )?.value === "si";


            /* =================================================
               VALIDACIONES
            ================================================= */

            if (!nombre || !apellido) {

                if (mensajeRegistro) {

                    mensajeRegistro.textContent =
                        "El nombre y apellido son obligatorios.";

                }

                return;

            }


            if (!password || password.length < 6) {

                if (mensajeRegistro) {

                    mensajeRegistro.textContent =
                        "La contraseña debe tener al menos 6 caracteres.";

                }

                return;

            }


            if (password !== passwordConfirm) {

                if (mensajeRegistro) {

                    mensajeRegistro.textContent =
                        "Las contraseñas no coinciden.";

                }

                return;

            }


            /* =================================================
               DESACTIVAR BOTÓN
            ================================================= */

            const boton =
                registroForm.querySelector(
                    'button[type="submit"]'
                );


            if (boton) {

                boton.disabled = true;

                boton.textContent =
                    "Creando cuenta...";

            }


            try {

                const {
                    data,
                    error
                } =
                    await supabaseAuth.auth.signUp({

                        email: email,

                        password: password,

                        options: {

                            data: {

                                nombre:
                                    nombre,

                                apellido:
                                    apellido,

                                telefono:
                                    telefono,

                                newsletter:
                                    newsletter

                            }

                        }

                    });


                if (error) {
                    throw error;
                }


                console.log(
                    "Cuenta creada correctamente:",
                    data
                );


                if (mensajeRegistro) {

                    mensajeRegistro.textContent =
                        "Cuenta creada correctamente. Revisa tu correo electrónico para confirmar tu cuenta si la confirmación está activada.";

                }


                registroForm.reset();


                setTimeout(
                    () => {

                        mostrarVistaCuenta(
                            "login"
                        );


                        const loginEmail =
                            document.getElementById(
                                "loginEmail"
                            );


                        if (loginEmail) {

                            loginEmail.value =
                                email;

                        }

                    },
                    2500
                );


            } catch (error) {

                console.error(
                    "Error al crear cuenta:",
                    error
                );


                if (mensajeRegistro) {

                    mensajeRegistro.textContent =
                        obtenerMensajeError(
                            error
                        );

                }


            } finally {

                if (boton) {

                    boton.disabled = false;

                    boton.textContent =
                        "Crear cuenta";

                }

            }

        }
    );

}


/* =====================================================
   INICIO DE SESIÓN
===================================================== */

if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();

            limpiarMensajes();


            const email =
                document
                    .getElementById(
                        "loginEmail"
                    )
                    ?.value
                    .trim() || "";


            const password =
                document
                    .getElementById(
                        "loginPassword"
                    )
                    ?.value || "";


            const boton =
                loginForm.querySelector(
                    'button[type="submit"]'
                );


            if (boton) {

                boton.disabled = true;

                boton.textContent =
                    "Iniciando sesión...";

            }


            try {

                const {
                    data,
                    error
                } =
                    await supabaseAuth.auth
                        .signInWithPassword({

                            email:
                                email,

                            password:
                                password

                        });


                if (error) {
                    throw error;
                }


                console.log(
                    "Sesión iniciada:",
                    data.user
                );


                loginForm.reset();


                mostrarUsuario(
                    data.user
                );


            } catch (error) {

                console.error(
                    "Error al iniciar sesión:",
                    error
                );


                if (mensajeLogin) {

                    mensajeLogin.textContent =
                        obtenerMensajeError(
                            error
                        );

                }


            } finally {

                if (boton) {

                    boton.disabled = false;

                    boton.textContent =
                        "Iniciar sesión";

                }

            }

        }
    );

}


/* =====================================================
   CERRAR SESIÓN
===================================================== */

if (btnCerrarSesion) {

    btnCerrarSesion.addEventListener(
        "click",
        async () => {

            const {
                error
            } =
                await supabaseAuth.auth
                    .signOut();


            if (error) {

                console.error(
                    "Error al cerrar sesión:",
                    error
                );


                if (mensajeCuenta) {

                    mensajeCuenta.textContent =
                        "No fue posible cerrar la sesión.";

                }

                return;

            }


            mostrarVistaCuenta(
                "acceso"
            );

            limpiarMensajes();

        }
    );

}


/* =====================================================
   RECUPERAR CONTRASEÑA
===================================================== */

if (recuperacionForm) {

    recuperacionForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();

            limpiarMensajes();


            const email =
                document
                    .getElementById(
                        "recuperacionEmail"
                    )
                    ?.value
                    .trim() || "";


            const boton =
                recuperacionForm.querySelector(
                    'button[type="submit"]'
                );


            if (boton) {

                boton.disabled = true;

                boton.textContent =
                    "Enviando...";

            }


            try {

                const {
                    error
                } =
                    await supabaseAuth.auth
                        .resetPasswordForEmail(
                            email,
                            {

                                redirectTo:
                                    `${window.location.origin}${window.location.pathname}#cuenta`

                            }
                        );


                if (error) {
                    throw error;
                }


                if (mensajeRecuperacion) {

                    mensajeRecuperacion.textContent =
                        "Si el correo está registrado, recibirás instrucciones para recuperar tu contraseña.";

                }


                recuperacionForm.reset();


            } catch (error) {

                console.error(
                    "Error de recuperación:",
                    error
                );


                if (mensajeRecuperacion) {

                    mensajeRecuperacion.textContent =
                        obtenerMensajeError(
                            error
                        );

                }


            } finally {

                if (boton) {

                    boton.disabled = false;

                    boton.textContent =
                        "Enviar instrucciones";

                }

            }

        }
    );

}


/* =====================================================
   MOSTRAR USUARIO CONECTADO
===================================================== */

function mostrarUsuario(user) {

    if (!user) {

        mostrarVistaCuenta(
            "acceso"
        );

        return;

    }


    const metadata =
        user.user_metadata || {};


    const nombre =
        metadata.nombre ||
        user.email?.split("@")[0] ||
        "Cliente";


    if (nombreUsuario) {

        nombreUsuario.textContent =
            nombre;

    }


    mostrarVistaCuenta(
        "usuario"
    );

}


/* =====================================================
   CARGAR DATOS DEL PERFIL
===================================================== */

async function cargarMisDatos() {

    limpiarMensajeMisDatos();


    const {

        data: { user },

        error: errorUsuario

    } =
        await supabaseAuth.auth.getUser();


    if (errorUsuario || !user) {

        if (mensajeMisDatos) {

            mensajeMisDatos.textContent =
                "Tu sesión ha expirado. Inicia sesión nuevamente.";

        }

        return;

    }


    if (datosEmail) {

        datosEmail.value =
            user.email || "";

    }


    const {
        data,
        error
    } =
        await supabaseAuth

            .from("perfiles")

            .select(
                "nombre, apellido, telefono, newsletter"
            )

            .eq(
                "id",
                user.id
            )

            .single();


    console.log(
        "USUARIO ACTUAL:",
        user
    );

    console.log(
        "DATOS DEL PERFIL:",
        data
    );

    console.log(
        "ERROR DEL PERFIL:",
        error
    );


    if (error) {

        console.error(
            "Error cargando perfil:",
            error
        );


        if (mensajeMisDatos) {

            mensajeMisDatos.textContent =
                "No fue posible cargar tus datos.";

        }

        return;

    }


    if (datosNombre) {

        datosNombre.value =
            data?.nombre || "";

    }


    if (datosApellido) {

        datosApellido.value =
            data?.apellido || "";

    }


    if (datosTelefono) {

        datosTelefono.value =
            data?.telefono || "";

    }


    const newsletterSi =
        document.querySelector(
            'input[name="datosNewsletter"][value="si"]'
        );


    const newsletterNo =
        document.querySelector(
            'input[name="datosNewsletter"][value="no"]'
        );


    if (data?.newsletter === true) {

        if (newsletterSi) {
            newsletterSi.checked = true;
        }

    } else {

        if (newsletterNo) {
            newsletterNo.checked = true;
        }

    }

}


/* =====================================================
   MOSTRAR MIS DATOS
===================================================== */

if (btnMisDatos) {

    btnMisDatos.addEventListener(
        "click",
        async () => {

            if (cuentaUsuario) {
                cuentaUsuario.hidden = false;
            }

            if (misDatos) {
                misDatos.hidden = false;
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


            const menuCuenta =
                document.querySelector(
                    ".cuenta-menu"
                );


            if (menuCuenta) {
                menuCuenta.hidden = true;
            }


            if (mensajeCuenta) {
                mensajeCuenta.textContent = "";
            }


            await cargarMisDatos();

        }
    );

}


/* =====================================================
   VOLVER A MI CUENTA DESDE MIS DATOS
===================================================== */

if (btnVolverCuenta) {

    btnVolverCuenta.addEventListener(
        "click",
        () => {

            if (misDatos) {
                misDatos.hidden = true;
            }


            const menuCuenta =
                document.querySelector(
                    ".cuenta-menu"
                );


            if (menuCuenta) {
                menuCuenta.hidden = false;
            }


            limpiarMensajeMisDatos();

        }
    );

}


/* =====================================================
   GUARDAR MIS DATOS
===================================================== */

if (formularioMisDatos) {

    formularioMisDatos.addEventListener(
        "submit",
        async event => {

            event.preventDefault();

            limpiarMensajeMisDatos();


            const nombre =
                datosNombre?.value.trim() || "";


            const apellido =
                datosApellido?.value.trim() || "";


            const telefono =
                datosTelefono?.value.trim() || "";


            const newsletter =
                document.querySelector(
                    'input[name="datosNewsletter"]:checked'
                )?.value === "si";


            if (!nombre || !apellido) {

                if (mensajeMisDatos) {

                    mensajeMisDatos.textContent =
                        "El nombre y apellido son obligatorios.";

                }

                return;

            }


            const boton =
                document.getElementById(
                    "btnGuardarDatos"
                );


            if (boton) {

                boton.disabled = true;

                boton.textContent =
                    "Guardando...";

            }


            try {

                const {

                    data: { user },

                    error: errorUsuario

                } =
                    await supabaseAuth.auth.getUser();


                if (errorUsuario || !user) {

                    throw new Error(
                        "No hay una sesión activa."
                    );

                }


                const {
                    error
                } =
                    await supabaseAuth

                        .from("perfiles")

                        .update({

                            nombre:
                                nombre,

                            apellido:
                                apellido,

                            telefono:
                                telefono,

                            newsletter:
                                newsletter,

                            actualizado_en:
                                new Date()
                                    .toISOString()

                        })

                        .eq(
                            "id",
                            user.id
                        );


                if (error) {
                    throw error;
                }


                /* =================================================
                   ACTUALIZAR METADATOS DE SUPABASE AUTH
                ================================================= */

                const {
                    error: errorMetadata
                } =
                    await supabaseAuth.auth
                        .updateUser({

                            data: {

                                nombre:
                                    nombre,

                                apellido:
                                    apellido,

                                telefono:
                                    telefono,

                                newsletter:
                                    newsletter

                            }

                        });


                if (errorMetadata) {

                    console.warn(
                        "El perfil se guardó, pero no fue posible actualizar los metadatos:",
                        errorMetadata
                    );

                }


                if (nombreUsuario) {

                    nombreUsuario.textContent =
                        nombre;

                }


                if (mensajeMisDatos) {

                    mensajeMisDatos.textContent =
                        "✓ Tus datos se actualizaron correctamente.";

                }


            } catch (error) {

                console.error(
                    "Error actualizando perfil:",
                    error
                );


                if (mensajeMisDatos) {

                    mensajeMisDatos.textContent =
                        "No fue posible guardar los cambios.";

                }


            } finally {

                if (boton) {

                    boton.disabled = false;

                    boton.textContent =
                        "Guardar cambios";

                }

            }

        }
    );

}


/* =====================================================
   MOSTRAR MIS DIRECCIONES
===================================================== */

if (btnMisDirecciones) {

    btnMisDirecciones.addEventListener(
        "click",
        async () => {

            if (cuentaUsuario) {
                cuentaUsuario.hidden = false;
            }

            if (misDirecciones) {
                misDirecciones.hidden = false;
            }

            if (misDatos) {
                misDatos.hidden = true;
            }

            if (misPedidos) {
                misPedidos.hidden = true;
            }

            if (misFavoritos) {
                misFavoritos.hidden = true;
            }


            const menuCuenta =
                document.querySelector(
                    ".cuenta-menu"
                );


            if (menuCuenta) {
                menuCuenta.hidden = true;
            }


            if (mensajeCuenta) {
                mensajeCuenta.textContent = "";
            }


            if (formularioDireccionContainer) {
                formularioDireccionContainer.hidden = true;
            }


            await cargarDirecciones();

        }
    );

}


/* =====================================================
   CARGAR DIRECCIONES DESDE SUPABASE
===================================================== */

async function cargarDirecciones() {

    limpiarMensajeDireccion();


    if (!listaDirecciones) {
        return;
    }


    listaDirecciones.innerHTML =
        "<p>Cargando tus direcciones...</p>";


    const {

        data: { user },

        error: errorUsuario

    } =
        await supabaseAuth.auth.getUser();


    if (errorUsuario || !user) {

        listaDirecciones.innerHTML =
            "<p>Tu sesión ha expirado. Inicia sesión nuevamente.</p>";

        return;

    }


    const {

        data,

        error

    } =
        await supabaseAuth

            .from("direcciones")

            .select(`
                id,
                nombre_direccion,
                nombre_receptor,
                telefono,
                departamento,
                municipio,
                direccion,
                referencia,
                principal
            `)

            .eq(
                "usuario_id",
                user.id
            )

            .order(
                "principal",
                {
                    ascending: false
                }
            )

            .order(
                "id",
                {
                    ascending: false
                }
            );


    if (error) {

        console.error(
            "Error cargando direcciones:",
            error
        );


        listaDirecciones.innerHTML =
            "<p>No fue posible cargar tus direcciones.</p>";

        return;

    }


    if (!data || data.length === 0) {

        listaDirecciones.innerHTML = `

            <div class="sin-direcciones">

                <div>
                    📍
                </div>

                <h3>
                    No tienes direcciones guardadas
                </h3>

                <p>
                    Agrega una dirección para
                    facilitar tus próximas compras.
                </p>

            </div>

        `;

        return;

    }


    listaDirecciones.innerHTML = "";


    data.forEach(
        direccion => {

            const tarjeta =
                document.createElement(
                    "div"
                );


            tarjeta.className =
                "tarjeta-direccion";


            tarjeta.innerHTML = `

                <div class="direccion-contenido">

                    <h4>

                        ${escaparHTML(
                            direccion.nombre_direccion
                        )}

                        ${
                            direccion.principal
                                ? `
                                    <span class="direccion-principal">
                                        ⭐ Principal
                                    </span>
                                  `
                                : ""
                        }

                    </h4>


                    <p>

                        <strong>
                            Recibe:
                        </strong>

                        ${escaparHTML(
                            direccion.nombre_receptor
                        )}

                    </p>


                    <p>

                        <strong>
                            Teléfono:
                        </strong>

                        ${escaparHTML(
                            direccion.telefono
                        )}

                    </p>


                    <p>

                        <strong>
                            Ubicación:
                        </strong>

                        ${escaparHTML(
                            direccion.municipio
                        )},

                        ${escaparHTML(
                            direccion.departamento
                        )}

                    </p>


                    <p>

                        <strong>
                            Dirección:
                        </strong>

                        ${escaparHTML(
                            direccion.direccion
                        )}

                    </p>


                    ${
                        direccion.referencia
                            ? `
                                <p>

                                    <strong>
                                        Referencia:
                                    </strong>

                                    ${escaparHTML(
                                        direccion.referencia
                                    )}

                                </p>
                              `
                            : ""
                    }

                </div>


                <div class="direccion-acciones">


                    <button
                        type="button"
                        class="btn-editar-direccion"
                        data-id="${direccion.id}"
                    >
                        ✏️ Editar
                    </button>


                    ${
                        !direccion.principal
                            ? `
                                <button
                                    type="button"
                                    class="btn-principal-direccion"
                                    data-id="${direccion.id}"
                                >
                                    ⭐ Hacer principal
                                </button>
                              `
                            : ""
                    }


                    <button
                        type="button"
                        class="btn-eliminar-direccion"
                        data-id="${direccion.id}"
                    >
                        🗑️ Eliminar
                    </button>


                </div>

            `;


            listaDirecciones.appendChild(
                tarjeta
            );

        }
    );


    activarBotonesDirecciones();

}


/* =====================================================
   ACTIVAR BOTONES DE DIRECCIONES
===================================================== */

function activarBotonesDirecciones() {


    /* =================================================
       EDITAR
    ================================================= */

    document
        .querySelectorAll(
            ".btn-editar-direccion"
        )
        .forEach(
            boton => {

                boton.addEventListener(
                    "click",
                    async () => {

                        const id =
                            boton.dataset.id;

                        await editarDireccion(
                            id
                        );

                    }
                );

            }
        );


    /* =================================================
       HACER PRINCIPAL
    ================================================= */

    document
        .querySelectorAll(
            ".btn-principal-direccion"
        )
        .forEach(
            boton => {

                boton.addEventListener(
                    "click",
                    async () => {

                        const id =
                            boton.dataset.id;

                        await hacerDireccionPrincipal(
                            id
                        );

                    }
                );

            }
        );


    /* =================================================
       ELIMINAR
    ================================================= */

    document
        .querySelectorAll(
            ".btn-eliminar-direccion"
        )
        .forEach(
            boton => {

                boton.addEventListener(
                    "click",
                    async () => {

                        const id =
                            boton.dataset.id;

                        await eliminarDireccion(
                            id
                        );

                    }
                );

            }
        );

}


/* =====================================================
   ABRIR FORMULARIO NUEVA DIRECCIÓN
===================================================== */

if (btnAgregarDireccion) {

    btnAgregarDireccion.addEventListener(
        "click",
        () => {

            limpiarFormularioDireccion();

            if (tituloFormularioDireccion) {

                tituloFormularioDireccion.textContent =
                    "Agregar dirección";

            }


            if (formularioDireccionContainer) {

                formularioDireccionContainer.hidden =
                    false;

            }


            if (direccionNombre) {

                direccionNombre.focus();

            }

        }
    );

}


/* =====================================================
   GUARDAR / ACTUALIZAR DIRECCIÓN
===================================================== */

if (formularioDireccion) {

    formularioDireccion.addEventListener(
        "submit",
        async event => {

            event.preventDefault();

            limpiarMensajeDireccion();


            const {

                data: { user },

                error: errorUsuario

            } =
                await supabaseAuth.auth.getUser();


            if (errorUsuario || !user) {

                mostrarMensajeDireccion(
                    "Tu sesión ha expirado. Inicia sesión nuevamente.",
                    true
                );

                return;

            }


            const id =
                direccionId?.value || "";


            const datosDireccion = {

                usuario_id:
                    user.id,

                nombre_direccion:
                    direccionNombre?.value
                        .trim() || "",

                nombre_receptor:
                    direccionReceptor?.value
                        .trim() || "",

                telefono:
                    direccionTelefono?.value
                        .trim() || "",

                departamento:
                    direccionDepartamento?.value
                        .trim() || "",

                municipio:
                    direccionMunicipio?.value
                        .trim() || "",

                direccion:
                    direccionCompleta?.value
                        .trim() || "",

                referencia:
                    direccionReferencia?.value
                        .trim() || null,

                principal:
                    direccionPrincipal?.checked === true,

                actualizado_en:
                    new Date()
                        .toISOString()

            };


            /* =================================================
               VALIDAR DATOS
            ================================================= */

            if (
                !datosDireccion.nombre_direccion ||
                !datosDireccion.nombre_receptor ||
                !datosDireccion.telefono ||
                !datosDireccion.departamento ||
                !datosDireccion.municipio ||
                !datosDireccion.direccion
            ) {

                mostrarMensajeDireccion(
                    "Completa todos los campos obligatorios.",
                    true
                );

                return;

            }


            /* =================================================
               ACTUALIZAR
            ================================================= */

            if (id) {

                const {
                    error
                } =
                    await supabaseAuth

                        .from("direcciones")

                        .update(
                            datosDireccion
                        )

                        .eq(
                            "id",
                            id
                        )

                        .eq(
                            "usuario_id",
                            user.id
                        );


                if (error) {

                    console.error(
                        "Error actualizando dirección:",
                        error
                    );


                    mostrarMensajeDireccion(
                        "No fue posible actualizar la dirección.",
                        true
                    );

                    return;

                }


                if (
                    direccionPrincipal?.checked
                ) {

                    const resultado =
                        await establecerDireccionPrincipal(
                            id,
                            user.id
                        );


                    if (!resultado) {

                        mostrarMensajeDireccion(
                            "La dirección se actualizó, pero no fue posible establecerla como principal.",
                            true
                        );

                    }

                }


                mostrarMensajeDireccion(
                    "✓ Dirección actualizada correctamente."
                );

            }


            /* =================================================
               CREAR
            ================================================= */

            else {

                const {
                    data,
                    error
                } =
                    await supabaseAuth

                        .from("direcciones")

                        .insert(
                            datosDireccion
                        )

                        .select()

                        .single();


                if (error) {

                    console.error(
                        "Error creando dirección:",
                        error
                    );


                    mostrarMensajeDireccion(
                        "No fue posible guardar la dirección.",
                        true
                    );

                    return;

                }


                if (
                    direccionPrincipal?.checked &&
                    data
                ) {

                    const resultado =
                        await establecerDireccionPrincipal(
                            data.id,
                            user.id
                        );


                    if (!resultado) {

                        mostrarMensajeDireccion(
                            "La dirección se guardó, pero no fue posible establecerla como principal.",
                            true
                        );

                    }

                }


                mostrarMensajeDireccion(
                    "✓ Dirección guardada correctamente."
                );

            }


            /* =================================================
               OCULTAR FORMULARIO
            ================================================= */

            if (formularioDireccionContainer) {

                formularioDireccionContainer.hidden =
                    true;

            }


            limpiarFormularioDireccion();


            await cargarDirecciones();

        }
    );

}


/* =====================================================
   EDITAR DIRECCIÓN
===================================================== */

async function editarDireccion(id) {

    limpiarMensajeDireccion();


    const {

        data: { user },

        error: errorUsuario

    } =
        await supabaseAuth.auth.getUser();


    if (errorUsuario || !user) {

        mostrarMensajeDireccion(
            "Tu sesión ha expirado. Inicia sesión nuevamente.",
            true
        );

        return;

    }


    const {

        data,

        error

    } =
        await supabaseAuth

            .from("direcciones")

            .select("*")

            .eq(
                "id",
                id
            )

            .eq(
                "usuario_id",
                user.id
            )

            .single();


    if (error || !data) {

        console.error(
            "Error obteniendo dirección:",
            error
        );


        mostrarMensajeDireccion(
            "No fue posible cargar la dirección.",
            true
        );

        return;

    }


    if (direccionId) {

        direccionId.value =
            data.id;

    }


    if (direccionNombre) {

        direccionNombre.value =
            data.nombre_direccion || "";

    }


    if (direccionReceptor) {

        direccionReceptor.value =
            data.nombre_receptor || "";

    }


    if (direccionTelefono) {

        direccionTelefono.value =
            data.telefono || "";

    }


    if (direccionDepartamento) {

        direccionDepartamento.value =
            data.departamento || "";

    }


    if (direccionMunicipio) {

        direccionMunicipio.value =
            data.municipio || "";

    }


    if (direccionCompleta) {

        direccionCompleta.value =
            data.direccion || "";

    }


    if (direccionReferencia) {

        direccionReferencia.value =
            data.referencia || "";

    }


    if (direccionPrincipal) {

        direccionPrincipal.checked =
            data.principal === true;

    }


    if (tituloFormularioDireccion) {

        tituloFormularioDireccion.textContent =
            "Editar dirección";

    }


    if (formularioDireccionContainer) {

        formularioDireccionContainer.hidden =
            false;

    }


    if (direccionNombre) {

        direccionNombre.focus();

    }

}


/* =====================================================
   HACER DIRECCIÓN PRINCIPAL
===================================================== */

async function hacerDireccionPrincipal(
    id
) {

    const {

        data: { user },

        error: errorUsuario

    } =
        await supabaseAuth.auth.getUser();


    if (errorUsuario || !user) {

        mostrarMensajeDireccion(
            "Tu sesión ha expirado. Inicia sesión nuevamente.",
            true
        );

        return;

    }


    const resultado =
        await establecerDireccionPrincipal(
            id,
            user.id
        );


    if (!resultado) {

        mostrarMensajeDireccion(
            "No fue posible establecer la dirección principal.",
            true
        );

        return;

    }


    mostrarMensajeDireccion(
        "✓ Dirección principal actualizada."
    );


    await cargarDirecciones();

}


/* =====================================================
   ESTABLECER DIRECCIÓN PRINCIPAL
===================================================== */

async function establecerDireccionPrincipal(
    id,
    usuarioId
) {

    /* =================================================
       QUITAR PRINCIPAL A TODAS
    ================================================= */

    const {
        error: errorQuitar
    } =
        await supabaseAuth

            .from("direcciones")

            .update({

                principal:
                    false

            })

            .eq(
                "usuario_id",
                usuarioId
            );


    if (errorQuitar) {

        console.error(
            "Error quitando dirección principal:",
            errorQuitar
        );

        return false;

    }


    /* =================================================
       ESTABLECER NUEVA PRINCIPAL
    ================================================= */

    const {
        error: errorPrincipal
    } =
        await supabaseAuth

            .from("direcciones")

            .update({

                principal:
                    true

            })

            .eq(
                "id",
                id
            )

            .eq(
                "usuario_id",
                usuarioId
            );


    if (errorPrincipal) {

        console.error(
            "Error estableciendo dirección principal:",
            errorPrincipal
        );

        return false;

    }


    return true;

}


/* =====================================================
   ELIMINAR DIRECCIÓN
===================================================== */

async function eliminarDireccion(
    id
) {

    const confirmar =
        confirm(
            "¿Estás seguro de que deseas eliminar esta dirección?"
        );


    if (!confirmar) {
        return;
    }


    const {

        data: { user },

        error: errorUsuario

    } =
        await supabaseAuth.auth.getUser();


    if (errorUsuario || !user) {

        mostrarMensajeDireccion(
            "Tu sesión ha expirado. Inicia sesión nuevamente.",
            true
        );

        return;

    }


    const {
        data: direccion,
        error: errorConsulta
    } =
        await supabaseAuth

            .from("direcciones")

            .select(
                "id, principal"
            )

            .eq(
                "id",
                id
            )

            .eq(
                "usuario_id",
                user.id
            )

            .single();


    if (errorConsulta || !direccion) {

        mostrarMensajeDireccion(
            "No fue posible encontrar la dirección.",
            true
        );

        return;

    }


    const {
        error
    } =
        await supabaseAuth

            .from("direcciones")

            .delete()

            .eq(
                "id",
                id
            )

            .eq(
                "usuario_id",
                user.id
            );


    if (error) {

        console.error(
            "Error eliminando dirección:",
            error
        );


        mostrarMensajeDireccion(
            "No fue posible eliminar la dirección.",
            true
        );

        return;

    }


    mostrarMensajeDireccion(
        "✓ Dirección eliminada correctamente."
    );


    await cargarDirecciones();

}


/* =====================================================
   CANCELAR FORMULARIO DE DIRECCIÓN
===================================================== */

if (btnCancelarDireccion) {

    btnCancelarDireccion.addEventListener(
        "click",
        () => {

            if (formularioDireccionContainer) {

                formularioDireccionContainer.hidden =
                    true;

            }


            limpiarFormularioDireccion();

            limpiarMensajeDireccion();

        }
    );

}


/* =====================================================
   VOLVER A MI CUENTA DESDE DIRECCIONES
===================================================== */

if (btnVolverCuentaDirecciones) {

    btnVolverCuentaDirecciones.addEventListener(
        "click",
        () => {

            if (misDirecciones) {

                misDirecciones.hidden =
                    true;

            }


            const menuCuenta =
                document.querySelector(
                    ".cuenta-menu"
                );


            if (menuCuenta) {

                menuCuenta.hidden =
                    false;

            }


            limpiarFormularioDireccion();

            limpiarMensajeDireccion();

        }
    );

}


/* =====================================================
   LIMPIAR FORMULARIO DE DIRECCIÓN
===================================================== */

function limpiarFormularioDireccion() {

    if (formularioDireccion) {

        formularioDireccion.reset();

    }


    if (direccionId) {

        direccionId.value =
            "";

    }


    if (tituloFormularioDireccion) {

        tituloFormularioDireccion.textContent =
            "Agregar dirección";

    }

}


/* =====================================================
   MOSTRAR MENSAJE DE DIRECCIÓN
===================================================== */

function mostrarMensajeDireccion(
    mensaje,
    error = false
) {

    if (!mensajeDireccion) {
        return;
    }


    mensajeDireccion.textContent =
        mensaje;


    mensajeDireccion.style.color =
        error
            ? "red"
            : "green";

}


/* =====================================================
   LIMPIAR MENSAJE DE DIRECCIÓN
===================================================== */

function limpiarMensajeDireccion() {

    if (mensajeDireccion) {

        mensajeDireccion.textContent =
            "";

    }

}


/* =====================================================
   LIMPIAR MENSAJES GENERALES
===================================================== */

function limpiarMensajes() {

    if (mensajeLogin) {

        mensajeLogin.textContent =
            "";

    }


    if (mensajeRegistro) {

        mensajeRegistro.textContent =
            "";

    }


    if (mensajeRecuperacion) {

        mensajeRecuperacion.textContent =
            "";

    }


    if (mensajeCuenta) {

        mensajeCuenta.textContent =
            "";

    }


    if (mensajePedidos) {

        mensajePedidos.textContent =
            "";

    }

}


/* =====================================================
   LIMPIAR MENSAJE DE MIS DATOS
===================================================== */

function limpiarMensajeMisDatos() {

    if (mensajeMisDatos) {

        mensajeMisDatos.textContent =
            "";

    }

}


/* =====================================================
   MENSAJES DE ERROR
===================================================== */

function obtenerMensajeError(
    error
) {

    const mensaje =
        error?.message
            ?.toLowerCase() || "";


    if (
        mensaje.includes(
            "invalid login credentials"
        )
    ) {

        return "El correo electrónico o la contraseña son incorrectos.";

    }


    if (
        mensaje.includes(
            "user already registered"
        )
    ) {

        return "Este correo electrónico ya tiene una cuenta.";

    }


    if (
        mensaje.includes(
            "password should be at least"
        )
    ) {

        return "La contraseña debe tener al menos 6 caracteres.";

    }


    if (
        mensaje.includes(
            "invalid email"
        )
    ) {

        return "Introduce un correo electrónico válido.";

    }


    if (
        mensaje.includes(
            "email not confirmed"
        )
    ) {

        return "Primero debes confirmar tu correo electrónico.";

    }


    if (
        mensaje.includes(
            "rate limit"
        )
    ) {

        return "Has realizado demasiados intentos. Espera unos minutos e inténtalo nuevamente.";

    }


    if (
        mensaje.includes(
            "network"
        )
    ) {

        return "No hay conexión con el servidor. Revisa tu conexión a Internet.";

    }


    return (
        error?.message ||
        "Ocurrió un error. Inténtalo nuevamente."
    );

}


/* =====================================================
   ESTADOS DE PEDIDO
===================================================== */

function obtenerEstadoPedido(
    estado
) {

    const estados = {

        pendiente: {

            texto:
                "Pendiente",

            icono:
                "🟡"

        },


        confirmado: {

            texto:
                "Confirmado",

            icono:
                "🔵"

        },


        preparando: {

            texto:
                "Preparando pedido",

            icono:
                "🟣"

        },


        en_camino: {

            texto:
                "En camino",

            icono:
                "🚚"

        },


        entregado: {

            texto:
                "Entregado",

            icono:
                "🟢"

        },


        cancelado: {

            texto:
                "Cancelado",

            icono:
                "🔴"

        }

    };


    return (
        estados[estado] ||
        {

            texto:
                "Estado desconocido",

            icono:
                "⚪"

        }
    );

}


/* =====================================================
   FORMATEAR PRECIO
===================================================== */

function formatearPrecio(
    valor
) {

    return `Q${Number(
        valor || 0
    ).toFixed(2)}`;

}


/* =====================================================
   FORMATEAR FECHA
===================================================== */

function formatearFecha(
    fecha
) {

    if (!fecha) {
        return "";
    }


    try {

        return new Intl.DateTimeFormat(
            "es-GT",
            {

                dateStyle:
                    "long"

            }
        ).format(
            new Date(fecha)
        );


    } catch (error) {

        return fecha;

    }

}


/* =====================================================
   NÚMERO DE PEDIDO
===================================================== */

function obtenerNumeroPedido(
    id
) {

    return `SM-${String(
        id
    ).padStart(
        4,
        "0"
    )}`;

}


/* =====================================================
   SEGURIDAD
   ESCAPAR HTML
===================================================== */

function escaparHTML(
    texto
) {

    if (
        texto === null ||
        texto === undefined
    ) {

        return "";

    }


    return String(texto)

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
   DETECTAR SESIÓN ACTUAL
===================================================== */

async function comprobarSesion() {

    try {

        const {

            data: { session }

        } =
            await supabaseAuth.auth
                .getSession();


        if (session?.user) {

            mostrarUsuario(
                session.user
            );

        } else {

            mostrarVistaCuenta(
                "acceso"
            );

        }


    } catch (error) {

        console.error(
            "Error comprobando sesión:",
            error
        );


        mostrarVistaCuenta(
            "acceso"
        );

    }

}


/* =====================================================
   ESCUCHAR CAMBIOS DE SESIÓN
===================================================== */

supabaseAuth.auth.onAuthStateChange(
    (event, session) => {

        console.log(
            "Cambio de autenticación:",
            event
        );


        if (session?.user) {

            mostrarUsuario(
                session.user
            );

        } else {

            mostrarVistaCuenta(
                "acceso"
            );

        }

    }
);


/* =====================================================
   INICIAR SISTEMA
===================================================== */

comprobarSesion();