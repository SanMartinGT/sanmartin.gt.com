import {readFile,readdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
let runtimeRequire=createRequire(import.meta.url);
let PGlite;
try { ({PGlite}=runtimeRequire('@electric-sql/pglite')); } catch (error) {
 if(!process.env.H05_PGLITE_ROOT)throw error;
 runtimeRequire=createRequire(path.join(path.resolve(process.env.H05_PGLITE_ROOT),'package.json'));
 ({PGlite}=runtimeRequire('@electric-sql/pglite'));
}
export const IDS={
 category:'11111111-1111-4111-8111-111111111111',unit:'22222222-2222-4222-8222-222222222221',metre:'22222222-2222-4222-8222-222222222222',
 paper:'33333333-3333-4333-8333-333333333333',tape:'44444444-4444-4444-8444-444444444444',hidden:'55555555-5555-4555-8555-555555555555',
 pack500:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',pack100:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',pack6:'cccccccc-cccc-4ccc-8ccc-cccccccccccc',badHalf:'dddddddd-dddd-4ddd-8ddd-dddddddddddd',quarter:'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',badPrecision:'ffffffff-ffff-4fff-8fff-ffffffffffff',
 destination:'88888888-8888-4888-8888-888888888888',source:'99999999-9999-4999-8999-999999999999',localOnly:'00000000-0000-4000-8000-000000000001',inactive:'00000000-0000-4000-8000-000000000002',noTransferSource:'00000000-0000-4000-8000-000000000003',warehouse:'00000000-0000-4000-8000-000000000004'
};
const schema=`
CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE unrelated; CREATE ROLE service_role BYPASSRLS;
CREATE SCHEMA erp_private;
GRANT USAGE ON SCHEMA public,erp_private TO anon,authenticated,service_role;
CREATE TABLE public.unidades_medida(id uuid primary key,activo boolean default true,permite_fraccion boolean default false,decimales_permitidos integer default 0,abreviatura text);
CREATE TABLE public.categorias(id uuid primary key,activo boolean default true,visible_ecommerce boolean default true);
CREATE TABLE public.marcas(id uuid primary key,activo boolean default true);
CREATE TABLE public.productos(id uuid primary key,nombre text,sku text,activo boolean default true,descontinuado boolean default false,es_vendible boolean default true,controla_inventario boolean default true,unidad_medida_id uuid,disponible_pos boolean default true,publicado_ecommerce boolean default true,visible_ecommerce boolean default true,es_comprable boolean default true,categoria_id uuid,marca_id uuid,precio_base numeric default 1,venta_fraccionada boolean default false);
CREATE TABLE public.producto_presentaciones(id uuid primary key,producto_id uuid,nombre text,activo boolean default true,disponible_pos boolean default true,disponible_ecommerce boolean default true,cantidad_base numeric,precio numeric default 1);
CREATE TABLE public.ofertas_producto(id uuid primary key default gen_random_uuid(),producto_id uuid,activo boolean default true,aplica_pos boolean default true,aplica_ecommerce boolean default true,fecha_inicio timestamptz default now()-interval '1 day',fecha_fin timestamptz,oferta_porcentaje numeric);
CREATE TABLE public.ubicaciones(id uuid primary key,nombre text,codigo text,direccion text,orden integer default 0,activo boolean default true,permite_inventario boolean default true,permite_venta boolean default true,permite_recepcion boolean default true,permite_transferencia boolean default true);
CREATE TABLE public.configuracion_ecommerce(id boolean primary key default true,ubicacion_ecommerce_id uuid,max_cantidad_por_linea numeric default 100);
CREATE TABLE public.existencias(id uuid primary key default gen_random_uuid(),producto_id uuid,ubicacion_id uuid,activo boolean default true,stock_fisico numeric default 0,stock_reservado numeric default 0,stock_disponible numeric default 0,unique(producto_id,ubicacion_id),check(stock_disponible=stock_fisico-stock_reservado),check(stock_disponible>=0),check(stock_fisico>=0),check(stock_reservado>=0));
CREATE TABLE public.pedidos_ecommerce(id uuid primary key default gen_random_uuid());
CREATE TABLE public.reservas(id uuid primary key default gen_random_uuid());
CREATE TABLE public.movimientos(id uuid primary key default gen_random_uuid());
CREATE TABLE public.transferencias_omnicanal(id uuid primary key default gen_random_uuid());
CREATE TABLE public.notificaciones_omnicanal(id uuid primary key default gen_random_uuid());
DO $$DECLARE tab record; BEGIN FOR tab IN SELECT tablename FROM pg_tables WHERE schemaname='public' LOOP EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',tab.tablename); END LOOP; END$$;
`;
export async function createFixture({migrationFile=null,functionsFile=path.join(root,'supabase/contratos/h05-dependencias-consulta.json')}={}){
 const db=new PGlite();
 try{
 await db.exec(schema);
 const ids=IDS;
 await db.query('insert into unidades_medida(id,abreviatura) values($1,$2)',[ids.unit,'u']);
 await db.query('insert into unidades_medida(id,abreviatura,permite_fraccion,decimales_permitidos) values($1,$2,true,2)',[ids.metre,'m']);
 await db.query('insert into categorias(id) values($1)',[ids.category]);
 for(const [id,nombre,unit,fraction,visible]of[[ids.paper,'Papel ficticio',ids.unit,false,true],[ids.tape,'Cinta ficticia',ids.metre,true,true],[ids.hidden,'Producto privado ficticio',ids.unit,false,false]]){
  await db.query('insert into productos(id,nombre,sku,unidad_medida_id,categoria_id,venta_fraccionada,publicado_ecommerce) values($1,$2,$2,$3,$4,$5,$6)',[id,nombre,unit,ids.category,fraction,visible]);
 }
 for(const [id,product,factor,nombre]of[[ids.pack500,ids.paper,500,'500 hojas'],[ids.pack100,ids.paper,100,'100 hojas'],[ids.pack6,ids.paper,6,'6 hojas'],[ids.badHalf,ids.paper,0.5,'Media hoja'],[ids.quarter,ids.tape,0.25,'Cuarto de metro'],[ids.badPrecision,ids.tape,0.005,'Precisión incompatible']]){
  await db.query('insert into producto_presentaciones(id,producto_id,cantidad_base,nombre) values($1,$2,$3,$4)',[id,product,factor,nombre]);
 }
 const branches=[[ids.destination,'Destino ficticio',true,true,true],[ids.source,'Fuente ficticia',true,true,true],[ids.localOnly,'Solo local',true,false,false],[ids.inactive,'Inactiva',false,true,true],[ids.noTransferSource,'Fuente sin transferencia',true,false,false],[ids.warehouse,'Bodega transferible',true,true,true]];
 for(let index=0;index<branches.length;index++){
  const [id,name,active,receipt,transfer]=branches[index];
  await db.query('insert into ubicaciones(id,nombre,codigo,orden,activo,permite_recepcion,permite_transferencia,permite_venta) values($1,$2,$3,$4,$5,$6,$7,$8)',[id,name,'F'+index,index,active,receipt,transfer,id!==ids.warehouse]);
 }
 await db.query('insert into configuracion_ecommerce(id,ubicacion_ecommerce_id,max_cantidad_por_linea) values(true,$1,100)',[ids.destination]);
 for(const [product,branch,stock]of[[ids.paper,ids.destination,20],[ids.paper,ids.source,1000],[ids.paper,ids.localOnly,10],[ids.paper,ids.inactive,9000],[ids.paper,ids.noTransferSource,9000],[ids.paper,ids.warehouse,100],[ids.tape,ids.destination,0.5],[ids.tape,ids.source,1.25]]){
  await db.query('insert into existencias(producto_id,ubicacion_id,stock_fisico,stock_disponible) values($1,$2,$3,$3)',[product,branch,stock]);
 }
 const snapshot=JSON.parse(await readFile(functionsFile,'utf8'));
 const functions=Array.isArray(snapshot)?snapshot:snapshot.functions;
 const wanted=new Set(['erp_private.validar_cantidad_producto','erp_private.normalizar_lineas_presentaciones','erp_private.resolver_linea_presentacion','erp_private.ecommerce_stock_omnicanal','public.ecommerce_stock_omnicanal','public.validar_disponibilidad_presentaciones']);
 const ordered=['validar_cantidad_producto','normalizar_lineas_presentaciones','resolver_linea_presentacion','ecommerce_stock_omnicanal','validar_disponibilidad_presentaciones'];
 const loaded=functions.filter(fn=>wanted.has(fn.schema+'.'+fn.name)).sort((a,b)=>ordered.indexOf(a.name)-ordered.indexOf(b.name)||(a.schema==='erp_private'?-1:1));
 for(const fn of loaded){
  await db.exec(fn.definition);
  const signature=`${fn.schema}.${fn.name}(${fn.identity_args})`;
  await db.exec(`REVOKE ALL ON FUNCTION ${signature} FROM PUBLIC,anon,authenticated;`);
  if(fn.public_execute)await db.exec(`GRANT EXECUTE ON FUNCTION ${signature} TO PUBLIC;`);
  if(fn.anon_execute)await db.exec(`GRANT EXECUTE ON FUNCTION ${signature} TO anon;`);
  if(fn.authenticated_execute)await db.exec(`GRANT EXECUTE ON FUNCTION ${signature} TO authenticated;`);
 }
 if(migrationFile)await db.exec(await readFile(migrationFile,'utf8'));
 return{db,ids,loaded:loaded.map(fn=>({schema:fn.schema,name:fn.name,definition_md5:fn.definition_md5}))};
 }catch(error){await db.close();throw error;}
}
export async function readOnly(db,role,sql,parameters=[]){
 await db.exec(`BEGIN READ ONLY; SET LOCAL ROLE ${role};`);
 try{return await db.query(sql,parameters)}finally{await db.exec('ROLLBACK;')}
}

export async function migrationPath(){
 if(process.env.H05_MIGRATION)return path.resolve(process.env.H05_MIGRATION);
 const directory=path.join(root,'supabase/migrations');
 const names=(await readdir(directory)).filter(name=>/^[0-9]{14}_.+\.sql$/.test(name)&&name.includes('disponibilidad_presentaciones_contextual'));
 if(names.length!==1)throw new Error('Se esperaba una migración contextual H05 única; especifica H05_MIGRATION.');
 return path.join(directory,names[0]);
}
export async function businessSnapshot(db){
 const result=await db.query(`select jsonb_build_object(
 'stock',(select jsonb_agg(to_jsonb(x) order by producto_id,ubicacion_id) from public.existencias x),
 'pedidos',(select count(*) from public.pedidos_ecommerce),
 'reservas',(select count(*) from public.reservas),
 'movimientos',(select count(*) from public.movimientos),
 'traslados',(select count(*) from public.transferencias_omnicanal),
 'notificaciones',(select count(*) from public.notificaciones_omnicanal)) as snapshot`);
 return result.rows[0].snapshot;
}
