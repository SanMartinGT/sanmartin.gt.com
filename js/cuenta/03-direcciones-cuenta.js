/* =====================================================
   SAN MARTÍN
   03-direcciones-cuenta.js

   GESTIÓN DE DIRECCIONES DEL CLIENTE

   FUNCIONES PRINCIPALES:
   - Mostrar mis direcciones
   - Cargar direcciones desde Supabase
   - Agregar dirección
   - Editar dirección
   - Eliminar dirección
   - Establecer dirección principal
   - Cancelar formulario
   - Volver al menú de Mi cuenta

   NOTA:
   Este módulo utiliza mostrarSubvistaCuenta()
   cuando está disponible, definida en:

   01-vistas-favoritos-pedidos-cuenta.js

   Si no está disponible, utiliza un sistema
   de respaldo para evitar que la interfaz quede
   bloqueada.
===================================================== */


/* =====================================================
   MOSTRAR MIS DIRECCIONES
===================================================== */

if (btnMisDirecciones) {

    btnMisDirecciones.addEventListener(
        "click",
        async () => {

            /*
             * Utilizar el sistema centralizado de vistas
             * cuando esté disponible.
             */
            if (
                typeof mostrarSubvistaCuenta ===
                "function"
            ) {

                mostrarSubvistaCuenta(
                    "direcciones"
                );

            } else {

                /*
                 * SISTEMA DE RESPALDO
                 */

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

            }


            /*
             * Aseguramos que el formulario de
             * dirección permanezca cerrado.
             */
            if (formularioDireccionContainer) {

                formularioDireccionContainer.hidden =
                    true;

            }


            /*
             * Limpiar mensajes generales.
             */
            if (mensajeCuenta) {

                mensajeCuenta.textContent =
                    "";

            }


            /*
             * Cargar direcciones.
             */
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


    /*
     * Estado de carga.
     */

    listaDirecciones.innerHTML = `
        <p class="estado-cargando-direcciones">
            Cargando tus direcciones...
        </p>
    `;


    /*
     * Comprobar usuario autenticado.
     */

    const {

        data: { user },

        error: errorUsuario

    } =
        await supabaseAuth.auth.getUser();


    if (errorUsuario || !user) {

        listaDirecciones.innerHTML = `
            <p class="mensaje-error-direcciones">
                Tu sesión ha expirado.
                Inicia sesión nuevamente.
            </p>
        `;

        return;

    }


    /*
     * Obtener direcciones.
     */

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


    /*
     * Error.
     */

    if (error) {

        console.error(
            "Error cargando direcciones:",
            error
        );


        listaDirecciones.innerHTML = `
            <p class="mensaje-error-direcciones">
                No fue posible cargar tus direcciones.
            </p>
        `;

        return;

    }


    /*
     * Sin direcciones.
     */

    if (
        !data ||
        data.length === 0
    ) {

        listaDirecciones.innerHTML = `

            <div class="sin-direcciones">

                <div
                    class="sin-direcciones-icono"
                    aria-hidden="true"
                >
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


    /*
     * Limpiar lista.
     */

    listaDirecciones.innerHTML = "";


    /*
     * Crear tarjetas.
     */

    data.forEach(
        direccion => {

            const tarjeta =
                document.createElement(
                    "div"
                );


            tarjeta.className =
                "tarjeta-direccion";


            tarjeta.dataset.id =
                direccion.id;


            tarjeta.innerHTML = `

                <div class="direccion-contenido">

                    <h4>

                        ${escaparHTML(
                            direccion.nombre_direccion ||
                            "Dirección"
                        )}

                        ${
                            direccion.principal
                                ? `
                                    <span
                                        class="direccion-principal"
                                        aria-label="Dirección principal"
                                    >
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
                            direccion.nombre_receptor ||
                            ""
                        )}

                    </p>


                    <p>

                        <strong>
                            Teléfono:
                        </strong>

                        ${escaparHTML(
                            direccion.telefono ||
                            ""
                        )}

                    </p>


                    <p>

                        <strong>
                            Ubicación:
                        </strong>

                        ${escaparHTML(
                            direccion.municipio ||
                            ""
                        )},

                        ${escaparHTML(
                            direccion.departamento ||
                            ""
                        )}

                    </p>


                    <p>

                        <strong>
                            Dirección:
                        </strong>

                        ${escaparHTML(
                            direccion.direccion ||
                            ""
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
                        aria-label="Editar dirección ${escaparHTML(
                            direccion.nombre_direccion ||
                            ""
                        )}"
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
                        aria-label="Eliminar dirección ${escaparHTML(
                            direccion.nombre_direccion ||
                            ""
                        )}"
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


    /*
     * Activar botones recién creados.
     */

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

                        if (!id) {
                            return;
                        }

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

                        if (!id) {
                            return;
                        }

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

                        if (!id) {
                            return;
                        }

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

            limpiarMensajeDireccion();


            if (tituloFormularioDireccion) {

                tituloFormularioDireccion.textContent =
                    "Agregar dirección";

            }


            if (formularioDireccionContainer) {

                formularioDireccionContainer.hidden =
                    false;

            }


            /*
             * El botón agregar dirección abre
             * únicamente el formulario.
             */

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


            /*
             * Obtener usuario actual.
             */

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


            /*
             * ID:
             *
             * vacío = nueva dirección
             * con valor = actualización
             */

            const id =
                direccionId?.value?.trim() || "";


            /*
             * Preparar datos.
             */

            const datosDireccion = {

                usuario_id:
                    user.id,

                nombre_direccion:
                    direccionNombre?.value
                        ?.trim() || "",

                nombre_receptor:
                    direccionReceptor?.value
                        ?.trim() || "",

                telefono:
                    direccionTelefono?.value
                        ?.trim() || "",

                departamento:
                    direccionDepartamento?.value
                        ?.trim() || "",

                municipio:
                    direccionMunicipio?.value
                        ?.trim() || "",

                direccion:
                    direccionCompleta?.value
                        ?.trim() || "",

                referencia:
                    direccionReferencia?.value
                        ?.trim() || null,

                principal:
                    direccionPrincipal?.checked === true,

                actualizado_en:
                    new Date()
                        .toISOString()

            };


            /* =================================================
               VALIDAR CAMPOS
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


            /*
             * Evitar doble envío.
             */

            const botonSubmit =
                formularioDireccion.querySelector(
                    'button[type="submit"]'
                );


            if (botonSubmit) {

                botonSubmit.disabled =
                    true;

            }


            try {


                /* =================================================
                   ACTUALIZAR DIRECCIÓN EXISTENTE
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


                    /*
                     * Si fue marcada como principal,
                     * establecerla como única principal.
                     */

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

                            return;

                        }

                    }


                    mostrarMensajeDireccion(
                        "✓ Dirección actualizada correctamente."
                    );

                }


                /* =================================================
                   CREAR NUEVA DIRECCIÓN
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


                    /*
                     * Si la nueva dirección fue marcada
                     * como principal, establecerla.
                     */

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

                            return;

                        }

                    }


                    mostrarMensajeDireccion(
                        "✓ Dirección guardada correctamente."
                    );

                }


                /*
                 * Cerrar formulario.
                 */

                if (formularioDireccionContainer) {

                    formularioDireccionContainer.hidden =
                        true;

                }


                /*
                 * Limpiar formulario.
                 */

                limpiarFormularioDireccion();


                /*
                 * Recargar lista.
                 */

                await cargarDirecciones();


            } finally {

                /*
                 * Reactivar botón aunque ocurra
                 * algún error.
                 */

                if (botonSubmit) {

                    botonSubmit.disabled =
                        false;

                }

            }

        }
    );

}


/* =====================================================
   EDITAR DIRECCIÓN
===================================================== */

async function editarDireccion(id) {

    limpiarMensajeDireccion();


    if (!id) {
        return;
    }


    /*
     * Comprobar sesión.
     */

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


    /*
     * Obtener dirección.
     */

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


    /*
     * Cargar valores.
     */

    if (direccionId) {

        direccionId.value =
            data.id || "";

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


    /*
     * Cambiar título.
     */

    if (tituloFormularioDireccion) {

        tituloFormularioDireccion.textContent =
            "Editar dirección";

    }


    /*
     * Mostrar formulario.
     */

    if (formularioDireccionContainer) {

        formularioDireccionContainer.hidden =
            false;

    }


    /*
     * Llevar al primer campo.
     */

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

    if (!id) {
        return;
    }


    /*
     * Comprobar sesión.
     */

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


    /*
     * Deshabilitar temporalmente botones
     * para evitar múltiples solicitudes.
     */

    const botones =
        document.querySelectorAll(
            ".btn-principal-direccion"
        );


    botones.forEach(
        boton => {

            boton.disabled =
                true;

        }
    );


    try {

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

    } finally {

        botones.forEach(
            boton => {

                boton.disabled =
                    false;

            }
        );

    }

}


/* =====================================================
   ESTABLECER DIRECCIÓN PRINCIPAL
===================================================== */

async function establecerDireccionPrincipal(
    id,
    usuarioId
) {

    if (!id || !usuarioId) {

        return false;

    }


    /*
     * Primero comprobar que la dirección
     * pertenece al usuario.
     */

    const {

        data: direccion,

        error: errorDireccion

    } =
        await supabaseAuth

            .from("direcciones")

            .select(
                "id"
            )

            .eq(
                "id",
                id
            )

            .eq(
                "usuario_id",
                usuarioId
            )

            .maybeSingle();


    if (
        errorDireccion ||
        !direccion
    ) {

        console.error(
            "La dirección no pertenece al usuario:",
            errorDireccion
        );

        return false;

    }


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
                    false,

                actualizado_en:
                    new Date()
                        .toISOString()

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
                    true,

                actualizado_en:
                    new Date()
                        .toISOString()

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

    if (!id) {
        return;
    }


    /*
     * Confirmación.
     */

    const confirmar =
        window.confirm(
            "¿Estás seguro de que deseas eliminar esta dirección?"
        );


    if (!confirmar) {
        return;
    }


    /*
     * Comprobar sesión.
     */

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


    /*
     * Buscar dirección antes de eliminar.
     */

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

            .maybeSingle();


    if (
        errorConsulta ||
        !direccion
    ) {

        console.error(
            "Error buscando dirección:",
            errorConsulta
        );


        mostrarMensajeDireccion(
            "No fue posible encontrar la dirección.",
            true
        );

        return;

    }


    /*
     * Eliminar.
     */

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


    /*
     * Si eliminamos la principal,
     * intentamos convertir otra en principal.
     */

    if (direccion.principal) {

        const {

            data: siguienteDireccion,

            error: errorSiguiente

        } =
            await supabaseAuth

                .from("direcciones")

                .select(
                    "id"
                )

                .eq(
                    "usuario_id",
                    user.id
                )

                .order(
                    "id",
                    {
                        ascending: false
                    }
                )
                .limit(1)
                .maybeSingle();


        if (
            !errorSiguiente &&
            siguienteDireccion
        ) {

            await establecerDireccionPrincipal(
                siguienteDireccion.id,
                user.id
            );

        }

    }


    mostrarMensajeDireccion(
        "✓ Dirección eliminada correctamente."
    );


    /*
     * Recargar lista.
     */

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

            /*
             * Utilizar el controlador central
             * de sub-vistas si está disponible.
             */

            if (
                typeof mostrarSubvistaCuenta ===
                "function"
            ) {

                mostrarSubvistaCuenta(
                    "menu"
                );

            } else {

                /*
                 * SISTEMA DE RESPALDO
                 */

                if (misDirecciones) {

                    misDirecciones.hidden =
                        true;

                }


                if (misDatos) {

                    misDatos.hidden =
                        true;

                }


                if (misPedidos) {

                    misPedidos.hidden =
                        true;

                }


                if (misFavoritos) {

                    misFavoritos.hidden =
                        true;

                }


                if (cuentaUsuario) {

                    cuentaUsuario.hidden =
                        false;

                }


                const menuCuenta =
                    document.querySelector(
                        ".cuenta-menu"
                    );


                if (menuCuenta) {

                    menuCuenta.hidden =
                        false;

                }

            }


            /*
             * Cerrar formulario.
             */

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

        /*
         * Restaurar color para futuros mensajes.
         */

        mensajeDireccion.style.color =
            "";

    }

}


/* =====================================================
   FIN 03-direcciones-cuenta.js
===================================================== */