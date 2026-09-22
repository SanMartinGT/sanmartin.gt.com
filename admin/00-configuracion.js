/* =====================================================
   SAN MARTÍN  00-configuracion.js
   PANEL DE ADMINISTRACIÓN
   CATÁLOGO + INVENTARIO + REPOSICIÓN
===================================================== */


/* =====================================================
   SUPABASE
===================================================== */

const SUPABASE_URL =
    "https://zqksriwvqbhjpixbsbgu.supabase.co";


const SUPABASE_KEY =
    "sb_publishable_w6a5Hx0aO9C8mdtvGIw6rA_G0XaQbrQ";


const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


/* =====================================================
   CONFIGURACIÓN
===================================================== */

const PORCENTAJE_REPOSICION = 0.30;


const ADMIN_EMAIL =
    "sanmartinlibreriapapeleria@gmail.com";


/* Ruta del logotipo que se muestra en la factura impresa. */
const LOGO_FACTURA_URL =
    new URL(
        "imagenes/logo-san-martin.png",
        window.location.href
    ).href;


/* =====================================================
   ESTADO
===================================================== */

let inventarioAdmin = [];

let productoEditando = null;


/* =====================================================
   PEDIDOS
===================================================== */

let pedidosAdmin = [];

let pedidoSeleccionado = null;

let ultimoPedidoAdminId = 0;

let primeraCargaPedidos = true;

let pedidosPolling = null;