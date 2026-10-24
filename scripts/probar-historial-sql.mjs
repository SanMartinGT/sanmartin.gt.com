import assert from 'node:assert/strict';
import test from 'node:test';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {PGlite} from '@electric-sql/pglite';

// Ejecuta sin modificar la definición observada del RPC vivo, en PostgreSQL WASM.
// La sesión, el permiso y el alcance de sucursal se simulan en funciones de fixture;
// estas pruebas no certifican la cadena real de Auth, MFA o revocación de sesiones.
// Sin Supabase, usuarios, pedidos ni datos reales. No crea/aplica migraciones.
const contract=JSON.parse(await readFile(new URL('../supabase/contratos/h07-historial-observado-2026-10-24.json',import.meta.url),'utf8'));
const observed=contract.functions.find(fn=>fn.schema==='public'&&fn.name==='erp_detalle_productos_pedido');
assert.ok(observed?.definition);
assert.equal(createHash('md5').update(observed.definition).digest('hex'),observed.md5,'La función observada debe conservar sus bytes');
const ID={
 owner:'11111111-1111-4111-8111-111111111111',other:'22222222-2222-4222-8222-222222222222',staff:'33333333-3333-4333-8333-333333333333',
 order:'44444444-4444-4444-8444-444444444441',otherOrder:'44444444-4444-4444-8444-444444444442',emptyOrder:'44444444-4444-4444-8444-444444444443',missingOrder:'44444444-4444-4444-8444-444444444449',
 location:'55555555-5555-4555-8555-555555555551',otherLocation:'55555555-5555-4555-8555-555555555552',
 hidden:'66666666-6666-4666-8666-666666666661',visible:'66666666-6666-4666-8666-666666666662',
 unit:'77777777-7777-4777-8777-777777777771',metre:'77777777-7777-4777-8777-777777777772',presentation:'88888888-8888-4888-8888-888888888888'
};
const schema=`
CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS; CREATE ROLE unrelated;
CREATE SCHEMA auth; CREATE SCHEMA erp_private;
GRANT USAGE ON SCHEMA public,auth TO anon,authenticated,service_role,unrelated;
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
 SELECT nullif(coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb->>'sub','')::uuid
$$;
-- Límites simulados explícitos: no sustituyen pruebas de Auth/MFA reales.
CREATE FUNCTION public.erp_sesion_autorizada() RETURNS boolean LANGUAGE sql STABLE AS $$
 SELECT coalesce((coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb->>'fixture_session_active')::boolean,false)
$$;
CREATE FUNCTION public.tiene_permiso(code text) RETURNS boolean LANGUAGE sql STABLE AS $$
 SELECT code='pedidos.ver' AND coalesce((coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb->>'fixture_permission')::boolean,false)
$$;
CREATE FUNCTION erp_private.tiene_acceso_ubicacion_historica(location uuid) RETURNS boolean LANGUAGE sql STABLE AS $$
 SELECT location=nullif(coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb->>'fixture_location','')::uuid
$$;
CREATE TABLE public.pedidos_ecommerce(id uuid PRIMARY KEY,cliente_id uuid,ubicacion_id uuid);
CREATE TABLE public.unidades_medida(id uuid PRIMARY KEY,nombre text,abreviatura text,permite_fraccion boolean,decimales_permitidos integer);
CREATE TABLE public.productos(id uuid PRIMARY KEY,nombre text,sku text,unidad_medida_id uuid,publicado_ecommerce boolean,costo numeric);
CREATE TABLE public.pedidos_ecommerce_detalle(id uuid PRIMARY KEY,pedido_id uuid,producto_id uuid,cantidad numeric,precio_unitario numeric,total_linea numeric,presentacion_id uuid,presentacion_nombre text,cantidad_presentaciones numeric,factor_presentacion numeric,precio_presentacion numeric);
CREATE TABLE public.reservas(id uuid PRIMARY KEY,cantidad numeric);
CREATE TABLE public.movimientos(id uuid PRIMARY KEY,cantidad numeric);
CREATE TABLE public.existencias(id uuid PRIMARY KEY,stock numeric);
ALTER TABLE public.pedidos_ecommerce ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos_ecommerce_detalle ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unidades_medida ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.pedidos_ecommerce,public.pedidos_ecommerce_detalle,public.productos,public.unidades_medida FROM PUBLIC,anon,authenticated;
`;
const report={contract_file:'supabase/contratos/h07-historial-observado-2026-10-24.json',rpc:'public.erp_detalle_productos_pedido(uuid)',function_md5:observed.md5,exact_observed_definition:true,limitations:['Sesión autorizada, permiso y alcance de sucursal simulados explícitamente; no valida Auth/MFA reales.','El RPC usa nombre/SKU/unidad actuales; no prueba ni añade snapshots históricos H08.'],checks:[],production_writes:0,migrations_applied:0};

test('H07: detalle autorizado con PostgreSQL aislado y contrato vivo exacto',async t=>{
 const db=new PGlite();
 const snapshot=async()=>{
  const {rows}=await db.query(`select jsonb_build_object('pedidos',(select jsonb_agg(to_jsonb(x) order by id) from public.pedidos_ecommerce x),'detalle',(select jsonb_agg(to_jsonb(x) order by id) from public.pedidos_ecommerce_detalle x),'productos',(select jsonb_agg(to_jsonb(x) order by id) from public.productos x),'unidades',(select jsonb_agg(to_jsonb(x) order by id) from public.unidades_medida x),'reservas',(select jsonb_agg(to_jsonb(x) order by id) from public.reservas x),'movimientos',(select jsonb_agg(to_jsonb(x) order by id) from public.movimientos x),'existencias',(select jsonb_agg(to_jsonb(x) order by id) from public.existencias x)) as result`);
  return rows[0].result;
 };
 const call=async({actor=ID.owner,session=true,permission=false,location=null,role='authenticated',order=ID.order}={})=>{
  assert.ok(['anon','authenticated','service_role','unrelated'].includes(role));
  await db.exec('BEGIN READ ONLY');
  try{
   await db.query("select set_config('request.jwt.claims',$1,true)",[JSON.stringify({sub:actor,fixture_session_active:session,fixture_permission:permission,fixture_location:location})]);
   await db.exec(`SET LOCAL ROLE ${role}`);
   return (await db.query('select public.erp_detalle_productos_pedido($1::uuid) as result',[order])).rows[0].result;
  }finally{await db.exec('ROLLBACK');}
 };
 const check=async(name,fn)=>t.test(name,async()=>{await fn();report.checks.push(name);});
 const denied=fn=>assert.rejects(fn,error=>{assert.equal(error.code,'42501');return true;});
 try{
  await db.exec(schema);
  await db.query('insert into public.pedidos_ecommerce(id,cliente_id,ubicacion_id) values($1,$2,$3),($4,$5,$6),($7,$2,$3)',[ID.order,ID.owner,ID.location,ID.otherOrder,ID.other,ID.otherLocation,ID.emptyOrder]);
  await db.query("insert into public.unidades_medida values($1,'Unidad','u',false,0),($2,'Metro','m',true,2)",[ID.unit,ID.metre]);
  await db.query("insert into public.productos values($1,'Cuaderno oculto <b>histórico</b>','OCULTO-1',$2,false,1.23),($3,'Cinta visible','VISIBLE-1',$4,true,0.35)",[ID.hidden,ID.unit,ID.visible,ID.metre]);
  await db.query("insert into public.pedidos_ecommerce_detalle values('99999999-9999-4999-8999-999999999991',$1,$2,12,0.833333,10,$3,'Paquete anterior de 6',2,6,5),('99999999-9999-4999-8999-999999999992',$1,$4,0.5,2,1,null,null,null,null,null),('99999999-9999-4999-8999-999999999993',$5,$4,1,9,9,null,null,null,null,null)",[ID.order,ID.hidden,ID.presentation,ID.visible,ID.otherOrder]);
  await db.query("insert into public.existencias values('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',27)");
  await db.exec(observed.definition);
  await db.exec('REVOKE ALL ON FUNCTION public.erp_detalle_productos_pedido(uuid) FROM PUBLIC,anon,unrelated; GRANT EXECUTE ON FUNCTION public.erp_detalle_productos_pedido(uuid) TO authenticated,service_role;');
  const before=await snapshot();
  await check('ejecuta PostgreSQL/PLpgSQL real con el cuerpo observado idéntico',async()=>{
   const {rows}=await db.query("select version() as version,md5(pg_get_functiondef('public.erp_detalle_productos_pedido(uuid)'::regprocedure)) as md5");
   assert.match(rows[0].version,/PostgreSQL/);assert.match(rows[0].version,/PGlite/);assert.equal(rows[0].md5,observed.md5);report.runtime=rows[0].version;
  });
  await check('dueño ve todas sus líneas incluido producto oculto sin vista de catálogo',async()=>{
   const lines=await call();assert.equal(lines.length,2);assert.equal(lines[0].producto_id,ID.hidden);assert.equal(lines[0].productos.nombre,'Cuaderno oculto <b>histórico</b>');
   assert.equal((await db.query("select to_regclass('public.catalogo_productos') as catalog")).rows[0].catalog,null);
  });
  await check('las líneas incluyen nombre/SKU y no exponen costo ni columnas privadas del producto',async()=>{
   const line=(await call())[0];assert.deepEqual(Object.keys(line.productos).sort(),['id','nombre','sku']);assert.equal(line.productos.sku,'OCULTO-1');assert.equal(JSON.stringify(line).includes('costo'),false);
  });
  await check('preserva presentación persistida y cantidad comercial diferenciada de cantidad base',async()=>{
   const line=(await call())[0];assert.equal(line.presentacion_id,ID.presentation);assert.equal(line.presentacion_nombre,'Paquete anterior de 6');assert.equal(line.cantidad_presentaciones,2);assert.equal(line.factor_presentacion,6);assert.equal(line.cantidad,12);assert.equal(line.precio_presentacion,5);assert.equal(line.total_linea,10);
  });
  await check('preserva cantidad fraccionada y unidad en líneas de venta base',async()=>{
   const line=(await call())[1];assert.equal(line.cantidad,0.5);assert.equal(line.presentacion_id,null);assert.equal(line.unidad_medida_snapshot.nombre,'Metro');assert.equal(line.unidad_medida_snapshot.decimales_permitidos,2);
  });
  await check('otro cliente no accede al pedido del dueño',()=>denied(()=>call({actor:ID.other})));
  await check('cada dueño ve únicamente su pedido solicitado',async()=>{
   const lines=await call({actor:ID.other,order:ID.otherOrder});assert.equal(lines.length,1);assert.equal(lines[0].pedido_id,ID.otherOrder);assert.equal(lines[0].precio_unitario,9);
  });
  await check('anon no tiene permiso de ejecutar el RPC',()=>denied(()=>call({role:'anon'})));
  await check('rol no relacionado no hereda EXECUTE por PUBLIC',()=>denied(()=>call({role:'unrelated'})));
  await check('sin auth.uid no hay acceso aunque la sesión simulada sea válida',()=>denied(()=>call({actor:null})));
  await check('sesión inactiva del dueño queda denegada',()=>denied(()=>call({session:false})));
  await check('sesión nula del dueño queda denegada',()=>denied(()=>call({session:null})));
  await check('pedido inexistente no produce un detalle vacío',()=>denied(()=>call({order:ID.missingOrder})));
  await check('pedido propio legítimamente sin líneas devuelve array vacío',async()=>assert.deepEqual(await call({order:ID.emptyOrder}),[]));
  await check('personal autorizado por permiso y sucursal puede consultar',async()=>assert.equal((await call({actor:ID.staff,permission:true,location:ID.location})).length,2));
  await check('personal sin permiso no puede consultar aunque tenga sucursal',()=>denied(()=>call({actor:ID.staff,permission:false,location:ID.location})));
  await check('personal sin alcance de sucursal no puede consultar aunque tenga permiso',()=>denied(()=>call({actor:ID.staff,permission:true,location:ID.otherLocation})));
  await check('personal con sesión inactiva tampoco puede consultar',()=>denied(()=>call({actor:ID.staff,session:false,permission:true,location:ID.location})));
  await check('service_role sin identidad de usuario no evita la comprobación de dueño/sesión',()=>denied(()=>call({actor:null,role:'service_role'})));
  await check('no amplía lectura directa de tablas para authenticated',async()=>{
   await db.exec('BEGIN READ ONLY; SET LOCAL ROLE authenticated;');try{await denied(()=>db.query('select * from public.productos'));}finally{await db.exec('ROLLBACK');}
  });
  await check('permisos reproducen authenticated sí y anon/PUBLIC no',async()=>{
   const {rows}=await db.query("select has_function_privilege('authenticated','public.erp_detalle_productos_pedido(uuid)','EXECUTE') as authenticated,has_function_privilege('anon','public.erp_detalle_productos_pedido(uuid)','EXECUTE') as anon,exists(select 1 from pg_proc p,lateral aclexplode(p.proacl)a where p.oid='public.erp_detalle_productos_pedido(uuid)'::regprocedure and a.grantee=0 and a.privilege_type='EXECUTE') as public");
   assert.deepEqual(rows[0],contract.permissions);
  });
  await check('las consultas READ ONLY no alteran pedidos/líneas/stock/reservas/movimientos',async()=>assert.deepEqual(await snapshot(),before));
  report.passed=report.checks.length;report.status='passed';
  if(process.env.H07_SQL_REPORT)await writeFile(process.env.H07_SQL_REPORT,JSON.stringify(report,null,2));
 }finally{await db.close();}
});
