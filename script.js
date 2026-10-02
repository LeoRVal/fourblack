const PRODUCTS = [
  { id: "faith-big-logo", name: "Camiseta Faith Big Logo Preta", price: 92, image: "assets/Produtos/10.png", collection: "Faith", category: "Camisetas", color: "Preta", sizes: ["P", "M", "G", "GG", "XG"] },
  { id: "faith-small-logo", name: "Camiseta Faith Small Logo Preta", price: 92, image: "assets/Produtos/11.png", collection: "Faith", category: "Camisetas", color: "Preta", sizes: ["P", "M", "G", "GG", "XG"] },
  { id: "roda-de-samba", name: "Camiseta Roda de Samba Branca", price: 92, image: "assets/Produtos/12.png", collection: "Samba", category: "Camisetas", color: "Branca", sizes: ["P", "M", "G", "GG", "XG"] },
  { id: "almir-guineto", name: "Camiseta Almir Guineto Preta", price: 92, image: "assets/Produtos/13.png", collection: "Samba", category: "Camisetas", sizes: ["P", "M", "G", "GG", "XG"] },
  { id: "fluxo-cavity", name: "Camiseta Fluxo Cavity Branca", price: 92, image: "assets/Produtos/14.png", collection: "Street", category: "Camisetas", color: "Branca", sizes: ["P", "M", "G", "GG", "XG"] },
  { id: "turma-pagode", name: "Camiseta Turma do Pagode Preta", price: 92, image: "assets/Produtos/15.png", collection: "Urban", category: "Camisetas", sizes: ["P", "M", "G", "GG", "XG"] }
];

const CART_KEY = "fourblack-cart";
const ORDER_KEY = "fourblack-last-order";
const money = value => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
const getCart = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
    if (!Array.isArray(parsed)) {
      console.error("O carrinho salvo não possui um formato válido.");
      return [];
    }
    const validItems = parsed.filter(item => PRODUCTS.some(product => product.id === item.id) && Number.isInteger(item.quantity) && item.quantity > 0);
    if (validItems.length !== parsed.length) console.error("Um ou mais itens inválidos foram ignorados no carrinho.");
    return validItems;
  } catch (error) {
    console.error("Não foi possível ler o carrinho salvo.", error);
    return [];
  }
};
const saveCart = cart => {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartCount();
};
const findProduct = id => PRODUCTS.find(product => product.id === id);
const getShipping = subtotal => subtotal === 0 || subtotal >= 299 ? 0 : 19.9;
const updateCartCount = () => {
  const count = getCart().reduce((total, item) => total + item.quantity, 0);
  document.querySelectorAll(".cart-count").forEach(element => { element.textContent = String(count); });
};

function createProductCard(product, showCta = true, quickBuy = false) {
  return `<article class="product-card">
    <a class="product-card-image" href="produto.html?id=${encodeURIComponent(product.id)}" aria-label="Ver ${product.name}">
      <span class="tag">Novo</span><img src="${product.image}" alt="${product.name}" loading="lazy">
    </a>
    <div class="product-card-meta">
      <a class="product-card-title" href="produto.html?id=${encodeURIComponent(product.id)}">${product.name}</a>
      <p class="product-card-price">${money(product.price)}</p><p class="product-card-installments">ou 3x de ${money(product.price / 3)} sem juros</p>
      <div class="product-swatches" aria-label="Cores disponíveis"><i></i><i></i></div>
      ${showCta ? quickBuy
        ? `<button class="button button-dark product-cta" type="button" data-quick-buy="${product.id}">Comprar <span>＋</span></button>`
        : `<a class="button button-dark product-cta" href="produto.html?id=${encodeURIComponent(product.id)}">Ver produto <span>↗</span></a>` : ""}
    </div>
  </article>`;
}

function renderProductGrid() {
  document.querySelectorAll("[data-product-grid]").forEach(grid => {
    const mode = grid.dataset.productGrid;
    const products = mode === "featured" ? PRODUCTS : mode === "related" ? PRODUCTS.slice(1, 5) : PRODUCTS;
    grid.innerHTML = products.map(product => createProductCard(product, mode !== "featured", mode === "catalog")).join("");
    if (mode === "catalog") bindQuickBuyButtons(grid);
  });
}

function addProductToCart(product, size, color) {
  const cart = getCart();
  const existing = cart.find(item => item.id === product.id && item.size === size && item.color === color);
  if (existing) existing.quantity += 1;
  else cart.push({ id: product.id, quantity: 1, size, color });
  saveCart(cart);
}

function bindQuickBuyButtons(grid) {
  grid.querySelectorAll("[data-quick-buy]").forEach(button => {
    button.addEventListener("click", () => {
      const product = findProduct(button.dataset.quickBuy);
      if (!product) {
        console.error(`Produto não encontrado: ${button.dataset.quickBuy}`);
        showToast("Não foi possível adicionar esse produto.");
        return;
      }
      const size = "M";
      addProductToCart(product, size, product.color || "Preta");
      showToast(`Adicionado ao carrinho: ${product.name} · Tam. ${size}.`);
    });
  });
}

function setupListing() {
  const grid = document.querySelector('[data-product-grid="catalog"]');
  if (!grid) return;
  const params = new URLSearchParams(location.search);
  const categoryParam = params.get("categoria");
  const collectionParam = params.get("colecao");
  if (categoryParam) {
    const category = document.querySelector(`input[name="category"][value="${CSS.escape(categoryParam)}"]`);
    if (category) category.checked = true;
  }
  if (collectionParam) {
    const collection = [...document.querySelectorAll('input[name="collection"]')].find(input => input.value.toLowerCase() === collectionParam.toLowerCase());
    if (collection) collection.checked = true;
  }
  const render = () => {
    const categories = [...document.querySelectorAll('input[name="category"]:checked')].map(input => input.value);
    const collections = [...document.querySelectorAll('input[name="collection"]:checked')].map(input => input.value);
    const sizes = [...document.querySelectorAll('input[name="size"]:checked')].map(input => input.value);
    const maxPrice = Number(document.querySelector("#price-filter").value);
    const sort = document.querySelector("#sort-products").value;
    let visible = PRODUCTS.filter(product =>
      (!categories.length || categories.includes(product.category)) &&
      (!collections.length || collections.includes(product.collection)) &&
      (!sizes.length || sizes.some(size => product.sizes.includes(size))) &&
      product.price <= maxPrice
    );
    if (sort === "price-asc") visible = visible.sort((a, b) => a.price - b.price);
    if (sort === "price-desc") visible = visible.sort((a, b) => b.price - a.price);
    if (sort === "name") visible = visible.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
    grid.innerHTML = visible.map(product => createProductCard(product, true, true)).join("");
    bindQuickBuyButtons(grid);
    document.querySelector("[data-product-count]").textContent = String(visible.length);
    document.querySelector(".empty-state").hidden = visible.length > 0;
    document.querySelector("#price-output").textContent = money(maxPrice);
  };
  document.querySelectorAll(".filters input, #sort-products").forEach(input => input.addEventListener("input", render));
  document.querySelector(".filter-clear").addEventListener("click", () => {
    document.querySelectorAll(".filters input[type=checkbox]").forEach(input => { input.checked = false; });
    document.querySelector("#price-filter").value = "180";
    render();
  });
  document.querySelector(".mobile-filter-button").addEventListener("click", () => {
    const filters = document.querySelector(".filters");
    filters.classList.toggle("open");
    document.querySelector(".mobile-filter-button").setAttribute("aria-expanded", String(filters.classList.contains("open")));
  });
  render();
}

function setupProduct() {
  const name = document.querySelector("[data-product-name]");
  if (!name) return;
  const product = findProduct(new URLSearchParams(location.search).get("id")) || PRODUCTS[0];
  const initialColor = product.color || "Preta";
  document.title = `${product.name} — Fourblack`;
  name.textContent = product.name;
  document.querySelector("[data-product-breadcrumb]").textContent = product.name;
  document.querySelector("[data-product-collection]").textContent = `Fourblack · ${product.collection}`;
  document.querySelector("[data-selected-color]").textContent = initialColor;
  document.querySelectorAll(".color-dot").forEach(button => {
    button.classList.toggle("active", button.dataset.color === initialColor);
  });
  document.querySelector("[data-product-price]").textContent = money(product.price);
  document.querySelector("[data-installment]").textContent = money(product.price / 3);
  const image = document.querySelector("[data-product-image]");
  image.src = product.image;
  image.alt = product.name;
  document.querySelector("[data-product-thumbnails]").innerHTML = [product.image].map((src, index) =>
    `<button type="button" class="${index === 0 ? "active" : ""}" aria-label="Ver imagem ${index + 1}"><img src="${src}" alt=""></button>`
  ).join("");
  document.querySelectorAll(".size-buttons button").forEach(button => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".size-buttons button").forEach(size => size.classList.remove("active"));
      button.classList.add("active");
    });
  });
  document.querySelectorAll(".color-dot").forEach(button => button.addEventListener("click", () => {
    document.querySelectorAll(".color-dot").forEach(color => color.classList.remove("active"));
    button.classList.add("active");
    document.querySelector("[data-selected-color]").textContent = button.dataset.color;
  }));
  const addToCart = () => {
    const selectedSize = document.querySelector(".size-buttons button.active");
    if (!selectedSize) {
      showToast("Selecione um tamanho antes de adicionar.");
      return;
    }
    const color = document.querySelector("[data-selected-color]").textContent;
    addProductToCart(product, selectedSize.textContent, color);
    showToast("Produto adicionado ao carrinho.");
  };
  document.querySelector(".add-to-cart").addEventListener("click", addToCart);
  document.querySelector(".zoom-button").addEventListener("click", () => image.classList.toggle("zoomed"));
}

function showToast(message) {
  const toast = document.querySelector(".toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("visible");
  window.setTimeout(() => toast.classList.remove("visible"), 2600);
}

function renderCart() {
  const container = document.querySelector("[data-cart-items]");
  if (!container) return;
  const cart = getCart();
  const checkoutButton = document.querySelector(".checkout-button");
  if (!cart.length) {
    container.innerHTML = '<div class="empty-cart"><h2>Seu carrinho está vazio</h2><p>Descubra peças feitas para você.</p><a class="button button-dark" href="produtos.html">Explorar produtos <span>↗</span></a></div>';
    checkoutButton.disabled = true;
    updateTotals(0);
    return;
  }
  container.innerHTML = cart.map(item => {
    const product = findProduct(item.id);
    return `<article class="cart-item" data-cart-id="${product.id}" data-cart-size="${item.size}" data-cart-color="${item.color}">
      <a href="produto.html?id=${encodeURIComponent(product.id)}"><img src="${product.image}" alt="${product.name}"></a>
      <div><h3>${product.name}</h3><p>Cor: ${item.color} &nbsp;·&nbsp; Tamanho: ${item.size}</p><div class="quantity-control"><button type="button" data-quantity="-1" aria-label="Diminuir quantidade">−</button><span>${item.quantity}</span><button type="button" data-quantity="1" aria-label="Aumentar quantidade">+</button></div><button class="remove-item" type="button">Remover</button></div>
      <strong class="cart-item-price">${money(product.price * item.quantity)}</strong>
    </article>`;
  }).join("");
  const subtotal = cart.reduce((sum, item) => sum + findProduct(item.id).price * item.quantity, 0);
  updateTotals(subtotal);
  checkoutButton.disabled = false;
  container.querySelectorAll(".cart-item").forEach(row => {
    const match = item => item.id === row.dataset.cartId && item.size === row.dataset.cartSize && item.color === row.dataset.cartColor;
    row.querySelectorAll("[data-quantity]").forEach(button => button.addEventListener("click", () => {
      const nextCart = getCart().map(item => match(item) ? { ...item, quantity: item.quantity + Number(button.dataset.quantity) } : item).filter(item => item.quantity > 0);
      saveCart(nextCart);
      renderCart();
    }));
    row.querySelector(".remove-item").addEventListener("click", () => {
      saveCart(getCart().filter(item => !match(item)));
      renderCart();
    });
  });
}

function updateTotals(subtotal) {
  const shipping = getShipping(subtotal);
  document.querySelector("[data-cart-subtotal]").textContent = money(subtotal);
  document.querySelector("[data-cart-shipping]").textContent = shipping ? money(shipping) : "Grátis";
  document.querySelector("[data-cart-total]").textContent = money(subtotal + shipping);
  document.querySelector("[data-shipping-hint]").textContent = subtotal > 0 && subtotal < 299 ? `Faltam ${money(299 - subtotal)} para ganhar frete grátis.` : subtotal >= 299 ? "Seu pedido tem frete grátis!" : "";
}

function setupCheckout() {
  const form = document.querySelector("[data-checkout-form]");
  if (!form) return;
  form.addEventListener("submit", event => {
    event.preventDefault();
    const cart = getCart();
    if (!cart.length) return;
    if (!form.reportValidity()) return;
    const formData = new FormData(form);
    const subtotal = cart.reduce((sum, item) => sum + findProduct(item.id).price * item.quantity, 0);
    const order = {
      number: `FB${Math.floor(100000 + Math.random() * 900000)}`,
      date: new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date()),
      name: String(formData.get("name")).trim(),
      email: String(formData.get("email")).trim(),
      items: cart,
      subtotal,
      shipping: getShipping(subtotal)
    };
    localStorage.setItem(ORDER_KEY, JSON.stringify(order));
    saveCart([]);
    location.href = "confirmacao.html";
  });
}

function setupConfirmation() {
  const root = document.querySelector("[data-order-number]");
  if (!root) return;
  let order;
  try {
    order = JSON.parse(localStorage.getItem(ORDER_KEY) || "null");
  } catch (error) {
    console.error("Não foi possível ler os dados do último pedido.", error);
    order = null;
  }
  if (!order) {
    document.querySelector(".confirmation-main h1").textContent = "Nenhum pedido recente";
    document.querySelector(".confirmation-lead").textContent = "Quando finalizar sua compra, os detalhes aparecerão aqui.";
    document.querySelector(".order-metadata").hidden = true;
    document.querySelector(".confirmation-summary").hidden = true;
    return;
  }
  root.textContent = `#${order.number}`;
  document.querySelector("[data-order-date]").textContent = order.date;
  document.querySelector("[data-customer-name]").textContent = order.name ? `, ${order.name}` : "";
  document.querySelector("[data-confirmation-items]").innerHTML = order.items.map(item => {
    const product = findProduct(item.id);
    return `<div class="confirmation-item"><img src="${product.image}" alt="${product.name}"><div><strong>${product.name}</strong><span>Cor: ${item.color} · Tamanho: ${item.size} · Qtd: ${item.quantity}</span><b>${money(product.price * item.quantity)}</b></div></div>`;
  }).join("");
  document.querySelector("[data-confirm-subtotal]").textContent = money(order.subtotal);
  document.querySelector("[data-confirm-shipping]").textContent = order.shipping ? money(order.shipping) : "Grátis";
  document.querySelector("[data-confirm-total]").textContent = money(order.subtotal + order.shipping);
}

function setupMobileMenu() {
  const toggle = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".main-nav");
  if (!toggle || !nav) return;
  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
  });
}

function setupHeroCarousel() {
  const image = document.querySelector(".hero-slide");
  const dots = [...document.querySelectorAll(".hero-dot")];
  if (!image || dots.length < 2) return;

  const slides = [
    { src: "assets/HOME%20-%20FOURBLACK/FOURBLACK%20HOME%2001.png", alt: "Faith Street People — da rua para a vida" },
    { src: "assets/HOME%20-%20FOURBLACK/FOURBLACK%20HOME%2002%20(2).png", alt: "Faith Music People — do samba para a vida" }
  ];
  slides.slice(1).forEach(slide => {
    const preload = new Image();
    preload.src = slide.src;
  });
  let activeSlide = 0;
  let timer;

  const showSlide = index => {
    activeSlide = (index + slides.length) % slides.length;
    image.classList.add("is-changing");
    window.setTimeout(() => {
      image.src = slides[activeSlide].src;
      image.alt = slides[activeSlide].alt;
      image.classList.remove("is-changing");
    }, 180);
    dots.forEach((dot, dotIndex) => {
      const active = dotIndex === activeSlide;
      dot.classList.toggle("active", active);
      dot.setAttribute("aria-pressed", String(active));
    });
  };

  const restartTimer = () => {
    window.clearInterval(timer);
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      timer = window.setInterval(() => showSlide(activeSlide + 1), 8000);
    }
  };

  document.querySelector(".hero-previous").addEventListener("click", () => {
    showSlide(activeSlide - 1);
    restartTimer();
  });
  document.querySelector(".hero-next").addEventListener("click", () => {
    showSlide(activeSlide + 1);
    restartTimer();
  });
  dots.forEach((dot, index) => dot.addEventListener("click", () => {
    showSlide(index);
    restartTimer();
  }));
  restartTimer();
}

document.addEventListener("DOMContentLoaded", () => {
  updateCartCount();
  renderProductGrid();
  setupListing();
  setupProduct();
  renderCart();
  setupCheckout();
  setupConfirmation();
  setupMobileMenu();
  setupHeroCarousel();
});
