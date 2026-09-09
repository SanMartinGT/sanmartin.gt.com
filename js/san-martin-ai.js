/* =========================================================
   SAN MARTÍN AGENT
   AGENTE INTELIGENTE DE COMPRAS Y VENTAS

   ARQUITECTURA:

   TIENDA
      ↓
   SAN MARTÍN AGENT
      ↓
   SUPABASE EDGE FUNCTION
      ↓
   GEMINI INTERACTIONS API
      ↓
   GEMINI FUNCTION CALLING
      ↓
   DATOS Y FUNCIONES REALES

   IMPORTANTE:

   - Gemini NO se ejecuta directamente en el navegador.
   - La API Key NO está aquí.
   - El estado de conversación usa interaction_id.
   - El agente puede solicitar acciones reales.
   - El frontend ejecuta únicamente acciones permitidas.
   - Preparado para carrito, productos, pedidos,
     recomendaciones, comparación, presupuesto, etc.

   ========================================================= */

(function () {

    "use strict";


    /* =========================================================
       CONFIGURACIÓN GENERAL
    ========================================================= */

    const SAN_MARTIN_AGENT_FUNCTION =
        "san-martin-agent";


    /*
       Versión del protocolo entre:

       FRONTEND
       ↕
       EDGE FUNCTION
       ↕
       GEMINI
    */

    const AGENT_PROTOCOL_VERSION =
        "1.0";


    /*
       Máximo de caracteres que permitiremos enviar
       en una sola consulta.

       Evita entradas gigantescas.
    */

    const MAX_MESSAGE_LENGTH =
        4000;


    /*
       Máximo de acciones que el navegador aceptará
       en una sola respuesta.

       Seguridad adicional.
    */

    const MAX_ACTIONS_PER_RESPONSE =
        20;


    /*
       ID de sesión del agente.

       Sirve para identificar esta conversación
       aunque todavía no haya una interacción Gemini.
    */

    const SESSION_STORAGE_KEY =
        "san_martin_agent_session";


    /*
       ID de interacción de Gemini.

       Interactions API permite continuar una conversación
       mediante previous_interaction_id.
    */

    const INTERACTION_STORAGE_KEY =
        "san_martin_gemini_interaction_id";


    /* =========================================================
       ESTADO DEL AGENTE
    ========================================================= */

    let interactionId =
        sessionStorage.getItem(
            INTERACTION_STORAGE_KEY
        ) || null;


    let sessionId =
        sessionStorage.getItem(
            SESSION_STORAGE_KEY
        );


    /*
       Si no existe una sesión, creamos una.
    */

    if (!sessionId) {

        sessionId =
            generarIdSeguro();

        sessionStorage.setItem(
            SESSION_STORAGE_KEY,
            sessionId
        );
    }


    /*
       Estado local del agente.

       NO sustituye la base de datos.

       Solamente contiene información útil de interfaz.
    */

    let agenteOcupado = false;


    /* =========================================================
       ELEMENTOS DEL HTML EXISTENTE
    ========================================================= */

    const btnAbrir =
        document.getElementById(
            "btnSanMartinIA"
        );


    const btnCerrar =
        document.getElementById(
            "btnCerrarSanMartinIA"
        );


    const ventana =
        document.getElementById(
            "sanMartinIA"
        );


    const mensajes =
        document.getElementById(
            "sanMartinAIMensajes"
        );


    const formulario =
        document.getElementById(
            "sanMartinAIForm"
        );


    const input =
        document.getElementById(
            "sanMartinAIInput"
        );


    const btnEnviar =
        document.getElementById(
            "btnEnviarSanMartinIA"
        );


    const typing =
        document.getElementById(
            "sanMartinAITyping"
        );


    /* =========================================================
       VALIDAR INTERFAZ
    ========================================================= */

    if (
        !btnAbrir ||
        !btnCerrar ||
        !ventana ||
        !mensajes ||
        !formulario ||
        !input ||
        !btnEnviar
    ) {

        console.error(
            "San Martín Agent: faltan elementos del HTML."
        );

        return;
    }


    /* =========================================================
       VALIDAR SUPABASE
    ========================================================= */

    if (
        typeof supabaseClient === "undefined" ||
        !supabaseClient
    ) {

        console.error(
            "San Martín Agent: supabaseClient no está disponible."
        );

        return;
    }


    /* =========================================================
       GENERAR ID SEGURO
    ========================================================= */

    function generarIdSeguro() {

        if (
            window.crypto &&
            typeof window.crypto.randomUUID === "function"
        ) {

            return window.crypto.randomUUID();

        }


        return (
            "sm-" +
            Date.now() +
            "-" +
            Math.random()
                .toString(36)
                .substring(2, 12)
        );
    }


    /* =========================================================
       ABRIR AGENTE
    ========================================================= */

    function abrirSanMartinAgent() {

        ventana.hidden = false;

        input.focus();

        desplazarMensajesAlFinal();

    }


    /* =========================================================
       CERRAR AGENTE
    ========================================================= */

    function cerrarSanMartinAgent() {

        ventana.hidden = true;

    }


    /* =========================================================
       NUEVA CONVERSACIÓN
    =========================================================

       Esta función será útil más adelante para:

       "Nueva conversación"

       No elimina carrito.
       No elimina cuenta.
       No elimina pedidos.

       Solamente reinicia la conversación de IA.
    */

    function nuevaConversacionAgent() {

        interactionId = null;

        sessionStorage.removeItem(
            INTERACTION_STORAGE_KEY
        );

        console.log(
            "🤖 San Martín Agent: nueva conversación."
        );

    }


    /* =========================================================
       AGREGAR MENSAJE DEL CLIENTE
    ========================================================= */

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


        mensajes.appendChild(
            mensaje
        );


        desplazarMensajesAlFinal();

    }


    /* =========================================================
       AGREGAR MENSAJE DEL AGENTE
    ========================================================= */

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


        mensajes.appendChild(
            mensaje
        );


        desplazarMensajesAlFinal();

    }


    /* =========================================================
       FORMATEAR RESPUESTA
    ========================================================= */

    function formatearRespuesta(texto) {

        return escaparHTML(
            String(texto || "")
        )
        .replace(/\n/g, "<br>");

    }


    /* =========================================================
       ESCAPAR HTML
    ========================================================= */

    function escaparHTML(texto) {

        const div =
            document.createElement("div");


        div.textContent =
            String(texto || "");


        return div.innerHTML;

    }


    /* =========================================================
       MOSTRAR TYPING
    ========================================================= */

    function mostrarTyping() {

        if (typing) {

            typing.hidden = false;

        }


        desplazarMensajesAlFinal();

    }


    /* =========================================================
       OCULTAR TYPING
    ========================================================= */

    function ocultarTyping() {

        if (typing) {

            typing.hidden = true;

        }

    }


    /* =========================================================
       SCROLL
    ========================================================= */

    function desplazarMensajesAlFinal() {

        setTimeout(function () {

            mensajes.scrollTop =
                mensajes.scrollHeight;

        }, 50);

    }


    /* =========================================================
       OBTENER CONTEXTO REAL DE LA APLICACIÓN
    =========================================================

       Aquí NO mandamos toda la aplicación.

       Solamente información útil para el agente.

       Esta función irá creciendo conforme conectemos:

       - carrito
       - usuario
       - filtros
       - producto seleccionado
       - checkout
       - etc.
    */

    function obtenerContextoAplicacion() {

        const contexto = {

            session_id:
                sessionId,

            pagina:
                window.location.pathname,

            url:
                window.location.href,

            idioma:
                document.documentElement.lang || "es",

            moneda:
                "GTQ",

            tienda:
                "San Martín | Papelería y Librería"

        };


        /*
           Intentamos detectar usuario de Supabase.

           Si no está disponible, simplemente continúa.
        */

        try {

            if (
                supabaseClient &&
                supabaseClient.auth
            ) {

                contexto.auth =
                    "supabase_auth_available";

            }

        } catch (error) {

            console.warn(
                "No se pudo obtener contexto de autenticación.",
                error
            );

        }


        /*
           Si posteriormente tenemos una función global
           para obtener el carrito real, podremos conectarla aquí.

           Ejemplo futuro:

           contexto.carrito =
               window.obtenerCarritoActual();
        */


        return contexto;

    }


    /* =========================================================
       CONSTRUIR PAYLOAD DEL AGENTE
    ========================================================= */

    function construirPayload(mensaje) {

        return {

            protocol_version:
                AGENT_PROTOCOL_VERSION,

            session_id:
                sessionId,

            interaction_id:
                interactionId,

            message:
                mensaje,

            context:
                obtenerContextoAplicacion()

        };

    }


    /* =========================================================
       EJECUTAR ACCIONES DEL AGENTE
    =========================================================

       GEMINI puede decidir:

       "agregar este producto al carrito"

       Pero Gemini NO manipula directamente el DOM.

       Devuelve una acción estructurada.

       Ejemplo:

       {
          type: "add_to_cart",
          payload: {
             product_id: "...",
             quantity: 3
          }
       }

       Esta capa ejecutará únicamente acciones
       expresamente permitidas.
    */

    async function ejecutarAccionesAgente(
        acciones
    ) {

        if (
            !Array.isArray(acciones) ||
            acciones.length === 0
        ) {

            return;

        }


        const accionesSeguras =
            acciones.slice(
                0,
                MAX_ACTIONS_PER_RESPONSE
            );


        for (
            const accion
            of accionesSeguras
        ) {

            try {

                await ejecutarAccion(
                    accion
                );

            } catch (error) {

                console.error(
                    "❌ Error ejecutando acción del agente:",
                    accion,
                    error
                );

            }

        }

    }


    /* =========================================================
       ROUTER DE ACCIONES
    ========================================================= */

    async function ejecutarAccion(
        accion
    ) {

        if (
            !accion ||
            typeof accion !== "object"
        ) {

            return;

        }


        const tipo =
            String(
                accion.type || ""
            );


        const payload =
            accion.payload || {};


        console.log(
            "🤖 San Martín Agent → acción:",
            tipo,
            payload
        );


        switch (tipo) {


            /* =============================================
               AGREGAR AL CARRITO
            ============================================= */

            case "add_to_cart":

                await accionAgregarAlCarrito(
                    payload
                );

                break;


            /* =============================================
               ELIMINAR DEL CARRITO
            ============================================= */

            case "remove_from_cart":

                await accionEliminarDelCarrito(
                    payload
                );

                break;


            /* =============================================
               ACTUALIZAR CANTIDAD
            ============================================= */

            case "update_cart_quantity":

                await accionActualizarCantidadCarrito(
                    payload
                );

                break;


            /* =============================================
               ABRIR CARRITO
            ============================================= */

            case "open_cart":

                accionAbrirCarrito();

                break;


            /* =============================================
               ABRIR PRODUCTO
            ============================================= */

            case "open_product":

                accionAbrirProducto(
                    payload
                );

                break;


            /* =============================================
               BUSCAR PRODUCTO EN TIENDA
            ============================================= */

            case "search_products":

                accionBuscarProductos(
                    payload
                );

                break;


            /* =============================================
               APLICAR FILTRO
            ============================================= */

            case "apply_catalog_filter":

                accionAplicarFiltro(
                    payload
                );

                break;


            /* =============================================
               SCROLL HACIA CATÁLOGO
            ============================================= */

            case "go_to_catalog":

                accionIrCatalogo();

                break;


            /* =============================================
               NO HACER NADA
            ============================================= */

            case "none":

                break;


            /* =============================================
               ACCIÓN DESCONOCIDA
            ============================================= */

            default:

                console.warn(
                    "San Martín Agent: acción no permitida:",
                    tipo
                );

                break;

        }

    }


    /* =========================================================
       ACCIÓN: AGREGAR AL CARRITO
    =========================================================

       IMPORTANTE:

       Todavía no inventamos el nombre de la función
       real de tu carrito.

       Primero intentamos detectar funciones comunes.

       Después conectaremos esto directamente con
       tu sistema real de carrito.
    */

    async function accionAgregarAlCarrito(
        payload
    ) {

        const productoId =
            payload.product_id ||
            payload.producto_id ||
            payload.id;


        const cantidad =
            Number(
                payload.quantity ||
                payload.cantidad ||
                1
            );


        if (!productoId) {

            console.warn(
                "add_to_cart sin product_id."
            );

            return;

        }


        /*
           Adaptador futuro.

           Cuando conectemos tu carrito real,
           aquí utilizaremos la función exacta
           de tu aplicación.
        */

        if (
            typeof window.agregarProductoAlCarrito ===
            "function"
        ) {

            await window.agregarProductoAlCarrito(
                productoId,
                cantidad
            );

            return;

        }


        /*
           Segundo nombre posible.
        */

        if (
            typeof window.agregarAlCarrito ===
            "function"
        ) {

            await window.agregarAlCarrito(
                productoId,
                cantidad
            );

            return;

        }


        /*
           Si todavía no existe la función,
           no hacemos una modificación falsa.
        */

        console.warn(
            "San Martín Agent: el adaptador del carrito aún no está conectado.",
            payload
        );

    }


    /* =========================================================
       ACCIÓN: ELIMINAR DEL CARRITO
    ========================================================= */

    async function accionEliminarDelCarrito(
        payload
    ) {

        const productoId =
            payload.product_id ||
            payload.producto_id ||
            payload.id;


        if (!productoId) {

            return;

        }


        if (
            typeof window.eliminarProductoDelCarrito ===
            "function"
        ) {

            await window.eliminarProductoDelCarrito(
                productoId
            );

            return;

        }


        if (
            typeof window.eliminarDelCarrito ===
            "function"
        ) {

            await window.eliminarDelCarrito(
                productoId
            );

            return;

        }


        console.warn(
            "San Martín Agent: función de eliminar carrito no conectada."
        );

    }


    /* =========================================================
       ACCIÓN: ACTUALIZAR CANTIDAD
    ========================================================= */

    async function accionActualizarCantidadCarrito(
        payload
    ) {

        const productoId =
            payload.product_id ||
            payload.producto_id ||
            payload.id;


        const cantidad =
            Number(
                payload.quantity ||
                payload.cantidad
            );


        if (
            !productoId ||
            !Number.isFinite(cantidad)
        ) {

            return;

        }


        if (
            typeof window.actualizarCantidadCarrito ===
            "function"
        ) {

            await window.actualizarCantidadCarrito(
                productoId,
                cantidad
            );

            return;

        }


        console.warn(
            "San Martín Agent: función de cantidad de carrito no conectada."
        );

    }


    /* =========================================================
       ACCIÓN: ABRIR CARRITO
    ========================================================= */

    function accionAbrirCarrito() {

        const posiblesSelectores = [

            "#cartPanel",

            "#carritoPanel",

            "#cart",

            ".cart-panel",

            ".carrito-panel"

        ];


        for (
            const selector
            of posiblesSelectores
        ) {

            const elemento =
                document.querySelector(
                    selector
                );


            if (elemento) {

                elemento.hidden = false;

                elemento.classList.add(
                    "active"
                );

                elemento.classList.add(
                    "open"
                );

                return;

            }

        }


        console.warn(
            "San Martín Agent: no se encontró el panel del carrito."
        );

    }


    /* =========================================================
       ACCIÓN: ABRIR PRODUCTO
    ========================================================= */

    function accionAbrirProducto(
        payload
    ) {

        const productoId =
            payload.product_id ||
            payload.producto_id ||
            payload.id;


        if (!productoId) {

            return;

        }


        if (
            typeof window.abrirProducto ===
            "function"
        ) {

            window.abrirProducto(
                productoId
            );

            return;

        }


        console.log(
            "San Martín Agent: abrir producto solicitado:",
            productoId
        );

    }


    /* =========================================================
       ACCIÓN: BUSCAR PRODUCTOS
    ========================================================= */

    function accionBuscarProductos(
        payload
    ) {

        const consulta =
            payload.query ||
            payload.search ||
            payload.text ||
            "";


        if (!consulta) {

            return;

        }


        /*
           Intentamos conectar con funciones
           existentes de búsqueda.
        */

        if (
            typeof window.buscarProductos ===
            "function"
        ) {

            window.buscarProductos(
                consulta
            );

            return;

        }


        const buscadores = [

            "#searchInput",

            "#buscador",

            "#catalogSearch",

            "input[type='search']"

        ];


        for (
            const selector
            of buscadores
        ) {

            const buscador =
                document.querySelector(
                    selector
                );


            if (buscador) {

                buscador.value =
                    consulta;


                buscador.dispatchEvent(
                    new Event(
                        "input",
                        {
                            bubbles: true
                        }
                    )
                );


                return;

            }

        }


        console.warn(
            "San Martín Agent: buscador no conectado."
        );

    }


    /* =========================================================
       ACCIÓN: APLICAR FILTRO
    ========================================================= */

    function accionAplicarFiltro(
        payload
    ) {

        const categoria =
            payload.category ||
            payload.categoria;


        if (!categoria) {

            return;

        }


        if (
            typeof window.aplicarFiltroCategoria ===
            "function"
        ) {

            window.aplicarFiltroCategoria(
                categoria
            );

            return;

        }


        console.log(
            "San Martín Agent: filtro solicitado:",
            categoria
        );

    }


    /* =========================================================
       ACCIÓN: IR AL CATÁLOGO
    ========================================================= */

    function accionIrCatalogo() {

        const catalogo =
            document.getElementById(
                "catalogo"
            );


        if (catalogo) {

            catalogo.scrollIntoView({
                behavior: "smooth"
            });

            return;

        }


        const catalog =
            document.querySelector(
                "[data-section='catalogo']"
            );


        if (catalog) {

            catalog.scrollIntoView({
                behavior: "smooth"
            });

        }

    }


    /* =========================================================
       PROCESAR RESPUESTA DEL AGENTE
    ========================================================= */

    async function procesarRespuestaAgente(
        data
    ) {

        if (
            !data ||
            data.success !== true
        ) {

            throw new Error(
                "Respuesta inválida del agente."
            );

        }


        /*
           Guardar interaction_id.

           Este es uno de los cambios más importantes
           respecto al sistema anterior.
        */

        if (
            data.interaction_id
        ) {

            interactionId =
                data.interaction_id;


            sessionStorage.setItem(
                INTERACTION_STORAGE_KEY,
                interactionId
            );

        }


        /*
           Ejecutar acciones reales de la aplicación.
        */

        if (
            Array.isArray(
                data.actions
            )
        ) {

            await ejecutarAccionesAgente(
                data.actions
            );

        }


        /*
           Mostrar respuesta final.
        */

        const respuesta =
            data.response ||
            data.output_text ||
            data.message;


        if (respuesta) {

            agregarMensajeBot(
                respuesta
            );

        }


        /*
           Información de depuración.

           Solo consola.
        */

        console.log(
            "🤖 San Martín Agent:",
            {
                interaction_id:
                    data.interaction_id,

                actions:
                    data.actions || [],

                response:
                    respuesta
            }
        );

    }


    /* =========================================================
       ENVIAR MENSAJE AL AGENTE
    ========================================================= */

    async function enviarAlAgente(
        texto
    ) {

        const payload =
            construirPayload(
                texto
            );


        console.log(
            "🤖 San Martín Agent → Edge Function:",
            payload
        );


        const resultado =
            await supabaseClient.functions.invoke(
                SAN_MARTIN_AGENT_FUNCTION,
                {
                    body:
                        payload
                }
            );


        if (
            resultado.error
        ) {

            throw resultado.error;

        }


        return resultado.data;

    }


    /* =========================================================
       PROCESAR MENSAJE
    ========================================================= */

    async function procesarMensaje(
        texto
    ) {

        texto =
            String(
                texto || ""
            ).trim();


        /*
           Mensaje vacío.
        */

        if (!texto) {

            input.focus();

            return;

        }


        /*
           Limitar tamaño.
        */

        if (
            texto.length >
            MAX_MESSAGE_LENGTH
        ) {

            agregarMensajeBot(
                "⚠️ El mensaje es demasiado largo. Intenta resumir lo que necesitas."
            );

            return;

        }


        /*
           Evitar doble envío.
        */

        if (agenteOcupado) {

            return;

        }


        agenteOcupado =
            true;


        /*
           Mostrar usuario.
        */

        agregarMensajeUsuario(
            texto
        );


        /*
           Limpiar input.
        */

        input.value =
            "";


        /*
           Bloquear interfaz.
        */

        btnEnviar.disabled =
            true;

        input.disabled =
            true;


        /*
           Mostrar pensamiento.
        */

        mostrarTyping();


        try {

            const data =
                await enviarAlAgente(
                    texto
                );


            await procesarRespuestaAgente(
                data
            );

        } catch (error) {

            console.error(
                "❌ San Martín Agent:",
                error
            );


            agregarMensajeBot(
                "⚠️ No pude conectarme con San Martín Agent en este momento. Intenta nuevamente."
            );

        } finally {

            ocultarTyping();


            agenteOcupado =
                false;


            btnEnviar.disabled =
                false;

            input.disabled =
                false;


            input.focus();


            desplazarMensajesAlFinal();

        }

    }


    /* =========================================================
       BOTÓN ABRIR
    ========================================================= */

    btnAbrir.addEventListener(
        "click",
        abrirSanMartinAgent
    );


    /* =========================================================
       BOTÓN CERRAR
    ========================================================= */

    btnCerrar.addEventListener(
        "click",
        cerrarSanMartinAgent
    );


    /* =========================================================
       FORMULARIO
    ========================================================= */

    formulario.addEventListener(
        "submit",
        function (evento) {

            evento.preventDefault();


            procesarMensaje(
                input.value
            );

        }
    );


    /* =========================================================
       ACCIONES RÁPIDAS
    ========================================================= */

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


                    abrirSanMartinAgent();


                    procesarMensaje(
                        prompt
                    );

                }
            );

        }
    );


    /* =========================================================
       ESCAPE
    ========================================================= */

    document.addEventListener(
        "keydown",
        function (evento) {

            if (
                evento.key === "Escape" &&
                !ventana.hidden
            ) {

                cerrarSanMartinAgent();

            }

        }
    );


    /* =========================================================
       API PÚBLICA DEL AGENTE
    =========================================================

       Esto permitirá que otras partes de la tienda
       puedan comunicarse con San Martín Agent.

       Ejemplo futuro:

       window.SanMartinAgent.open();

       window.SanMartinAgent.ask(
           "Busca crayones baratos"
       );

       window.SanMartinAgent.newConversation();
    */

    window.SanMartinAgent = {

        open:
            abrirSanMartinAgent,

        close:
            cerrarSanMartinAgent,

        ask:
            procesarMensaje,

        newConversation:
            nuevaConversacionAgent,

        getInteractionId:
            function () {

                return interactionId;

            },

        getSessionId:
            function () {

                return sessionId;

            }

    };


    /* =========================================================
       INICIO
    ========================================================= */

    console.log(
        "🤖 San Martín Agent 1.0 iniciado."
    );


    console.log(
        "🧠 Motor: Gemini Interactions API"
    );


    console.log(
        "🔧 Arquitectura: Function Calling + Supabase"
    );


    console.log(
        "🛒 Preparado para funciones reales de la aplicación."
    );


})();
