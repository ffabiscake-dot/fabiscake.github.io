/* ===================== CONFIG DEL NEGOCIO ===================== */
const WHATSAPP_NUMBER = "5352076748"; // +53 5 2076748

const CATEGORIES = [
  {id:'all', label:'Todos'},
  {id:'cakes', label:'Cakes personalizados'},
  {id:'postres', label:'Postres y bufet'},
  {id:'ramos', label:'Ramos de rosas'},
  {id:'decoracion', label:'Decoración con globos'},
  {id:'hombre', label:'Regalos hombre'},
  {id:'mujer', label:'Regalos mujer'},
  {id:'nino', label:'Regalos niño'},
  {id:'nina', label:'Regalos niña'},
];

const SERVICES = [
  {ico:'🎈', name:'Decoración con globos', desc:'Arcos, columnas y arreglos temáticos para cualquier celebración.'},
  {ico:'🎂', name:'Decoración de cumpleaños', desc:'Ambientación completa acorde al tema elegido.'},
  {ico:'💍', name:'Decoración de bodas', desc:'Montaje elegante para tu día especial.'},
  {ico:'👑', name:'Decoración de XV años', desc:'Escenografía a la medida para la quinceañera.'},
  {ico:'🍼', name:'Baby Shower', desc:'Decoración tierna y personalizada para la futura mamá.'},
  {ico:'🎊', name:'Aniversarios y eventos corporativos', desc:'Ambientación profesional para toda ocasión.'},
  {ico:'📋', name:'Organización de eventos', desc:'Coordinación integral de tu celebración de principio a fin.'},
  {ico:'🦸', name:'Entrega con personajes disfrazados', desc:'Sorprende con la entrega de regalos y cakes por un personaje.'},
  {ico:'🍬', name:'Mesa de dulces / Candy Bar', desc:'Montaje de mesa dulce con packaging a juego con tu evento.'},
];

/* ===================== ESTADO ===================== */
let cart = JSON.parse(sessionStorage.getItem('fc_cart') || '[]');
let activeCat = 'all';

function saveCart(){ sessionStorage.setItem('fc_cart', JSON.stringify(cart)); renderCart(); }

/* ===================== RENDER CATÁLOGO ===================== */
function renderPills(){
  const el = document.getElementById('pills');
  el.innerHTML = CATEGORIES.map(c => `<div class="pill ${c.id===activeCat?'active':''}" onclick="setCat('${c.id}')">${c.label}</div>`).join('');
}
function setCat(id){ activeCat = id; renderPills(); renderGrid(); }

function money(n){ return n.toLocaleString('es'); }

function matchesCat(p, catId){
  if(catId === 'all') return true;
  if(Array.isArray(p.cat)) return p.cat.includes(catId);
  return p.cat === catId;
}

function renderGrid(){
  const el = document.getElementById('productGrid');
  const list = activeCat==='all' ? PRODUCTS : PRODUCTS.filter(p=>matchesCat(p, activeCat));
  el.innerHTML = list.map(p => {
    const media = p.img
      ? `<div class="card-media" style="background-image:url('${p.img}')"></div>`
      : `<div class="card-media">${p.icon}</div>`;
    const priceLabel = p.unit === 'unidad'
      ? `$${money(p.price)} <small>/ unidad</small>`
      : `$${money(p.price)} <small>CUP</small>`;
    const addControl = p.unit === 'unidad'
      ? `<div class="qty-add">
           <input type="number" min="1" value="1" id="qtyinput-${p.row}" class="qty-input">
           <button class="add-btn" onclick="addToCart(${p.row})">+</button>
         </div>`
      : `<button class="add-btn" onclick="addToCart(${p.row})">+</button>`;
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
  document.getElementById('servicesGrid').innerHTML = SERVICES.map(s => `
    <div class="svc-card">
      <span class="ico">${s.ico}</span>
      <h4>${s.name}</h4>
      <p>${s.desc}</p>
    </div>`).join('');
}

/* ===================== CARRITO ===================== */
function addToCart(row){
  const p = PRODUCTS.find(x=>x.row===row);
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
    <div class="row-total"><span>Envío</span><span>Según distancia</span></div>
    <div class="row-total"><b>Total</b><b>$${money(subtotal)} CUP</b></div>
    <button class="btn btn-primary" style="width:100%;justify-content:center;margin-top:10px;" onclick="openOrderModal()">Continuar pedido</button>`;
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
  msg += `Hora: ${time}%0A`;
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
  renderGrid();
  renderServices();
  renderCart();
})();
