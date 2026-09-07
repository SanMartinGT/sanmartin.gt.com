/* =========================================================
   SAN MARTÍN IA
   ASISTENTE VIRTUAL DE COMPRAS
   CONECTADO A SUPABASE EDGE FUNCTION + OPENAI
========================================================= */

(function () {

    "use strict";


    /* =====================================================
       CONFIGURACIÓN
    ===================================================== */

    const SAN_MARTIN_AI_FUNCTION =
        "san-martin-ai";


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

        ventana.hidden = false;

        input.focus();

        desplazarMensajesAlFinal();

    }


    /* =====================================================
       CERRAR SAN MARTÍN IA
    ===================================================== */

    function cerrarSanMartinIA() {

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


        /* -------------------------------------------------
           MOSTRAR MENSAJE DEL CLIENTE
        ------------------------------------------------- */

        agregarMensajeUsuario(texto);


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
            ============================================= */

            console.log(
                "🤖 San Martín IA: enviando mensaje..."
            );


            const resultado =
                await supabaseClient.functions.invoke(
                    SAN_MARTIN_AI_FUNCTION,
                    {
                        body: {
                            message: texto
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
            ============================================= */

            if (
                !data ||
                data.success !== true ||
                !data.message
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
               MOSTRAR RESPUESTA DE OPENAI
            ============================================= */

            agregarMensajeBot(
                data.message
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
               MOSTRAR ERROR AL CLIENTE
            ============================================= */

            mostrarErrorIA();

        } finally {

            /* =============================================
               VOLVER A ACTIVAR CONTROLES
            ============================================= */

            btnEnviar.disabled = false;

            input.disabled = false;


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
        "🤖 San Martín IA: interfaz conectada con Supabase Edge Function."
    );

})();
