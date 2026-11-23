/* ===================== DETECCIÓN WebP ===================== */
window.WebP = (function(){
  try {
    const c = document.createElement('canvas');
    if(c.toDataURL && c.toDataURL('image/webp').indexOf('data:image/webp') === 0) return true;
  } catch(e) {}
  return false;
})();

function toWebP(path) {
  if (!path || !window.WebP) return path;
  let result = path.replace(/\.jpg$/i, '.webp').replace(/\.jpeg$/i, '.webp').replace(/\.png$/i, '.webp');
  if (result.includes('assets/products/')) {
    result = result.replace('assets/products/', 'assets/products/webp/');
  }
  return result;
}

/* ===================== TEMA Y NAVEGACIÓN (compartido en todo el sitio) ===================== */
function toggleTheme(){
  const body = document.body;
  const isDark = body.getAttribute('data-theme') === 'dark';
  body.setAttribute('data-theme', isDark ? 'light' : 'dark');
  const btn = document.getElementById('themeBtn');
  if(btn) btn.textContent = isDark ? '🌙' : '☀️';
  localStorage.setItem('fc_theme', isDark ? 'light' : 'dark');
}
function toggleNav(){
  const nav = document.getElementById('navLinks');
  if(nav) nav.classList.toggle('open');
}
function closeNav(){
  const nav = document.getElementById('navLinks');
  if(nav) nav.classList.remove('open');
}

/* ===================== AVISO DE COOKIES ===================== */
function hideCookieBanner(){
  const b = document.getElementById('cookieBanner');
  if(b) b.classList.remove('show');
}
function acceptCookies(){
  localStorage.setItem('fc_cookies', 'accepted');
  hideCookieBanner();
}
function configureCookies(){
  window.location.href = (document.body.getAttribute('data-root') || '') + 'cookies.html';
}
function showCookieBannerIfNeeded(){
  const pref = localStorage.getItem('fc_cookies');
  const b = document.getElementById('cookieBanner');
  if(!pref && b) b.classList.add('show');
}

/* ===================== BUSCADOR DEL CATÁLOGO ===================== */
(function initCatalogSearch(){
  const normalize = (value) => String(value == null ? '' : value)
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
  const categoryNames = {
    cakes: 'cakes tortas pasteles', postres: 'postres bufet', ramos: 'flores ramos rosas',
    sorpresas: 'sorpresas entretenimiento', decoracion: 'decoracion globos',
    hombre: 'regalos hombre', mujer: 'regalos mujer', nino: 'regalos nino', nina: 'regalos nina',
    combos_alimentos: 'combos alimentos bebidas comida', combos_cumple: 'combos cumpleanos cumpleaños'
  };

  function install(){
    const catalog = document.getElementById('catalogo');
    const heading = catalog && catalog.querySelector('.catalog-head');
    const grid = document.getElementById('productGrid');
    const pills = document.getElementById('pills');
    if(!catalog || !heading || !grid || !pills || document.getElementById('catalogSearch')) return;

    const style = document.createElement('style');
    style.id = 'catalog-search-styles';
    style.textContent = `
      #catalogSearch{width:min(100%,620px);margin:-20px auto 34px;}
      #catalogSearch .search-box{display:flex;align-items:center;gap:12px;min-height:58px;padding:0 16px 0 19px;background:#fff;border:1px solid #f0dfe2;border-radius:999px;box-shadow:0 12px 30px -20px rgba(110,48,62,.42);transition:border-color .2s,box-shadow .2s,transform .2s;}
      #catalogSearch .search-box:focus-within{border-color:#c98f9b;box-shadow:0 14px 32px -18px rgba(150,77,94,.48);transform:translateY(-1px);}
      #catalogSearch .search-icon{width:20px;height:20px;flex:none;color:#a86f7b;}
      #catalogSearch input{width:100%;min-width:0;border:0;outline:0;background:transparent;color:#3a2528;font:500 15px var(--font-body);}
      #catalogSearch input::placeholder{color:#9a8a8d;opacity:1;}
      #catalogSearch .search-clear{width:36px;height:36px;flex:none;border:0;border-radius:50%;background:transparent;color:#755c61;font:inherit;font-size:21px;cursor:pointer;}
      #catalogSearch .search-clear:hover{background:#fff1f3;color:#9f5d6a;}
      #catalogSearch .search-status{min-height:20px;margin:7px 12px 0;color:#817276;font-size:12px;text-align:left;}
      #catalogSearch .search-empty{grid-column:1/-1;padding:42px 20px;text-align:center;background:#fff;border:1px solid #f3e1e3;border-radius:18px;box-shadow:0 12px 34px -24px rgba(201,143,155,.4);}
      #catalogSearch .search-empty p{margin:0 0 16px;color:#625257;font-size:15px;}
      #catalogSearch .search-empty .quote-btn{background:#fff;border:1px solid #c98f9b;color:#a86f7b;border-radius:99px;padding:11px 20px;font:700 12px var(--font-body);letter-spacing:.04em;cursor:pointer;}
      #catalogSearch .search-empty .quote-btn:hover{background:#fff1f3;}
      [data-theme="dark"] #catalogSearch .search-box,[data-theme="dark"] #catalogSearch .search-empty{background:#2b1019;border-color:rgba(253,232,240,.18);}
      [data-theme="dark"] #catalogSearch input{color:#fde8f0;}
      [data-theme="dark"] #catalogSearch .search-status{color:rgba(253,232,240,.7);}
      [data-theme="dark"] #catalogSearch .search-empty p{color:#fde8f0;}
      @media(max-width:640px){#catalogSearch{margin:-16px auto 28px;padding:0 2px;}#catalogSearch .search-box{min-height:54px;padding:0 13px 0 16px;}#catalogSearch input{font-size:14px;}#catalogSearch .search-status{margin-left:8px;}}
      @media(prefers-reduced-motion:reduce){#catalogSearch .search-box{transition:none;}}
    `;
    document.head.appendChild(style);

    const form = document.createElement('form');
    form.id = 'catalogSearch';
    form.setAttribute('role', 'search');
    form.innerHTML = `
      <div class="search-box">
        <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-4-4"></path></svg>
        <input id="catalogSearchInput" type="search" placeholder="¿Qué estás buscando?" autocomplete="off" aria-label="Buscar productos por nombre, categoría o descripción" aria-controls="productGrid">
        <button class="search-clear" type="button" aria-label="Limpiar búsqueda" title="Limpiar búsqueda" hidden>×</button>
      </div>
      <div class="search-status" id="catalogSearchStatus" role="status" aria-live="polite" aria-atomic="true"></div>`;
    heading.insertAdjacentElement('afterend', form);

    const input = form.querySelector('#catalogSearchInput');
    const clearButton = form.querySelector('.search-clear');
    const status = form.querySelector('#catalogSearchStatus');
    let debounceTimer = null;
    const originalRenderGrid = window.renderGrid;

    function categoryText(product){
      const categories = Array.isArray(product.cat) ? product.cat : [product.cat];
      return categories.map((cat) => `${cat || ''} ${categoryNames[cat] || ''}`).join(' ');
    }

    function renderSearchResults(){
      const term = normalize(input.value);
      const words = term ? term.split(' ').filter(Boolean) : [];
      const allProducts = Array.isArray(window.PRODUCTS) ? window.PRODUCTS : [];
      const filtered = words.length ? allProducts.filter((product) => {
        const searchable = normalize([
          product.name, product.desc, categoryText(product), product.keywords,
          product.tags, product.palabrasClave, product.descripcion
        ].join(' '));
        return words.every((word) => searchable.includes(word));
      }) : allProducts;

      // Dejar que el renderizador oficial genere las tarjetas originales. El
      // renderizador de categoría sigue aplicándose a esta lista filtrada.
      if(typeof originalRenderGrid === 'function'){
        window.PRODUCTS = filtered;
        try { originalRenderGrid(); }
        finally { window.PRODUCTS = allProducts; }
      }

      const cards = Array.from(grid.children).filter((child) => child.classList.contains('card'));
      const visibleCount = cards.length;
      status.textContent = !term ? '' : visibleCount === 1
        ? '1 producto encontrado'
        : `${visibleCount} productos encontrados`;

      const oldEmpty = grid.querySelector('.search-empty');
      if(oldEmpty) oldEmpty.remove();
      if(term && visibleCount === 0){
        const empty = document.createElement('div');
        empty.className = 'search-empty';
        empty.innerHTML = '<p>No encontramos productos con esa búsqueda</p><button class="quote-btn" type="button">Ver todos los productos</button>';
        empty.querySelector('button').addEventListener('click', () => {
          input.value = '';
          clearButton.hidden = true;
          if(typeof window.setCat === 'function') window.setCat('all');
          else renderSearchResults();
          input.focus();
        });
        grid.replaceChildren(empty);
      }
    }

    form.addEventListener('submit', (event) => event.preventDefault());
    input.addEventListener('input', () => {
      clearButton.hidden = !input.value;
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(renderSearchResults, 60);
    });
    clearButton.addEventListener('click', () => {
      input.value = '';
      clearButton.hidden = true;
      renderSearchResults();
      input.focus();
    });

    if(typeof originalRenderGrid === 'function' && !originalRenderGrid.__catalogSearchWrapped){
      const wrappedRenderGrid = function(){
        if(input.value.trim()) renderSearchResults();
        else originalRenderGrid.apply(this, arguments);
      };
      wrappedRenderGrid.__catalogSearchWrapped = true;
      window.renderGrid = wrappedRenderGrid;
    }
    window.addEventListener('products:ready', () => {
      clearTimeout(debounceTimer);
      renderSearchResults();
    });
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, {once:true});
  else install();
})();

/* ===================== INIT (compartido) ===================== */
(function initSite(){
  const savedTheme = localStorage.getItem('fc_theme');
  if(savedTheme === 'dark'){
    document.body.setAttribute('data-theme', 'dark');
    const btn = document.getElementById('themeBtn');
    if(btn) btn.textContent = '☀️';
  }
  showCookieBannerIfNeeded();
})();
