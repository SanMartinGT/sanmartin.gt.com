/*
  Configuración central de Supabase.
  La publishable key está pensada para usarse desde el navegador. La seguridad
  de los datos debe definirse en Supabase con RLS y políticas por tabla.
*/
const SUPABASE_URL = 'https://beasfybalepkdlomzazf.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_WPNx9dnbcylQWB6_AXP-HA_KvTbHamZ';

if (!window.supabase) {
  console.error('No se pudo cargar la biblioteca de Supabase. Revisa tu conexión a internet.');
} else {
  // Cliente único reutilizable para productos, categorías, pedidos y usuarios.
  window.supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    },
  );

  window.SUPABASE_CONFIG = { url: SUPABASE_URL };
  console.info('Cliente de Supabase inicializado para San Martín ERP.');
}
