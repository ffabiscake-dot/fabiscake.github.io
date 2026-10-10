// ============================================================
// products-model.js
// Lógica COMPARTIDA (sin Firebase) entre la web pública, el panel
// admin y la herramienta de migración. Al ser funciones puras se
// pueden probar sin conexión.
// ============================================================

export const VALID_CATEGORIES = [
  "cakes", "postres", "ramos", "sorpresas", "decoracion",
  "hombre", "mujer", "nino", "nina", "combos_alimentos", "combos_cumple"
];

// "Oculto" = desactivado: sigue en el admin pero NO se muestra en la web.
export const VALID_ESTADOS = ["Disponible", "Agotado", "Oculto"];

const MAX_DOC_CHARS = 900000; // Firestore: 1 MiB por documento

export function fnv1a(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

export function normalizeText(s) {
  return String(s == null ? "" : s)
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/\s+/g, " ").trim();
}

export function slug(s) {
  return normalizeText(s).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "producto";
}

// Un producto "es el mismo" si coincide nombre + categoría + foto.
// (Hay productos con el mismo nombre y fotos/precios distintos: se conservan.)
export function legacySignature(p) {
  const img = p.imagenPrincipal || p.imagen || "";
  return normalizeText(p.nombre) + "|" + (p.categoria || "cakes") + "|" + (img ? fnv1a(img) : "sin-foto");
}

// Identificador estable y determinista para productos importados.
export function importKeyFor(p) {
  return "imp-" + slug(p.nombre).slice(0, 40) + "-" + fnv1a(legacySignature(p));
}

// Para limpiar duplicados exactos ya existentes en Firestore.
export function exactDuplicateSignature(d) {
  return legacySignature(d) + "|" + Number(d.precio || 0) + "|" + normalizeText(d.descripcion);
}

export function isHiddenProduct(d) {
  return d.estado === "Oculto" || d.activo === false || d.eliminado === true;
}

const num = (v) => (typeof v === "number" && isFinite(v) ? v : Infinity);

// Ordena por "orden", luego por fecha de creación, luego por nombre.
// Los documentos SIN orden/fecha van al final en vez de desaparecer.
export function sortProducts(list) {
  const created = (x) => num(x._created != null ? x._created : (x.createdAt && x.createdAt.seconds));
  const name = (x) => String(x.name != null ? x.name : (x.nombre || ""));
  return [...list].sort((a, b) =>
    num(a.orden) - num(b.orden) ||
    created(a) - created(b) ||
    name(a).localeCompare(name(b), "es")
  );
}

export function validateProduct(raw) {
  const errors = [];
  const warnings = [];
  const p = raw && typeof raw === "object" ? raw : {};
  const nombre = typeof p.nombre === "string" ? p.nombre.trim() : "";
  if (!nombre) errors.push("falta el nombre");

  const precio = Number(p.precio);
  if (!isFinite(precio) || precio < 0) errors.push("precio inválido (" + p.precio + ")");
  const unidad = p.unidad === "cotizar" ? "cotizar" : "unidad";
  if (isFinite(precio) && precio === 0 && unidad !== "cotizar") warnings.push("precio 0 sin ser 'a cotizar'");

  const categoria = p.categoria || "cakes";
  if (!VALID_CATEGORIES.includes(categoria)) errors.push("categoría desconocida (" + categoria + ")");

  const img = p.imagenPrincipal || p.imagen || "";
  if (typeof img !== "string") errors.push("imagen inválida");
  else if (!img) warnings.push("sin imagen");
  else if (!/^(data:image\/|https?:\/\/|assets\/)/.test(img)) errors.push("imagen con formato no reconocido");

  const imagenes = Array.isArray(p.imagenes) ? p.imagenes : [];
  if (imagenes.some((u) => typeof u !== "string")) errors.push("lista de imágenes adicionales inválida");

  let estado = p.estado;
  if (!VALID_ESTADOS.includes(estado)) {
    if (estado) warnings.push("estado '" + estado + "' no reconocido, se usa Disponible");
    estado = "Disponible";
  }

  const clean = {
    nombre,
    descripcion: typeof p.descripcion === "string" ? p.descripcion.trim() : "",
    precio: isFinite(precio) && precio >= 0 ? precio : 0,
    categoria,
    unidad,
    unidadEtiqueta: typeof p.unidadEtiqueta === "string" ? p.unidadEtiqueta.trim() : "",
    icono: p.icono || "🎂",
    estado,
    destacado: !!p.destacado,
    imagenPrincipal: typeof img === "string" ? img : "",
    imagenes: imagenes.filter((u) => typeof u === "string")
  };
  if (!errors.length && JSON.stringify(clean).length > MAX_DOC_CHARS) {
    errors.push("el producto (con sus imágenes) supera el límite de 1 MB de Firestore");
  }
  return { ok: errors.length === 0, errors, warnings, clean };
}

// ------------------------------------------------------------
// Plan de migración (NO escribe nada): decide qué hacer con cada
// producto del archivo comparándolo con lo que ya hay en Firestore.
//   existingDocs: [{ id, data }]
//   opts.overwrite: true => también reemplaza los campos de contenido
//                   de productos ya existentes con los del archivo.
// Acciones: add | update | unchanged | skip-dup | error
// ------------------------------------------------------------
const CONTENT_FIELDS = [
  "nombre", "descripcion", "precio", "categoria", "unidad", "unidadEtiqueta",
  "icono", "estado", "destacado", "imagenPrincipal", "imagenes"
];

export function planMigration(items, existingDocs, opts = {}) {
  const overwrite = !!opts.overwrite;
  const byId = new Map();
  const byKey = new Map();
  const bySig = new Map();
  let maxOrden = -1;

  for (const e of existingDocs) {
    byId.set(e.id, e);
    if (e.data.importKey) byKey.set(e.data.importKey, e);
    const sig = legacySignature(e.data);
    if (!bySig.has(sig)) bySig.set(sig, []);
    bySig.get(sig).push(e);
    if (typeof e.data.orden === "number" && e.data.orden > maxOrden) maxOrden = e.data.orden;
  }
  let nextOrden = maxOrden + 1;

  const seen = new Set();
  const rows = [];

  items.forEach((raw, index) => {
    const label = raw && raw.nombre ? String(raw.nombre) : "(sin nombre)";
    const v = validateProduct(raw);
    if (!v.ok) {
      rows.push({ index, label, action: "error", reason: v.errors.join("; "), warnings: v.warnings });
      return;
    }
    const clean = v.clean;
    const key = importKeyFor(clean);
    if (seen.has(key)) {
      rows.push({ index, label, action: "skip-dup", reason: "repetido dentro del archivo", warnings: v.warnings });
      return;
    }
    seen.add(key);

    let match = byKey.get(key) || byId.get(key);
    if (!match) {
      const cands = bySig.get(legacySignature(clean)) || [];
      match = cands.find((c) => typeof c.data.orden === "number") || cands[0];
    }

    if (!match) {
      rows.push({
        index, label, action: "add", id: key, warnings: v.warnings,
        data: { ...clean, importKey: key, orden: nextOrden++ }
      });
      return;
    }

    // Producto ya existente: se completa lo que falta; solo se
    // sobrescribe el contenido si el usuario lo pidió expresamente.
    const cur = match.data;
    const patch = {};
    if (!cur.importKey) patch.importKey = key;
    if (typeof cur.orden !== "number") patch.orden = nextOrden++;
    for (const f of CONTENT_FIELDS) {
      if (overwrite) {
        if (JSON.stringify(cur[f]) !== JSON.stringify(clean[f])) patch[f] = clean[f];
      } else if (cur[f] === undefined || cur[f] === null) {
        patch[f] = clean[f];
      }
    }
    const needsCreatedAt = !cur.createdAt;
    if (Object.keys(patch).length || needsCreatedAt) {
      rows.push({
        index, label, action: "update", id: match.id, warnings: v.warnings,
        patch, needsCreatedAt,
        reason: Object.keys(patch).concat(needsCreatedAt ? ["createdAt"] : []).join(", ")
      });
    } else {
      rows.push({ index, label, action: "unchanged", id: match.id, reason: "ya está al día", warnings: v.warnings });
    }
  });

  const count = (a) => rows.filter((r) => r.action === a).length;
  return {
    rows,
    summary: {
      found: items.length,
      add: count("add"),
      update: count("update"),
      skipped: count("unchanged") + count("skip-dup"),
      errors: count("error")
    }
  };
}

// Grupos de documentos existentes que son duplicados exactos.
// Devuelve [{ keep: id, remove: [ids] }].
export function findExactDuplicates(existingDocs) {
  const groups = new Map();
  for (const e of existingDocs) {
    const sig = exactDuplicateSignature(e.data);
    if (!groups.has(sig)) groups.set(sig, []);
    groups.get(sig).push(e);
  }
  const rank = (e) => [
    typeof e.data.orden === "number" ? 0 : 1,
    e.data.importKey ? 0 : 1,
    e.data.createdAt && e.data.createdAt.seconds ? e.data.createdAt.seconds : Infinity
  ];
  const out = [];
  for (const list of groups.values()) {
    if (list.length < 2) continue;
    list.sort((a, b) => {
      const ra = rank(a), rb = rank(b);
      return ra[0] - rb[0] || ra[1] - rb[1] || ra[2] - rb[2] || a.id.localeCompare(b.id);
    });
    out.push({ keep: list[0].id, remove: list.slice(1).map((e) => e.id), label: list[0].data.nombre || "" });
  }
  return out;
}
