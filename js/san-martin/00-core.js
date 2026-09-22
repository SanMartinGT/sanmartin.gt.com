/* =====================================================
   SAN MARTÍN
   CORE
===================================================== */

/* =====================================================
   CONFIGURACIÓN
===================================================== */

const WHATSAPP_SAN_MARTIN = "50249027035";

const SUPABASE_URL =
    "https://zqksriwvqbhjpixbsbgu.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_w6a5Hx0aO9C8mdtvGIw6rA_G0XaQbrQ";


/* =====================================================
   SUPABASE
===================================================== */

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


/* =====================================================
   ESTADO GLOBAL
===================================================== */

let inventario = {};

let productos = [];