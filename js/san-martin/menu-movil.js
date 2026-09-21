/* =========================================================
   SAN MARTÍN — MENÚ MÓVIL
   Apertura, cierre y navegación responsive
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    const btnMenu = document.getElementById("btnMenuMovil");
    const menu = document.getElementById("menuNavegacion");

    /* ---------------------------------------------------------
       VERIFICAR ELEMENTOS
    --------------------------------------------------------- */

    if (!btnMenu || !menu) {
        console.warn("SAN MARTÍN: No se encontró el botón o menú móvil.");
        return;
    }


    /* ---------------------------------------------------------
       ABRIR / CERRAR MENÚ
    --------------------------------------------------------- */

    function abrirMenu() {

        menu.classList.add("menu-abierto");

        btnMenu.setAttribute("aria-expanded", "true");

        btnMenu.setAttribute(
            "aria-label",
            "Cerrar menú de navegación"
        );

        btnMenu.classList.add("menu-activo");

    }


    function cerrarMenu() {

        menu.classList.remove("menu-abierto");

        btnMenu.setAttribute("aria-expanded", "false");

        btnMenu.setAttribute(
            "aria-label",
            "Abrir menú de navegación"
        );

        btnMenu.classList.remove("menu-activo");

    }


    function alternarMenu() {

        const abierto =
            menu.classList.contains("menu-abierto");

        if (abierto) {

            cerrarMenu();

        } else {

            abrirMenu();

        }

    }


    /* ---------------------------------------------------------
       BOTÓN HAMBURGUESA
    --------------------------------------------------------- */

    btnMenu.addEventListener("click", (event) => {

        event.preventDefault();

        event.stopPropagation();

        alternarMenu();

    });


    /* ---------------------------------------------------------
       CERRAR AL SELECCIONAR UNA OPCIÓN
    --------------------------------------------------------- */

    const enlacesMenu =
        menu.querySelectorAll("a");

    enlacesMenu.forEach((enlace) => {

        enlace.addEventListener("click", () => {

            cerrarMenu();

        });

    });


    /* ---------------------------------------------------------
       CERRAR AL HACER CLICK FUERA
    --------------------------------------------------------- */

    document.addEventListener("click", (event) => {

        if (!menu.classList.contains("menu-abierto")) {
            return;
        }

        const clickDentroMenu =
            menu.contains(event.target);

        const clickBoton =
            btnMenu.contains(event.target);

        if (!clickDentroMenu && !clickBoton) {

            cerrarMenu();

        }

    });


    /* ---------------------------------------------------------
       ESC — CERRAR MENÚ
    --------------------------------------------------------- */

    document.addEventListener("keydown", (event) => {

        if (event.key === "Escape") {

            cerrarMenu();

            btnMenu.focus();

        }

    });


    /* ---------------------------------------------------------
       CAMBIO DE TAMAÑO
       Si volvemos a escritorio, cerrar menú.
    --------------------------------------------------------- */

    window.addEventListener("resize", () => {

        if (window.innerWidth > 950) {

            cerrarMenu();

        }

    });


    /* ---------------------------------------------------------
       ESTADO INICIAL
    --------------------------------------------------------- */

    cerrarMenu();

});