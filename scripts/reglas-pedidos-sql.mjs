// Guardia específica de H02, no un parser ni una prueba de equivalencia SQL.
// Reconoce nombres heredados y ramas IF/CASE o UPDATE que vinculan CONFIRMADO
// con escrituras de stock en existencias en contexto de pedidos ecommerce:
// asociación directa de trigger o referencias explícitas en la rutina/DO.
// Las asociaciones sin esquema asumen public; no resuelve search_path ni
// alias de variables, llamadas transitivas, SQL cifrado ni expresiones dinámicas
// arbitrarias. Solo evalúa EXECUTE literal, concatenación y format constantes.
const LEGACY_TRIGGER = 'pedidos_ecommerce_procesar_reserva';
const LEGACY_ROUTINE = 'procesar_estado_pedido_ecommerce';
const STOCK = new Set(['stock_fisico', 'stock_reservado']);
const id = token => token && ['word', 'identifier'].includes(token.kind);
const kw = (token, value) => token?.kind === 'word' && token.value === value;
const sym = (token, value) => token?.kind === 'symbol' && token.value === value;

function analysisError(code, message, line) {
  const error = new Error(message);
  error.code = code;
  error.line = line;
  throw error;
}

function tokenize(source, firstLine = 1) {
  const tokens = [];
  let i = 0, line = firstLine;
  const advance = end => { line += (source.slice(i, end).match(/\n/g) || []).length; i = end; };
  while (i < source.length) {
    const char = source[i], start = i, tokenLine = line;
    if (/\s/.test(char)) { advance(i + 1); continue; }
    if (source.startsWith('--', i)) {
      const end = source.indexOf('\n', i + 2);
      advance(end < 0 ? source.length : end);
      continue;
    }
    if (source.startsWith('/*', i)) {
      let end = i + 2, nesting = 1;
      while (end < source.length && nesting) {
        if (source.startsWith('/*', end)) { nesting++; end += 2; }
        else if (source.startsWith('*/', end)) { nesting--; end += 2; }
        else end++;
      }
      if (nesting) analysisError('SQL_LEXER_ERROR', 'Comentario SQL sin cierre.', tokenLine);
      advance(end);
      continue;
    }
    const escaped = /[eE]/.test(char) && source[i + 1] === "'";
    if (char === "'" || escaped) {
      let end = i + (escaped ? 2 : 1), value = '', closed = false;
      while (end < source.length) {
        if (source[end] === "'") {
          if (source[end + 1] === "'") { value += "'"; end += 2; continue; }
          end++; closed = true; break;
        }
        if (escaped && source[end] === '\\' && end + 1 < source.length) {
          const next = source[end + 1];
          value += ({ n: '\n', r: '\r', t: '\t', b: '\b', f: '\f' })[next] ?? next;
          end += 2;
        } else value += source[end++];
      }
      if (!closed) analysisError('SQL_LEXER_ERROR', 'Literal SQL sin cierre.', tokenLine);
      tokens.push({ kind: 'string', value, line: tokenLine }); advance(end); continue;
    }
    if (char === '"') {
      let end = i + 1, value = '', closed = false;
      while (end < source.length) {
        if (source[end] === '"') {
          if (source[end + 1] === '"') { value += '"'; end += 2; continue; }
          end++; closed = true; break;
        }
        value += source[end++];
      }
      if (!closed) analysisError('SQL_LEXER_ERROR', 'Identificador SQL sin cierre.', tokenLine);
      tokens.push({ kind: 'identifier', value: value.toLowerCase(), line: tokenLine }); advance(end); continue;
    }
    if (char === '$') {
      const delimiter = source.slice(i).match(/^\$(?:[A-Za-z_][A-Za-z0-9_]*)?\$/)?.[0];
      if (delimiter) {
        const end = source.indexOf(delimiter, i + delimiter.length);
        if (end < 0) analysisError('SQL_LEXER_ERROR', 'Cuerpo dollar-quoted sin cierre.', tokenLine);
        tokens.push({ kind: 'string', value: source.slice(i + delimiter.length, end), line: tokenLine });
        advance(end + delimiter.length); continue;
      }
    }
    if (/[A-Za-z_\u0080-\uffff]/.test(char)) {
      let end = i + 1;
      while (end < source.length && /[A-Za-z0-9_$\u0080-\uffff]/.test(source[end])) end++;
      tokens.push({ kind: 'word', value: source.slice(i, end).toLowerCase(), line: tokenLine });
      i = end; continue;
    }
    const pair = source.slice(i, i + 2);
    if (['::', '||', '<>', '!=', ':=', '<=', '>='].includes(pair)) i += 2;
    else i++;
    tokens.push({ kind: 'symbol', value: source.slice(start, i), line: tokenLine });
  }
  return tokens;
}

function qualified(tokens, start) {
  if (!id(tokens[start])) return null;
  const parts = [tokens[start].value];
  let end = start + 1;
  while (sym(tokens[end], '.') && id(tokens[end + 1])) { parts.push(tokens[end + 1].value); end += 2; }
  return { name: parts.at(-1), parts, end };
}

function statementEnd(tokens, start) {
  let parentheses = 0;
  for (let index = start; index < tokens.length; index++) {
    if (sym(tokens[index], '(')) parentheses++;
    else if (sym(tokens[index], ')')) parentheses--;
    else if (sym(tokens[index], ';') && parentheses <= 0) return index;
  }
  return tokens.length;
}

function createObject(tokens, start) {
  let index = start + 1;
  if (kw(tokens[index], 'or') && kw(tokens[index + 1], 'replace')) index += 2;
  if (kw(tokens[index], 'constraint')) index++;
  if (!['trigger', 'function', 'procedure'].some(type => kw(tokens[index], type))) return null;
  const type = tokens[index++].value, object = qualified(tokens, index);
  return object ? { type, ...object } : null;
}

const routineKey = parts => (parts.length === 1 ? ['public', ...parts] : parts).join('.');
function orderTriggerTargets(tokens) {
  const targets = new Set();
  for (let index = 0; index < tokens.length; index++) {
    if (!kw(tokens[index], 'create')) continue;
    const object = createObject(tokens, index);
    if (object?.type !== 'trigger') continue;
    const end = statementEnd(tokens, object.end);
    let table = null;
    for (let cursor = object.end; cursor < end; cursor++) {
      if (kw(tokens[cursor], 'on') && !table) table = qualified(tokens, cursor + 1);
      if (table?.name === 'pedidos_ecommerce' && kw(tokens[cursor], 'execute')
          && (kw(tokens[cursor + 1], 'function') || kw(tokens[cursor + 1], 'procedure'))) {
        const routine = qualified(tokens, cursor + 2);
        if (routine) targets.add(routineKey(routine.parts));
      }
    }
  }
  return targets;
}

function explicitOrderContext(tokens) {
  return tokens.some(token => id(token) && token.value === 'pedidos_ecommerce')
    || tokens.some(token => id(token) && token.value === 'reservas')
      && tokens.some(token => token.kind === 'string' && token.value.trim().toUpperCase() === 'ECOMMERCE');
}

function conditionEnd(tokens, start, keyword) {
  let nesting = 0;
  for (let index = start; index < tokens.length; index++) {
    if (sym(tokens[index], '(')) nesting++;
    else if (sym(tokens[index], ')')) nesting--;
    if (nesting === 0 && kw(tokens[index], keyword)) return index;
    if (nesting === 0 && sym(tokens[index], ';')) break;
  }
  return -1;
}

const stateReference = token => id(token) && (token.value === 'estado' || /_estado$/.test(token.value));
const confirmedLiteral = token => token?.kind === 'string' && token.value.trim().toUpperCase() === 'CONFIRMADO';

function confirmedPredicate(tokens) {
  for (let index = 0; index < tokens.length; index++) {
    if (!confirmedLiteral(tokens[index])) continue;
    for (let other = Math.max(0, index - 10); other < Math.min(tokens.length, index + 11); other++) {
      if (!stateReference(tokens[other])) continue;
      const between = tokens.slice(Math.min(index, other) + 1, Math.max(index, other));
      if (between.some(token => token.kind === 'string' || ['and', 'or', 'then', 'when'].some(word => kw(token, word)))) continue;
      const negative = between.some(token => ['<>', '!='].some(operator => sym(token, operator)))
        || between.some(token => kw(token, 'not')) && !between.some(token => kw(token, 'distinct'));
      const positive = between.some(token => sym(token, '=')) || between.some(token => kw(token, 'in'))
        || between.some(token => kw(token, 'not')) && between.some(token => kw(token, 'distinct'));
      const prefix = tokens.slice(Math.max(0, other - 3), other);
      if (positive && !negative && !prefix.some(token => kw(token, 'not'))) return true;
    }
  }
  return false;
}

function updatesStock(tokens, start, end) {
  let index = start + 1;
  if (kw(tokens[index], 'only')) index++;
  const table = qualified(tokens, index);
  if (!table || table.name !== 'existencias') return false;
  index = table.end;
  while (index < end && !kw(tokens[index], 'set')) index++;
  if (index === end) return false;
  let assignment = [], level = 0;
  for (index++; index < end; index++) {
    const token = tokens[index];
    if (level === 0 && ['where', 'from', 'returning'].some(word => kw(token, word))) break;
    if (level === 0 && sym(token, ',')) { assignment = []; continue; }
    if (level === 0 && sym(token, '=')) {
      if (assignment.some(item => id(item) && STOCK.has(item.value))) return true;
      assignment = [];
      // Ignorar el lado derecho hasta la siguiente asignación del SET.
      for (index++; index < end; index++) {
        const rhs = tokens[index];
        if (sym(rhs, '(')) level++;
        else if (sym(rhs, ')')) level--;
        if (level === 0 && (sym(rhs, ',') || ['where', 'from', 'returning'].some(word => kw(rhs, word)))) break;
      }
      index--;
      continue;
    }
    assignment.push(token);
    if (sym(token, '(')) level++;
    else if (sym(token, ')')) level--;
  }
  return false;
}

function constantFormat(template, args) {
  let output = '', next = 0;
  for (let index = 0; index < template.length; index++) {
    if (template[index] !== '%') { output += template[index]; continue; }
    if (template[index + 1] === '%') { output += '%'; index++; continue; }
    const spec = template.slice(index + 1).match(/^(?:(\d+)\$)?([sIL])/);
    if (!spec) return null;
    const argument = spec[1] ? Number(spec[1]) - 1 : next++;
    if (argument < 0 || argument >= args.length) return null;
    const value = args[argument];
    output += spec[2] === 'I' ? '"' + value.replace(/"/g, '""') + '"'
      : spec[2] === 'L' ? "'" + value.replace(/'/g, "''") + "'" : value;
    index += spec[0].length;
  }
  return output;
}

function staticExpression(tokens, start, depth = 0) {
  if (depth > 8) return null;
  function atom(index) {
    if (tokens[index]?.kind === 'string') return { value: tokens[index].value, end: index + 1 };
    if (sym(tokens[index], '(')) {
      const expression = staticExpression(tokens, index + 1, depth + 1);
      return expression && sym(tokens[expression.end], ')') ? { value: expression.value, end: expression.end + 1 } : null;
    }
    const name = qualified(tokens, index);
    if (!name || name.name !== 'format' || !sym(tokens[name.end], '(')) return null;
    const args = [];
    let end = name.end + 1;
    while (!sym(tokens[end], ')')) {
      const argument = staticExpression(tokens, end, depth + 1);
      if (!argument) return null;
      args.push(argument.value); end = argument.end;
      if (sym(tokens[end], ',')) end++;
      else if (!sym(tokens[end], ')')) return null;
    }
    if (!args.length) return null;
    const value = constantFormat(args[0], args.slice(1));
    return value === null ? null : { value, end: end + 1 };
  }
  let expression = atom(start);
  if (!expression) return null;
  while (sym(tokens[expression.end], '||')) {
    const right = atom(expression.end + 1);
    if (!right) return null;
    expression = { value: expression.value + right.value, end: right.end };
  }
  return expression;
}

/** Rechaza patrones de reinstalación del flujo heredado, sin ejecutar SQL. */
export function assertNoLegacyOrderSql(sql, { path = 'SQL' } = {}) {
  if (typeof sql !== 'string') throw new TypeError('sql debe ser texto.');
  const label = String(path).replace(/[\r\n]/g, ' ');
  function reject(token, rule) {
    const error = new Error(`Flujo antiguo de pedidos detectado en ${label}:${token.line} (${rule}). CONFIRMADO no debe reinstalar el consumo de inventario.`);
    error.code = 'LEGACY_ORDER_FLOW'; error.rule = rule; error.path = path; error.line = token.line;
    throw error;
  }

  function inspect(tokens, { body = false, inheritedConfirmed = false, orderContext = false, depth = 0 } = {}) {
    if (depth > 12) analysisError('SQL_ANALYSIS_LIMIT', 'Anidación SQL fuera del alcance de la guardia.', tokens[0]?.line || 1);
    const orderTargets = orderTriggerTargets(tokens);
    const inOrderContext = orderContext || body && explicitOrderContext(tokens);
    const branches = [];
    const inConfirmed = () => inheritedConfirmed || branches.some(branch => branch.confirmed);
    for (let index = 0; index < tokens.length; index++) {
      const token = tokens[index];
      if (kw(token, 'create')) {
        const object = createObject(tokens, index);
        if (object?.type === 'trigger' && object.name === LEGACY_TRIGGER) reject(token, 'CREATE_LEGACY_TRIGGER');
        if (object && ['function', 'procedure'].includes(object.type)) {
          if (object.name === LEGACY_ROUTINE) reject(token, 'CREATE_LEGACY_ROUTINE');
          const end = statementEnd(tokens, object.end);
          for (let cursor = object.end; cursor < end; cursor++) {
            if (kw(tokens[cursor], 'as') && tokens[cursor + 1]?.kind === 'string') {
              const routineBody = tokens[cursor + 1];
              inspect(tokenize(routineBody.value, routineBody.line), {
                body: true, orderContext: orderTargets.has(routineKey(object.parts)), depth: depth + 1,
              });
              break;
            }
          }
        }
      }
      if (kw(token, 'do')) {
        const end = statementEnd(tokens, index + 1);
        const anonymous = tokens.slice(index + 1, end).find(item => item.kind === 'string');
        if (anonymous) inspect(tokenize(anonymous.value, anonymous.line), { body: true, depth: depth + 1 });
      }
      if (kw(token, 'execute')) {
        if (kw(tokens[index + 1], 'function') || kw(tokens[index + 1], 'procedure')) {
          if (qualified(tokens, index + 2)?.name === LEGACY_ROUTINE) reject(token, 'EXECUTE_LEGACY_ROUTINE');
        } else {
          const expression = staticExpression(tokens, index + 1);
          if (expression) inspect(tokenize(expression.value, token.line), {
            body, inheritedConfirmed: inConfirmed(), orderContext: inOrderContext, depth: depth + 1,
          });
        }
      }
      if (kw(token, 'alter') && kw(tokens[index + 1], 'table')) {
        const end = statementEnd(tokens, index + 2);
        for (let cursor = index + 2; cursor < end; cursor++) {
          if (!kw(tokens[cursor], 'enable')) continue;
          let next = cursor + 1;
          if (kw(tokens[next], 'always') || kw(tokens[next], 'replica')) next++;
          if (kw(tokens[next], 'trigger') && qualified(tokens, next + 1)?.name === LEGACY_TRIGGER) reject(token, 'ENABLE_LEGACY_TRIGGER');
        }
      }
      if (kw(token, 'alter') && ['function', 'procedure', 'routine'].some(type => kw(tokens[index + 1], type))) {
        const object = qualified(tokens, index + 2);
        if (object?.name === LEGACY_ROUTINE) {
          const end = statementEnd(tokens, object.end);
          for (let cursor = object.end; cursor < end; cursor++) {
            if (kw(tokens[cursor], 'rename') && kw(tokens[cursor + 1], 'to')
                || kw(tokens[cursor], 'set') && kw(tokens[cursor + 1], 'schema')) {
              reject(token, 'MOVE_LEGACY_ROUTINE');
            }
          }
        }
      }
      if (kw(token, 'grant')) {
        const end = statementEnd(tokens, index + 1);
        let on = index + 1;
        while (on < end && !kw(tokens[on], 'on')) on++;
        if (tokens.slice(index + 1, on).some(item => kw(item, 'execute') || kw(item, 'all'))
            && ['function', 'procedure', 'routine'].some(type => kw(tokens[on + 1], type))) {
          let cursor = on + 2, level = 0, objectStart = true;
          while (cursor < end && !kw(tokens[cursor], 'to')) {
            if (objectStart) {
              if (qualified(tokens, cursor)?.name === LEGACY_ROUTINE) reject(token, 'GRANT_LEGACY_ROUTINE');
              objectStart = false;
            }
            if (sym(tokens[cursor], '(')) level++;
            else if (sym(tokens[cursor], ')')) level--;
            else if (level === 0 && sym(tokens[cursor], ',')) objectStart = true;
            cursor++;
          }
        }
      }
      if (!body) continue;
      if (kw(token, 'end') && (kw(tokens[index + 1], 'if') || kw(tokens[index + 1], 'case'))) {
        const kind = tokens[index + 1].value;
        if (branches.at(-1)?.kind === kind) branches.pop();
        index++; continue;
      }
      if (kw(token, 'end') && branches.at(-1)?.kind === 'case') { branches.pop(); continue; }
      if (kw(token, 'if') || kw(token, 'elsif')) {
        const end = conditionEnd(tokens, index + 1, 'then');
        if (end >= 0) {
          const confirmed = confirmedPredicate(tokens.slice(index + 1, end));
          if (kw(token, 'elsif') && branches.at(-1)?.kind === 'if') branches.at(-1).confirmed = confirmed;
          else branches.push({ kind: 'if', confirmed });
          index = end; continue;
        }
      }
      if (kw(token, 'case')) {
        const when = conditionEnd(tokens, index + 1, 'when');
        if (when >= 0) {
          branches.push({ kind: 'case', confirmed: false, selector: tokens.slice(index + 1, when) });
          index = when - 1; continue;
        }
      }
      if (kw(token, 'when') && branches.at(-1)?.kind === 'case') {
        const end = conditionEnd(tokens, index + 1, 'then');
        if (end >= 0) {
          const branch = branches.at(-1), condition = tokens.slice(index + 1, end);
          branch.confirmed = confirmedPredicate(condition)
            || branch.selector.some(stateReference) && condition.some(confirmedLiteral);
          index = end; continue;
        }
      }
      if (kw(token, 'else') && branches.length) { branches.at(-1).confirmed = false; continue; }
      if (kw(token, 'update')) {
        const end = statementEnd(tokens, index + 1);
        if (inOrderContext && updatesStock(tokens, index, end) && (inConfirmed() || confirmedPredicate(tokens.slice(index, end)))) {
          reject(token, 'CONFIRMED_STOCK_WRITE');
        }
      }
    }
  }

  inspect(tokenize(sql));
}
