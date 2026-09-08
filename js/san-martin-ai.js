/* ============================================================
   SAN MARTÍN IA — FRONTEND
   FASE 2.1 — MEMORIA CONVERSACIONAL
   ============================================================ */


/* ============================================================
   ELEMENTOS
   ============================================================ */

const btnSanMartinIA =
    document.getElementById("btnSanMartinIA");

const btnCerrarSanMartinIA =
    document.getElementById("btnCerrarSanMartinIA");

const sanMartinIA =
    document.getElementById("sanMartinIA");

const sanMartinAIMensajes =
    document.getElementById("sanMartinAIMensajes");

const sanMartinAIForm =
    document.getElementById("sanMartinAIForm");

const sanMartinAIInput =
    document.getElementById("sanMartinAIInput");

const btnEnviarSanMartinIA =
    document.getElementById("btnEnviarSanMartinIA");

const sanMartinAITyping =
    document.getElementById("sanMartinAITyping");


/* ============================================================
   MEMORIA CONVERSACIONAL
   ============================================================ */

/*
   Esta memoria vive mientras el usuario tenga abierta
   la página.

   No se guarda en localStorage.

   Al recargar la página comienza una conversación nueva.
*/

let historialConversacion = [];


/* ============================================================
   LÍMITE DE MEMORIA
   ============================================================ */

const MAX_HISTORIAL =
    10;


/* ============================================================
   AGREGAR MENSAJE AL HISTORIAL
   ============================================================ */

function agregarAlHistorial(
    role,
    content
) {

    if (
        !content ||
        !String(content).trim()
    ) {
        return;
    }

    historialConversacion.push({

        role: role,

        content:
            String(content).trim()

    });


    /*
       Conservamos solamente
       las últimas conversaciones.
    */

    if (
        historialConversacion.length >
        MAX_HISTORIAL
    ) {

        historialConversacion =
            historialConversacion.slice(
                -MAX_HISTORIAL
            );
    }
}


/* ============================================================
   OBTENER HISTORIAL PARA ENVIAR
   ============================================================ */

function obtenerHistorialParaEnviar() {

    return historialConversacion
        .slice(-MAX_HISTORIAL)
        .map(
            (mensaje) => ({

                role:
                    mensaje.role,

                content:
                    mensaje.content

            })
        );
}


/* ============================================================
   ESCAPAR HTML
   ============================================================ */

function escaparHTML(
    texto
) {

    const div =
        document.createElement(
            "div"
        );

    div.textContent =
        String(texto ?? "");

    return div.innerHTML;
}


/* ============================================================
   AGREGAR MENSAJE DEL USUARIO
   ============================================================ */

function agregarMensajeUsuario(
    texto
) {

    const mensaje =
        document.createElement(
            "div"
        );

    mensaje.className =
        "san-martin-ai-mensaje usuario";

    mensaje.innerHTML =
        escaparHTML(texto);

    sanMartinAIMensajes.appendChild(
        mensaje
    );

    sanMartinAIMensajes.scrollTop =
        sanMartinAIMensajes.scrollHeight;
}


/* ============================================================
   AGREGAR MENSAJE DEL BOT
   ============================================================ */

function agregarMensajeBot(
    texto
) {

    const mensaje =
        document.createElement(
            "div"
        );

    mensaje.className =
        "san-martin-ai-mensaje bot";

    mensaje.innerHTML =
        escaparHTML(texto)
            .replace(
                /\n/g,
                "<br>"
            );

    sanMartinAIMensajes.appendChild(
        mensaje
    );

    sanMartinAIMensajes.scrollTop =
        sanMartinAIMensajes.scrollHeight;
}


/* ============================================================
   MOSTRAR ESCRIBIENDO
   ============================================================ */

function mostrarTyping() {

    if (
        sanMartinAITyping
    ) {

        sanMartinAITyping.style.display =
            "flex";
    }
}


/* ============================================================
   OCULTAR ESCRIBIENDO
   ============================================================ */

function ocultarTyping() {

    if (
        sanMartinAITyping
    ) {

        sanMartinAITyping.style.display =
            "none";
    }
}


/* ============================================================
   ABRIR SAN MARTÍN IA
   ============================================================ */

function abrirSanMartinIA() {

    if (
        !sanMartinIA
    ) {
        return;
    }

    sanMartinIA.classList.add(
        "activo"
    );

    sanMartinIA.classList.add(
        "open"
    );

    sanMartinIA.setAttribute(
        "aria-hidden",
        "false"
    );


    setTimeout(
        () => {

            if (
                sanMartinAIInput
            ) {

                sanMartinAIInput.focus();
            }

        },
        100
    );
}


/* ============================================================
   CERRAR SAN MARTÍN IA
   ============================================================ */

function cerrarSanMartinIA() {

    if (
        !sanMartinIA
    ) {
        return;
    }

    sanMartinIA.classList.remove(
        "activo"
    );

    sanMartinIA.classList.remove(
        "open"
    );

    sanMartinIA.setAttribute(
        "aria-hidden",
        "true"
    );
}


/* ============================================================
   EVENTO ABRIR
   ============================================================ */

if (
    btnSanMartinIA
) {

    btnSanMartinIA.addEventListener(
        "click",
        abrirSanMartinIA
    );
}


/* ============================================================
   EVENTO CERRAR
   ============================================================ */

if (
    btnCerrarSanMartinIA
) {

    btnCerrarSanMartinIA.addEventListener(
        "click",
        cerrarSanMartinIA
    );
}


/* ============================================================
   ESCAPE PARA CERRAR
   ============================================================ */

document.addEventListener(
    "keydown",
    (event) => {

        if (
            event.key ===
            "Escape"
        ) {

            cerrarSanMartinIA();
        }
    }
);


/* ============================================================
   ENVIAR MENSAJE A SUPABASE
   ============================================================ */

async function enviarMensajeSanMartinIA(
    texto
) {

    const mensaje =
        String(
            texto || ""
        ).trim();


    if (!mensaje) {
        return;
    }


    /*
       Guardamos primero el mensaje
       del usuario en la memoria.
    */

    agregarAlHistorial(
        "user",
        mensaje
    );


    /*
       Enviamos solamente el historial
       reciente a Supabase.
    */

    const history =
        obtenerHistorialParaEnviar();


    try {

        mostrarTyping();


        if (
            btnEnviarSanMartinIA
        ) {

            btnEnviarSanMartinIA.disabled =
                true;
        }


        console.log(
            "🤖 San Martín IA - Enviando:",
            {
                message: mensaje,
                history: history
            }
        );


        /*
           IMPORTANTE:

           supabaseClient debe existir
           en tu HTML principal.
        */

        if (
            typeof supabaseClient ===
            "undefined"
        ) {

            throw new Error(
                "supabaseClient no está disponible."
            );
        }


        const {
            data,
            error
        } =
            await supabaseClient.functions.invoke(
                "san-martin-ai",
                {

                    body: {

                        message:
                            mensaje,

                        history:
                            history

                    }

                }
            );


        if (
            error
        ) {

            console.error(
                "❌ San Martín IA - Error de Supabase:",
                error
            );

            throw error;
        }


        console.log(
            "🤖 San Martín IA - Respuesta recibida:",
            data
        );


        /*
           Validación de respuesta.
        */

        if (
            !data ||
            data.success !== true ||
            !data.response
        ) {

            console.error(
                "❌ San Martín IA - Respuesta inválida:",
                data
            );

            throw new Error(
                "La IA no devolvió una respuesta válida."
            );
        }


        const respuesta =
            String(
                data.response
            ).trim();


        /*
           Guardamos la respuesta
           de San Martín IA.
        */

        agregarAlHistorial(
            "assistant",
            respuesta
        );


        /*
           Mostramos la respuesta.
        */

        agregarMensajeBot(
            respuesta
        );


        console.log(
            "🤖 San Martín IA - Etapa:",
            data.etapa
        );


    } catch (error) {

        console.error(
            "❌ San Martín IA - Error:",
            error
        );


        /*
           Si hubo error, eliminamos
           el último mensaje del usuario
           para evitar dejar memoria
           incompleta.
        */

        const ultimo =
            historialConversacion[
                historialConversacion.length - 1
            ];

        if (
            ultimo &&
            ultimo.role ===
                "user" &&
            ultimo.content ===
                mensaje
        ) {

            historialConversacion.pop();
        }


        agregarMensajeBot(
            "Lo siento 😔, ocurrió un error al procesar tu solicitud. Por favor, intenta nuevamente."
        );

    } finally {

        ocultarTyping();


        if (
            btnEnviarSanMartinIA
        ) {

            btnEnviarSanMartinIA.disabled =
                false;
        }


        if (
            sanMartinAIInput
        ) {

            sanMartinAIInput.focus();
        }
    }
}


/* ============================================================
   FORMULARIO
   ============================================================ */

if (
    sanMartinAIForm
) {

    sanMartinAIForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            if (
                !sanMartinAIInput
            ) {
                return;
            }


            const texto =
                sanMartinAIInput.value.trim();


            if (!texto) {
                return;
            }


            /*
               Mostrar inmediatamente
               el mensaje del cliente.
            */

            agregarMensajeUsuario(
                texto
            );


            /*
               Limpiar input.
            */

            sanMartinAIInput.value =
                "";


            /*
               Enviar a la Edge Function.
            */

            await enviarMensajeSanMartinIA(
                texto
            );

        }
    );
}


/* ============================================================
   BOTONES RÁPIDOS
   ============================================================ */

document.addEventListener(
    "click",
    async (event) => {

        const boton =
            event.target.closest(
                "[data-ai-prompt]"
            );


        if (
            !boton
        ) {
            return;
        }


        const prompt =
            boton.getAttribute(
                "data-ai-prompt"
            );


        if (
            !prompt
        ) {
            return;
        }


        /*
           Abrimos el asistente.
        */

        abrirSanMartinIA();


        /*
           Mostrar mensaje del usuario.
        */

        agregarMensajeUsuario(
            prompt
        );


        /*
           Enviar mensaje.
        */

        await enviarMensajeSanMartinIA(
            prompt
        );

    }
);


/* ============================================================
   MENSAJE INICIAL
   ============================================================ */

console.log(
    "🤖 San Martín IA: interfaz conectada con Supabase Edge Function + memoria conversacional."
);