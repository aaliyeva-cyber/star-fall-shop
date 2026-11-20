/**
 * Валидация контракта context-app-data/manifest.json — то, что движок реально
 * читает (src/lib/types.ts). Возвращает список проблем строками; пустой список
 * = валидно. Без зависимостей — переиспользуется CLI-валидатором и экспортёром.
 */

const isStr = (v) => typeof v === 'string' && v.length > 0;

export function validateManifest(m) {
  const problems = [];
  if (m === null || typeof m !== 'object' || Array.isArray(m)) {
    return ['manifest: must be a JSON object'];
  }
  for (const f of ['prototypeId', 'title', 'generatedAt']) {
    if (!isStr(m[f])) problems.push(`manifest.${f}: required non-empty string`);
  }
  if (!Array.isArray(m.areas) || !m.areas.every(isStr)) problems.push('manifest.areas: required string[]');
  if (m.docs === undefined || typeof m.docs !== 'object' || m.docs === null || Array.isArray(m.docs)) {
    problems.push('manifest.docs: must be an object {featureId: paths[]}');
  }
  if (!Array.isArray(m.features)) {
    problems.push('manifest.features: required array');
    return problems;
  }
  m.features.forEach((feat, i) => {
    const at = `features[${i}]`;
    if (feat === null || typeof feat !== 'object') {
      problems.push(`${at}: must be an object`);
      return;
    }
    for (const f of ['id', 'title', 'summary']) {
      if (!isStr(feat[f])) problems.push(`${at}.${f}: required non-empty string`);
    }
    if (feat.flowMap !== undefined) validateFlowMap(feat.flowMap, `${at}.flowMap`, problems);
  });
  if (m.variants !== undefined) validateVariants(m.variants, problems);
  return problems;
}

// Settings (src/variants.json, added by settings-export.mjs): optional, but when present every
// default is one of its options and every preset picks options that exist.
function validateVariants(v, problems) {
  if (!Array.isArray(v?.axes)) {
    problems.push('variants.axes: required array');
    return;
  }
  const axes = new Map(v.axes.map((a) => [a.id, a]));
  for (const a of v.axes) {
    const ids = (a.options ?? []).map((o) => o.id);
    if (!isStr(a.id) || !ids.length) problems.push(`variants.axes "${a.id}": needs an id and options`);
    else if (a.kind !== 'many' && !ids.includes(a.default)) problems.push(`setting "${a.id}": default "${a.default}" is not one of its options`);
    for (const w of a.when ?? []) if (!axes.has(w.axis)) problems.push(`setting "${a.id}": depends on "${w.axis}", which is not declared`);
  }
  for (const p of v.versions ?? []) {
    for (const [axis, option] of Object.entries(p.choices ?? {})) {
      const a = axes.get(axis);
      if (!a) problems.push(`preset "${p.id}": picks "${axis}", which is not declared`);
      else if (a.kind !== 'many' && !(a.options ?? []).some((o) => o.id === option)) problems.push(`preset "${p.id}": "${axis}" has no option "${option}"`);
    }
  }
}

function validateFlowMap(map, at, problems) {
  if (map === null || typeof map !== 'object') {
    problems.push(`${at}: must be an object`);
    return;
  }
  if (!isStr(map.title)) problems.push(`${at}.title: required non-empty string`);
  if (!Array.isArray(map.flows) || !map.flows.every((f) => f && isStr(f.id) && isStr(f.label))) {
    problems.push(`${at}.flows: required [{id, label}]`);
  }
  if (!Array.isArray(map.nodes)) {
    problems.push(`${at}.nodes: required array`);
    return;
  }
  const nodeIds = new Set();
  map.nodes.forEach((n, i) => {
    const nat = `${at}.nodes[${i}]`;
    if (!n || !isStr(n.id) || !isStr(n.label) || !isStr(n.flowId)) {
      problems.push(`${nat}: requires id, label, flowId`);
      return;
    }
    nodeIds.add(n.id);
    if (!n.target || !isStr(n.target.sectionId)) problems.push(`${nat}.target.sectionId: required (deep link into the prototype)`);
  });
  if (!Array.isArray(map.edges)) {
    problems.push(`${at}.edges: required array`);
    return;
  }
  map.edges.forEach((e, i) => {
    const eat = `${at}.edges[${i}]`;
    if (!e || !isStr(e.from) || !isStr(e.to)) {
      problems.push(`${eat}: requires from, to`);
      return;
    }
    for (const end of [e.from, e.to]) {
      if (!nodeIds.has(end)) problems.push(`${eat}: references unknown node "${end}"`);
    }
  });
}
