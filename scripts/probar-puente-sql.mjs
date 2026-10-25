import assert from 'node:assert/strict';
import test from 'node:test';
import {readFile,readdir,writeFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';

// PostgreSQL/PLpgSQL real, datos y transporte exclusivamente ficticios.
// PGlite no incluye pg_net/Vault: sus catálogos de extensión y vistas/funciones
// se simulan expresamente. El stub net.http_post sólo escribe una cola local
// transaccional. No prueba transporte HTTP ni despacho después de COMMIT reales.
const directory=new URL('../supabase/migrations/',import.meta.url);
const names=(await readdir(directory)).filter(name=>/^\d{14}_conectar_puente_catalogo\.sql$/.test(name));
assert.equal(names.length,1,'Debe existir un único delta H09');
const migration=await readFile(new URL(names[0],directory),'utf8');
const tables=['productos','producto_imagenes','ofertas_producto','categorias','marcas','existencias','configuracion_ecommerce','producto_presentaciones','unidades_medida'];
const secret='H09-FIXTURE-SECRET-NOT-A-REAL-CREDENTIAL-123456';
const endpoint='https://beasfybalepkdlomzazf.supabase.co/functions/v1/catalogo-actualizado';
const schema=`
CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
CREATE SCHEMA erp_private; CREATE SCHEMA vault; CREATE SCHEMA net;
REVOKE ALL ON SCHEMA erp_private,vault,net FROM PUBLIC,anon,authenticated;
GRANT USAGE ON SCHEMA public,erp_private TO anon,authenticated,service_role;
-- Sólo este fixture altera pg_extension para simular metadatos instalados.
INSERT INTO pg_catalog.pg_extension(oid,extname,extowner,extnamespace,extrelocatable,extversion)
 SELECT 900001,'pg_net',(SELECT oid FROM pg_roles WHERE rolname=current_user),(SELECT oid FROM pg_namespace WHERE nspname='net'),false,'0.20.4';
INSERT INTO pg_catalog.pg_extension(oid,extname,extowner,extnamespace,extrelocatable,extversion)
 SELECT 900002,'supabase_vault',(SELECT oid FROM pg_roles WHERE rolname=current_user),(SELECT oid FROM pg_namespace WHERE nspname='vault'),false,'0.3.1';
CREATE TABLE vault.secrets(id bigint GENERATED ALWAYS AS IDENTITY,name text,value text);
CREATE VIEW vault.decrypted_secrets AS SELECT id,name,value AS decrypted_secret FROM vault.secrets;
CREATE TABLE net.http_request_queue(id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,url text,body jsonb,params jsonb,headers jsonb,timeout_milliseconds integer);
-- pg_net de Supabase concede estos permisos de plataforma a PUBLIC. El control
-- de schemas expuestos por Data API se acepta aparte mediante HTTP real.
GRANT USAGE ON SCHEMA net TO PUBLIC,anon,authenticated;
GRANT ALL ON net.http_request_queue TO PUBLIC;
CREATE FUNCTION net.http_post(url text,body jsonb,params jsonb,headers jsonb,timeout_milliseconds integer) RETURNS bigint LANGUAGE plpgsql AS $$
DECLARE request_id bigint;
BEGIN
 IF current_setting('fixture.net_fail',true)='on' THEN RAISE EXCEPTION 'Fallo ficticio del transporte'; END IF;
 INSERT INTO net.http_request_queue(url,body,params,headers,timeout_milliseconds) VALUES(url,body,params,headers,timeout_milliseconds) RETURNING id INTO request_id;
 RETURN request_id;
END $$;
CREATE TABLE public.fixture_audit(event text);
CREATE FUNCTION public.fixture_existing_trigger() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$BEGIN INSERT INTO public.fixture_audit VALUES(TG_OP); RETURN NULL; END$$;
`;
const report={migration:names[0],production_writes:0,network_requests:0,checks:[],limitations:['Vault/pg_net metadata and transport are explicit local stubs; not a production extension/network test.','Rollback verifies the simulated transactional queue only; real pg_net after-COMMIT delivery requires live acceptance.','Data API exposed schemas cannot be proven in this SQL fixture; fresh external HTTP406/PGRST106 probes for net/vault are required before applying.','pg_net queue headers remain readable by trusted SQL LOGIN roles under Supabase platform grants.'],failures:[]};

test('H09: delta del puente de catálogo en PostgreSQL aislado',async t=>{
 const db=new PGlite();
 const check=async(name,fn)=>{await t.test(name,async()=>{try{await fn();report.checks.push(name);}catch(error){report.failures.push(name);throw error;}});};
 const row=(id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')=>({id,nombre:'Nombre privado ficticio',costo:123.45,proveedor_id:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',stock_fisico:987,correo:'privado@example.test'});
 const insert=async(table,id=table==='configuracion_ecommerce'?true:undefined)=>{const r=row(id);await db.query(`INSERT INTO public.${table}(id,nombre,costo,proveedor_id,stock_fisico,correo) VALUES($1,$2,$3,$4,$5,$6)`,Object.values(r));return r;};
 const install=()=>db.exec(migration);
 const trial=async(prepare,expected=/H09:/)=>{
  await db.exec('BEGIN');
  try{await prepare();await assert.rejects(install,expected);}finally{await db.exec('ROLLBACK');}
  assert.equal((await db.query("select to_regprocedure('erp_private.notificar_catalogo_webhook()')::text as helper")).rows[0].helper,null);
 };
 const latest=async()=> (await db.query('SELECT * FROM net.http_request_queue ORDER BY id DESC LIMIT 1')).rows[0];
 const queueCount=async()=>Number((await db.query('SELECT count(*) n FROM net.http_request_queue')).rows[0].n);
 try{
  await db.exec(schema);
  for(const table of tables)await db.exec(`CREATE TABLE public.${table}(id ${table==='configuracion_ecommerce'?'boolean':'uuid'} PRIMARY KEY,nombre text,costo numeric,proveedor_id uuid,stock_fisico numeric,correo text);`);
  await db.exec('CREATE TRIGGER fixture_audit_productos AFTER INSERT OR UPDATE OR DELETE ON public.productos FOR EACH ROW EXECUTE FUNCTION public.fixture_existing_trigger();');
  const originalTrigger=(await db.query("SELECT pg_get_triggerdef(oid) definition FROM pg_trigger WHERE tgname='fixture_audit_productos'")).rows[0].definition;
  await check('sin secreto Vault el delta rechaza la activación sin crear helper',async()=>trial(async()=>{}));
  await db.query('INSERT INTO vault.secrets(name,value) VALUES($1,$2)',['catalogo_webhook_secret',secret]);
  await check('secreto duplicado se rechaza sin activar parcialmente',async()=>trial(()=>db.query('INSERT INTO vault.secrets(name,value) VALUES($1,$2)',['catalogo_webhook_secret',secret])));
  await check('secreto corto se rechaza sin imprimir su valor',async()=>trial(()=>db.query('UPDATE vault.secrets SET value=$1',['corto'])));
  await check('secreto con espacios se rechaza',async()=>trial(()=>db.query('UPDATE vault.secrets SET value=$1',[secret+' '])));
  await check('CREATE para cliente en esquema privado se rechaza',async()=>trial(()=>db.exec('GRANT CREATE ON SCHEMA erp_private TO anon')));
  await check('LOGIN en anon se rechaza antes de activar',async()=>trial(()=>db.exec('ALTER ROLE anon LOGIN'),/H09: un rol de cliente/));
  await check('LOGIN en authenticated se rechaza antes de activar',async()=>trial(()=>db.exec('ALTER ROLE authenticated LOGIN'),/H09: un rol de cliente/));
  await check('BYPASSRLS en anon se rechaza antes de activar',async()=>trial(()=>db.exec('ALTER ROLE anon BYPASSRLS'),/H09: un rol de cliente/));
  await check('BYPASSRLS en authenticated se rechaza antes de activar',async()=>trial(()=>db.exec('ALTER ROLE authenticated BYPASSRLS'),/H09: un rol de cliente/));
  await check('lectura del secreto descifrado por un cliente se rechaza',async()=>trial(()=>db.exec('GRANT SELECT(decrypted_secret) ON vault.decrypted_secrets TO anon')));
  await check('tipo del ID distinto del baseline se rechaza',async()=>trial(()=>db.exec('ALTER TABLE public.productos ALTER COLUMN id TYPE text USING id::text')));
  await check('extensión distinta del baseline se rechaza',async()=>trial(()=>db.exec("UPDATE pg_extension SET extversion='0.0' WHERE extname='pg_net'")));
  await check('un webhook previo se rechaza para no duplicar disparadores',async()=>trial(()=>db.exec('CREATE TRIGGER catalogo_webhook_notificar AFTER INSERT ON public.productos FOR EACH ROW EXECUTE FUNCTION public.fixture_existing_trigger();')));
  await db.exec('BEGIN');await install();await db.exec('COMMIT');
  await check('grants de pg_net a PUBLIC se conservan sin afirmar exposición de la Data API',async()=>{
   const {rows}=await db.query("SELECT has_schema_privilege('anon','net','USAGE') net_usage,has_column_privilege('anon','net.http_request_queue','headers','SELECT') queue_headers,(SELECT rolcanlogin FROM pg_roles WHERE rolname='anon') can_login,has_column_privilege('anon','vault.decrypted_secrets','decrypted_secret','SELECT') vault_secret");
   assert.deepEqual(rows[0],{net_usage:true,queue_headers:true,can_login:false,vault_secret:false});
  });
  await check('instala nueve AFTER ROW con cero argumentos conservando otros triggers',async()=>{
   const rows=(await db.query("SELECT tgname,tgtype,tgenabled,tgnargs,octet_length(tgargs) bytes FROM pg_trigger WHERE tgfoid='erp_private.notificar_catalogo_webhook()'::regprocedure")).rows;
   assert.equal(rows.length,9);assert.ok(rows.every(r=>r.tgname==='catalogo_webhook_notificar'&&r.tgtype===29&&r.tgenabled==='O'&&r.tgnargs===0&&r.bytes===0));
   assert.equal((await db.query("SELECT pg_get_triggerdef(oid) definition FROM pg_trigger WHERE tgname='fixture_audit_productos'")).rows[0].definition,originalTrigger);
  });
  await check('reaplicar el mismo delta se rechaza',async()=>{
   await db.exec('BEGIN');try{await assert.rejects(install,/H09:/);}finally{await db.exec('ROLLBACK');}
  });
  for(const table of tables){
   await check(`${table}: INSERT/UPDATE/DELETE producen tres eventos mínimos, no filas privadas`,async()=>{
    const start=await queueCount();const r=await insert(table);let previous=null;
    for(const type of ['INSERT','UPDATE','DELETE']){
     if(type==='UPDATE')await db.query(`UPDATE public.${table} SET nombre=$1,costo=999 WHERE id=$2`,['Dato privado actualizado',r.id]);
     if(type==='DELETE')await db.query(`DELETE FROM public.${table} WHERE id=$1`,[r.id]);
     const request=await latest();assert.equal(request.url,endpoint);assert.equal(request.timeout_milliseconds,15000);assert.deepEqual(request.params,{});
     assert.deepEqual(request.body,{type,schema:'public',table,record:type==='DELETE'?null:{id:r.id},old_record:type==='INSERT'?null:{id:r.id}});
     assert.deepEqual(request.headers,{'Content-Type':'application/json','x-webhook-secret':secret});
     assert.ok(!JSON.stringify(request.body).includes(secret));assert.ok(!JSON.stringify(request.body).includes('privado'));assert.equal(Object.keys(request.body).length,5);
     assert.ok(!('costo' in (request.body.record||{})));if(previous!==null)assert.ok(request.id>previous);previous=request.id;
    }
    assert.equal(await queueCount(),start+3);
   });
  }
  await check('rollback de edición también revierte el encolado simulado',async()=>{
   const count=await queueCount();await db.exec('BEGIN');await insert('productos');assert.equal(await queueCount(),count+1);await db.exec('ROLLBACK');assert.equal(await queueCount(),count);assert.equal((await db.query('SELECT count(*) n FROM productos')).rows[0].n,0);
  });
  await check('fallo de net.http_post no aborta la edición del producto',async()=>{
   const count=await queueCount();await db.exec('BEGIN');await db.exec("SET LOCAL fixture.net_fail='on'");await insert('productos');await db.exec('COMMIT');assert.equal(await queueCount(),count);assert.equal((await db.query('SELECT count(*) n FROM productos')).rows[0].n,1);await db.exec('DELETE FROM productos');
  });
  await check('secreto desaparecido después de activar no aborta la edición',async()=>{
   const count=await queueCount();await db.exec('BEGIN');await db.exec('DELETE FROM vault.secrets');await insert('productos');await db.exec('COMMIT');assert.equal(await queueCount(),count);assert.equal((await db.query('SELECT count(*) n FROM productos')).rows[0].n,1);await db.query('INSERT INTO vault.secrets(name,value) VALUES($1,$2)',['catalogo_webhook_secret',secret]);await db.exec('DELETE FROM productos');
  });
  await check('secreto duplicado después de activar no envía credencial arbitraria ni aborta',async()=>{
   const count=await queueCount();await db.exec('BEGIN');await db.query('INSERT INTO vault.secrets(name,value) VALUES($1,$2)',['catalogo_webhook_secret',secret]);await insert('productos');await db.exec('ROLLBACK');assert.equal(await queueCount(),count);
  });
  await check('helper privado sin EXECUTE para PUBLIC/anon/authenticated/service_role',async()=>{
   const {rows}=await db.query("SELECT has_function_privilege('anon','erp_private.notificar_catalogo_webhook()','EXECUTE') anon,has_function_privilege('authenticated','erp_private.notificar_catalogo_webhook()','EXECUTE') authenticated,has_function_privilege('service_role','erp_private.notificar_catalogo_webhook()','EXECUTE') service_role,EXISTS(SELECT 1 FROM pg_proc p,LATERAL aclexplode(p.proacl)a WHERE p.oid='erp_private.notificar_catalogo_webhook()'::regprocedure AND a.grantee=0 AND a.privilege_type='EXECUTE') public");assert.deepEqual(rows[0],{anon:false,authenticated:false,service_role:false,public:false});
  });
  await check('edición de un actor sin lectura de Vault funciona mediante trigger privado',async()=>{
   await db.exec('GRANT INSERT,UPDATE,DELETE ON productos TO authenticated; BEGIN; SET LOCAL ROLE authenticated;');
   try{await insert('productos');await db.exec('RESET ROLE;COMMIT');}catch(error){await db.exec('ROLLBACK');throw error;}
   const request=await latest();assert.equal(request.body.table,'productos');assert.equal(request.headers['x-webhook-secret'],secret);await db.exec('DELETE FROM productos');
  });
  await check('no incluye secreto real ni parámetros de destino en definiciones o argumentos',async()=>{
   const row=(await db.query("SELECT pg_get_functiondef('erp_private.notificar_catalogo_webhook()'::regprocedure) definition,p.prosecdef,p.proconfig,md5(pg_get_functiondef(p.oid)) md5 FROM pg_proc p WHERE p.oid='erp_private.notificar_catalogo_webhook()'::regprocedure")).rows[0];
   assert.equal(row.prosecdef,true);assert.deepEqual(row.proconfig,['search_path=""']);assert.ok(!row.definition.includes(secret));assert.ok(!row.definition.replace(/--.*$/gm,'').includes('SQLERRM'));report.function_md5=row.md5;
  });
  report.status=report.failures.length?'failed':'passed';report.passed=report.checks.length;
 }finally{
  await db.close();if(process.env.H09_SQL_REPORT)await writeFile(process.env.H09_SQL_REPORT,JSON.stringify(report,null,2));
 }
});
