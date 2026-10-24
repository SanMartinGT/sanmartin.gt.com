import assert from 'node:assert/strict';
import test from 'node:test';
import {readFile,readdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createFixture,IDS} from './fixtures-disponibilidad.mjs';

// PostgreSQL/PLpgSQL real: se ejecutan los cuerpos exactos de ambos checkout,
// resolución comercial, reservas y migración. Solo las fronteras Auth/permiso y
// la envoltura de respuesta omnicanal son fixtures explícitos, sin servicios.
const root=new URL('../',import.meta.url);
const source=JSON.parse(await readFile(new URL('supabase/contratos/h08-dependencias-snapshots.json',root),'utf8'));
const names=(await readdir(new URL('supabase/migrations/',root))).filter(n=>/^\d{14}_persistir_snapshots_pedidos\.sql$/.test(n));
assert.equal(names.length,1,'Se esperaba una única migración H08');
const migration=await readFile(new URL('supabase/migrations/'+names[0],root),'utf8');
const A='12121212-1212-4212-8212-121212121212',B='23232323-2323-4232-8232-232323232323',LEGACY='34343434-3434-4343-8343-343434343434';
const report={migration:names[0],production_writes:0,checks:[],failures:[],limitations:['Auth, permisos, alcance de sucursal y omnicanal_respuesta se simulan explícitamente; no valida MFA, sesiones reales ni red.','La factura se emite llamando al cuerpo real sobre un pedido marcado pagado en el fixture; no se simulan cobros de producción.']};
const ident=name=>{assert.match(name,/^[a-z][a-z0-9_]*$/);return '"'+name+'"';};
const type=c=>c.data_type==='USER-DEFINED'?ident(c.udt_name):c.data_type==='ARRAY'?ident(c.udt_name.slice(1))+'[]':c.data_type;

async function setup(){
 const {db,loaded}=await createFixture();
 try{
  for(const table of ['pedidos_ecommerce_detalle','perfiles'])await db.exec(`CREATE TABLE public.${ident(table)}(id uuid PRIMARY KEY DEFAULT gen_random_uuid());`);
  for(const c of source.columns){
   if(!['productos','unidades_medida','pedidos_ecommerce','pedidos_ecommerce_detalle','perfiles','existencias','reservas','movimientos','transferencias_omnicanal','notificaciones_omnicanal','ubicaciones','configuracion_ecommerce'].includes(c.table_name))continue;
   const exists=(await db.query('select 1 from information_schema.columns where table_schema=$1 and table_name=$2 and column_name=$3',['public',c.table_name,c.column_name])).rows.length;
   if(!exists)await db.exec(`ALTER TABLE public.${ident(c.table_name)} ADD COLUMN ${ident(c.column_name)} ${type(c)}${c.column_default?' DEFAULT '+c.column_default:''};`);
  }
  await db.exec(`CREATE SCHEMA auth; GRANT USAGE ON SCHEMA auth,erp_private TO authenticated,service_role;
  CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$SELECT nullif(coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb->>'sub','')::uuid$$;
  CREATE FUNCTION public.erp_sesion_autorizada() RETURNS boolean LANGUAGE sql STABLE AS $$SELECT coalesce((coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb->>'fixture_session')::boolean,false)$$;
  CREATE FUNCTION public.erp_usuario_activo() RETURNS boolean LANGUAGE sql STABLE AS $$SELECT public.erp_sesion_autorizada()$$;
  CREATE FUNCTION public.tiene_permiso(code text) RETURNS boolean LANGUAGE sql STABLE AS $$SELECT false$$;
  CREATE FUNCTION erp_private.tiene_acceso_ubicacion_historica(location uuid) RETURNS boolean LANGUAGE sql STABLE AS $$SELECT false$$;
  CREATE FUNCTION erp_private.require_staff(code text,location uuid) RETURNS void LANGUAGE plpgsql AS $$BEGIN RAISE EXCEPTION 'Fixture: no se admite personal'; END$$;
  CREATE FUNCTION erp_private.omnicanal_respuesta(order_id uuid) RETURNS jsonb LANGUAGE sql STABLE AS $$SELECT jsonb_build_object('id',id,'pedido_id',id,'numero',numero,'total',total,'direccion_envio',direccion_envio) FROM public.pedidos_ecommerce WHERE id=order_id$$;
  CREATE SEQUENCE public.pedidos_ecommerce_numero_seq;
  CREATE TABLE public.configuracion_erp(clave text PRIMARY KEY,valor jsonb);
  CREATE TABLE public.facturas_ecommerce(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),pedido_id uuid UNIQUE,ubicacion_id uuid,fecha_emision timestamptz,datos jsonb);
  ALTER TABLE public.pedidos_ecommerce_detalle ENABLE ROW LEVEL SECURITY;
  REVOKE ALL ON public.pedidos_ecommerce,public.pedidos_ecommerce_detalle,public.productos,public.unidades_medida FROM PUBLIC,anon,authenticated;`);
  const functions=[...source.functions].sort((a,b)=>((a.schema==='erp_private'?0:1)-(b.schema==='erp_private'?0:1))||(a.name==='crear_pedido_omnicanal'?1:0)-(b.name==='crear_pedido_omnicanal'?1:0));
  for(const fn of functions){
   assert.equal(createHash('md5').update(fn.definition).digest('hex'),fn.md5,fn.name+' bytes observados');
   await db.exec(fn.definition);
   const identity=fn.identity||fn.identity_args;
   if(identity!==undefined){await db.exec(`REVOKE ALL ON FUNCTION ${ident(fn.schema)}.${ident(fn.name)}(${identity}) FROM PUBLIC,anon,authenticated,service_role;`);for(const role of ['authenticated','service_role'])if(fn.acl?.includes(role+'=X/'))await db.exec(`GRANT EXECUTE ON FUNCTION ${ident(fn.schema)}.${ident(fn.name)}(${identity}) TO ${role};`);}
  }
  await db.query(`insert into public.perfiles(id,nombre,segundo_nombre,apellido,segundo_apellido,telefono,nombre_direccion,departamento,municipio,direccion_completa,referencia_direccion) values($1,'  Ana  ',' María ',' López ',' Pérez ',' 5555-1234 ','Casa','Guatemala','Mixco','Calle ficticia 1','Portón azul')`,[A]);
  await db.query('update public.productos set precio_base=10 where id=$1',[IDS.paper]);
  await db.query('update public.productos set precio_base=200 where id=$1',[IDS.tape]);
  await db.query("update public.unidades_medida set nombre=case when id=$1 then 'Unidad' else 'Metro' end",[IDS.unit]);
  await db.query('update public.producto_presentaciones set precio=case when id=$1 then 30 when id=$2 then 13 when id=$3 then 25 else 1 end',[IDS.pack500,IDS.pack100,IDS.pack6]);
  await db.query("insert into public.pedidos_ecommerce(id,numero,ubicacion_id,cliente_id,direccion_envio,metodo_entrega,total) values($1,'LEGADO-FICTICIO',$2,$3,'{\"nombre\":\"Casa antigua\",\"direccion_completa\":\"Dirección guardada\"}', 'DOMICILIO',9)",[LEGACY,IDS.destination,A]);
  await db.query('insert into public.pedidos_ecommerce_detalle(pedido_id,producto_id,cantidad,precio_unitario,total_linea) values($1,$2,1,9,9)',[LEGACY,IDS.paper]);
  return{db,loaded};
 }catch(error){await db.close();throw error;}
}

test('H08 snapshots de pedidos nuevos y vacíos históricos en PostgreSQL aislado',async t=>{
 const {db,loaded}=await setup();let key=0;
 const check=async(name,fn)=>t.test(name,async()=>{try{await fn();report.checks.push(name);}catch(error){report.failures.push({name,message:error.message,code:error.code});throw error;}});
 const claim=actor=>JSON.stringify({sub:actor,fixture_session:true});
 const checkout=async({items=[{producto_id:IDS.paper,cantidad:1}],mode='SUCURSAL',delivery='RETIRO_TIENDA',presentations=false,idempotency=null,actor=A}={})=>{
  const id=idempotency||'98989898-9898-4989-8989-'+String(++key).padStart(12,'0');
  await db.exec('BEGIN');
  try{await db.query("select set_config('request.jwt.claims',$1,true)",[claim(actor)]);await db.exec('SET LOCAL ROLE authenticated');
   const result=(await db.query(`select public.${presentations?'crear_pedido_checkout_presentaciones':'crear_pedido_checkout'}($1::jsonb,$2,$3::uuid,$4::varchar,'CONTRA_ENTREGA'::varchar,$5::uuid,30) result`,[JSON.stringify(items),mode,mode==='SUCURSAL'?null:IDS.destination,delivery,id])).rows[0].result;
   await db.exec('COMMIT');return{...result,idempotency:id};
  }catch(error){await db.exec('ROLLBACK');throw error;}
 };
 const details=async(order,actor=A,role='authenticated')=>{
  await db.exec('BEGIN READ ONLY');try{await db.query("select set_config('request.jwt.claims',$1,true)",[claim(actor)]);await db.exec('SET LOCAL ROLE '+role);return(await db.query('select public.erp_detalle_productos_pedido($1::uuid) result',[order])).rows[0].result;}finally{await db.exec('ROLLBACK');}
 };
 const stored=async order=>(await db.query('select to_jsonb(p) result from public.pedidos_ecommerce p where id=$1',[order])).rows[0].result;
 const snapshot=async()=>(await db.query(`select jsonb_build_object('orders',(select jsonb_agg(to_jsonb(x) order by id)from pedidos_ecommerce x),'lines',(select jsonb_agg(to_jsonb(x)order by id)from pedidos_ecommerce_detalle x),'stock',(select jsonb_agg(to_jsonb(x)order by id)from existencias x),'reservations',(select jsonb_agg(to_jsonb(x)order by id)from reservas x),'movements',(select jsonb_agg(to_jsonb(x)order by id)from movimientos x),'transfers',(select jsonb_agg(to_jsonb(x)order by id)from transferencias_omnicanal x),'invoices',(select jsonb_agg(to_jsonb(x)order by id)from facturas_ecommerce x)) result`)).rows[0].result;
 const rejects=async(fn,code)=>assert.rejects(fn,error=>{if(code)assert.equal(error.code,code);return true;});
 let base,pack,network;
 try{
  await check('carga cuerpos exactos observados y PostgreSQL real',async()=>{
   const version=(await db.query('select version() version')).rows[0].version;assert.match(version,/PostgreSQL/);assert.equal(loaded.length,6);report.runtime=version;
   for(const fn of source.functions){const rows=(await db.query('select md5(pg_get_functiondef(p.oid)) md5 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname=$1 and p.proname=$2 and pg_get_function_identity_arguments(p.oid)=$3',[fn.schema,fn.name,fn.identity??fn.identity_args])).rows;assert.equal(rows.length,1,fn.name);assert.equal(rows[0].md5,fn.md5,fn.name);}
  });
  await check('la migración no rellena pedidos ni líneas antiguos',async()=>{
   const before=await stored(LEGACY);await db.exec('BEGIN');try{await db.exec(migration);await db.exec('COMMIT');}catch(error){await db.exec('ROLLBACK');throw error;}
   assert.deepEqual(await stored(LEGACY),before);const row=(await db.query('select producto_snapshot,unidad_medida_snapshot from pedidos_ecommerce_detalle where pedido_id=$1',[LEGACY])).rows[0];assert.deepEqual(row,{producto_snapshot:null,unidad_medida_snapshot:null});
  });
  await check('consulta antigua devuelve referencia actual explícita y unidad no registrada',async()=>{
   const row=(await details(LEGACY))[0];assert.equal(row.identidad_origen,'REFERENCIA_ACTUAL');assert.equal(row.producto_snapshot,null);assert.equal(row.unidad_medida_snapshot,null);assert.equal(row.productos.nombre,'Papel ficticio');
  });
  await check('checkout SUCURSAL unidad guarda identidad comercial y contacto completo',async()=>{
   base=await checkout({items:[{producto_id:IDS.paper,cantidad:2}]});const order=await stored(base.id),line=(await details(base.id))[0];assert.equal(order.total,20);assert.equal(order.direccion_envio.destinatario,'Ana María López Pérez');assert.equal(order.direccion_envio.nombre_completo,order.direccion_envio.destinatario);assert.equal(order.direccion_envio.telefono,'5555-1234');assert.equal(order.direccion_envio.version_snapshot,1);assert.equal(order.direccion_envio.tipo,'RETIRO_TIENDA');assert.equal(line.producto_snapshot.nombre,'Papel ficticio');assert.equal(line.producto_snapshot.sku,'Papel ficticio');assert.equal(line.unidad_medida_snapshot.abreviatura,'u');assert.equal(line.identidad_origen,'SNAPSHOT');assert.equal(line.producto_snapshot.version,1);assert.ok(line.producto_snapshot.capturado_en);assert.equal(line.producto_snapshot.capturado_en,line.unidad_medida_snapshot.capturado_en);
  });
  await check('checkout SUCURSAL presentación conserva cantidad comercial y cantidad base',async()=>{
   pack=await checkout({presentations:true,items:[{producto_id:IDS.paper,presentacion_id:IDS.pack6,cantidad:1}]});const line=(await details(pack.id))[0];assert.equal(line.cantidad,6);assert.equal(line.cantidad_presentaciones,1);assert.equal(line.factor_presentacion,6);assert.equal(line.precio_presentacion,25);assert.equal(line.unidad_medida_snapshot.nombre,'Unidad');
  });
  await check('checkout OMNICANAL presentación reserva red y captura snapshot',async()=>{
   network=await checkout({presentations:true,mode:'OMNICANAL',items:[{producto_id:IDS.paper,presentacion_id:IDS.pack500,cantidad:1}]});const line=(await details(network.id))[0];assert.equal(line.cantidad,500);assert.equal(line.cantidad_presentaciones,1);assert.equal(line.identidad_origen,'SNAPSHOT');assert.ok((await db.query('select count(*)::int n from transferencias_omnicanal where pedido_id=$1',[network.id])).rows[0].n>0);
  });
  await check('checkout DOMICILIO conserva dirección/etiqueta y teléfono del mismo perfil',async()=>{
   const order=await checkout({items:[{producto_id:IDS.paper,cantidad:10}],mode:'OMNICANAL',delivery:'DOMICILIO'}),row=await stored(order.id);assert.equal(row.total,125);assert.equal(row.costo_envio,25);assert.equal(row.direccion_envio.nombre,'Casa');assert.equal(row.direccion_envio.direccion_completa,'Calle ficticia 1');assert.equal(row.direccion_envio.destinatario,'Ana María López Pérez');assert.equal(row.direccion_envio.telefono,'5555-1234');
  });
  await check('presentación DOMICILIO OMNICANAL conserva precio y regla de envío',async()=>{
   const order=await checkout({presentations:true,mode:'OMNICANAL',delivery:'DOMICILIO',items:[{producto_id:IDS.paper,presentacion_id:IDS.pack6,cantidad:4}]}),row=await stored(order.id);assert.equal(row.total,125);assert.equal(row.direccion_envio.destinatario,'Ana María López Pérez');assert.equal((await details(order.id))[0].cantidad,24);
  });
  await check('venta fraccionaria preserva unidad Metro y precisión original',async()=>{
   const order=await checkout({items:[{producto_id:IDS.tape,cantidad:0.5}],delivery:'DOMICILIO'}),line=(await details(order.id))[0];assert.equal(line.cantidad,0.5);assert.equal(line.unidad_medida_snapshot.nombre,'Metro');assert.equal(line.unidad_medida_snapshot.abreviatura,'m');assert.equal(line.unidad_medida_snapshot.decimales_permitidos,2);assert.equal(line.unidad_medida_snapshot.venta_fraccionada,true);
  });
  await check('nombres opcionales y teléfono ausente permanecen honestos',async()=>{
   await db.query("update perfiles set segundo_nombre=null,segundo_apellido='',telefono='  ' where id=$1",[A]);const order=await checkout({mode:'OMNICANAL'}),row=await stored(order.id);assert.equal(row.direccion_envio.destinatario,'Ana López');assert.equal(row.direccion_envio.telefono,null);await db.query("update perfiles set segundo_nombre=' María ',segundo_apellido=' Pérez ',telefono=' 5555-1234 ' where id=$1",[A]);
  });
  await check('nombre vacío no se inventa como etiqueta de dirección ni usuario',async()=>{
   await db.query("update perfiles set nombre=' ',segundo_nombre=null,apellido=null,segundo_apellido=null where id=$1",[A]);const order=await checkout({mode:'OMNICANAL'}),row=await stored(order.id);assert.equal(row.direccion_envio.destinatario,null);assert.equal(row.direccion_envio.nombre_completo,null);await db.query("update perfiles set nombre=' Ana ',segundo_nombre=' María ',apellido=' López ',segundo_apellido=' Pérez ' where id=$1",[A]);
  });
  await check('cambios posteriores de producto/unidad/perfil no cambian pedido ni snapshots',async()=>{
   const beforeOrder=await stored(base.id),beforeLines=await details(base.id);await db.query("update productos set nombre='Nombre posterior',sku='SKU-NUEVO',precio_base=999 where id=$1",[IDS.paper]);await db.query("update unidades_medida set nombre='Caja posterior',abreviatura='caja',decimales_permitidos=3 where id=$1",[IDS.unit]);await db.query("update perfiles set nombre='Otra persona',telefono='9999',direccion_completa='Otra dirección' where id=$1",[A]);assert.deepEqual(await stored(base.id),beforeOrder);assert.deepEqual(await details(base.id),beforeLines);
  });
  await check('replay de checkout unidad no recaptura contacto ni reserva inventario otra vez',async()=>{
   const before=await snapshot();const replay=await checkout({items:[{producto_id:IDS.paper,cantidad:2}],idempotency:base.idempotency});assert.equal(replay.id,base.id);assert.equal(replay.total,20);assert.deepEqual(await snapshot(),before);
  });
  await check('replay de paquete retirado mantiene snapshots y cantidad persistida',async()=>{
   await db.query('update producto_presentaciones set activo=false,cantidad_base=7,precio=999 where id=$1',[IDS.pack6]);const before=await snapshot(),replay=await checkout({presentations:true,items:[{producto_id:IDS.paper,presentacion_id:IDS.pack6,cantidad:1}],idempotency:pack.idempotency});assert.equal(replay.id,pack.id);assert.deepEqual(await snapshot(),before);assert.equal((await details(pack.id))[0].factor_presentacion,6);
  });
  await check('legado no reconstruye su unidad ni convierte referencia actual en snapshot',async()=>{
   const row=(await details(LEGACY))[0];assert.equal(row.productos.nombre,'Nombre posterior');assert.equal(row.identidad_origen,'REFERENCIA_ACTUAL');assert.equal(row.producto_snapshot,null);assert.equal(row.unidad_medida_snapshot,null);const order=await stored(LEGACY);assert.equal(order.direccion_envio.destinatario,undefined);assert.equal(order.direccion_envio.telefono,undefined);
  });
  await check('insertar un snapshot falsificado no reemplaza la captura del servidor',async()=>{
   const row=(await db.query("insert into pedidos_ecommerce_detalle(pedido_id,producto_id,cantidad,precio_unitario,total_linea,producto_snapshot,unidad_medida_snapshot) values($1,$2,1,1,1,'{\"nombre\":\"Falso\"}','{\"abreviatura\":\"falsa\"}') returning producto_snapshot,unidad_medida_snapshot",[base.id,IDS.paper])).rows[0];assert.equal(row.producto_snapshot.nombre,'Nombre posterior');assert.equal(row.unidad_medida_snapshot.abreviatura,'caja');
  });
  for(const [name,sql]of[['producto_snapshot',"producto_snapshot='{}'::jsonb"],['unidad_medida_snapshot',"unidad_medida_snapshot='{}'::jsonb"],['producto_id',`producto_id='${IDS.tape}'::uuid`]])await check('rechaza modificar '+name+' de una línea ya registrada',async()=>rejects(()=>db.query(`update pedidos_ecommerce_detalle set ${sql} where pedido_id=$1`,[pack.id]),'22023'));
  await check('un UPDATE corriente no rellena snapshots nulos antiguos',async()=>{await db.query('update pedidos_ecommerce_detalle set precio_unitario=precio_unitario where pedido_id=$1',[LEGACY]);const row=(await details(LEGACY))[0];assert.equal(row.producto_snapshot,null);assert.equal(row.unidad_medida_snapshot,null);});
  await check('no permite rellenar un snapshot antiguo con datos actuales',async()=>rejects(()=>db.query("update pedidos_ecommerce_detalle set producto_snapshot='{}' where pedido_id=$1",[LEGACY]),'22023'));
  await check('otro dueño y anon no pueden leer el detalle con snapshots',async()=>{await rejects(()=>details(base.id,B),'42501');await rejects(()=>details(base.id,A,'anon'),'42501');});
  await check('el helper trigger no expone EXECUTE al frontend ni PUBLIC',async()=>{const row=(await db.query("select has_function_privilege('anon','erp_private.capturar_identidad_pedido()','EXECUTE') anon,has_function_privilege('authenticated','erp_private.capturar_identidad_pedido()','EXECUTE') authenticated,has_function_privilege('service_role','erp_private.capturar_identidad_pedido()','EXECUTE') service")).rows[0];assert.deepEqual(row,{anon:false,authenticated:false,service:false});});
  await check('lecturas READ ONLY de snapshot no cambian stock/reservas/líneas',async()=>{const before=await snapshot();await details(base.id);await details(pack.id);await details(LEGACY);assert.deepEqual(await snapshot(),before);});
  await check('stock insuficiente revierte pedido, líneas, reservas y movimientos',async()=>{const before=await snapshot();await rejects(()=>checkout({mode:'OMNICANAL',items:[{producto_id:IDS.tape,cantidad:99}]}));assert.deepEqual(await snapshot(),before);});
  await check('comprobante emitido después conserva snapshots del pedido y contacto original',async()=>{
   await db.query("update pedidos_ecommerce set estado='PAGADO',estado_pago='PAGADO',fecha_pago=now() where id=$1",[pack.id]);const invoice=(await db.query('select erp_private.emitir_comprobante_cobrado($1::uuid) id',[pack.id])).rows[0].id;const data=(await db.query('select datos from facturas_ecommerce where id=$1',[invoice])).rows[0].datos;assert.equal(data.lineas[0].nombre,'Papel ficticio');assert.equal(data.lineas[0].unidad_medida_snapshot.nombre,'Unidad');assert.equal(data.lineas[0].medida,'u');assert.equal(data.lineas[0].identidad_origen,'SNAPSHOT');assert.equal(data.pedido.direccion_envio.destinatario,'Ana María López Pérez');assert.equal(data.pedido.direccion_envio.telefono,'5555-1234');
   const before=await snapshot();const replay=(await db.query('select erp_private.emitir_comprobante_cobrado($1::uuid) id',[pack.id])).rows[0].id;assert.equal(replay,invoice);assert.deepEqual(await snapshot(),before);
  });
  await check('comprobante nuevo de pedido antiguo mantiene faltantes explícitos',async()=>{
   await db.query("update pedidos_ecommerce set estado='PAGADO',estado_pago='PAGADO',fecha_pago=now() where id=$1",[LEGACY]);const invoice=(await db.query('select erp_private.emitir_comprobante_cobrado($1::uuid) id',[LEGACY])).rows[0].id;const data=(await db.query('select datos from facturas_ecommerce where id=$1',[invoice])).rows[0].datos;assert.equal(data.lineas[0].unidad_medida_snapshot,null);assert.equal(data.lineas[0].medida,null);assert.equal(data.lineas[0].identidad_origen,'REFERENCIA_ACTUAL');assert.equal(data.pedido.direccion_envio.telefono,undefined);
  });
  await check('reaplicar la migración ya instalada se rechaza antes de mutar',async()=>{const before=await snapshot();await db.exec('BEGIN');try{await rejects(()=>db.exec(migration));}finally{await db.exec('ROLLBACK');}assert.deepEqual(await snapshot(),before);});
  report.function_fingerprints=(await db.query(`select n.nspname schema,p.proname name,pg_get_function_identity_arguments(p.oid) identity,md5(pg_get_functiondef(p.oid)) md5,p.prosecdef security_definer,p.provolatile volatility,p.proconfig settings,p.proacl::text acl
   from pg_proc p join pg_namespace n on n.oid=p.pronamespace
   where (n.nspname='erp_private' and p.proname in('crear_pedido_checkout','crear_pedido_checkout_presentaciones','emitir_comprobante_cobrado','capturar_identidad_pedido'))
    or (n.nspname='public' and p.proname='erp_detalle_productos_pedido') order by n.nspname,p.proname`)).rows;
  assert.equal(report.function_fingerprints.length,5,'Paridad local requiere cinco funciones H08 compiladas');
  report.snapshot_columns=(await db.query("select column_name,data_type,is_nullable,column_default from information_schema.columns where table_schema='public' and table_name='pedidos_ecommerce_detalle' and column_name in('producto_snapshot','unidad_medida_snapshot') order by column_name")).rows;
  report.snapshot_trigger=(await db.query("select pg_get_triggerdef(oid) definition,tgenabled enabled from pg_trigger where tgrelid='public.pedidos_ecommerce_detalle'::regclass and tgname='h08_snapshot_identidad_pedido'")).rows;
  report.passed=report.checks.length;report.status=report.failures.length?'failed':'passed';if(process.env.H08_SQL_REPORT)await writeFile(process.env.H08_SQL_REPORT,JSON.stringify(report,null,2));
 }finally{await db.close();}
});
