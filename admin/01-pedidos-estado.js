/* =====================================================
   ESTADOS DE PEDIDO
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
         * Esta función pertenece
         * a la segunda parte del JS.
         *
         * Se comprobará allí que exista
         * antes de utilizarla.
         */

        if (
            typeof mostrarPedidosAdmin ===
            "function"
        ) {

            mostrarPedidosAdmin();

        }


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
         * Si la segunda parte ya contiene
         * cargarPedidosAdmin(), volvemos a
         * cargar los pedidos.
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
   SELECTOR DE ESTADO DEL PEDIDO
===================================================== */

function crearSelectorEstadoPedido(
    pedido
) {

    const estadoGuardado =
        String(pedido.estado || "pendiente").toLowerCase();

    /* Compatibilidad con pedidos que antes usaban "enviado". */
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