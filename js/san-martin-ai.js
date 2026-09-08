/* =========================================================
   SAN MARTÍN IA
   ASISTENTE VIRTUAL DE COMPRAS
   CONECTADO A SUPABASE EDGE FUNCTION + OPENAI

   VERSIÓN:
   - Memoria conversacional durante la sesión
   - Envía historial a Supabase Edge Function
   - Mantiene apertura/cierre original con hidden
   - Mantiene acciones rápidas
   - Mantiene búsqueda exacta
   - Compatible con data.response
========================================================= */

(function () {

    "use strict";


    /* =====================================================
       CONFIGURACIÓN
    ===================================================== */

    const SAN_MARTIN_AI_FUNCTION =
        "san-martin-ai";


    /*
       Cantidad máxima de mensajes anteriores
       que se enviarán a la Edge Function.

       10 mensajes = aproximadamente 5 turnos
       Cliente + San Martín IA.
    */

    const MAX_HISTORIAL =
        10;


    /* =====================================================
       MEMORIA CONVERSACIONAL
    ===================================================== */

    /*
       Esta memoria vive únicamente mientras la página
       permanezca abierta.

       Ejemplo:

       Cliente:
       necesito una caja de marcadores

       IA:
       Claro 😊 ...

       Cliente:
       tengo Q80

       Al segundo mensaje se enviará:

       history:
       [
           {
               role: "user",
               content: "necesito una caja de marcadores"
           },
           {
               role: "assistant",
               content: "Claro 😊 ..."
           }
       ]

       message:
       "tengo Q80"
    */

    let historialConversacion = [];


    /* =====================================================
       ELEMENTOS DEL HTML
    ===================================================== */

    const btnAbrir =
        document.getElementById("btnSanMartinIA");

    const btnCerrar =
        document.getElementById("btnCerrarSanMartinIA");

    const ventana =
        document.getElementById("sanMartinIA");

    const mensajes =
        document.getElementById("sanMartinAIMensajes");

    const formulario =
        document.getElementById("sanMartinAIForm");

    const input =
        document.getElementById("sanMartinAIInput");

    const btnEnviar =
        document.getElementById("btnEnviarSanMartinIA");

    const typing =
        document.getElementById("sanMartinAITyping");


    /* =====================================================
       COMPROBAR ELEMENTOS
    ===================================================== */

    if (
        !btnAbrir ||
        !btnCerrar ||
        !ventana ||
        !mensajes ||
        !formulario ||
        !input ||
        !btnEnviar
    ) {

        console.warn(
            "San Martín IA: no se encontraron todos los elementos necesarios."
        );

        return;
    }


    /* =====================================================
       COMPROBAR SUPABASE
    ===================================================== */

    if (
        typeof supabaseClient === "undefined" ||
        !supabaseClient
    ) {

        console.error(
            "San Martín IA: supabaseClient no está disponible."
        );

        return;
    }


    /* =====================================================
       ABRIR SAN MARTÍN IA
    ===================================================== */

    function abrirSanMartinIA() {

        /*
           IMPORTANTE:

           Conservamos exactamente el sistema original
           que ya sabemos que funciona.

           NO usamos:
           .activo
           .open
           .active

           Solamente hidden.
        */

        ventana.hidden = false;

        input.focus();

        desplazarMensajesAlFinal();

    }


    /* =====================================================
       CERRAR SAN MARTÍN IA
    ===================================================== */

    function cerrarSanMartinIA() {

        /*
           Conservamos exactamente el cierre original.
        */

        ventana.hidden = true;

    }


    /* =====================================================
       AGREGAR MENSAJE DEL USUARIO
    ===================================================== */

    function agregarMensajeUsuario(texto) {

        const mensaje =
            document.createElement("div");

        mensaje.className =
            "san-martin-ai-message san-martin-ai-message-user";

        mensaje.innerHTML = `
            <div class="san-martin-ai-message-content">
                <p>${escaparHTML(texto)}</p>
            </div>
        `;

        mensajes.appendChild(mensaje);

        desplazarMensajesAlFinal();

    }


    /* =====================================================
       AGREGAR MENSAJE DEL ASISTENTE
    ===================================================== */

    function agregarMensajeBot(texto) {

        const mensaje =
            document.createElement("div");

        mensaje.className =
            "san-martin-ai-message san-martin-ai-message-bot";

        mensaje.innerHTML = `
            <div class="san-martin-ai-message-avatar">
                🤖
            </div>

            <div class="san-martin-ai-message-content">
                <p>${formatearRespuesta(texto)}</p>
            </div>
        `;

        mensajes.appendChild(mensaje);

        desplazarMensajesAlFinal();

    }


    /* =====================================================
       FORMATEAR RESPUESTA

       Convierte saltos de línea en <br>
       y evita HTML peligroso.
    ===================================================== */

    function formatearRespuesta(texto) {

        return escaparHTML(
            String(texto || "")
        ).replace(/\n/g, "<br>");

    }


    /* =====================================================
       MOSTRAR INDICADOR "PENSANDO"
    ===================================================== */

    function mostrarTyping() {

        if (typing) {

            typing.hidden = false;

        }

        desplazarMensajesAlFinal();

    }


    /* =====================================================
       OCULTAR INDICADOR "PENSANDO"
    ===================================================== */

    function ocultarTyping() {

        if (typing) {

            typing.hidden = true;

        }

    }


    /* =====================================================
       DESPLAZAR CHAT AL FINAL
    ===================================================== */

    function desplazarMensajesAlFinal() {

        setTimeout(function () {

            mensajes.scrollTop =
                mensajes.scrollHeight;

        }, 50);

    }


    /* =====================================================
       ESCAPAR HTML
    ===================================================== */

    function escaparHTML(texto) {

        const div =
            document.createElement("div");

        div.textContent =
            String(texto || "");

        return div.innerHTML;

    }


    /* =====================================================
       AGREGAR MENSAJE A LA MEMORIA
    ===================================================== */

    function agregarAlHistorial(
        role,
        content
    ) {

        /*
           Solo aceptamos mensajes válidos.
        */

        if (
            !role ||
            !content
        ) {

            return;

        }


        historialConversacion.push({

            role:
                role,

            content:
                String(content)

        });


        /*
           Conservamos solamente los últimos
           mensajes permitidos.
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


    /* =====================================================
       OBTENER HISTORIAL PARA ENVIAR
    ===================================================== */

    function obtenerHistorialParaEnviar() {

        /*
           Creamos una copia para no modificar
           directamente la memoria original.
        */

        return historialConversacion
            .slice(-MAX_HISTORIAL)
            .map(function (mensaje) {

                return {

                    role:
                        mensaje.role,

                    content:
                        mensaje.content

                };

            });

    }


    /* =====================================================
       MOSTRAR ERROR
    ===================================================== */

    function mostrarErrorIA() {

        agregarMensajeBot(
            "⚠️ Lo siento, en este momento no pude conectarme con San Martín IA. Intenta nuevamente en unos segundos."
        );

    }


    /* =====================================================
       PROCESAR MENSAJE
    ===================================================== */

    async function procesarMensaje(texto) {

        /* -------------------------------------------------
           LIMPIAR TEXTO
        ------------------------------------------------- */

        texto =
            String(texto || "").trim();


        /* -------------------------------------------------
           NO ENVIAR MENSAJES VACÍOS
        ------------------------------------------------- */

        if (!texto) {

            input.focus();

            return;

        }


        /* =================================================
           GUARDAR EL HISTORIAL ANTERIOR

           IMPORTANTE:

           Tomamos el historial ANTES de agregar el mensaje
           actual.

           Esto evita enviar dos veces:

           "tengo Q80"

           a la Edge Function.
        ================================================= */

        const historialAnterior =
            obtenerHistorialParaEnviar();


        console.log(
            "🤖 San Martín IA: historial anterior:",
            historialAnterior
        );


        /* -------------------------------------------------
           MOSTRAR MENSAJE DEL CLIENTE
        ------------------------------------------------- */

        agregarMensajeUsuario(texto);


        /* -------------------------------------------------
           AGREGAR MENSAJE ACTUAL A LA MEMORIA
        ------------------------------------------------- */

        agregarAlHistorial(
            "user",
            texto
        );


        /* -------------------------------------------------
           LIMPIAR INPUT
        ------------------------------------------------- */

        input.value = "";


        /* -------------------------------------------------
           BLOQUEAR CONTROLES
        ------------------------------------------------- */

        btnEnviar.disabled = true;

        input.disabled = true;


        /* -------------------------------------------------
           MOSTRAR "PENSANDO"
        ------------------------------------------------- */

        mostrarTyping();


        try {

            /* =============================================
               ENVIAR MENSAJE A SUPABASE EDGE FUNCTION

               Se envían DOS cosas:

               1. message
                  → mensaje actual

               2. history
                  → conversación anterior
            ============================================= */

            console.log(
                "🤖 San Martín IA: enviando mensaje..."
            );


            console.log(
                "🤖 San Martín IA: mensaje actual:",
                texto
            );


            console.log(
                "🤖 San Martín IA: enviando historial:",
                historialAnterior
            );


            const resultado =
                await supabaseClient.functions.invoke(
                    SAN_MARTIN_AI_FUNCTION,
                    {
                        body: {

                            message:
                                texto,

                            history:
                                historialAnterior

                        }
                    }
                );


            /* =============================================
               EXTRAER RESPUESTA
            ============================================= */

            const data =
                resultado?.data;

            const error =
                resultado?.error;


            console.log(
                "🤖 San Martín IA: respuesta recibida",
                data
            );


            /* =============================================
               COMPROBAR ERROR DE SUPABASE
            ============================================= */

            if (error) {

                console.error(
                    "San Martín IA - Error Supabase Functions:",
                    error
                );

                throw error;

            }


            /* =============================================
               COMPROBAR RESPUESTA

               La Edge Function actual devuelve:

               {
                   success: true,
                   response: "..."
               }

               NO:

               {
                   message: "..."
               }
            ============================================= */

            if (
                !data ||
                data.success !== true ||
                !data.response
            ) {

                console.error(
                    "San Martín IA - Respuesta inválida:",
                    data
                );

                throw new Error(
                    "La IA no devolvió una respuesta válida."
                );

            }


            /* =============================================
               OCULTAR "PENSANDO"
            ============================================= */

            ocultarTyping();


            /* =============================================
               GUARDAR RESPUESTA DEL ASISTENTE
               EN LA MEMORIA
            ============================================= */

            agregarAlHistorial(
                "assistant",
                data.response
            );


            /* =============================================
               MOSTRAR RESPUESTA DE OPENAI
            ============================================= */

            agregarMensajeBot(
                data.response
            );


            /* =============================================
               MOSTRAR HISTORIAL ACTUAL EN CONSOLA

               Esto nos servirá durante las pruebas.
            ============================================= */

            console.log(
                "🤖 San Martín IA: memoria actual:",
                historialConversacion
            );


        } catch (error) {

            /* =============================================
               MOSTRAR ERROR EN CONSOLA
            ============================================= */

            console.error(
                "❌ San Martín IA - Error:",
                error
            );


            /* =============================================
               OCULTAR "PENSANDO"
            ============================================= */

            ocultarTyping();


            /* =============================================
               ELIMINAR DEL HISTORIAL EL MENSAJE DEL
               USUARIO QUE FALLÓ

               Así no dejamos una conversación incompleta
               en la memoria.
            ============================================= */

            if (
                historialConversacion.length > 0
            ) {

                const ultimoMensaje =
                    historialConversacion[
                        historialConversacion.length - 1
                    ];


                if (
                    ultimoMensaje.role === "user" &&
                    ultimoMensaje.content === texto
                ) {

                    historialConversacion.pop();

                }

            }


            /* =============================================
               MOSTRAR ERROR AL CLIENTE
            ============================================= */

            mostrarErrorIA();

        } finally {

            /* =============================================
               VOLVER A ACTIVAR CONTROLES
            ============================================= */

            btnEnviar.disabled = false;

            input.disabled = false;

            input.focus();

        }

    }


    /* =====================================================
       BOTÓN ABRIR
    ===================================================== */

    btnAbrir.addEventListener(
        "click",
        abrirSanMartinIA
    );


    /* =====================================================
       BOTÓN CERRAR
    ===================================================== */

    btnCerrar.addEventListener(
        "click",
        cerrarSanMartinIA
    );


    /* =====================================================
       FORMULARIO
    ===================================================== */

    formulario.addEventListener(
        "submit",
        function (evento) {

            evento.preventDefault();

            procesarMensaje(
                input.value
            );

        }
    );


    /* =====================================================
       ACCIONES RÁPIDAS
    ===================================================== */

    const botonesRapidos =
        document.querySelectorAll(
            "[data-ai-prompt]"
        );


    botonesRapidos.forEach(
        function (boton) {

            boton.addEventListener(
                "click",
                function () {

                    const prompt =
                        boton.getAttribute(
                            "data-ai-prompt"
                        );


                    if (!prompt) {

                        return;

                    }


                    abrirSanMartinIA();


                    procesarMensaje(
                        prompt
                    );

                }
            );

        }
    );


    /* =====================================================
       CERRAR CON ESC
    ===================================================== */

    document.addEventListener(
        "keydown",
        function (evento) {

            if (
                evento.key === "Escape" &&
                !ventana.hidden
            ) {

                cerrarSanMartinIA();

            }

        }
    );


    /* =====================================================
       INICIO
    ===================================================== */

    console.log(
        "🤖 San Martín IA: interfaz conectada con Supabase Edge Function + memoria conversacional."
    );

})();