/* ===== NARIN MARKET – script ===== */
"use strict";

/* ---------- Data ---------- */
const CATEGORIES = [
  { id: "fruits", name: "Fruits & Vegetables", img: "cat-fruits" },
  { id: "dairy",  name: "Dairy Products",      img: "cat-dairy" },
  { id: "meat",   name: "Meat & Chicken",      img: "cat-meat" },
  { id: "drinks", name: "Drinks",              img: "cat-drinks" },
  { id: "sweets", name: "Sweets & Snacks",     img: "cat-sweets" },
  { id: "bakery", name: "Bakery Products",     img: "cat-bakery" }
];
// [id, name, category, price, oldPrice|0, rating, description]
const RAW = [
  ["apple","Red Apples","fruits",120,150,4.8,"Crisp and sweet apples from local orchards. Price per kg."],
  ["banana","Bananas","fruits",110,0,4.6,"Ripe, naturally sweet bananas. A perfect quick snack. Price per kg."],
  ["tomato","Tomatoes","fruits",140,175,4.7,"Juicy sun-ripened tomatoes for salads and cooking. Price per kg."],
  ["cucumber","Cucumbers","fruits",90,0,4.5,"Fresh and crunchy greenhouse cucumbers. Price per kg."],
  ["carrot","Carrots","fruits",60,0,4.4,"Sweet orange carrots, rich in vitamins. Price per kg."],
  ["milk","Fresh Milk 1L","dairy",95,0,4.9,"Whole pasteurized milk from local farms."],
  ["cheese","Cheese 300g","dairy",320,400,4.8,"Mild, creamy cheese, aged for a rich flavor."],
  ["yogurt","Natural Yogurt","dairy",70,0,4.6,"Thick natural yogurt with live cultures, no sugar added."],
  ["butter","Butter 200g","dairy",210,0,4.7,"Real creamy butter, perfect on fresh bread."],
  ["chicken","Chicken Breast","meat",380,450,4.7,"Tender, lean chicken breast. Price per kg."],
  ["beef","Beef Steak","meat",720,0,4.9,"Premium beef cut, great for grilling. Price per kg."],
  ["sausages","Sausages 500g","meat",290,360,4.3,"Juicy sausages made from quality meat."],
  ["water","Mineral Water 1.5L","drinks",45,0,4.5,"Naturally sparkling mineral water from mountain springs."],
  ["juice","Orange Juice 1L","drinks",160,200,4.6,"100% pressed orange juice with no added sugar."],
  ["coffee","Ground Coffee 250g","drinks",450,0,4.8,"Medium roast, rich aroma, smooth taste."],
  ["chocolate","Milk Chocolate","sweets",130,170,4.9,"Smooth milk chocolate bar for sweet moments."],
  ["cookies","Butter Cookies","sweets",110,0,4.6,"Crumbly butter cookies, baked the classic way."],
  ["candy","Fruit Candies 300g","sweets",95,120,4.2,"Colorful candies with real fruit flavors."],
  ["bread","Fresh Bread","bakery",35,0,4.8,"Soft inside, crusty outside. Baked every morning."],
  ["croissant","Butter Croissant","bakery",65,85,4.9,"Flaky, golden croissant baked with real butter."],
  ["baguette","French Baguette","bakery",55,0,4.7,"Traditional baguette with a crisp crust."]
];
const PRODUCTS = RAW.map(([id,name,cat,price,old,rating,desc]) => ({
  id, name, cat, price, old, rating, desc,
  discount: old ? Math.round((1 - price / old) * 100) : 0
}));
const DELIVERY_FEE = 150, FREE_FROM = 1500;

/* ---------- State ---------- */
const state = {
  cart: load("nm-cart", {}),   // { productId: quantity }
  favs: load("nm-favs", []),   // [productId]
  category: "all", query: "", favOnly: false
};
function load(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } }
function save() {
  try { localStorage.setItem("nm-cart", JSON.stringify(state.cart)); localStorage.setItem("nm-favs", JSON.stringify(state.favs)); } catch {}
}

/* ---------- Helpers ---------- */
const $ = (s, r = document) => r.querySelector(s);
const money = n => n.toLocaleString("en-US") + " KGS";
const catName = id => CATEGORIES.find(c => c.id === id).name;
const find = id => PRODUCTS.find(p => p.id === id);
const stars = r => "★".repeat(Math.round(r)) + "☆".repeat(5 - Math.round(r));

let toastTimer;
function toast(msg) {
  const t = $("#toast"); t.textContent = msg; t.classList.add("show");
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove("show"), 2000);
}

/* ---------- Rendering: categories ---------- */
function renderCategories() {
  $("#catGrid").innerHTML = CATEGORIES.map(c => {
    const n = PRODUCTS.filter(p => p.cat === c.id).length;
    return `<button class="cat ${state.category === c.id ? "active" : ""}" data-cat="${c.id}">
      <img src="images/${c.img}.svg" alt="${c.name}"><b>${c.name}</b><small>${n} products</small></button>`;
  }).join("");
  $("#chips").innerHTML = [{ id: "all", name: "All" }, ...CATEGORIES].map(c =>
    `<button class="chip ${state.category === c.id ? "active" : ""}" data-cat="${c.id}">${c.name}</button>`).join("");
  $("#footCats").innerHTML = CATEGORIES.map(c => `<a href="#products" data-cat="${c.id}">${c.name}</a>`).join("");
}

/* ---------- Rendering: product cards ---------- */
function cardHTML(p) {
  const fav = state.favs.includes(p.id);
  return `<article class="card">
    ${p.discount ? `<span class="badge">-${p.discount}%</span>` : ""}
    <button class="fav ${fav ? "on" : ""}" data-fav="${p.id}" aria-label="Favorite">${fav ? "♥" : "♡"}</button>
    <div class="card-img" data-open="${p.id}"><img src="images/${p.id}.svg" alt="${p.name}" loading="lazy"></div>
    <div class="card-body">
      <small>${catName(p.cat)}</small>
      <h3 data-open="${p.id}">${p.name}</h3>
      <div class="stars">${stars(p.rating)}<span>${p.rating}</span></div>
      <div class="price-row">
        <div class="price">${money(p.price)}${p.old ? `<s>${p.old}</s>` : ""}</div>
        <button class="add" data-add="${p.id}">Add to Cart</button>
      </div>
    </div></article>`;
}
function renderProducts() {
  const q = state.query.trim().toLowerCase();
  const list = PRODUCTS.filter(p =>
    (state.category === "all" || p.cat === state.category) &&
    (!state.favOnly || state.favs.includes(p.id)) &&
    (!q || p.name.toLowerCase().includes(q) || catName(p.cat).toLowerCase().includes(q)));
  $("#productGrid").innerHTML = list.map(cardHTML).join("");
  $("#empty").hidden = list.length > 0;
  $("#productsTitle").textContent = state.favOnly ? "Your favorites"
    : state.category === "all" ? "All products" : catName(state.category);
  $("#offerGrid").innerHTML = PRODUCTS.filter(p => p.discount >= 20).slice(0, 4).map(cardHTML).join("");
  $("#favCount").textContent = state.favs.length;
}
function renderAll() { renderCategories(); renderProducts(); renderCart(); }

/* ---------- Cart ---------- */
function cartTotals() {
  const items = Object.entries(state.cart).map(([id, q]) => ({ p: find(id), q }));
  const count = items.reduce((s, i) => s + i.q, 0);
  const subtotal = items.reduce((s, i) => s + i.p.price * i.q, 0);
  const delivery = !count || subtotal >= FREE_FROM ? 0 : DELIVERY_FEE;
  return { items, count, subtotal, delivery, total: subtotal + delivery };
}
function renderCart() {
  const { items, count, subtotal, delivery, total } = cartTotals();
  $("#cartCount").textContent = count;
  $("#cartItems").innerHTML = items.length ? items.map(({ p, q }) => `
    <div class="ci"><img src="images/${p.id}.svg" alt="">
      <div><b>${p.name}</b><small>${money(p.price)}</small>
        <div class="qty"><button data-dec="${p.id}" aria-label="Decrease">−</button><span>${q}</span><button data-inc="${p.id}" aria-label="Increase">+</button></div></div>
      <div><b>${money(p.price * q)}</b><button class="rm" data-rm="${p.id}">Remove</button></div></div>`).join("")
    : `<p class="empty">Your cart is empty. Add something fresh!</p>`;
  $("#subtotal").textContent = money(subtotal);
  $("#delivery").textContent = delivery ? money(delivery) : "Free";
  $("#total").textContent = money(total);
  $("#cartFoot").style.display = count ? "grid" : "none";
  save();
}
function addToCart(id, n = 1) {
  state.cart[id] = (state.cart[id] || 0) + n;
  renderCart(); toast("Product added to cart!");
}
function changeQty(id, d) {
  state.cart[id] += d;
  if (state.cart[id] <= 0) delete state.cart[id];
  renderCart();
}
function toggleFav(id) {
  const i = state.favs.indexOf(id);
  i > -1 ? state.favs.splice(i, 1) : state.favs.push(id);
  save(); renderProducts();
  toast(i > -1 ? "Removed from favorites" : "Added to favorites!");
}
function openCart(open) {
  $("#cart").classList.toggle("open", open);
  $("#overlay").classList.toggle("show", open);
}

/* ---------- Product modal ---------- */
function openModal(id) {
  const p = find(id); let qty = 1;
  $("#modalBox").innerHTML = `<img src="images/${p.id}.svg" alt="${p.name}">
    <div class="m-info"><button class="x" data-close-modal>✕</button>
      <small class="muted">${catName(p.cat)}</small><h3>${p.name}</h3>
      <div class="stars">${stars(p.rating)}<span>${p.rating} / 5</span></div>
      <p class="muted">${p.desc}</p>
      <div class="price">${money(p.price)}${p.old ? `<s>${p.old}</s>` : ""}</div>
      <div class="m-actions"><div class="qty"><button id="mDec">−</button><span id="mQty">1</span><button id="mInc">+</button></div>
      <button class="btn" id="mAdd">Add to Cart</button></div></div>`;
  $("#mDec").onclick = () => $("#mQty").textContent = qty = Math.max(1, qty - 1);
  $("#mInc").onclick = () => $("#mQty").textContent = ++qty;
  $("#mAdd").onclick = () => { addToCart(id, qty); closeModal(); };
  $("#modal").classList.add("show");
}
function closeModal() { $("#modal").classList.remove("show"); }

/* ---------- Events (one delegated listener) ---------- */
document.addEventListener("click", e => {
  const t = e.target.closest("button, a, [data-open]"); if (!t) return;
  const d = t.dataset;
  if (d.add) addToCart(d.add);
  else if (d.fav) toggleFav(d.fav);
  else if (d.open) openModal(d.open);
  else if (d.inc) changeQty(d.inc, 1);
  else if (d.dec) changeQty(d.dec, -1);
  else if (d.rm) changeQty(d.rm, -state.cart[d.rm]);
  else if (d.cat) {                       // category filter
    state.category = d.cat; state.favOnly = false; state.query = ""; $("#searchInput").value = "";
    renderCategories(); renderProducts();
    $("#products").scrollIntoView({ behavior: "smooth" });
    closeMenu();
  }
  else if (t.id === "showAll") { state.category = "all"; state.favOnly = false; renderAll(); }
  else if (t.id === "openFav") {
    state.favOnly = !state.favOnly; renderProducts();
    $("#products").scrollIntoView({ behavior: "smooth" });
    if (state.favOnly) toast("Showing your favorites");
  }
  else if (t.id === "openCart") openCart(true);
  else if (t.id === "checkout") { toast("Thank you! Order placed."); state.cart = {}; renderCart(); openCart(false); }
  else if (t.hasAttribute("data-close")) openCart(false);
  else if (t.hasAttribute("data-close-modal")) closeModal();
  else if (t.id === "burger") toggleMenu();
  else if (t.closest("#menu")) closeMenu();
});
$("#overlay").onclick = () => openCart(false);
$("#modal").onclick = e => { if (e.target.id === "modal") closeModal(); };
document.addEventListener("keydown", e => { if (e.key === "Escape") { closeModal(); openCart(false); } });

/* Live search */
$("#searchInput").addEventListener("input", e => {
  state.query = e.target.value; state.category = "all"; state.favOnly = false;
  renderCategories(); renderProducts();
  if (state.query) $("#products").scrollIntoView({ behavior: "smooth" });
});

/* Mobile menu */
function toggleMenu() {
  const open = $("#menu").classList.toggle("open");
  $("#burger").classList.toggle("open", open);
  $("#header").classList.toggle("show-search", open);
}
function closeMenu() {
  $("#menu").classList.remove("open"); $("#burger").classList.remove("open"); $("#header").classList.remove("show-search");
}

/* Sticky header shadow */
addEventListener("scroll", () => $("#header").classList.toggle("scrolled", scrollY > 10));

/* Contact form */
$("#contactForm").addEventListener("submit", e => { e.preventDefault(); e.target.reset(); toast("Message sent! We will reply soon."); });

renderAll();
