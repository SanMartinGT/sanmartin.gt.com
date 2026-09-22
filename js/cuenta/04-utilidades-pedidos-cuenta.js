/* =====================================================
   SAN MARTÍN
   04-utilidades-pedidos-cuenta.js

   UTILIDADES GENERALES PARA PEDIDOS Y CUENTA

   FUNCIONES:
   - Obtener estado de pedido
   - Formatear precios
   - Formatear fechas
   - Generar número de pedido
   - Escapar HTML
   - Normalizar datos
   - Utilidades de mensajes
   - Obtener mensajes de error de Supabase

   IMPORTANTE:
   La gestión de sesión NO pertenece a este archivo.

   La autenticación se controla desde:

   02-autenticacion-perfil-cuenta.js

   Este archivo NO contiene:
   - comprobarSesion()
   - onAuthStateChange()
   - mostrarUsuario()
   - signInWithPassword()
   - signOut()
===================================================== */


/* =====================================================
   ESTADOS DE PEDIDO
===================================================== */

function obtenerEstadoPedido(
    estado
) {

    const estadoNormalizado =
        String(
            estado || ""
        )
            .trim()
            .toLowerCase();


    const estados = {

        pendiente: {

            texto:
                "Pendiente",

            icono:
                "🟡",

            clase:
                "pedido-pendiente"

        },


        confirmado: {

            texto:
                "Confirmado",

            icono:
                "🔵",

            clase:
                "pedido-confirmado"

        },


        preparando: {

            texto:
                "Preparando pedido",

            icono:
                "🟣",

            clase:
                "pedido-preparando"

        },


        en_camino: {

            texto:
                "En camino",

            icono:
                "🚚",

            clase:
                "pedido-en-camino"

        },


        entregado: {

            texto:
                "Entregado",

            icono:
                "🟢",

            clase:
                "pedido-entregado"

        },


        cancelado: {

            texto:
                "Cancelado",

            icono:
                "🔴",

            clase:
                "pedido-cancelado"

        }

    };


    return (

        estados[
            estadoNormalizado
        ]

        ||

        {

            texto:
                "Estado desconocido",

            icono:
                "⚪",

            clase:
                "pedido-desconocido"

        }

    );

}


/* =====================================================
   FORMATEAR PRECIO
===================================================== */

function formatearPrecio(
    valor
) {

    const numero =
        Number(
            valor
        );


    const precioValido =
        Number.isFinite(
            numero
        )
            ? numero
            : 0;


    return `Q${precioValido.toFixed(2)}`;

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

        const fechaConvertida =
            new Date(
                fecha
            );


        if (
            Number.isNaN(
                fechaConvertida.getTime()
            )
        ) {

            return String(
                fecha
            );

        }


        return new Intl.DateTimeFormat(
            "es-GT",
            {

                dateStyle:
                    "long"

            }
        ).format(
            fechaConvertida
        );


    } catch (error) {

        console.error(
            "Error formateando fecha:",
            error
        );


        return String(
            fecha
        );

    }

}


/* =====================================================
   FORMATEAR FECHA Y HORA
===================================================== */

function formatearFechaHora(
    fecha
) {

    if (!fecha) {

        return "";

    }


    try {

        const fechaConvertida =
            new Date(
                fecha
            );


        if (
            Number.isNaN(
                fechaConvertida.getTime()
            )
        ) {

            return String(
                fecha
            );

        }


        return new Intl.DateTimeFormat(
            "es-GT",
            {

                dateStyle:
                    "long",

                timeStyle:
                    "short"

            }
        ).format(
            fechaConvertida
        );


    } catch (error) {

        console.error(
            "Error formateando fecha y hora:",
            error
        );


        return String(
            fecha
        );

    }

}


/* =====================================================
   NÚMERO DE PEDIDO
===================================================== */

function obtenerNumeroPedido(
    id
) {

    /*
     * Si no existe ID, devolver identificador
     * genérico para evitar SM-NaN.
     */

    if (
        id === null ||
        id === undefined ||
        id === ""
    ) {

        return "SM-0000";

    }


    /*
     * Si el ID es numérico, mantener formato
     * SM-0001, SM-0025, etc.
     */

    const numero =
        Number(
            id
        );


    if (
        Number.isFinite(
            numero
        )
    ) {

        return `SM-${String(
            Math.trunc(
                numero
            )
        ).padStart(
            4,
            "0"
        )}`;

    }


    /*
     * Si el identificador no es numérico,
     * devolverlo de forma segura.
     */

    return `SM-${String(
        id
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


    return String(
        texto
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
   ESCAPAR ATRIBUTO HTML
===================================================== */

function escaparAtributoHTML(
    texto
) {

    return escaparHTML(
        texto
    );

}


/* =====================================================
   NORMALIZAR TEXTO
===================================================== */

function normalizarTexto(
    texto
) {

    if (
        texto === null ||
        texto === undefined
    ) {

        return "";

    }


    return String(
        texto
    )
        .trim()
        .toLowerCase();

}


/* =====================================================
   OBTENER TEXTO SEGURO
===================================================== */

function obtenerTextoSeguro(
    texto,
    valorPorDefecto = ""
) {

    if (
        texto === null ||
        texto === undefined
    ) {

        return valorPorDefecto;

    }


    const resultado =
        String(
            texto
        ).trim();


    return resultado ||
        valorPorDefecto;

}


/* =====================================================
   OBTENER NÚMERO SEGURO
===================================================== */

function obtenerNumeroSeguro(
    valor,
    valorPorDefecto = 0
) {

    const numero =
        Number(
            valor
        );


    if (
        Number.isFinite(
            numero
        )
    ) {

        return numero;

    }


    return valorPorDefecto;

}


/* =====================================================
   CALCULAR TOTAL
===================================================== */

function calcularTotal(
    cantidad,
    precio
) {

    const cantidadSegura =
        obtenerNumeroSeguro(
            cantidad,
            0
        );


    const precioSeguro =
        obtenerNumeroSeguro(
            precio,
            0
        );


    return (
        cantidadSegura *
        precioSeguro
    );

}


/* =====================================================
   FORMATEAR CANTIDAD
===================================================== */

function formatearCantidad(
    cantidad
) {

    const numero =
        obtenerNumeroSeguro(
            cantidad,
            0
        );


    return new Intl.NumberFormat(
        "es-GT"
    ).format(
        numero
    );

}


/* =====================================================
   FORMATEAR MONEDA
===================================================== */

function formatearMoneda(
    valor
) {

    const numero =
        obtenerNumeroSeguro(
            valor,
            0
        );


    try {

        return new Intl.NumberFormat(
            "es-GT",
            {

                style:
                    "currency",

                currency:
                    "GTQ",

                minimumFractionDigits:
                    2,

                maximumFractionDigits:
                    2

            }
        ).format(
            numero
        );


    } catch (error) {

        return `Q${numero.toFixed(2)}`;

    }

}


/* =====================================================
   COMPROBAR SI UN PEDIDO ESTÁ TERMINADO
===================================================== */

function pedidoFinalizado(
    estado
) {

    const estadoNormalizado =
        normalizarTexto(
            estado
        );


    return (

        estadoNormalizado ===
            "entregado"

        ||

        estadoNormalizado ===
            "cancelado"

    );

}


/* =====================================================
   COMPROBAR SI UN PEDIDO ESTÁ ACTIVO
===================================================== */

function pedidoActivo(
    estado
) {

    return !pedidoFinalizado(
        estado
    );

}


/* =====================================================
   OBTENER CLASE DE ESTADO
===================================================== */

function obtenerClaseEstadoPedido(
    estado
) {

    const informacion =
        obtenerEstadoPedido(
            estado
        );


    return informacion.clase ||
        "pedido-desconocido";

}


/* =====================================================
   OBTENER TEXTO DE ESTADO
===================================================== */

function obtenerTextoEstadoPedido(
    estado
) {

    const informacion =
        obtenerEstadoPedido(
            estado
        );


    return informacion.texto;

}


/* =====================================================
   OBTENER ICONO DE ESTADO
===================================================== */

function obtenerIconoEstadoPedido(
    estado
) {

    const informacion =
        obtenerEstadoPedido(
            estado
        );


    return informacion.icono;

}


/* =====================================================
   LIMPIAR TODOS LOS MENSAJES DE CUENTA
===================================================== */

function limpiarMensajes() {

    const mensajes = [

        mensajeLogin,

        mensajeRegistro,

        mensajeRecuperacion,

        mensajeCuenta,

        mensajeMisDatos,

        mensajePedidos,

        mensajeDireccion

    ];


    mensajes.forEach(
        mensaje => {

            if (
                mensaje
            ) {

                mensaje.textContent =
                    "";

                /*
                 * También eliminamos estados
                 * visuales de error/éxito si
                 * fueron agregados mediante
                 * clases CSS.
                 */

                mensaje.classList.remove(
                    "error",
                    "exito",
                    "success",
                    "mensaje-error",
                    "mensaje-exito"
                );

            }

        }
    );

}


/* =====================================================
   LIMPIAR MENSAJE DE MIS DATOS
===================================================== */

function limpiarMensajeMisDatos() {

    if (
        mensajeMisDatos
    ) {

        mensajeMisDatos.textContent =
            "";

        mensajeMisDatos.classList.remove(
            "error",
            "exito",
            "success",
            "mensaje-error",
            "mensaje-exito"
        );

    }

}


/* =====================================================
   LIMPIAR MENSAJE DE DIRECCIÓN
===================================================== */

function limpiarMensajeDireccion() {

    if (
        mensajeDireccion
    ) {

        mensajeDireccion.textContent =
            "";

        mensajeDireccion.classList.remove(
            "error",
            "exito",
            "success",
            "mensaje-error",
            "mensaje-exito"
        );

    }

}


/* =====================================================
   LIMPIAR MENSAJE DE PEDIDOS
===================================================== */

function limpiarMensajePedidos() {

    if (
        mensajePedidos
    ) {

        mensajePedidos.textContent =
            "";

        mensajePedidos.classList.remove(
            "error",
            "exito",
            "success",
            "mensaje-error",
            "mensaje-exito"
        );

    }

}


/* =====================================================
   OBTENER MENSAJE DE ERROR
   SUPABASE / AUTENTICACIÓN
===================================================== */

function obtenerMensajeError(
    error
) {

    if (
        !error
    ) {

        return "Ocurrió un error inesperado.";

    }


    /*
     * Recopilar información disponible.
     */

    const mensajeOriginal =
        String(
            error.message ||
            error.msg ||
            error.error_description ||
            ""
        )
            .trim();


    const mensajeNormalizado =
        normalizarTexto(
            mensajeOriginal
        );


    const codigo =
        normalizarTexto(
            error.code ||
            ""
        );


    const status =
        Number(
            error.status
        );


    /*
     * Credenciales incorrectas.
     */

    if (

        codigo ===
            "invalid_credentials"

        ||

        mensajeNormalizado.includes(
            "invalid login credentials"
        )

        ||

        mensajeNormalizado.includes(
            "invalid credentials"
        )

    ) {

        return (
            "El correo electrónico o la contraseña son incorrectos."
        );

    }


    /*
     * Correo no confirmado.
     */

    if (

        codigo ===
            "email_not_confirmed"

        ||

        mensajeNormalizado.includes(
            "email not confirmed"
        )

        ||

        mensajeNormalizado.includes(
            "email_not_confirmed"
        )

    ) {

        return (
            "Tu correo electrónico aún no ha sido confirmado. Revisa tu bandeja de entrada."
        );

    }


    /*
     * Usuario ya registrado.
     */

    if (

        codigo ===
            "user_already_exists"

        ||

        mensajeNormalizado.includes(
            "user already registered"
        )

        ||

        mensajeNormalizado.includes(
            "already registered"
        )

        ||

        mensajeNormalizado.includes(
            "already exists"
        )

    ) {

        return (
            "Este correo electrónico ya está registrado. Intenta iniciar sesión."
        );

    }


    /*
     * Contraseña demasiado corta.
     */

    if (

        mensajeNormalizado.includes(
            "password should be at least"
        )

        ||

        mensajeNormalizado.includes(
            "password must be at least"
        )

        ||

        mensajeNormalizado.includes(
            "password"
        )
        &&
        mensajeNormalizado.includes(
            "characters"
        )

    ) {

        return (
            "La contraseña no cumple con los requisitos mínimos de seguridad."
        );

    }


    /*
     * Correo electrónico inválido.
     */

    if (

        codigo ===
            "invalid_email"

        ||

        mensajeNormalizado.includes(
            "invalid email"
        )

        ||

        mensajeNormalizado.includes(
            "email address"
        )
        &&
        mensajeNormalizado.includes(
            "invalid"
        )

    ) {

        return (
            "Ingresa un correo electrónico válido."
        );

    }


    /*
     * Límite temporal de solicitudes.
     */

    if (

        status === 429

        ||

        codigo ===
            "over_request_rate_limit"

        ||

        mensajeNormalizado.includes(
            "rate limit"
        )

        ||

        mensajeNormalizado.includes(
            "too many requests"
        )

    ) {

        return (
            "Se realizaron demasiados intentos. Espera unos minutos y vuelve a intentarlo."
        );

    }


    /*
     * Recuperación de contraseña.
     */

    if (

        mensajeNormalizado.includes(
            "password recovery"
        )

        ||

        mensajeNormalizado.includes(
            "reset password"
        )

    ) {

        return (
            "No fue posible iniciar el proceso de recuperación de contraseña."
        );

    }


    /*
     * Error de red.
     */

    if (

        mensajeNormalizado.includes(
            "network"
        )

        ||

        mensajeNormalizado.includes(
            "fetch"
        )

        ||

        mensajeNormalizado.includes(
            "failed to fetch"
        )

    ) {

        return (
            "No fue posible conectarse con el servidor. Comprueba tu conexión e inténtalo nuevamente."
        );

    }


    /*
     * Si Supabase proporciona un mensaje
     * comprensible, devolverlo.
     */

    if (
        mensajeOriginal
    ) {

        return mensajeOriginal;

    }


    /*
     * Error genérico.
     */

    return (
        "Ocurrió un error inesperado. Inténtalo nuevamente."
    );

}


/* =====================================================
   FIN 04-utilidades-pedidos-cuenta.js

   RESPONSABILIDAD:

   Este módulo contiene únicamente:

   ✓ Utilidades
   ✓ Formateadores
   ✓ Seguridad HTML
   ✓ Estados de pedidos
   ✓ Utilidades de mensajes
   ✓ Mensajes de errores

   NO contiene:

   ✗ comprobarSesion()
   ✗ onAuthStateChange()
   ✗ mostrarUsuario()
   ✗ signInWithPassword()
   ✗ signOut()

   La autenticación pertenece exclusivamente a:

   02-autenticacion-perfil-cuenta.js

   De esta manera evitamos que varios módulos
   de Supabase controlen simultáneamente las
   vistas de "Mi cuenta".
===================================================== */

console.log(
    "✓ San Martín: utilidades de cuenta y pedidos cargadas"
);