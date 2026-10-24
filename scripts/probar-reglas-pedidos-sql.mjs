import assert from 'node:assert/strict';
import test from 'node:test';
import { assertNoLegacyOrderSql } from './reglas-pedidos-sql.mjs';

// Pruebas de texto sintético: no hay red, archivos temporales ni ejecución SQL.
const legacy = 'procesar_estado_pedido_ecommerce';
const trigger = 'pedidos_ecommerce_procesar_reserva';
const renamed = body => `create or replace function public.motor_renombrado()
returns trigger language plpgsql as $body$ begin ${body} return new; end; $body$;
create trigger motor_pedido_nuevo before update on public.pedidos_ecommerce
for each row execute function public.motor_renombrado();`;
const stock = 'UPDATE public.existencias SET stock_fisico = stock_fisico - r.cantidad, stock_reservado=stock_reservado-r.cantidad;';
function rejects(sql, rule) {
  assert.throws(() => assertNoLegacyOrderSql(sql, { path: 'prueba.sql' }), error => {
    assert.equal(error.code, 'LEGACY_ORDER_FLOW');
    assert.equal(error.path, 'prueba.sql');
    assert.ok(Number.isInteger(error.line) && error.line > 0);
    if (rule) assert.equal(error.rule, rule);
    return true;
  });
}
function permits(sql) { assert.doesNotThrow(() => assertNoLegacyOrderSql(sql)); }

test('rechaza crear trigger antiguo con variaciones de nombre/caso/comillas', () => {
  for (const prefix of ['CREATE TRIGGER', 'create or replace trigger', 'CREATE CONSTRAINT TRIGGER', 'CREATE OR REPLACE CONSTRAINT TRIGGER']) {
    rejects(`${prefix} "${trigger.toUpperCase()}" before update on public.pedidos_ecommerce for each row execute function public.otro();`, 'CREATE_LEGACY_TRIGGER');
  }
});

test('rechaza crear función o procedimiento antiguo cualificado', () => {
  for (const kind of ['function', 'procedure']) {
    rejects(`CREATE OR REPLACE ${kind} "PUBLIC"."${legacy.toUpperCase()}"() language sql as 'select 1';`, 'CREATE_LEGACY_ROUTINE');
  }
});

test('trigger renombrado que ejecuta función/procedimiento antiguo falla', () => {
  for (const kind of ['FUNCTION', 'PROCEDURE']) {
    rejects(`CREATE TRIGGER nombre_nuevo before update on public.pedidos_ecommerce for each row EXECUTE ${kind} "public"."${legacy}"();`, 'EXECUTE_LEGACY_ROUTINE');
  }
});

test('comentarios inline y bloques anidados no evaden tokens activos', () => {
  rejects(`CrEaTe /* uno /* dos */ final */ OR -- otro\n REPLACE FUNCTION public./* salto */${legacy}() returns trigger as $$ begin return new; end $$ language plpgsql;`, 'CREATE_LEGACY_ROUTINE');
  rejects(`ALTER /* nota */ TABLE ONLY public.pedidos_ecommerce ENABLE /* nota */ ALWAYS TRIGGER "${trigger}";`, 'ENABLE_LEGACY_TRIGGER');
});

test('rechaza rehabilitar trigger normal, ALWAYS o REPLICA', () => {
  for (const mode of ['', 'ALWAYS ', 'REPLICA ']) {
    rejects(`ALTER TABLE IF EXISTS public.pedidos_ecommerce ENABLE ${mode}TRIGGER ${trigger};`, 'ENABLE_LEGACY_TRIGGER');
  }
});

test('rechaza GRANT EXECUTE y ALL incluidos varios objetos', () => {
  for (const privileges of ['EXECUTE', 'ALL', 'ALL PRIVILEGES', 'USAGE, EXECUTE']) {
    rejects(`GRANT ${privileges} ON FUNCTION public.otra(), "PUBLIC"."${legacy}"(), tercera(integer) TO authenticated;`, 'GRANT_LEGACY_ROUTINE');
  }
  rejects(`GRANT EXECUTE ON PROCEDURE public.${legacy}() TO public;`, 'GRANT_LEGACY_ROUTINE');
  permits('GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;');
});

test('DROP, REVOKE, DISABLE y comentarios de documentación permitidos', () => {
  permits(`-- CREATE TRIGGER ${trigger} ...\n/* CREATE FUNCTION ${legacy}() /* bloque interno */ ; */
    DROP TRIGGER IF EXISTS ${trigger} ON public.pedidos_ecommerce;
    DROP FUNCTION IF EXISTS public.${legacy}();
    DROP PROCEDURE IF EXISTS public.${legacy}();
    REVOKE EXECUTE ON FUNCTION public.${legacy}() FROM anon;
    REVOKE ALL PRIVILEGES ON FUNCTION public.${legacy}() FROM public;
    ALTER TABLE public.pedidos_ecommerce DISABLE TRIGGER ${trigger};`);
});

test('meras cadenas, mensajes y documentación dentro de rutinas son inertes', () => {
  permits(`SELECT 'CREATE FUNCTION public.${legacy}()';
    COMMENT ON FUNCTION public.moderno() IS 'EXECUTE FUNCTION public.${legacy}()';
    CREATE FUNCTION public.descripcion() RETURNS text LANGUAGE sql AS $doc$
      SELECT 'CREATE TRIGGER ${trigger} before update';
    $doc$;`);
  permits(renamed(`RAISE NOTICE 'new.estado=''CONFIRMADO''; ${stock.replace(/'/g, "''")}';`));
});

test('función renombrada que consume al CONFIRMADO falla aunque cambie el hash', () => {
  rejects(renamed(`-- Nombre y comentario nuevos para evadir copia exacta\nIF NEW.estado = 'CONFIRMADO' THEN ${stock} END IF;`), 'CONFIRMED_STOCK_WRITE');
  rejects(renamed(`IF 'CONFIRMADO' = "NEW"."estado" THEN UPDATE "PUBLIC"."existencias" SET "stock_reservado"="stock_reservado"-1; END IF;`), 'CONFIRMED_STOCK_WRITE');
});

test('DO y cuerpo single-quoted también se inspeccionan', () => {
  rejects(`DO LANGUAGE plpgsql $outer$ BEGIN PERFORM 1 FROM public.pedidos_ecommerce; IF new.estado=E'CONFIRMADO' THEN ${stock} END IF; END; $outer$;`, 'CONFIRMED_STOCK_WRITE');
  rejects(`CREATE FUNCTION otro() RETURNS trigger AS 'BEGIN PERFORM 1 FROM public.pedidos_ecommerce; IF new.estado=''CONFIRMADO'' THEN ${stock} END IF; RETURN NEW; END;' LANGUAGE plpgsql;`, 'CONFIRMED_STOCK_WRITE');
});

test('CASE simple y CASE buscado asocian estado con stock', () => {
  rejects(renamed(`CASE new.estado WHEN 'CONFIRMADO' THEN ${stock} WHEN 'CANCELADO' THEN NULL; END CASE;`), 'CONFIRMED_STOCK_WRITE');
  rejects(renamed(`CASE WHEN new.estado IN ('CONFIRMADO') THEN ${stock} ELSE NULL; END CASE;`), 'CONFIRMED_STOCK_WRITE');
});

test('condición dentro del propio UPDATE se inspecciona', () => {
  rejects(renamed(`UPDATE existencias SET stock_fisico=stock_fisico-1 WHERE producto_id=new.id AND new.estado='CONFIRMADO';`), 'CONFIRMED_STOCK_WRITE');
  rejects(renamed(`UPDATE existencias SET (stock_fisico,stock_reservado)=(0,0) WHERE new.estado='CONFIRMADO';`), 'CONFIRMED_STOCK_WRITE');
});

test('lectura CONFIRMADO sin tocar stock está permitida', () => {
  permits(renamed(`IF new.estado='CONFIRMADO' THEN PERFORM registrar_auditoria(new.id); END IF;`));
  permits(renamed(`IF new.estado='CONFIRMADO' THEN UPDATE existencias SET fecha_actualizacion=now() WHERE stock_fisico > 0; END IF;`));
  permits(`SELECT estado, stock_fisico FROM pedidos_ecommerce CROSS JOIN existencias WHERE estado='CONFIRMADO';`);
});

test('PREPARAR/COBRAR modernos y rama distinta a lectura CONFIRMADO permitidos', () => {
  permits(renamed(`IF new.estado='CONFIRMADO' THEN RAISE NOTICE 'Estado histórico'; ELSIF p_accion='PREPARAR' THEN ${stock} ELSE PERFORM cobrar(); END IF;`));
  permits(renamed(`IF new.estado='CONFIRMADO' THEN PERFORM registrar_auditoria(); END IF;
    IF p_accion='PREPARAR' THEN ${stock} END IF; IF p_accion='COBRAR' THEN PERFORM emitir_comprobante(); END IF;`));
  permits(renamed(`CASE new.estado WHEN 'CONFIRMADO' THEN NULL; WHEN 'PREPARADO' THEN ${stock} END CASE;`));
});

test('dollar-quotes anidados y comentarios no confunden cuerpos', () => {
  rejects(`DO $outer$ BEGIN PERFORM 1 FROM public.pedidos_ecommerce; /* ' $$ /* comentario */ */ IF new.estado=$status$CONFIRMADO$status$ THEN ${stock} END IF; END; $outer$;`, 'CONFIRMED_STOCK_WRITE');
  permits(`DO $$ BEGIN RAISE NOTICE $text$CREATE FUNCTION public.${legacy}()$text$; END; $$;`);
});

test('EXECUTE literal, concatenado y format constante detectan reinstalación', () => {
  rejects(`DO $$ BEGIN EXECUTE 'CREATE TRIGGER ${trigger} BEFORE UPDATE ON pedidos_ecommerce EXECUTE FUNCTION moderno()'; END $$;`, 'CREATE_LEGACY_TRIGGER');
  rejects(`DO $$ BEGIN EXECUTE ('CREATE OR REPLACE FUN' || 'CTION public.${legacy}() RETURNS integer LANGUAGE sql AS ''select 1'''); END $$;`, 'CREATE_LEGACY_ROUTINE');
  rejects(`DO $$ BEGIN EXECUTE format('CREATE TRIGGER %I BEFORE UPDATE ON pedidos_ecommerce EXECUTE FUNCTION moderno()', '${trigger}'); END $$;`, 'CREATE_LEGACY_TRIGGER');
  rejects(`DO $$ BEGIN EXECUTE pg_catalog.format('GRANT EXECUTE ON FUNCTION %1$I.%2$I() TO anon', 'public', '${legacy}'); END $$;`, 'GRANT_LEGACY_ROUTINE');
});

test('EXECUTE de UPDATE conserva contexto CONFIRMADO del bloque', () => {
  rejects(renamed(`IF new.estado='CONFIRMADO' THEN EXECUTE 'UPDATE existencias SET stock_reservado=stock_reservado-1'; END IF;`), 'CONFIRMED_STOCK_WRITE');
  permits(renamed(`IF p_accion='PREPARAR' THEN EXECUTE 'UPDATE existencias SET stock_fisico=stock_fisico-1'; END IF;`));
});

test('EXECUTE de SQL que solo retorna documentación sigue permitido', () => {
  permits(`DO $$ BEGIN EXECUTE 'SELECT ''CREATE FUNCTION public.${legacy}()'''; END $$;`);
  permits(`DO $$ BEGIN EXECUTE format('DROP FUNCTION IF EXISTS %I.%I()', 'public', '${legacy}'); END $$;`);
});

test('no bloquea confirmar compras ni su trigger de inventario en otro módulo', () => {
  permits(`CREATE FUNCTION public.recibir_compra(p_estado text) RETURNS void LANGUAGE plpgsql AS $$
    BEGIN IF p_estado='CONFIRMADO' THEN UPDATE existencias SET stock_fisico=stock_fisico+1; END IF; END $$;
    CREATE FUNCTION public.compra_confirmada() RETURNS trigger LANGUAGE plpgsql AS $$
    BEGIN IF new.estado='CONFIRMADO' THEN UPDATE existencias SET stock_fisico=stock_fisico+1; END IF; RETURN NEW; END $$;
    CREATE TRIGGER compra BEFORE UPDATE ON public.ordenes_compra FOR EACH ROW EXECUTE FUNCTION public.compra_confirmada();`);
});

test('acota el contexto de cada rutina aunque el mismo delta también defina pedidos', () => {
  permits(renamed(`IF p_accion='PREPARAR' THEN ${stock} END IF;`) + `
    CREATE FUNCTION public.confirmar_recepcion(p_estado text) RETURNS void LANGUAGE plpgsql AS $$
    BEGIN IF p_estado='CONFIRMADO' THEN UPDATE existencias SET stock_fisico=stock_fisico+1; END IF; END $$;`);
  rejects(`CREATE FUNCTION public.alias_antiguo() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
    IF new.estado='CONFIRMADO' THEN
      PERFORM id FROM public.reservas WHERE origen='ECOMMERCE'; ${stock}
    END IF; RETURN NEW; END $$;`, 'CONFIRMED_STOCK_WRITE');
});

test('rechaza cambiar identidad de la función antigua antes de asociar un alias', () => {
  for (const suffix of ['RENAME TO motor_reubicado', 'SET SCHEMA otro_esquema']) {
    rejects(`ALTER FUNCTION public.${legacy}() ${suffix};`, 'MOVE_LEGACY_ROUTINE');
  }
  rejects(`ALTER FUNCTION public.${legacy}() RENAME TO motor_reubicado;
    CREATE TRIGGER renombrado BEFORE UPDATE ON pedidos_ecommerce FOR EACH ROW EXECUTE FUNCTION public.motor_reubicado();`, 'MOVE_LEGACY_ROUTINE');
});
