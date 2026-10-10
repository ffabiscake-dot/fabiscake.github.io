// ============================================================
// migration-runner.js
// Orquesta analizar → aplicar → verificar la migración de productos.
// No conoce Firebase: trabaja con un "store" con esta forma:
//   listAll()            -> [{ id, data }]
//   add(id, data)        -> crea/reemplaza el documento <id>
//   update(id, patch, { needsCreatedAt })
//   remove(id)
// (admin/migrar.html le pasa un store real de Firestore; las pruebas
//  usan uno en memoria.)
// ============================================================
import { planMigration, findExactDuplicates } from "./products-model.js";

export function friendlyError(e) {
  const code = (e && e.code) || "";
  const msg = (e && e.message) || String(e);
  if (/permission-denied/.test(code)) return "Sin permisos: inicia sesión con la cuenta de administradora y comprueba que las reglas de Firestore (firestore.rules) estén publicadas.";
  if (/unauthenticated/.test(code)) return "Sesión no iniciada o caducada: vuelve a entrar en admin.html.";
  if (/unavailable|network|deadline-exceeded/.test(code) || /network|offline|Failed to fetch/i.test(msg)) return "Sin conexión con Firebase (revisa internet o VPN: googleapis.com / gstatic.com pueden estar bloqueados).";
  if (/resource-exhausted/.test(code)) return "Se agotó la cuota gratuita de Firestore. Reintenta más tarde (se renueva a diario).";
  if (/invalid-argument|too large|exceeds/i.test(code + msg)) return "Documento rechazado por Firestore (¿demasiado grande o con datos inválidos?): " + msg;
  return msg;
}

export async function analyze(items, store, opts = {}) {
  const existing = await store.listAll();
  const plan = planMigration(items, existing, opts);
  const dups = findExactDuplicates(existing);
  return { existing, plan, duplicates: dups };
}

async function pool(tasks, concurrency) {
  let i = 0;
  const workers = Array.from({ length: Math.min(concurrency, tasks.length) }, async () => {
    while (i < tasks.length) { const t = tasks[i++]; await t(); }
  });
  await Promise.all(workers);
}

// Ejecuta SOLO las filas add/update del plan. Cada producto se escribe por
// separado, así un fallo no frena el resto y se informa con precisión.
export async function apply(plan, store, { concurrency = 4, onProgress } = {}) {
  const todo = plan.rows.filter((r) => r.action === "add" || r.action === "update");
  const result = { added: 0, updated: 0, errors: [] };
  let done = 0;
  await pool(todo.map((r) => async () => {
    try {
      if (r.action === "add") { await store.add(r.id, r.data); result.added++; }
      else { await store.update(r.id, r.patch, { needsCreatedAt: r.needsCreatedAt }); result.updated++; }
    } catch (e) {
      result.errors.push({ label: r.label, message: friendlyError(e) });
    }
    done++;
    if (onProgress) onProgress(done, todo.length);
  }), concurrency);
  return result;
}

// Vuelve a leer Firestore y comprueba que ya no queda nada pendiente.
export async function verify(items, store, opts = {}) {
  const { plan } = await analyze(items, store, opts);
  const s = plan.summary;
  return { pending: s.add + s.update, validationErrors: s.errors, total: (await store.listAll()).length };
}

// Operación explícita (con confirmación en la interfaz): borra SOLO los
// duplicados exactos, conservando un ejemplar de cada producto.
export async function removeDuplicates(groups, store, { onProgress } = {}) {
  const ids = groups.flatMap((g) => g.remove);
  const result = { removed: 0, errors: [] };
  let done = 0;
  for (const id of ids) {
    try { await store.remove(id); result.removed++; }
    catch (e) { result.errors.push({ label: id, message: friendlyError(e) }); }
    done++;
    if (onProgress) onProgress(done, ids.length);
  }
  return result;
}
