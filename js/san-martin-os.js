/* =========================================================
   SAN MARTÍN OS
   SISTEMA OPERATIVO DE INTELIGENCIA DE SAN MARTÍN

   ARQUITECTURA ACTUAL:

   TIENDA
      ↓
   SAN MARTÍN OS
      ↓
   SUPABASE EDGE FUNCTION
      ↓
   SAN MARTÍN CEREBRO LÓGICO
      ↓
   SUPABASE / INVENTARIO
      ↓
   RESPUESTA REAL

   IMPORTANTE:

   - Este archivo NO contiene API Keys.
   - No utiliza Gemini directamente.
   - No utiliza OpenAI directamente.
   - No utiliza interaction_id.
   - No utiliza Function Calling del navegador.
   - El navegador solamente envía mensajes.
   - La Edge Function controla la lógica.
   - Preparado para crecer hacia:
       • búsqueda de productos
       • precios
       • stock
       • cantidades
       • marcas
       • categorías
       • comparaciones
       • recomendaciones
       • presupuesto
       • carrito
       • pedidos
       • cuenta
       • compras inteligentes

   ========================================================= */

(function () {

    "use strict";


    /* =========================================================
       CONFIGURACIÓN
    ========================================================= */

    const SAN_MARTIN_OS_FUNCTION =
        "san-martin-ai";


    const OS_PROTOCOL_VERSION =
        "1.0";


    const MAX_MESSAGE_LENGTH =
        4000;


    const SESSION_STORAGE_KEY =
        "san_martin_os_session";


    const DEBUG =
        true;


    /* =========================================================
       ESTADO
    ========================================================= */

    let sessionId =
        sessionStorage.getItem(
            SESSION_STORAGE_KEY
        );


    let agenteOcupado =
        false;


    /*
       Crear sesión si no existe.
    */

    if (!sessionId) {

        sessionId =
            generarIdSeguro();

        sessionStorage.setItem(
            SESSION_STORAGE_KEY,
            sessionId
        );

    }


    /* =========================================================
       ELEMENTOS DE LA INTERFAZ
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
       VALIDACIÓN DE INTERFAZ
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
            "❌ San Martín OS: faltan elementos necesarios del HTML."
        );

        return;

    }


    /* =========================================================
       GENERAR ID DE SESIÓN
    ========================================================= */

    function generarIdSeguro() {

        if (
            window.crypto &&
            typeof window.crypto.randomUUID === "function"
        ) {

            return window.crypto.randomUUID();

        }


        return (
            "sm-os-" +
            Date.now() +
            "-" +
            Math.random()
                .toString(36)
                .substring(2, 12)
        );

    }


    /* =========================================================
       LOG
    ========================================================= */

    function log(...args) {

        if (DEBUG) {

            console.log(
                "🤖 San Martín OS:",
                ...args
            );

        }

    }


    /* =========================================================
       ABRIR
    ========================================================= */

    function abrirSanMartinOS() {

        ventana.hidden = false;

        ventana.classList.add(
            "active"
        );

        input.focus();

        desplazarMensajesAlFinal();

    }


    /* =========================================================
       CERRAR
    ========================================================= */

    function cerrarSanMartinOS() {

        ventana.hidden = true;

        ventana.classList.remove(
            "active"
        );

    }


    /* =========================================================
       NUEVA CONVERSACIÓN
    ========================================================= */

    function nuevaConversacion() {

        sessionId =
            generarIdSeguro();

        sessionStorage.setItem(
            SESSION_STORAGE_KEY,
            sessionId
        );

        log(
            "Nueva sesión:",
            sessionId
        );

    }


    /* =========================================================
       MENSAJE DEL USUARIO
    ========================================================= */

    function agregarMensajeUsuario(
        texto
    ) {

        const mensaje =
            document.createElement(
                "div"
            );


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
       MENSAJE DE SAN MARTÍN OS
    ========================================================= */

    function agregarMensajeBot(
        texto
    ) {

        const mensaje =
            document.createElement(
                "div"
            );


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

    function formatearRespuesta(
        texto
    ) {

        return escaparHTML(
            String(
                texto || ""
            )
        )
        .replace(/\n/g, "<br>");

    }


    /* =========================================================
       ESCAPAR HTML
    ========================================================= */

    function escaparHTML(
        texto
    ) {

        const div =
            document.createElement(
                "div"
            );


        div.textContent =
            String(
                texto || ""
            );


        return div.innerHTML;

    }


    /* =========================================================
       TYPING
    ========================================================= */

    function mostrarTyping() {

        if (typing) {

            typing.hidden = false;

        }


        desplazarMensajesAlFinal();

    }


    function ocultarTyping() {

        if (typing) {

            typing.hidden = true;

        }

    }


    /* =========================================================
       SCROLL
    ========================================================= */

    function desplazarMensajesAlFinal() {

        requestAnimationFrame(
            function () {

                mensajes.scrollTop =
                    mensajes.scrollHeight;

            }
        );

    }


    /* =========================================================
       CONTEXTO REAL DE LA TIENDA
    ========================================================= */

    function obtenerContextoAplicacion() {

        const contexto = {

            pagina:
                window.location.pathname,

            url:
                window.location.href,

            idioma:
                document.documentElement.lang ||
                "es",

            moneda:
                "GTQ",

            tienda:
                "San Martín | Papelería y Librería"

        };


        /*
           Categoría activa.
        */

        try {

            const categoriaActiva =
                document.querySelector(
                    ".category-filter.active"
                );


            if (
                categoriaActiva
            ) {

                contexto.categoria_activa =
                    categoriaActiva.textContent.trim();

            }

        } catch (error) {

            log(
                "No se pudo detectar categoría activa.",
                error
            );

        }


        /*
           Producto seleccionado.
        */

        try {

            if (
                window.productoSeleccionado
            ) {

                contexto.producto_seleccionado =
                    window.productoSeleccionado;

            }

        } catch (error) {

            log(
                "No se pudo obtener producto seleccionado.",
                error
            );

        }


        /*
           Carrito.

           Si en el futuro la tienda expone:

           window.obtenerCarritoActual()

           San Martín OS podrá utilizarlo
           automáticamente.
        */

        try {

            if (
                typeof window.obtenerCarritoActual ===
                "function"
            ) {

                contexto.carrito =
                    window.obtenerCarritoActual();

            }

        } catch (error) {

            log(
                "No se pudo obtener carrito.",
                error
            );

        }


        return contexto;

    }


    /* =========================================================
       CONSTRUIR PAYLOAD
    ========================================================= */

    function construirPayload(
        mensaje
    ) {

        return {

            protocol_version:
                OS_PROTOCOL_VERSION,

            session_id:
                sessionId,

            message:
                mensaje,

            context:
                obtenerContextoAplicacion()

        };

    }


    /* =========================================================
       ENVIAR A SAN MARTÍN OS
    ========================================================= */

    async function enviarAlSanMartinOS(
        texto
    ) {

        const payload =
            construirPayload(
                texto
            );


        log(
            "→ Edge Function:",
            payload
        );


        /*
           Usamos el cliente Supabase
           que ya existe en la aplicación.
        */

        if (
            typeof supabaseClient ===
            "undefined" ||
            !supabaseClient
        ) {

            throw new Error(
                "supabaseClient no está disponible."
            );

        }


        const resultado =
            await supabaseClient.functions.invoke(
                SAN_MARTIN_OS_FUNCTION,
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


        if (
            !resultado.data
        ) {

            throw new Error(
                "San Martín OS no devolvió datos."
            );

        }


        log(
            "← Edge Function:",
            resultado.data
        );


        return resultado.data;

    }


    /* =========================================================
       PROCESAR RESPUESTA
    ========================================================= */

    async function procesarRespuesta(
        data
    ) {

        if (
            !data ||
            data.success !== true
        ) {

            throw new Error(
                "Respuesta inválida de San Martín OS."
            );

        }


        /*
           La nueva Edge Function devuelve:

           {
               success,
               version,
               response,
               analysis,
               actions
           }

           No necesitamos interaction_id.
        */


        const respuesta =
            data.response ||
            "No pude generar una respuesta.";


        /*
           Mostrar respuesta.
        */

        agregarMensajeBot(
            respuesta
        );


        /*
           Registrar análisis en consola.

           No se muestra al cliente.
        */

        log(
            "🧠 Análisis:",
            data.analysis
        );


        /*
           Acciones futuras.

           La Fase 1 actualmente devuelve:

           actions: []

           Cuando conectemos carrito,
           navegación y compras,
           esta función podrá procesarlas.
        */

        if (
            Array.isArray(
                data.actions
            ) &&
            data.actions.length > 0
        ) {

            await ejecutarAcciones(
                data.actions
            );

        }

    }


    /* =========================================================
       EJECUTOR DE ACCIONES
    =========================================================

       Por ahora la Fase 1 no necesita acciones.

       Esta estructura queda preparada para:

       add_to_cart
       remove_from_cart
       update_cart_quantity
       open_cart
       open_product
       search_products
       apply_catalog_filter
       go_to_catalog

    ========================================================= */

    async function ejecutarAcciones(
        acciones
    ) {

        if (
            !Array.isArray(
                acciones
            )
        ) {

            return;

        }


        for (
            const accion
            of acciones
        ) {

            if (
                !accion ||
                typeof accion !== "object"
            ) {

                continue;

            }


            const tipo =
                String(
                    accion.type || ""
                );


            const payload =
                accion.payload || {};


            log(
                "🔧 Acción:",
                tipo,
                payload
            );


            switch (tipo) {

                case "go_to_catalog":

                    accionIrCatalogo();

                    break;


                case "search_products":

                    accionBuscarProductos(
                        payload
                    );

                    break;


                case "apply_catalog_filter":

                    accionAplicarFiltro(
                        payload
                    );

                    break;


                case "open_product":

                    accionAbrirProducto(
                        payload
                    );

                    break;


                case "open_cart":

                    accionAbrirCarrito();

                    break;


                default:

                    console.warn(
                        "⚠️ San Martín OS: acción desconocida:",
                        tipo
                    );

                    break;

            }

        }

    }


    /* =========================================================
       ACCIÓN — IR AL CATÁLOGO
    ========================================================= */

    function accionIrCatalogo() {

        const catalogo =
            document.getElementById(
                "catalogo"
            );


        if (
            catalogo
        ) {

            catalogo.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

        }

    }


    /* =========================================================
       ACCIÓN — BUSCAR PRODUCTOS
    ========================================================= */

    function accionBuscarProductos(
        payload
    ) {

        const consulta =
            payload.query ||
            payload.search ||
            payload.text ||
            "";


        if (
            !consulta
        ) {

            return;

        }


        /*
           Primera opción:
           función real de la tienda.
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


        /*
           Buscador principal conocido
           de San Martín.
        */

        const buscador =
            document.getElementById(
                "search"
            );


        if (
            buscador
        ) {

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

        }

    }


    /* =========================================================
       ACCIÓN — FILTRO
    ========================================================= */

    function accionAplicarFiltro(
        payload
    ) {

        const categoria =
            payload.category ||
            payload.categoria;


        if (
            !categoria
        ) {

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


        /*
           Buscar botones de categoría
           de la tienda.
        */

        const botones =
            document.querySelectorAll(
                "[data-category]"
            );


        botones.forEach(
            function (boton) {

                const valor =
                    boton.getAttribute(
                        "data-category"
                    );


                if (
                    valor &&
                    valor.toLowerCase() ===
                    categoria.toLowerCase()
                ) {

                    boton.click();

                }

            }
        );

    }


    /* =========================================================
       ACCIÓN — ABRIR PRODUCTO
    ========================================================= */

    function accionAbrirProducto(
        payload
    ) {

        const productoId =
            payload.product_id ||
            payload.producto_id ||
            payload.id;


        if (
            !productoId
        ) {

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


        log(
            "Producto solicitado:",
            productoId
        );

    }


    /* =========================================================
       ACCIÓN — ABRIR CARRITO
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


            if (
                elemento
            ) {

                elemento.hidden =
                    false;


                elemento.classList.add(
                    "active"
                );


                elemento.classList.add(
                    "open"
                );


                return;

            }

        }


        /*
           Intentar botones conocidos.
        */

        const botones =
            document.querySelectorAll(
                "[data-cart]"
            );


        if (
            botones.length > 0
        ) {

            botones[0].click();

        }

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
           Vacío.
        */

        if (
            !texto
        ) {

            input.focus();

            return;

        }


        /*
           Límite.
        */

        if (
            texto.length >
            MAX_MESSAGE_LENGTH
        ) {

            agregarMensajeBot(
                "⚠️ El mensaje es demasiado largo. Intenta resumirlo."
            );

            return;

        }


        /*
           Evitar doble envío.
        */

        if (
            agenteOcupado
        ) {

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
           Limpiar.
        */

        input.value =
            "";


        /*
           Bloquear.
        */

        btnEnviar.disabled =
            true;

        input.disabled =
            true;


        /*
           Mostrar typing.
        */

        mostrarTyping();


        try {

            const data =
                await enviarAlSanMartinOS(
                    texto
                );


            await procesarRespuesta(
                data
            );

        } catch (error) {

            console.error(
                "❌ San Martín OS:",
                error
            );


            agregarMensajeBot(
                "⚠️ No pude conectarme con San Martín OS en este momento. Intenta nuevamente."
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
        function () {

            abrirSanMartinOS();

        }
    );


    /* =========================================================
       BOTÓN CERRAR
    ========================================================= */

    btnCerrar.addEventListener(
        "click",
        function () {

            cerrarSanMartinOS();

        }
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
       BOTONES DE ACCIONES RÁPIDAS
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


                    if (
                        !prompt
                    ) {

                        return;

                    }


                    abrirSanMartinOS();


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

                cerrarSanMartinOS();

            }

        }
    );


    /* =========================================================
       API PÚBLICA
    =========================================================

       Permite que cualquier parte de la tienda
       pueda comunicarse con San Martín OS.

       Ejemplos:

       SanMartinOS.open();

       SanMartinOS.ask(
           "Busca crayones baratos"
       );

       SanMartinOS.newConversation();

    ========================================================= */

    window.SanMartinOS = {

        open:
            abrirSanMartinOS,

        close:
            cerrarSanMartinOS,

        ask:
            procesarMensaje,

        newConversation:
            nuevaConversacion,

        getSessionId:
            function () {

                return sessionId;

            }

    };


    /* =========================================================
       INICIO
    ========================================================= */

    log(
        "🚀 San Martín OS iniciado."
    );


    log(
        "🧠 Motor: San Martín OS — Cerebro lógico"
    );


    log(
        "🗄️ Datos: Supabase"
    );


    log(
        "🔌 Edge Function:",
        SAN_MARTIN_OS_FUNCTION
    );


    log(
        "🛒 Sistema preparado para evolucionar hacia el asistente de compras."
    );


})();