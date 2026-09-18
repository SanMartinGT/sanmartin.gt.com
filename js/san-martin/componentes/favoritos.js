/* =====================================================
   FAVORITOS DEL USUARIO

   Conserva solo este bloque. Reemplaza los bloques de
   favoritos duplicados que aparecen al inicio del archivo.
===================================================== */

const TABLA_FAVORITOS = "favoritos";

// Debe coincidir exactamente con la columna de tu tabla favoritos.
// Si en Supabase se llama "producto_codigo", cambia solo este valor.
const COLUMNA_CODIGO_FAVORITO = "codigo_producto";

let favoritosUsuario = new Set();

function productoEsFavorito(codigo) {
    return favoritosUsuario.has(String(codigo));
}

function actualizarBotonFavorito(boton, activo, animar = false) {
    if (!boton) return;

    const etiqueta = activo
        ? "Quitar de favoritos"
        : "Agregar a favoritos";

    boton.classList.toggle("activo", activo);
    boton.textContent = activo ? "♥" : "♡";
    boton.setAttribute("aria-label", etiqueta);
    boton.title = etiqueta;

    if (animar) {
        boton.classList.remove("favorito-animacion");
        void boton.offsetWidth;
        boton.classList.add("favorito-animacion");
    }
}

function actualizarBotonesFavoritos(botonAnimado = null) {
    document
        .querySelectorAll(".btn-favorito-producto")
        .forEach(boton => {
            actualizarBotonFavorito(
                boton,
                productoEsFavorito(boton.dataset.codigo),
                boton === botonAnimado
            );
        });
}

function notificarFavoritosActualizados() {

    document.dispatchEvent(
        new CustomEvent("favoritos:actualizados")
    );

}

function limpiarFavoritosUsuario() {
    favoritosUsuario.clear();
    actualizarBotonesFavoritos();
    notificarFavoritosActualizados();
}

async function cargarFavoritosUsuario() {
    try {
        const {
            data: { user },
            error: errorUsuario
        } = await supabaseClient.auth.getUser();


        if (errorUsuario) {
            console.error("Error obteniendo usuario:", errorUsuario);
        }

        if (errorUsuario || !user) {
            limpiarFavoritosUsuario();
            return;
        }

        const { data, error } = await supabaseClient
            .from(TABLA_FAVORITOS)
            .select(COLUMNA_CODIGO_FAVORITO)
            .eq("usuario_id", user.id);

        if (error) {
            console.error("Error cargando favoritos:", error);
            limpiarFavoritosUsuario();
            return;
        }

        favoritosUsuario = new Set(
            (data ?? []).map(favorito =>
                String(favorito[COLUMNA_CODIGO_FAVORITO])
            )
        );

        actualizarBotonesFavoritos();
        notificarFavoritosActualizados();
    } catch (error) {
        console.error("Error inesperado cargando favoritos:", error);
        limpiarFavoritosUsuario();
    }
}

async function cambiarFavorito(producto, boton) {
    if (!producto || producto.codigo == null || !boton) return;
    if (boton.dataset.procesando === "true") return;

    boton.dataset.procesando = "true";
    boton.disabled = true;

    try {
        const {
            data: { user },
            error: errorUsuario
        } = await supabaseClient.auth.getUser();

        if (errorUsuario || !user) {
            if (errorUsuario) {
                console.error("Error obteniendo usuario:", errorUsuario);
            }

            document.getElementById("cuenta")?.scrollIntoView({
                behavior: "smooth"
            });

            if (typeof mostrarVistaCuenta === "function") {
                mostrarVistaCuenta("acceso");
            }

            alert(
                "Para guardar productos en favoritos debes iniciar sesión en tu cuenta de San Martín."
            );
            return;
        }

        const codigo = String(producto.codigo);
        const yaEsFavorito = productoEsFavorito(codigo);

        if (yaEsFavorito) {
            const { error } = await supabaseClient
                .from(TABLA_FAVORITOS)
                .delete()
                .eq("usuario_id", user.id)
                .eq(COLUMNA_CODIGO_FAVORITO, codigo);

            if (error) {
                console.error("Error eliminando favorito:", error);
                alert("No fue posible quitar este producto de favoritos.");
                return;
            }

            favoritosUsuario.delete(codigo);
        } else {
            const { error } = await supabaseClient
                .from(TABLA_FAVORITOS)
                .insert({
                    usuario_id: user.id,
                    [COLUMNA_CODIGO_FAVORITO]: codigo
                });

            // El código 23505 indica que otro intento ya lo había guardado.
            if (error && error.code !== "23505") {
                console.error("Error agregando favorito:", error);
                alert("No fue posible guardar este producto en favoritos.");
                return;
            }

            favoritosUsuario.add(codigo);
        }

        // Sincroniza todas las apariciones del producto (catálogo y ofertas).
        actualizarBotonesFavoritos(boton);
        notificarFavoritosActualizados();
    } catch (error) {
        console.error("Error inesperado con favorito:", error);
        alert("Ocurrió un error. Intenta nuevamente.");
    } finally {
        boton.dataset.procesando = "false";
        boton.disabled = false;
    }
}

/* =====================================================
   SINCRONIZAR FAVORITOS CON LA SESIÓN
===================================================== */

supabaseClient.auth.onAuthStateChange(
    async (evento, session) => {

        console.log(
            "Cambio de sesión para favoritos:",
            evento
        );


        /*
           Usuario inició sesión
        */

        if (session?.user) {

            await cargarFavoritosUsuario();

        }


        /*
           Usuario cerró sesión
        */

        else {

            limpiarFavoritosUsuario();

        }

    }
);

// =====================================================
// INICIAR CATÁLOGO
// =====================================================


// Cargar favoritos del usuario
cargarFavoritosUsuario();