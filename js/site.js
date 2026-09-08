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
  // Enlaza a la política de cookies para que el usuario revise el detalle antes de decidir.
  window.location.href = (document.body.getAttribute('data-root') || '') + 'cookies.html';
}
function showCookieBannerIfNeeded(){
  const pref = localStorage.getItem('fc_cookies');
  const b = document.getElementById('cookieBanner');
  if(!pref && b) b.classList.add('show');
}

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
