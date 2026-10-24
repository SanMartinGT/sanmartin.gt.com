import assert from 'node:assert/strict';
import test from 'node:test';
import {readFile} from 'node:fs/promises';
import {createFixture,readOnly,migrationPath,businessSnapshot,IDS} from './fixtures-disponibilidad.mjs';

// PostgreSQL WASM real, con funciones vivas copiadas y datos totalmente ficticios.
// Cada preflight se ejecuta como anon/authenticated en BEGIN READ ONLY y se revierte.
const line=(producto_id=IDS.paper,cantidad=1,presentacion_id=null)=>({producto_id,cantidad,...(presentacion_id?{presentacion_id}:{})});
const contextSql='select public.validar_disponibilidad_presentaciones_contextual($1::jsonb,$2,$3::uuid) as result';
const legacySql='select public.validar_disponibilidad_presentaciones($1::jsonb) as result';
test('aceptación del contrato H05 en PostgreSQL aislado',async t=>{
 const migration=await migrationPath(),fixture=await createFixture({migrationFile:migration});
 const {db}=fixture;
 const call=async(items,modo='OMNICANAL',destino=IDS.destination,role='anon')=>(await readOnly(db,role,contextSql,[JSON.stringify(items),modo,destino])).rows[0].result;
 const result=async(...args)=>{const rows=await call(...args);assert.equal(rows.length,1);return rows[0]};
 const rejects=async(fn,code='22023')=>assert.rejects(fn,error=>{assert.equal(error.code,code);return true});
 async function changed(sql,parameters,restore,restoreParameters,fn){
  await db.query(sql,parameters);try{return await fn()}finally{await db.query(restore,restoreParameters)}
 }
 try{
  const before=await businessSnapshot(db);
  await t.test('el runtime ejecuta PostgreSQL y PL/pgSQL reales',async()=>{
   const {rows}=await db.query('select version() as version');assert.match(rows[0].version,/PostgreSQL/);assert.match(rows[0].version,/PGlite/);
   assert.equal(fixture.loaded.length,6);
  });
  await t.test('SUCURSAL resuelve null a la asignada y no toma stock externo',async()=>{
   const row=await result([line(IDS.paper,30)],'SUCURSAL',null);
   assert.equal(row.estado,'AGOTADO');assert.equal(row.ubicacion_destino_id,IDS.destination);assert.equal(row.modo_inventario,'SUCURSAL');assert.equal(row.requiere_traslado,false);
  });
  await t.test('la sucursal asignada explícita es compatible con SUCURSAL',async()=>assert.equal((await result([line(IDS.paper,20)],'SUCURSAL',IDS.destination)).estado,'DISPONIBLE'));
  await t.test('SUCURSAL rechaza elegir otra sucursal',async()=>rejects(()=>call([line()],'SUCURSAL',IDS.source)));
  await t.test('OMNICANAL acepta un paquete de500 aun con límite comercial100',async()=>{
   const row=await result([line(IDS.paper,1,IDS.pack500)]);assert.equal(row.estado,'DISPONIBLE');assert.equal(row.requiere_traslado,true);
  });
  await t.test('el mismo paquete500 no cabe en la sucursal asignada',async()=>assert.equal((await result([line(IDS.paper,1,IDS.pack500)],'SUCURSAL',null)).estado,'AGOTADO'));
  await t.test('suma unidades y distintas presentaciones en demanda base única',async()=>{
   const rows=await call([line(IDS.paper,100),line(IDS.paper,2,IDS.pack500)]);assert.equal(rows.length,1);assert.equal(rows[0].estado,'DISPONIBLE');
  });
  await t.test('agota la red al sumar1121 aunque cada línea por separado quepa',async()=>{
   const rows=await call([line(IDS.paper,3),line(IDS.paper,2,IDS.pack500),line(IDS.paper,1,IDS.pack100),line(IDS.paper,3,IDS.pack6)]);assert.equal(rows.length,1);assert.equal(rows[0].estado,'AGOTADO');
  });
  await t.test('excluye fuentes inactivas o sin transferencia pero incluye bodega transferible',async()=>{
   // Red elegible=20+1000+100=1120; dos fuentes de9000 no habilitadas no cuentan.
   const exact=await result([line(IDS.paper,100),line(IDS.paper,2,IDS.pack500),line(IDS.paper,3,IDS.pack6),line(IDS.paper,4,IDS.badHalf)]);assert.equal(exact.estado,'DISPONIBLE');
   const excess=await result([line(IDS.paper,100),line(IDS.paper,2,IDS.pack500),line(IDS.paper,3,IDS.pack6),line(IDS.paper,6,IDS.badHalf)]);assert.equal(excess.estado,'AGOTADO');
  });
  await t.test('un destino sin recepción/transferencia no toma red externa',async()=>{
   assert.equal((await result([line(IDS.paper,11)],'OMNICANAL',IDS.localOnly)).estado,'AGOTADO');
   const row=await result([line(IDS.paper,10)],'OMNICANAL',IDS.localOnly);assert.equal(row.estado,'DISPONIBLE');assert.equal(row.requiere_traslado,false);
  });
  await t.test('el traslado depende del stock local del destino exacto',async()=>{
   const row=await result([line(IDS.paper,1,IDS.pack500)],'OMNICANAL',IDS.source);assert.equal(row.estado,'DISPONIBLE');assert.equal(row.requiere_traslado,false);
  });
  await t.test('ignora factores y precios falsos enviados por el navegador',async()=>{
   const row=await result([{...line(IDS.paper,1,IDS.pack500),factor_presentacion:1,cantidad_base:1,precio:0,verificado:true}],'SUCURSAL',null);assert.equal(row.estado,'AGOTADO');
  });
  await t.test('valida precisión de la cantidad base de cada paquete',async()=>{
   assert.equal((await result([line(IDS.paper,1,IDS.badHalf)])).estado,'NO_DISPONIBLE');
   assert.equal((await result([line(IDS.tape,1,IDS.badPrecision)])).estado,'NO_DISPONIBLE');
  });
  await t.test('un factor fraccionario puede ser válido cuando su cantidad base es entera',async()=>assert.equal((await result([line(IDS.paper,2,IDS.badHalf)])).estado,'DISPONIBLE'));
  await t.test('admite fracciones y paquetes compatibles con unidad de dos decimales',async()=>{
   const row=await result([line(IDS.tape,0.5),line(IDS.tape,2,IDS.quarter)]);assert.equal(row.estado,'DISPONIBLE');assert.equal(row.requiere_traslado,true);
  });
  await t.test('una línea inválida impide DISPONIBLE para todo el mismo producto',async()=>{
   const rows=await call([line(IDS.paper,1),line(IDS.paper,1,IDS.badHalf)]);assert.equal(rows.length,1);assert.equal(rows[0].estado,'NO_DISPONIBLE');
  });
  await t.test('la cantidad comercial acumulada por producto/presentación respeta máximo100',async()=>{
   const row=await result([line(IDS.paper,60,IDS.pack6),line(IDS.paper,60,IDS.pack6)]);assert.equal(row.estado,'NO_DISPONIBLE');
  });
  await t.test('no filtra nombres ni detalles de productos no publicados o inexistentes',async()=>{
   const rows=await call([line(IDS.hidden),line('12345678-1234-4234-8234-123456789abc')]);
   assert.equal(rows.length,2);assert.ok(rows.every(row=>row.estado==='NO_DISPONIBLE'));assert.ok(!JSON.stringify(rows).includes('Producto privado ficticio'));
  });
  await t.test('una presentación de otro producto no se resuelve como propia',async()=>assert.equal((await result([line(IDS.tape,1,IDS.pack500)])).estado,'NO_DISPONIBLE'));
  await t.test('una presentación retirada bloquea su producto',async()=>changed('update producto_presentaciones set activo=false where id=$1',[IDS.pack6],'update producto_presentaciones set activo=true where id=$1',[IDS.pack6],async()=>assert.equal((await result([line(IDS.paper,1,IDS.pack6)])).estado,'NO_DISPONIBLE')));
  await t.test('una unidad inactiva bloquea el producto aunque haya existencias',async()=>changed('update unidades_medida set activo=false where id=$1',[IDS.unit],'update unidades_medida set activo=true where id=$1',[IDS.unit],async()=>assert.equal((await result([line(IDS.paper)])).estado,'NO_DISPONIBLE')));
  await t.test('un precio inválido tampoco obtiene disponibilidad positiva',async()=>changed('update producto_presentaciones set precio=-1 where id=$1',[IDS.pack6],'update producto_presentaciones set precio=1 where id=$1',[IDS.pack6],async()=>assert.equal((await result([line(IDS.paper,1,IDS.pack6)])).estado,'NO_DISPONIBLE')));
  await t.test('un modo desconocido, nulo o destino omnicanal ausente se rechaza',async()=>{
   await rejects(()=>call([line()],'OTRO'));await rejects(()=>call([line()],null));await rejects(()=>call([line()],'OMNICANAL',null));
  });
  await t.test('destinos inactivos, inexistentes o que no venden quedan fuera',async()=>{
   for(const id of [IDS.inactive,IDS.warehouse,'12345678-1234-4234-8234-123456789abc'])await rejects(()=>call([line()],'OMNICANAL',id));
  });
  await t.test('la configuración de sucursal ausente o inactiva no produce un positivo',async()=>{
   await changed('update configuracion_ecommerce set ubicacion_ecommerce_id=null',[],'update configuracion_ecommerce set ubicacion_ecommerce_id=$1',[IDS.destination],async()=>rejects(()=>call([line()],'SUCURSAL',null)));
   await changed('update ubicaciones set activo=false where id=$1',[IDS.destination],'update ubicaciones set activo=true where id=$1',[IDS.destination],async()=>rejects(()=>call([line()],'SUCURSAL',null)));
  });
  await t.test('formatos inválidos, cantidades no numéricas y demasiadas líneas se rechazan',async()=>{
   for(const payload of [null,{},[],[line(IDS.paper,'1')],[line(IDS.paper,0)],[line(IDS.paper,-1)],[line(IDS.paper,0.0001)],Array.from({length:101},()=>line())])await rejects(()=>call(payload));
   await rejects(()=>call([line('no-uuid')]),'22P02');
  });
  await t.test('no consolida fracciones ilegales de unidad o paquete para hacerlas válidas',async()=>{
   await rejects(()=>call([line(IDS.paper,0.5),line(IDS.paper,0.5)]));
   await rejects(()=>call([line(IDS.paper,0.5,IDS.pack6),line(IDS.paper,0.5,IDS.pack6)]));
  });
  await t.test('anon y authenticated ven la misma proyección pública mínima',async()=>{
   const anon=await call([line(IDS.paper,1,IDS.pack500)]),authenticated=await call([line(IDS.paper,1,IDS.pack500)],'OMNICANAL',IDS.destination,'authenticated');assert.deepEqual(anon,authenticated);
   assert.deepEqual(Object.keys(anon[0]).sort(),['estado','mensaje','producto_id','modo_inventario','requiere_traslado','ubicacion_destino_id'].sort());
  });
  await t.test('la RPC antigua mantiene solo sus tres campos y consulta el mismo núcleo',async()=>{
   const items=[line(IDS.paper,1,IDS.pack6)],rows=(await readOnly(db,'anon',legacySql,[JSON.stringify(items)])).rows[0].result,contextual=await call(items,'SUCURSAL',null);
   assert.deepEqual(rows,contextual.map(({producto_id,estado,mensaje})=>({producto_id,estado,mensaje})));
  });
  await t.test('las tablas internas siguen sin permisos directos para anon',async()=>{
   await rejects(()=>readOnly(db,'anon','select * from public.existencias'),'42501');await rejects(()=>readOnly(db,'anon','select * from public.configuracion_ecommerce'),'42501');
  });
  await t.test('el resolvedor de consulta privado no es ejecutable por compradores',async()=>rejects(()=>readOnly(db,'anon',"select erp_private.resolver_linea_presentacion_consulta($1::uuid,null,1,'ECOMMERCE')",[IDS.paper]),'42501'));
  await t.test('PUBLIC y un rol ajeno no obtienen ejecución de la nueva RPC',async()=>{
   const {rows}=await db.query("select exists(select 1 from aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) acl where acl.grantee=0 and acl.privilege_type='EXECUTE') as public_execute from pg_proc p where p.oid='public.validar_disponibilidad_presentaciones_contextual(jsonb,text,uuid)'::regprocedure");assert.equal(rows[0].public_execute,false);
   await rejects(()=>call([line()],'OMNICANAL',IDS.destination,'unrelated'),'42501');
  });
  await t.test('los objetos nuevos son STABLE y fijan search_path vacío',async()=>{
   const {rows}=await db.query("select n.nspname,p.proname,p.provolatile,p.prosecdef,p.proconfig from pg_proc p join pg_namespace n on n.oid=p.pronamespace where (n.nspname='public' and p.proname in('validar_disponibilidad_presentaciones','validar_disponibilidad_presentaciones_contextual')) or (n.nspname='erp_private' and p.proname in('resolver_linea_presentacion_consulta','validar_disponibilidad_presentaciones_contextual'))");assert.equal(rows.length,4);assert.ok(rows.every(row=>row.provolatile==='s'&&row.proconfig.includes('search_path=""')));
   assert.ok(rows.filter(row=>row.nspname==='public').every(row=>row.prosecdef===false));
  });
  await t.test('la consulta READ ONLY no adquiere bloqueos de escritura sobre inventario',async()=>{
   await db.exec('BEGIN READ ONLY; SET LOCAL ROLE anon;');
   try{
    await db.query(contextSql,[JSON.stringify([line(IDS.paper,1,IDS.pack500)]),'OMNICANAL',IDS.destination]);
    const {rows}=await db.query("select mode from pg_locks l join pg_class c on c.oid=l.relation join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and mode in('RowShareLock','RowExclusiveLock','ShareRowExclusiveLock','ExclusiveLock','AccessExclusiveLock')");assert.deepEqual(rows,[]);
   }finally{await db.exec('ROLLBACK;')}
  });
  await t.test('el motor de reserva original se conserva y solo difiere por sus bloqueos',async()=>{
   const args=[IDS.paper,IDS.pack500,1,'ECOMMERCE'];
   const original=(await db.query('select erp_private.resolver_linea_presentacion($1,$2,$3,$4) as resolved',args)).rows[0].resolved;
   const consulta=(await db.query('select erp_private.resolver_linea_presentacion_consulta($1,$2,$3,$4) as resolved',args)).rows[0].resolved;assert.deepEqual(consulta,original);
  });
  await t.test('la resolución de consulta coincide con la original en unidades, paquetes y rechazos',async()=>{
   const cases=[[IDS.paper,null,1],[IDS.paper,IDS.pack500,1],[IDS.paper,IDS.badHalf,1],[IDS.paper,IDS.badHalf,2],
    [IDS.tape,null,0.5],[IDS.tape,null,0.005],[IDS.tape,IDS.quarter,3],[IDS.tape,IDS.badPrecision,1],
    [IDS.tape,IDS.pack500,1],[IDS.hidden,null,1],[IDS.paper,IDS.pack6,0.5],[IDS.paper,null,100000000000]];
   for(const args of cases){
    const resolve=async name=>{try{return{value:(await db.query(`select erp_private.${name}($1,$2,$3,'ECOMMERCE') as value`,args)).rows[0].value}}catch(error){return{code:error.code}}};
    assert.deepEqual(await resolve('resolver_linea_presentacion_consulta'),await resolve('resolver_linea_presentacion'),JSON.stringify(args));
   }
  });
  await t.test('guardas de migración rechazan una reaplicación sin reconciliar catálogo',async()=>{
   const sql=await readFile(migration,'utf8');await assert.rejects(()=>db.exec(sql),error=>{assert.equal(error.code,'P0001');assert.match(error.message,/H05:/);return true});
  });
  await t.test('todas las consultas dejan stock, reservas, pedidos y traslados intactos',async()=>assert.deepEqual(await businessSnapshot(db),before));
 }finally{await db.close()}
});
