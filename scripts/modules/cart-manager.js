import { formatCurrency } from '../utils/whatsapp-formatter.js';

const DEFAULT_CUSTOMER = {
  modality: 'Recojo en local',
  name: '',
  address: '',
  paymentMethod: 'Yape',
  notes: '',
};

/**
 * Crea el gestor del carrito Local-First persistido en localStorage.
 * Controla estado, barra flotante y drawer táctil sin diálogos nativos.
 */
export function createCartManager({
  storageKey,
  elements,
  onCartChange,
  onShowToast,
  onSubmitOrder,
}) {
  let state = loadState();
  let confirmClearPending = false;
  let formErrors = {};

  function loadState() {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) {
        return { items: [], customer: { ...DEFAULT_CUSTOMER } };
      }
      const parsed = JSON.parse(raw);
      return {
        items: Array.isArray(parsed.items) ? parsed.items : [],
        customer: { ...DEFAULT_CUSTOMER, ...(parsed.customer || {}) },
      };
    } catch {
      return { items: [], customer: { ...DEFAULT_CUSTOMER } };
    }
  }

  function saveState() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch {
      // Si el almacenamiento está lleno o bloqueado, continuamos en memoria
    }
  }

  function getTotalItems() {
    return state.items.reduce((acc, item) => acc + item.quantity, 0);
  }

  function getSubtotal() {
    return state.items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  }

  function getQuantitiesMap() {
    const map = new Map();
    state.items.forEach((item) => map.set(item.id, item.quantity));
    return map;
  }

  function addItem(product) {
    const existing = state.items.find((item) => item.id === product.id);
    if (existing) {
      existing.quantity += 1;
    } else {
      state.items.push({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
      });
    }
    confirmClearPending = false;
    saveState();
    updateCartBar();
    onCartChange();
    onShowToast(`Agregado: ${product.name}`);
  }

  function updateQuantity(itemId, delta) {
    const idx = state.items.findIndex((item) => item.id === itemId);
    if (idx === -1) return;

    state.items[idx].quantity += delta;
    if (state.items[idx].quantity <= 0) {
      state.items.splice(idx, 1);
    }

    confirmClearPending = false;
    saveState();
    updateCartBar();
    onCartChange();

    if (state.items.length === 0) {
      closeDrawer();
    } else {
      renderDrawer();
    }
  }

  function handleClearCartClick() {
    if (!confirmClearPending) {
      confirmClearPending = true;
      updateClearButtonUI();
      return;
    }

    state.items = [];
    confirmClearPending = false;
    saveState();
    updateCartBar();
    onCartChange();
    closeDrawer();
    onShowToast('Pedido vaciado');
  }

  function updateClearButtonUI() {
    const btn = elements.clearCartBtn;
    if (!btn) return;
    if (confirmClearPending) {
      btn.textContent = '¿Confirmar vaciar?';
      btn.classList.add('text-btn--danger');
    } else {
      btn.textContent = 'Vaciar';
      btn.classList.remove('text-btn--danger');
    }
  }

  function updateCartBar() {
    const totalItems = getTotalItems();
    const total = getSubtotal();

    if (totalItems === 0) {
      elements.cartBarWrap.hidden = true;
      return;
    }

    const label = totalItems === 1 ? '1 ítem' : `${totalItems} ítems`;
    elements.cartBarSummary.textContent = `Ver pedido • ${label}`;
    elements.cartBarTotal.textContent = formatCurrency(total);
    elements.cartBarWrap.hidden = false;
  }

  function openDrawer() {
    if (state.items.length === 0) return;
    confirmClearPending = false;
    formErrors = {};
    renderDrawer();
    elements.drawerBackdrop.hidden = false;
    elements.cartDrawer.hidden = false;
    requestAnimationFrame(() => {
      elements.drawerBackdrop.classList.add('drawer-backdrop--open');
    });
  }

  function closeDrawer() {
    confirmClearPending = false;
    updateClearButtonUI();
    elements.drawerBackdrop.classList.remove('drawer-backdrop--open');
    elements.drawerBackdrop.hidden = true;
    elements.cartDrawer.hidden = true;
  }

  function setCustomerField(field, value) {
    state.customer[field] = value;
    if (formErrors[field]) {
      delete formErrors[field];
    }
    saveState();
  }

  function validateOrder() {
    const errors = {};
    if (!state.customer.name.trim()) {
      errors.name = 'Ingresa tu nombre para identificar el pedido.';
    }
    if (state.customer.modality === 'Delivery' && !state.customer.address.trim()) {
      errors.address = 'Ingresa tu dirección y referencia para el delivery.';
    }
    formErrors = errors;
    return Object.keys(errors).length === 0;
  }

  function handleSubmit() {
    if (state.items.length === 0) return;
    if (!validateOrder()) {
      renderDrawer();
      onShowToast('Completa los campos requeridos', true);
      return;
    }

    onSubmitOrder({
      items: [...state.items],
      total: getSubtotal(),
      customer: { ...state.customer },
    });
  }

  function renderDrawer() {
    updateClearButtonUI();
    elements.drawerTotalAmount.textContent = formatCurrency(getSubtotal());

    const isDelivery = state.customer.modality === 'Delivery';
    const paymentOptions = ['Yape', 'Plin', 'Efectivo'];

    const itemsHtml = state.items.map((item) => `
      <div class="cart-item-row">
        <div class="cart-item-info">
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-price">${formatCurrency(item.price)} c/u</div>
        </div>
        <div class="qty-controls">
          <button type="button" class="qty-btn" data-action="dec" data-id="${item.id}" aria-label="Restar ${item.name}">−</button>
          <span class="qty-value">${item.quantity}</span>
          <button type="button" class="qty-btn" data-action="inc" data-id="${item.id}" aria-label="Sumar ${item.name}">+</button>
        </div>
      </div>
    `).join('');

    const paymentHtml = paymentOptions.map((method) => `
      <button
        type="button"
        class="choice-btn${state.customer.paymentMethod === method ? ' choice-btn--active' : ''}"
        data-payment="${method}"
      >${method}</button>
    `).join('');

    elements.drawerBody.innerHTML = `
      <div class="cart-items-list">${itemsHtml}</div>

      <div class="order-form-section">
        <div>
          <span class="form-label">Modalidad de entrega</span>
          <div class="segmented-group">
            <button
              type="button"
              class="choice-btn${!isDelivery ? ' choice-btn--active' : ''}"
              data-modality="Recojo en local"
            >Recojo en local</button>
            <button
              type="button"
              class="choice-btn${isDelivery ? ' choice-btn--active' : ''}"
              data-modality="Delivery"
            >Delivery</button>
          </div>
        </div>

        <div>
          <label class="form-label" for="customer-name-input">Tu nombre *</label>
          <input
            id="customer-name-input"
            class="form-input"
            type="text"
            placeholder="Ej. Carlos Mendoza"
            value="${escapeAttr(state.customer.name)}"
          >
          ${formErrors.name ? `<p class="form-error">${formErrors.name}</p>` : ''}
        </div>

        ${isDelivery ? `
          <div>
            <label class="form-label" for="customer-address-input">Dirección y referencia *</label>
            <input
              id="customer-address-input"
              class="form-input"
              type="text"
              placeholder="Ej. Av. Larco 420, dpto 302"
              value="${escapeAttr(state.customer.address)}"
            >
            ${formErrors.address ? `<p class="form-error">${formErrors.address}</p>` : ''}
          </div>
        ` : ''}

        <div>
          <span class="form-label">Método de pago</span>
          <div class="chip-group">${paymentHtml}</div>
        </div>

        <div>
          <label class="form-label" for="customer-notes-input">Notas opcionales</label>
          <input
            id="customer-notes-input"
            class="form-input"
            type="text"
            placeholder="Sin cebolla, ají aparte, etc."
            value="${escapeAttr(state.customer.notes)}"
          >
        </div>
      </div>
    `;

    bindDrawerEvents();
  }

  function bindDrawerEvents() {
    elements.drawerBody.querySelectorAll('.qty-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const delta = btn.dataset.action === 'inc' ? 1 : -1;
        updateQuantity(btn.dataset.id, delta);
      });
    });

    elements.drawerBody.querySelectorAll('[data-modality]').forEach((btn) => {
      btn.addEventListener('click', () => {
        setCustomerField('modality', btn.dataset.modality);
        renderDrawer();
      });
    });

    elements.drawerBody.querySelectorAll('[data-payment]').forEach((btn) => {
      btn.addEventListener('click', () => {
        setCustomerField('paymentMethod', btn.dataset.payment);
        renderDrawer();
      });
    });

    const nameInput = elements.drawerBody.querySelector('#customer-name-input');
    if (nameInput) {
      nameInput.addEventListener('input', (e) => setCustomerField('name', e.target.value));
    }

    const addressInput = elements.drawerBody.querySelector('#customer-address-input');
    if (addressInput) {
      addressInput.addEventListener('input', (e) => setCustomerField('address', e.target.value));
    }

    const notesInput = elements.drawerBody.querySelector('#customer-notes-input');
    if (notesInput) {
      notesInput.addEventListener('input', (e) => setCustomerField('notes', e.target.value));
    }
  }

  return {
    addItem,
    getQuantitiesMap,
    updateCartBar,
    openDrawer,
    closeDrawer,
    handleClearCartClick,
    handleSubmit,
  };
}

function escapeAttr(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
