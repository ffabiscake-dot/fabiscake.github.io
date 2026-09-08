/* ===================== CONFIG DEL NEGOCIO ===================== */
const WHATSAPP_NUMBER = "5352076748"; // +53 5 2076748

const CATEGORIES = [
  {id:'all', label:'Todos', sub:[]},
  {id:'destacados', label:'⭐ Destacados', sub:[]},
  {id:'cakes', label:'Cakes', sub:['cakes']},
  {id:'postres', label:'Postres', sub:['postres']},
  {id:'regalos', label:'Regalos', sub:['hombre','mujer','nino','nina']},
  {id:'flores', label:'Flores', sub:['ramos']},
  {id:'combos', label:'Combos', sub:['combos_alimentos','combos_cumple']},
  {id:'celebraciones', label:'Celebraciones', sub:['decoracion','sorpresas']},
];

const ICONS = {
  globos: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="8.5" cy="7.5" r="4.5"/><circle cx="15.5" cy="10" r="3.5"/><path d="M8.5 12 7.4 20.5"/><path d="M8.5 12l1.1 1.2 1.1-1.2"/><path d="M15.5 13.5 14.6 20.5"/></svg>',
  pastel: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 18h15"/><path d="M5.5 18v-2.5a6.5 6.5 0 0 1 13 0V18"/><path d="M12 8.5V5.5"/><path d="M9.5 4 12 1.5 14.5 4"/><path d="M8 11.5h.01M12 13h.01M16 11.5h.01"/></svg>',
  anillos: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="13.5" r="3.5"/><circle cx="15" cy="13.5" r="3.5"/><path d="m12 3 1.7 2.4L12 7.8l-1.7-2.4z"/></svg>',
  corona: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17h18"/><path d="M4.2 17 5.8 7l3.9 3.3L12 4.5l2.3 5.8L18.2 7l1.6 10"/></svg>',
  bebe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="11.5" r="7.5"/><path d="M12 4a2.6 2.6 0 0 0-2.5 2.6c0 .6.2 1.1.5 1.6"/><circle cx="9.3" cy="12" r=".6" fill="currentColor" stroke="none"/><circle cx="14.7" cy="12" r=".6" fill="currentColor" stroke="none"/><path d="M9.6 15.3c1 .7 3.8.7 4.8 0"/></svg>',
  edificio: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="3.5" width="9.5" height="17" rx="1"/><path d="M14.5 8.5h4.5v12"/><path d="M8 8h3.5"/><path d="M8 12h3.5"/><path d="M8 16h3.5"/><path d="M17 12h.01M17 16h.01"/></svg>',
  calendario: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="5" width="16" height="15.5" rx="2"/><path d="M4 9.5h16"/><path d="M8.5 3v4"/><path d="M15.5 3v4"/></svg>',
  mascara: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11.5c0-3.2 1.6-5.2 8-5.2s8 2 8 5.2-1.6 5.8-8 5.8-8-2.6-8-5.8z"/><circle cx="9" cy="11.5" r="1.1" fill="currentColor" stroke="none"/><circle cx="15" cy="11.5" r="1.1" fill="currentColor" stroke="none"/></svg>',
  caramelo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="9" r="6"/><path d="M8.7 6.8a3.3 3.3 0 0 1 6.6 0 3.3 3.3 0 0 1-6.6 0z"/><path d="M12 15v6"/><path d="m12 21-2.6-2.4"/></svg>',
};

const SERVICES = [
  {icon:ICONS.globos, name:'Decoración con globos', desc:'Arcos, columnas y arreglos personalizados para darle vida a tu celebración.', featured:true, img:'assets/products/decoracion-con-globos-sencilla-61.jpg'},
  {icon:ICONS.pastel, name:'Decoración de cumpleaños', desc:'Ambientación completa y personalizada para celebrar un día inolvidable.', featured:true, img:'assets/products/decoracion-interior-set-principal-68.jpg'},
  {icon:ICONS.anillos, name:'Decoración de bodas', desc:'Decoración elegante y romántica diseñada para tu día especial.', featured:true, img:'assets/products/torta-o-pastel-de-15-o-para-bodas-6.jpg'},
  {icon:ICONS.corona, name:'Decoración de XV años', desc:'Creamos una ambientación única para celebrar tus quince años.', featured:true, img:'assets/products/decoracion-de-espacios-grandes-para-15-anos-65.jpg'},
  {icon:ICONS.calendario, name:'Organización de eventos', desc:'Coordinamos cada detalle para que disfrutes tu evento sin preocupaciones.'},
  {icon:ICONS.mascara, name:'Entrega con personajes disfrazados', desc:'Una sorpresa especial para niños y adultos con personajes para tu celebración.'},
  {icon:ICONS.caramelo, name:'Mesa de dulces / Candy Bar', desc:'Una mesa dulce personalizada que combina sabor, decoración y estilo.'},
];

/* ===================== ESTADO ===================== */
let cart = JSON.parse(sessionStorage.getItem('fc_cart') || '[]');
let activeCat = 'all';

function saveCart(){ sessionStorage.setItem('fc_cart', JSON.stringify(cart)); renderCart(); }

/* ===================== RENDER CATÁLOGO ===================== */
function renderPills(){
  const el = document.getElementById('pills');
  el.innerHTML = CATEGORIES.map(c => `<button type="button" class="pill ${c.id===activeCat?'active':''}" aria-pressed="${c.id===activeCat}" onclick="setCat('${c.id}')">${c.label}</button>`).join('');
}
function setCat(id){ activeCat = id; renderPills(); renderGrid(); }

function money(n){ return n.toLocaleString('es'); }

function matchesCat(p, catId){
  if(catId === 'all') return true;
  if(catId === 'destacados') return !!p.destacado;
  const cat = CATEGORIES.find(c=>c.id===catId);
  const allowed = cat && cat.sub && cat.sub.length ? cat.sub : [catId];
  if(Array.isArray(p.cat)) return p.cat.some(c=>allowed.includes(c));
  return allowed.includes(p.cat);
}

function renderGrid(){
  const el = document.getElementById('productGrid');
  const list = activeCat==='all' ? PRODUCTS : PRODUCTS.filter(p=>matchesCat(p, activeCat));
  el.innerHTML = list.map(p => {
    const media = p.img
      ? `<div class="card-media" style="background-image:url('${p.img}')" role="img" aria-label="${p.name}"></div>`
      : `<div class="card-media">${p.icon}</div>`;
    if(p.unit === 'cotizar'){
      return `<div class="card">
        ${media}
        <div class="card-body">
          <h3>${p.name}</h3>
          <p>${p.desc}</p>
          <div class="price-row">
            <span class="price quote">Precio a cotizar</span>
            <button type="button" class="quote-btn" onclick="quoteWA('${p.name.replace(/'/g,"")}')">Cotizar</button>
          </div>
        </div>
      </div>`;
    }
    const priceLabel = p.unit === 'unidad'
      ? `$${money(p.price)} <small>/ ${p.unit_label || 'unidad'}</small>`
      : `$${money(p.price)} <small>CUP</small>`;
    const cartIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>';
    const addControl = p.unit === 'unidad'
      ? `<div class="qty-add">
           <input type="number" min="1" value="1" id="qtyinput-${p.row}" class="qty-input" aria-label="Cantidad">
           <button type="button" class="add-btn" onclick="addToCart('${p.row}')"><span class="add-plus" aria-hidden="true">${cartIcon}</span><span class="add-label">Agregar</span></button>
         </div>`
      : `<button type="button" class="add-btn" onclick="addToCart('${p.row}')"><span class="add-plus" aria-hidden="true">${cartIcon}</span><span class="add-label">Agregar</span></button>`;
    return `<div class="card">
      ${media}
      <div class="card-body">
        <h3>${p.name}</h3>
        <p>${p.desc}</p>
        <div class="price-row">
          <span class="price">${priceLabel}</span>
          ${addControl}
        </div>
      </div>
    </div>`;
  }).join('');
}

function renderServices(){
  document.getElementById('servicesGrid').innerHTML = SERVICES.map(s => {
    const featured = s.featured ? ' svc-featured' : '';
    const media = s.img ? `<div class="svc-media" style="background-image:url('${s.img}')" role="img" aria-label="${s.name}"></div>` : '';
    return `
    <div class="svc-card${featured}">
      ${media}
      <div class="svc-body">
        <span class="svc-icon">${s.icon}</span>
        <h4>${s.name}</h4>
        <p>${s.desc}</p>
        <a href="#contacto" class="svc-link">Ver servicio <span aria-hidden="true">→</span></a>
      </div>
    </div>`;
  }).join('');
}

/* ===================== CARRITO ===================== */
function addToCart(row){
  const p = PRODUCTS.find(x=>String(x.row)===String(row));
  if(!p) return;
  let qtyToAdd = 1;
  if(p.unit === 'unidad'){
    const input = document.getElementById(`qtyinput-${row}`);
    if(input){
      qtyToAdd = parseInt(input.value, 10);
      if(!qtyToAdd || qtyToAdd < 1) qtyToAdd = 1;
    }
  }
  const existing = cart.find(i=>i.row===row);
  if(existing){ existing.qty += qtyToAdd; } else { cart.push({row:p.row, name:p.name, price:p.price, unit:p.unit, qty:qtyToAdd}); }
  saveCart();
  openCart();
}
function changeQty(i, delta){
  cart[i].qty += delta;
  if(cart[i].qty<=0) cart.splice(i,1);
  saveCart();
}
function removeItem(i){ cart.splice(i,1); saveCart(); }

function renderCart(){
  document.getElementById('cartCount').textContent = cart.reduce((a,i)=>a+i.qty,0);
  const body = document.getElementById('cartBody');
  const foot = document.getElementById('cartFoot');
  if(cart.length===0){
    body.innerHTML = `<div class="empty-cart">🛒<br>Tu carrito está vacío.<br>Agrega productos del catálogo.</div>`;
    foot.innerHTML = '';
    return;
  }
  body.innerHTML = cart.map((i,idx)=>{
    const p = PRODUCTS.find(x=>x.row===i.row);
    const bg = p && p.img ? `style="background-image:url('${p.img}')"` : '';
    return `
    <div class="cart-item">
      <div class="ico" ${bg}>${p && p.img ? '' : (p?p.icon:'🎂')}</div>
      <div class="meta">
        <h4>${i.name}</h4>
        <small>$${money(i.price)} ${i.unit==='unidad'?'c/u':''}</small>
        <div class="qty-ctrl">
          <button onclick="changeQty(${idx},-1)">−</button>
          <span>${i.qty}</span>
          <button onclick="changeQty(${idx},1)">+</button>
        </div>
      </div>
      <button class="remove" onclick="removeItem(${idx})">Quitar</button>
    </div>`;
  }).join('');
  const subtotal = cart.reduce((a,i)=>a+i.price*i.qty,0);
  foot.innerHTML = `
    <div class="row-total"><span>Subtotal</span><span>$${money(subtotal)} CUP</span></div>
    <div class="delivery-note"><span class="delivery-note-title">🚚 Entrega a domicilio</span><span class="delivery-note-desc">El costo se calcula según la distancia y se confirma por WhatsApp</span></div>
    <div class="row-total"><b>Total</b><b>$${money(subtotal)} CUP</b></div>
    <div class="zelle-note">💳 También aceptamos pagos por <b>Zelle</b></div>
    <button class="btn btn-cart-continue" onclick="openOrderModal()">Continuar pedido<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button>`;
}

function openCart(){ document.getElementById('cartDrawer').classList.add('open'); document.getElementById('overlay').classList.add('open'); }
function closeCart(){ document.getElementById('cartDrawer').classList.remove('open'); document.getElementById('overlay').classList.remove('open'); }

/* ===================== MODAL DE PEDIDO ===================== */
function openOrderModal(){
  if(cart.length===0){ alert('Agrega al menos un producto al carrito antes de continuar.'); return; }
  closeCart();
  document.getElementById('orderModal').classList.add('open');
  document.getElementById('overlay').classList.add('open');
  const today = new Date(); today.setDate(today.getDate()+3);
  document.getElementById('f_date').min = today.toISOString().split('T')[0];
}
function closeModal(){ document.getElementById('orderModal').classList.remove('open'); document.getElementById('overlay').classList.remove('open'); }

function sendOrder(e){
  e.preventDefault();
  const name = document.getElementById('f_name').value;
  const phone = document.getElementById('f_phone').value;
  const email = document.getElementById('f_email').value;
  const date = document.getElementById('f_date').value;
  const time = document.getElementById('f_time').value;
  const ampm = document.getElementById('f_ampm').value;
  const address = document.getElementById('f_address').value;
  const city = document.getElementById('f_city').value;
  const eventType = document.getElementById('f_event').value;
  const guests = document.getElementById('f_guests').value;
  const delivery = document.getElementById('f_delivery').value;
  const notes = document.getElementById('f_notes').value;

  const subtotal = cart.reduce((a,i)=>a+i.price*i.qty,0);
  let msg = `Hola, deseo realizar el siguiente pedido en Fabi's Cake:%0A%0A*PRODUCTOS*%0A`;
  cart.forEach(i=>{
    msg += `${i.qty}x ${i.name} ............ $${money(i.price*i.qty)}%0A`;
  });
  msg += `%0A*TOTAL: $${money(subtotal)} CUP*%0A%0A`;
  msg += `*DATOS DEL PEDIDO*%0A`;
  msg += `Cliente: ${name}%0A`;
  msg += `Teléfono: ${phone}%0A`;
  if(email) msg += `Correo: ${email}%0A`;
  msg += `Fecha del evento: ${date}%0A`;
  msg += `Hora: ${time} ${ampm}%0A`;
  msg += `Tipo de evento: ${eventType}%0A`;
  if(guests) msg += `Invitados: ${guests}%0A`;
  msg += `Entrega: ${delivery}%0A`;
  msg += `Dirección: ${address}, ${city}%0A`;
  if(notes) msg += `Observaciones: ${notes}%0A`;
  msg += `%0AEsperamos confirmación del pedido. Gracias.`;

  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, '_blank');
  cart = []; saveCart(); closeModal();
  return false;
}

function quoteWA(productName){
  const msg = encodeURIComponent(`Hola, me gustaría cotizar: ${productName}. ¿Me pueden dar más información?`);
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, '_blank');
}

/* ===================== UI GENERAL ===================== */
function toggleTheme(){
  const body = document.body;
  const isDark = body.getAttribute('data-theme')==='dark';
  body.setAttribute('data-theme', isDark ? 'light' : 'dark');
  document.getElementById('themeBtn').textContent = isDark ? '🌙' : '☀️';
  localStorage.setItem('fc_theme', isDark ? 'light' : 'dark');
}
function toggleNav(){ document.getElementById('navLinks').classList.toggle('open'); }
function closeNav(){ document.getElementById('navLinks').classList.remove('open'); }

/* ===================== INIT ===================== */
(function init(){
  const savedTheme = localStorage.getItem('fc_theme');
  if(savedTheme==='dark'){ document.body.setAttribute('data-theme','dark'); document.getElementById('themeBtn').textContent='☀️'; }
  renderPills();
  renderServices();
  renderCart();
  initFabWhatsapp();

  // El catálogo se pinta aquí (con data.js como respaldo) y de nuevo cada
  // vez que Firestore envía datos actualizados (products-loader.js).
  renderGridIfReady();

  // Cuando products-loader.js recibe (o reutiliza el caché de) los productos
  // desde Firestore, re-renderiza el catálogo en tiempo real.
  window.addEventListener('products:ready', () => {
    renderPills();
    renderGrid();
  });
})();

function renderGridIfReady(){
  // Si aún no hay productos (ni data.js ni Firestore), muestra vacío sin errores.
  if(!Array.isArray(window.PRODUCTS)) return;
  renderGrid();
}

/* ===================== BOTÓN FLOTANTE WHATSAPP ===================== */
function initFabWhatsapp(){
  const fab = document.getElementById('fabWhatsapp');
  if(!fab) return;
  let tooltipTimeout;
  function showTooltip(){
    const tip = fab.querySelector('.fab-wa-tooltip');
    if(tip){ tip.style.opacity='1'; tip.style.visibility='visible'; }
  }
  function hideTooltip(){
    const tip = fab.querySelector('.fab-wa-tooltip');
    if(tip){ tip.style.opacity=''; tip.style.visibility=''; }
  }
  fab.addEventListener('touchstart', function(){
    showTooltip();
    clearTimeout(tooltipTimeout);
    tooltipTimeout = setTimeout(hideTooltip, 3000);
  }, {passive:true});
  fab.addEventListener('focus', showTooltip);
  fab.addEventListener('blur', hideTooltip);
  fab.addEventListener('mouseleave', hideTooltip);
}
