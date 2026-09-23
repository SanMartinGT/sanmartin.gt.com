/* =====================================================
   ESTADOS DE PEDIDO 01-pedidos-estado.js
===================================================== */

const ESTADOS_PEDIDO = [
    {
        valor: "pendiente",
        texto: "Pendiente"
    },
    {
        valor: "confirmado",
        texto: "Confirmado"
    },
    {
        valor: "preparando",
        texto: "Preparando"
    },
    {
        valor: "en_camino",
        texto: "En camino"
    },
    {
        valor: "entregado",
        texto: "Entregado"
    },
    {
        valor: "cancelado",
        texto: "Cancelado"
    }
];


/* =====================================================
   CAMBIAR ESTADO DEL PEDIDO
===================================================== */

async function cambiarEstadoPedido(
    pedidoId,
    nuevoEstado
) {

    try {

        /* =================================================
           CANCELACIÓN ESPECIAL
           
           Cancelar NO utiliza UPDATE directo.
           Utiliza la RPC que devuelve el inventario.
        ================================================= */

        if (
            String(nuevoEstado).toLowerCase() ===
            "cancelado"
        ) {

            return await cancelarPedido(
                pedidoId
            );

        }


        mostrarEstado(
            "Actualizando estado del pedido..."
        );


        const {
            error
        } =
            await supabaseClient
                .from("pedidos")
                .update({
                    estado: nuevoEstado
                })
                .eq(
                    "id",
                    pedidoId
                );


        if (error) {

            throw error;

        }


        const pedido =
            pedidosAdmin.find(
                pedido =>
                    Number(
                        pedido.id
                    ) ===
                    Number(
                        pedidoId
                    )
            );


        if (pedido) {

            pedido.estado =
                nuevoEstado;

            pedido.actualizado_en =
                new Date().toISOString();

        }


        /*
         * Actualizar listado de pedidos.
         */

        if (
            typeof mostrarPedidosAdmin ===
            "function"
        ) {

            mostrarPedidosAdmin();

        }


        /*
         * Actualizar pedido seleccionado
         * si el modal sigue abierto.
         */

        if (
            pedidoSeleccionado &&
            Number(
                pedidoSeleccionado.id
            ) ===
            Number(
                pedidoId
            )
        ) {

            pedidoSeleccionado.estado =
                nuevoEstado;


            if (
                typeof mostrarDetallePedido ===
                "function"
            ) {

                mostrarDetallePedido(
                    pedidoSeleccionado.id
                );

            }

        }


        mostrarEstado(

            `Pedido #${
                String(
                    pedidoId
                ).padStart(
                    6,
                    "0"
                )
            } actualizado correctamente.`

        );


    } catch (error) {

        console.error(
            "Error al cambiar estado del pedido:",
            error
        );


        mostrarEstado(
            "No se pudo actualizar el estado del pedido."
        );


        /*
         * Recargar pedidos para evitar que
         * la interfaz quede con información
         * diferente a Supabase.
         */

        if (
            typeof cargarPedidosAdmin ===
            "function"
        ) {

            await cargarPedidosAdmin({

                silencioso:
                    true

            });

        }

    }

}


/* =====================================================
   CANCELAR PEDIDO
   DEVOLVER STOCK AUTOMÁTICAMENTE
===================================================== */

async function cancelarPedido(
    pedidoId
) {

    try {

        /* =================================================
           CONFIRMACIÓN DEL ADMINISTRADOR
        ================================================= */

        const confirmar =
            window.confirm(

                `¿Deseas cancelar el pedido #${
                    String(
                        pedidoId
                    ).padStart(
                        6,
                        "0"
                    )
                }?

Al cancelarlo, el inventario descontado será devuelto automáticamente.

Esta acción no se puede deshacer.`

            );


        if (!confirmar) {

            /*
             * No lanzamos error.
             * Simplemente dejamos el pedido
             * en su estado actual.
             */

            return false;

        }


        mostrarEstado(
            "Cancelando pedido y devolviendo inventario..."
        );


        /*
         * La RPC realiza toda la operación
         * de forma transaccional:
         *
         * 1. Bloquea el pedido.
         * 2. Verifica permisos.
         * 3. Verifica el estado.
         * 4. Bloquea los productos.
         * 5. Devuelve las cantidades.
         * 6. Marca stock_devuelto = true.
         * 7. Cambia el pedido a cancelado.
         *
         * Si algo falla, toda la operación
         * se revierte.
         */

        const {
            data,
            error
        } =
            await supabaseClient.rpc(

                "cancelar_pedido_y_devolver_stock",

                {
                    p_pedido_id:
                        Number(
                            pedidoId
                        )
                }

            );


        if (error) {

            throw error;

        }


        /*
         * Validar respuesta de la RPC.
         */

        if (
            !data ||
            data.ok !== true
        ) {

            throw new Error(

                data?.mensaje ||
                "La cancelación del pedido no pudo completarse."

            );

        }


        console.log(
            "✓ Pedido cancelado correctamente:",
            data
        );


        /*
         * Actualizar pedido local.
         */

        const pedido =
            pedidosAdmin.find(
                pedido =>
                    Number(
                        pedido.id
                    ) ===
                    Number(
                        pedidoId
                    )
            );


        if (pedido) {

            pedido.estado =
                "cancelado";

            pedido.stock_devuelto =
                true;

            pedido.actualizado_en =
                new Date().toISOString();

        }


        /*
         * Actualizar pedido seleccionado.
         */

        if (
            pedidoSeleccionado &&
            Number(
                pedidoSeleccionado.id
            ) ===
            Number(
                pedidoId
            )
        ) {

            pedidoSeleccionado.estado =
                "cancelado";

            pedidoSeleccionado.stock_devuelto =
                true;


            if (
                typeof mostrarDetallePedido ===
                "function"
            ) {

                mostrarDetallePedido(
                    pedidoSeleccionado.id
                );

            }

        }


        /*
         * Volver a cargar la lista desde
         * Supabase para garantizar sincronización.
         */

        if (
            typeof cargarPedidosAdmin ===
            "function"
        ) {

            await cargarPedidosAdmin({

                silencioso:
                    true

            });

        } else if (
            typeof mostrarPedidosAdmin ===
            "function"
        ) {

            mostrarPedidosAdmin();

        }


        /*
         * Mostrar resultado.
         */

        const cantidadDevuelta =
            Number(
                data.cantidad_productos_devueltos ||
                data.items_devueltos ||
                data.cantidad_devuelta ||
                0
            );


        mostrarEstado(

            cantidadDevuelta > 0

                ? `Pedido #${
                    String(
                        pedidoId
                    ).padStart(
                        6,
                        "0"
                    )
                } cancelado. Se devolvieron ${
                    cantidadDevuelta
                } unidades al inventario.`

                : `Pedido #${
                    String(
                        pedidoId
                    ).padStart(
                        6,
                        "0"
                    )
                } cancelado correctamente.`

        );


        return true;


    } catch (error) {

        console.error(
            "Error al cancelar pedido:",
            error
        );


        /*
         * Errores conocidos de la RPC.
         */

        let mensaje =
            "No se pudo cancelar el pedido.";


        const textoError =
            String(
                error?.message ||
                error ||
                ""
            ).toLowerCase();


        if (
            textoError.includes(
                "entregado"
            )
        ) {

            mensaje =
                "No se puede cancelar un pedido que ya fue entregado.";

        } else if (
            textoError.includes(
                "no encontrado"
            )
        ) {

            mensaje =
                "El pedido ya no existe.";

        } else if (
            textoError.includes(
                "inventario"
            )
        ) {

            mensaje =
                "No se pudo devolver el inventario del pedido.";

        }


        mostrarEstado(
            mensaje
        );


        /*
         * Recargar desde Supabase para
         * mantener la interfaz sincronizada.
         */

        if (
            typeof cargarPedidosAdmin ===
            "function"
        ) {

            await cargarPedidosAdmin({

                silencioso:
                    true

            });

        }


        return false;

    }

}


/* =====================================================
   SELECTOR DE ESTADO DEL PEDIDO
===================================================== */

function crearSelectorEstadoPedido(
    pedido
) {

    const estadoGuardado =
        String(
            pedido.estado ||
            "pendiente"
        ).toLowerCase();


    /* =================================================
       Compatibilidad con pedidos antiguos
       que utilizaban "enviado".
    ================================================= */

    const estadoActual =
        estadoGuardado === "enviado"

            ? "en_camino"

            : estadoGuardado;


    return `

        <select

            class="
                pedido-estado
                pedido-estado-${escaparAtributo(
                    estadoActual
                )}
            "

            data-pedido-id="${
                escaparAtributo(
                    pedido.id
                )
            }"

            id="pedidoEstadoSeleccionado"

            aria-label="Cambiar estado del pedido"

        >

            ${
                ESTADOS_PEDIDO
                    .map(
                        estado => `

                            <option

                                value="${
                                    escaparAtributo(
                                        estado.valor
                                    )
                                }"

                                ${
                                    estado.valor ===
                                    estadoActual
                                        ? "selected"
                                        : ""
                                }

                            >

                                ${
                                    escaparHTML(
                                        estado.texto
                                    )
                                }

                            </option>

                        `
                    )
                    .join("")
            }

        </select>

    `;

}


/* =====================================================
   GUARDAR EL ESTADO ELEGIDO DESDE EL MODAL
===================================================== */

async function guardarEstadoPedidoSeleccionado() {

    if (!pedidoSeleccionado) {

        return;

    }


    const selector =
        document.getElementById(
            "pedidoEstadoSeleccionado"
        );


    if (!selector) {

        return;

    }


    const boton =
        document.getElementById(
            "guardarEstadoPedidoButton"
        );


    if (boton) {

        boton.disabled = true;

        boton.textContent =
            "⏳ Guardando...";

    }


    selector.disabled = true;


    try {

        await cambiarEstadoPedido(

            pedidoSeleccionado.id,

            selector.value

        );

    } finally {

        selector.disabled = false;


        if (boton) {

            boton.disabled = false;

            boton.textContent =
                "💾 Guardar estado";

        }

    }

}


/* =====================================================
   INICIAR MONITOREO DE PEDIDOS
===================================================== */

function iniciarMonitoreoPedidos() {

    /*
     * Evitar crear múltiples intervalos
     * si el panel se abre más de una vez.
     */

    if (
        pedidosPolling
    ) {

        return;

    }


    pedidosPolling =
        setInterval(

            () => {

                /*
                 * No consultar mientras la pestaña
                 * está en segundo plano.
                 */

                if (
                    !document.hidden
                ) {

                    if (
                        typeof cargarPedidosAdmin ===
                        "function"
                    ) {

                        cargarPedidosAdmin({

                            silencioso:
                                true

                        });

                    }

                }

            },

            30000

        );

}


/* =====================================================
   DETENER MONITOREO DE PEDIDOS
===================================================== */

function detenerMonitoreoPedidos() {

    if (
        pedidosPolling
    ) {

        clearInterval(
            pedidosPolling
        );


        pedidosPolling =
            null;

    }

}


/* =====================================================
   NOTIFICACIÓN — NUEVO PEDIDO
===================================================== */

function mostrarNotificacionNuevoPedido(
    pedidosNuevos
) {

    if (
        !pedidosNuevos ||
        pedidosNuevos.length === 0
    ) {

        return;

    }


    const cantidad =
        pedidosNuevos.length;


    const ultimoPedido =
        pedidosNuevos[
            pedidosNuevos.length - 1
        ];


    const numeroPedido =
        String(
            ultimoPedido.id
        ).padStart(
            6,
            "0"
        );


    mostrarAlertaPedidoNuevo(

        cantidad,

        numeroPedido

    );

}


/* =====================================================
   MOSTRAR ALERTA DE PEDIDO NUEVO
===================================================== */

function mostrarAlertaPedidoNuevo(
    cantidad,
    numeroPedido
) {

    let alerta =
        document.getElementById(
            "adminNewOrderAlert"
        );


    if (
        !alerta
    ) {

        alerta =
            document.createElement(
                "div"
            );


        alerta.id =
            "adminNewOrderAlert";


        alerta.className =
            "admin-new-order-alert";


        document.body.appendChild(
            alerta
        );

    }


    alerta.innerHTML = `

        <div
            class="admin-new-order-alert-icon"
        >

            🛎️

        </div>


        <div
            class="admin-new-order-alert-content"
        >

            <strong>

                ¡Nuevo pedido recibido!

            </strong>


            <span>

                ${
                    cantidad === 1

                        ? `

                            Pedido #${
                                escaparHTML(
                                    numeroPedido
                                )
                            }

                          `

                        : `

                            ${
                                cantidad
                            }

                            pedidos nuevos

                          `
                }

            </span>

        </div>


        <button

            type="button"

            onclick="
                cerrarAlertaPedidoNuevo()
            "

            aria-label="
                Cerrar notificación
            "

        >

            ×

        </button>

    `;


    alerta.classList.add(
        "visible"
    );


    setTimeout(

        () => {

            cerrarAlertaPedidoNuevo();

        },

        10000

    );

}


/* =====================================================
   CERRAR ALERTA DE PEDIDO NUEVO
===================================================== */

function cerrarAlertaPedidoNuevo() {

    const alerta =
        document.getElementById(
            "adminNewOrderAlert"
        );


    if (
        !alerta
    ) {

        return;

    }


    alerta.classList.remove(
        "visible"
    );

}