/* =====================================================
   SAN MARTÍN · NAVEGACIÓN INTERNA
   Convierte Nosotros y Mi cuenta en vistas del sitio,
   sin salir de la página ni interferir con Supabase.
===================================================== */

(() => {
    "use strict";

    const paginasInternas = {
        nosotros: {
            titulo: "Nosotros",
            descripcion: "Conoce San Martín"
        },
        cuenta: {
            titulo: "Mi cuenta",
            descripcion: "Tu espacio personal"
        }
    };

    const idsInicio = [
        "inicio",
        "promociones",
        "categorias",
        "catalogo",
        "ubicacion"
    ];

    const encabezado = document.querySelector("header");
    const tituloOriginal = document.title;

    const seccionesInicio = idsInicio
        .map(id => document.getElementById(id))
        .filter(Boolean);

    const seccionesInternas = Object.entries(paginasInternas)
        .map(([id, datos]) => ({
            id,
            ...datos,
            elemento: document.getElementById(id)
        }))
        .filter(vista => vista.elemento);

    if (!seccionesInicio.length || !seccionesInternas.length) {
        return;
    }

    seccionesInicio.forEach(seccion => {
        seccion.dataset.vistaInicio = "";
    });

    seccionesInternas.forEach(vista => {
        vista.elemento.classList.add("pagina-interna");
        vista.elemento.setAttribute("tabindex", "-1");
        crearEncabezadoInterno(vista);
    });

    function crearEncabezadoInterno(vista) {
        const contenedor = vista.elemento.querySelector(
            ".container, .cuenta-container"
        );

        if (!contenedor || vista.elemento.querySelector(".vista-interna-encabezado")) {
            return;
        }

        const encabezadoInterno = document.createElement("div");
        encabezadoInterno.className = "vista-interna-encabezado";

        const volver = document.createElement("button");
        volver.type = "button";
        volver.className = "vista-interna-volver";
        volver.dataset.navegacionVolver = "inicio";
        volver.setAttribute("aria-label", "Regresar al inicio del catálogo");
        volver.innerHTML = "<span aria-hidden=\"true\">←</span> Regresar al inicio";

        const ruta = document.createElement("p");
        ruta.className = "vista-interna-ruta";

        const marca = document.createElement("span");
        marca.textContent = "San Martín";

        const separador = document.createElement("span");
        separador.setAttribute("aria-hidden", "true");
        separador.textContent = "/";

        const pagina = document.createElement("strong");
        pagina.textContent = vista.titulo;

        ruta.append(marca, separador, pagina);
        encabezadoInterno.append(volver, ruta);

        /* La cabecera se muestra antes del contenido propio de cada vista. */
        vista.elemento.insertBefore(encabezadoInterno, contenedor);
    }

    function obtenerDestinoDesdeHash() {
        const id = decodeURIComponent(window.location.hash.replace(/^#/, ""));

        return document.getElementById(id) ? id : "inicio";
    }

    function esPaginaInterna(id) {
        return Object.hasOwn(paginasInternas, id);
    }

    function actualizarEnlacesActivos(destino) {
        document.querySelectorAll("header a[href^='#']").forEach(enlace => {
            const id = enlace.getAttribute("href").slice(1);
            const activo = esPaginaInterna(destino)
                ? id === destino
                : id === "inicio" && destino === "inicio";

            if (activo) {
                enlace.setAttribute("aria-current", "page");
            } else {
                enlace.removeAttribute("aria-current");
            }
        });
    }

    function desplazarA(destino, comportamiento) {
        const objetivo = document.getElementById(destino) || document.getElementById("inicio");

        if (!objetivo) {
            return;
        }

        const altoHeader = encabezado ? encabezado.offsetHeight : 0;
        const posicion = objetivo.getBoundingClientRect().top + window.scrollY;
        const reducirMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        window.scrollTo({
            top: Math.max(0, posicion - altoHeader - 20),
            behavior: reducirMovimiento ? "auto" : comportamiento
        });
    }

    function mostrarVista(destino, opciones = {}) {
        const {
            actualizarHistorial = false,
            desplazar = true,
            comportamiento = "smooth",
            enfocar = true
        } = opciones;

        const destinoValido = document.getElementById(destino) ? destino : "inicio";
        const vistaInterna = esPaginaInterna(destinoValido) ? destinoValido : null;

        seccionesInicio.forEach(seccion => {
            seccion.hidden = Boolean(vistaInterna);
        });

        seccionesInternas.forEach(vista => {
            vista.elemento.hidden = vista.id !== vistaInterna;
        });

        document.body.classList.toggle("vista-interna-activa", Boolean(vistaInterna));
        actualizarEnlacesActivos(destinoValido);

        document.title = vistaInterna
            ? `${paginasInternas[vistaInterna].titulo} | San Martín`
            : tituloOriginal;

        if (actualizarHistorial) {
            const siguienteUrl = new URL(window.location.href);
            siguienteUrl.hash = destinoValido;
            window.history.pushState({ vistaSanMartin: destinoValido }, "", siguienteUrl);
        }

        if (!desplazar) {
            return;
        }

        requestAnimationFrame(() => {
            desplazarA(destinoValido, comportamiento);

            if (vistaInterna && enfocar) {
                document.getElementById(vistaInterna)?.focus({ preventScroll: true });
            }
        });
    }

    /*
       Se usa captura para evitar que el scroll del menú antiguo se ejecute
       antes de que la vista interna se haga visible.
    */
    document.addEventListener("click", evento => {
        const volver = evento.target.closest("[data-navegacion-volver]");
        const enlace = evento.target.closest("header a[href^='#']");

        if (!volver && !enlace) {
            return;
        }

        evento.preventDefault();
        evento.stopImmediatePropagation();

        const destino = volver
            ? volver.dataset.navegacionVolver
            : enlace.getAttribute("href").slice(1);

        mostrarVista(destino, { actualizarHistorial: true });
    }, true);

    window.addEventListener("popstate", () => {
        mostrarVista(obtenerDestinoDesdeHash(), {
            comportamiento: "auto"
        });
    });

    window.addEventListener("hashchange", () => {
        mostrarVista(obtenerDestinoDesdeHash(), {
            comportamiento: "auto"
        });
    });

    const destinoInicial = obtenerDestinoDesdeHash();

    mostrarVista(destinoInicial, {
        desplazar: Boolean(window.location.hash),
        comportamiento: "auto",
        enfocar: false
    });
})();