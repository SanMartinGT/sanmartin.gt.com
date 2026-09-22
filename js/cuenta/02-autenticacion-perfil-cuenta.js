/* =====================================================
   SAN MARTÍN
   02-autenticacion-perfil-cuenta.js

   AUTENTICACIÓN
   PERFIL
   SESIÓN
   MIS DATOS

   IMPORTANTE:
   Las referencias DOM y supabaseAuth pertenecen
   exclusivamente a 00-configuracion-dom-cuenta.js.
===================================================== */

"use strict";


/* =====================================================
   MOSTRAR LOGIN
===================================================== */

if (mostrarLogin) {

    mostrarLogin.addEventListener(
        "click",
        event => {

            event.preventDefault();

            limpiarMensajes();

            mostrarVistaCuenta("login");

        }
    );

}


/* =====================================================
   MOSTRAR REGISTRO
===================================================== */

if (mostrarRegistro) {

    mostrarRegistro.addEventListener(
        "click",
        event => {

            event.preventDefault();

            limpiarMensajes();

            mostrarVistaCuenta("registro");

        }
    );

}


/* =====================================================
   MOSTRAR RECUPERACIÓN
===================================================== */

if (mostrarRecuperacion) {

    mostrarRecuperacion.addEventListener(
        "click",
        event => {

            event.preventDefault();

            limpiarMensajes();

            mostrarVistaCuenta("recuperacion");

        }
    );

}


/* =====================================================
   VOLVER A ACCESO DESDE LOGIN
===================================================== */

if (volverCuenta) {

    volverCuenta.addEventListener(
        "click",
        event => {

            event.preventDefault();

            limpiarMensajes();

            mostrarVistaCuenta("acceso");

        }
    );

}


/* =====================================================
   VOLVER A ACCESO DESDE REGISTRO
===================================================== */

if (volverCuentaRegistro) {

    volverCuentaRegistro.addEventListener(
        "click",
        event => {

            event.preventDefault();

            limpiarMensajes();

            mostrarVistaCuenta("acceso");

        }
    );

}


/* =====================================================
   VOLVER A LOGIN
===================================================== */

if (volverLogin) {

    volverLogin.addEventListener(
        "click",
        event => {

            event.preventDefault();

            limpiarMensajes();

            mostrarVistaCuenta("login");

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


            /* =========================================
               DATOS
            ========================================= */

            const nombre =
                document
                    .getElementById("registroNombre")
                    ?.value
                    .trim() || "";


            const apellido =
                document
                    .getElementById("registroApellido")
                    ?.value
                    .trim() || "";


            const email =
                document
                    .getElementById("registroEmail")
                    ?.value
                    .trim() || "";


            const telefono =
                document
                    .getElementById("registroTelefono")
                    ?.value
                    .trim() || "";


            const password =
                document
                    .getElementById("registroPassword")
                    ?.value || "";


            const passwordConfirm =
                document
                    .getElementById("registroPasswordConfirm")
                    ?.value || "";


            const newsletter =
                document.querySelector(
                    'input[name="newsletter"]:checked'
                )?.value === "si";


            /* =========================================
               VALIDAR NOMBRE Y APELLIDO
            ========================================= */

            if (!nombre || !apellido) {

                if (mensajeRegistro) {

                    mensajeRegistro.textContent =
                        "El nombre y apellido son obligatorios.";

                }

                return;

            }


            /* =========================================
               VALIDAR CORREO
            ========================================= */

            if (!email) {

                if (mensajeRegistro) {

                    mensajeRegistro.textContent =
                        "Ingresa tu correo electrónico.";

                }

                return;

            }


            /* =========================================
               VALIDAR CONTRASEÑA
            ========================================= */

            if (
                !password ||
                password.length < 6
            ) {

                if (mensajeRegistro) {

                    mensajeRegistro.textContent =
                        "La contraseña debe tener al menos 6 caracteres.";

                }

                return;

            }


            /* =========================================
               CONFIRMAR CONTRASEÑA
            ========================================= */

            if (
                password !==
                passwordConfirm
            ) {

                if (mensajeRegistro) {

                    mensajeRegistro.textContent =
                        "Las contraseñas no coinciden.";

                }

                return;

            }


            /* =========================================
               BOTÓN
            ========================================= */

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

                /* =====================================
                   CREAR USUARIO
                ===================================== */

                const {
                    data,
                    error
                } =
                    await supabaseAuth.auth.signUp({

                        email,

                        password,

                        options: {

                            data: {

                                nombre,

                                apellido,

                                telefono,

                                newsletter

                            }

                        }

                    });


                if (error) {

                    throw error;

                }


                console.log(
                    "✓ San Martín: cuenta creada",
                    data.user
                );


                /* =====================================
                   ¿SUPABASE CREÓ SESIÓN?
                ===================================== */

                if (data?.session?.user) {

                    /*
                     * La confirmación de correo está
                     * desactivada o ya no es necesaria.
                     *
                     * Supabase ya inició sesión.
                     */

                    registroForm.reset();

                    mostrarUsuario(
                        data.session.user
                    );

                    return;

                }


                /* =====================================
                   CONFIRMACIÓN DE CORREO
                ===================================== */

                if (mensajeRegistro) {

                    mensajeRegistro.textContent =
                        "Cuenta creada correctamente. Revisa tu correo electrónico para confirmar tu cuenta.";

                }


                registroForm.reset();


                /*
                 * Solamente en este caso llevamos al
                 * usuario al login.
                 */

                setTimeout(
                    () => {

                        mostrarVistaCuenta("login");


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
                        obtenerMensajeError(error);

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


            /* =========================================
               DATOS
            ========================================= */

            const email =
                document
                    .getElementById("loginEmail")
                    ?.value
                    .trim() || "";


            const password =
                document
                    .getElementById("loginPassword")
                    ?.value || "";


            if (!email || !password) {

                if (mensajeLogin) {

                    mensajeLogin.textContent =
                        "Ingresa tu correo y contraseña.";

                }

                return;

            }


            /* =========================================
               BOTÓN
            ========================================= */

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

                /* =====================================
                   AUTENTICAR
                ===================================== */

                const {
                    data,
                    error
                } =
                    await supabaseAuth.auth
                        .signInWithPassword({

                            email,

                            password

                        });


                if (error) {

                    throw error;

                }


                console.log(
                    "✓ San Martín: sesión iniciada",
                    data.user
                );


                loginForm.reset();


                /*
                 * SIGNED_IN también será recibido por
                 * onAuthStateChange.
                 *
                 * Lo mostramos aquí inmediatamente
                 * para que la interfaz responda sin
                 * depender del callback.
                 */

                if (data?.user) {

                    mostrarUsuario(
                        data.user
                    );

                }


            } catch (error) {

                console.error(
                    "Error al iniciar sesión:",
                    error
                );


                if (mensajeLogin) {

                    mensajeLogin.textContent =
                        obtenerMensajeError(error);

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
        async event => {

            event.preventDefault();


            btnCerrarSesion.disabled =
                true;


            try {

                const {
                    error
                } =
                    await supabaseAuth.auth
                        .signOut();


                if (error) {

                    throw error;

                }


                /*
                 * NO cambiamos manualmente la vista.
                 *
                 * Supabase disparará SIGNED_OUT.
                 */

            } catch (error) {

                console.error(
                    "Error al cerrar sesión:",
                    error
                );


                if (mensajeCuenta) {

                    mensajeCuenta.textContent =
                        "No fue posible cerrar la sesión.";

                }

            } finally {

                btnCerrarSesion.disabled =
                    false;

            }

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
                    .getElementById("recuperacionEmail")
                    ?.value
                    .trim() || "";


            if (!email) {

                if (mensajeRecuperacion) {

                    mensajeRecuperacion.textContent =
                        "Ingresa tu correo electrónico.";

                }

                return;

            }


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
                        obtenerMensajeError(error);

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

        mostrarVistaCuenta("acceso");

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


    /*
     * IMPORTANTE:
     *
     * mostrarVistaCuenta("usuario")
     * debe mostrar:
     *
     * - cuentaUsuario
     * - .cuenta-menu
     *
     * y ocultar las demás vistas.
     */

    mostrarVistaCuenta("usuario");

}


/* =====================================================
   CARGAR MIS DATOS
===================================================== */

async function cargarMisDatos() {

    limpiarMensajeMisDatos();


    /* =================================================
       OBTENER USUARIO
    ================================================= */

    const {
        data: {
            user
        } = {},
        error: errorUsuario
    } =
        await supabaseAuth.auth.getUser();


    if (
        errorUsuario ||
        !user
    ) {

        if (mensajeMisDatos) {

            mensajeMisDatos.textContent =
                "Tu sesión ha expirado. Inicia sesión nuevamente.";

        }

        return;

    }


    /* =================================================
       EMAIL
    ================================================= */

    if (datosEmail) {

        datosEmail.value =
            user.email || "";

    }


    /* =================================================
       OBTENER PERFIL
    ================================================= */

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
        "San Martín — usuario actual:",
        user
    );


    console.log(
        "San Martín — datos del perfil:",
        data
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


    /* =================================================
       NOMBRE
    ================================================= */

    if (datosNombre) {

        datosNombre.value =
            data?.nombre || "";

    }


    /* =================================================
       APELLIDO
    ================================================= */

    if (datosApellido) {

        datosApellido.value =
            data?.apellido || "";

    }


    /* =================================================
       TELÉFONO
    ================================================= */

    if (datosTelefono) {

        datosTelefono.value =
            data?.telefono || "";

    }


    /* =================================================
       NEWSLETTER
    ================================================= */

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
        async event => {

            event.preventDefault();


            if (
                typeof mostrarSubvistaCuenta ===
                "function"
            ) {

                mostrarSubvistaCuenta("datos");

            } else {

                /*
                 * Respaldo.
                 */

                if (cuentaUsuario) {

                    cuentaUsuario.hidden =
                        false;

                }

                if (misDatos) {

                    misDatos.hidden =
                        false;

                }

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
        event => {

            event.preventDefault();


            if (
                typeof mostrarSubvistaCuenta ===
                "function"
            ) {

                mostrarSubvistaCuenta("menu");

            } else {

                if (misDatos) {

                    misDatos.hidden =
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


            /* =========================================
               DATOS
            ========================================= */

            const nombre =
                datosNombre
                    ?.value
                    .trim() || "";


            const apellido =
                datosApellido
                    ?.value
                    .trim() || "";


            const telefono =
                datosTelefono
                    ?.value
                    .trim() || "";


            const newsletter =
                document.querySelector(
                    'input[name="datosNewsletter"]:checked'
                )?.value === "si";


            /* =========================================
               VALIDAR
            ========================================= */

            if (!nombre || !apellido) {

                if (mensajeMisDatos) {

                    mensajeMisDatos.textContent =
                        "El nombre y apellido son obligatorios.";

                }

                return;

            }


            /* =========================================
               BOTÓN
            ========================================= */

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

                /* =====================================
                   OBTENER USUARIO
                ===================================== */

                const {
                    data: {
                        user
                    } = {},
                    error: errorUsuario
                } =
                    await supabaseAuth.auth.getUser();


                if (
                    errorUsuario ||
                    !user
                ) {

                    throw new Error(
                        "No hay una sesión activa."
                    );

                }


                /* =====================================
                   ACTUALIZAR PERFIL
                ===================================== */

                const {
                    error
                } =
                    await supabaseAuth
                        .from("perfiles")
                        .update({

                            nombre,

                            apellido,

                            telefono,

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


                /* =====================================
                   ACTUALIZAR METADATOS AUTH
                ===================================== */

                const {
                    error: errorMetadata
                } =
                    await supabaseAuth.auth
                        .updateUser({

                            data: {

                                nombre,

                                apellido,

                                telefono,

                                newsletter

                            }

                        });


                if (errorMetadata) {

                    console.warn(
                        "San Martín: el perfil se guardó, pero no fue posible actualizar los metadatos.",
                        errorMetadata
                    );

                }


                /* =====================================
                   ACTUALIZAR NOMBRE VISUAL
                ===================================== */

                if (nombreUsuario) {

                    nombreUsuario.textContent =
                        nombre;

                }


                /* =====================================
                   ÉXITO
                ===================================== */

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
   COMPROBAR SESIÓN ACTUAL
===================================================== */

async function comprobarSesion() {

    try {

        const {
            data: {
                session
            } = {},
            error
        } =
            await supabaseAuth.auth.getSession();


        if (error) {

            console.error(
                "Error obteniendo sesión:",
                error
            );


            mostrarVistaCuenta("acceso");

            return null;

        }


        if (session?.user) {

            mostrarUsuario(
                session.user
            );

            return session.user;

        }


        mostrarVistaCuenta("acceso");

        return null;


    } catch (error) {

        console.error(
            "Error comprobando sesión:",
            error
        );


        mostrarVistaCuenta("acceso");

        return null;

    }

}


/* =====================================================
   ESCUCHAR CAMBIOS DE AUTENTICACIÓN
===================================================== */

supabaseAuth.auth.onAuthStateChange(
    (
        event,
        session
    ) => {

        console.log(
            "Cambio de autenticación:",
            event
        );


        /* =============================================
           SESIÓN INICIAL
        ============================================= */

        if (
            event ===
            "INITIAL_SESSION"
        ) {

            if (session?.user) {

                mostrarUsuario(
                    session.user
                );

            } else {

                mostrarVistaCuenta(
                    "acceso"
                );

            }

            return;

        }


        /* =============================================
           INICIO DE SESIÓN
        ============================================= */

        if (
            event ===
            "SIGNED_IN"
        ) {

            if (session?.user) {

                mostrarUsuario(
                    session.user
                );

            }

            return;

        }


        /* =============================================
           CIERRE DE SESIÓN
        ============================================= */

        if (
            event ===
            "SIGNED_OUT"
        ) {

            mostrarVistaCuenta(
                "acceso"
            );

            limpiarMensajes();

            return;

        }


        /* =============================================
           USUARIO ACTUALIZADO
        ============================================= */

        if (
            event ===
            "USER_UPDATED"
        ) {

            /*
             * Solamente actualizamos el nombre.
             *
             * NO cambiamos de vista.
             */

            if (session?.user) {

                const metadata =
                    session.user.user_metadata ||
                    {};


                const nombre =
                    metadata.nombre ||
                    session.user.email
                        ?.split("@")[0] ||
                    "Cliente";


                if (nombreUsuario) {

                    nombreUsuario.textContent =
                        nombre;

                }

            }

            return;

        }


        /* =============================================
           TOKEN ACTUALIZADO
        ============================================= */

        if (
            event ===
            "TOKEN_REFRESHED"
        ) {

            /*
             * No modificamos la interfaz.
             *
             * El cliente permanece donde estaba.
             */

            return;

        }

    }
);