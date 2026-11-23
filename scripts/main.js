import { APP_CONFIG, MENU_ITEMS } from './config.js';
import { createMenuRenderer } from './modules/menu-renderer.js';
import { createCartManager } from './modules/cart-manager.js';
import {
  buildDirectContactUrl,
  buildWhatsAppOrderMessage,
  buildWhatsAppUrl,
} from './utils/whatsapp-formatter.js';

/**
 * Aplica los colores de marca configurados en scripts/config.js.
 */
function applyBrandTheme(theme) {
  if (!theme) return;
  const root = document.documentElement;
  if (theme.bgMain) root.style.setProperty('--bg-main', theme.bgMain);
  if (theme.surfaceCard) root.style.setProperty('--surface-card', theme.surfaceCard);
  if (theme.borderSubtle) root.style.setProperty('--border-subtle', theme.borderSubtle);
  if (theme.brandPrimary) root.style.setProperty('--brand-primary', theme.brandPrimary);
  if (theme.textPrimary) root.style.setProperty('--text-primary', theme.textPrimary);
  if (theme.textSecondary) root.style.setProperty('--text-secondary', theme.textSecondary);
  if (theme.whatsappGreen) root.style.setProperty('--whatsapp-green', theme.whatsappGreen);
}

/**
 * Inicializa el encabezado del local con los datos de APP_CONFIG.
 */
function initStoreHeader() {
  document.getElementById('store-badge').textContent = APP_CONFIG.badge;
  document.getElementById('store-name').textContent = APP_CONFIG.businessName;
  document.getElementById('store-subtitle').textContent = APP_CONFIG.subtitle;
  document.getElementById('store-status-text').textContent = APP_CONFIG.statusText;

  const statusPill = document.getElementById('store-status');
  if (!APP_CONFIG.isOpen) {
    statusPill.classList.add('status-pill--closed');
  }

  const directWaBtn = document.getElementById('direct-whatsapp-btn');
  directWaBtn.href = buildDirectContactUrl(APP_CONFIG.whatsappNumber, APP_CONFIG.businessName);

  const fidelizaBtn = document.getElementById('fideliza-btn');
  fidelizaBtn.href = APP_CONFIG.fidelizaUrl;
}

/**
 * Muestra una notificación toast temporal en pantalla.
 */
function showToast(message, isError = false) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast${isError ? ' toast--error' : ''}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 2400);
}

function bootstrap() {
  applyBrandTheme(APP_CONFIG.theme);
  initStoreHeader();

  let activeCategory = 'Todos';
  let searchQuery = '';

  const searchInput = document.getElementById('search-input');
  const searchClearBtn = document.getElementById('search-clear-btn');

  const menuRenderer = createMenuRenderer({
    tabsContainer: document.getElementById('category-tabs'),
    listContainer: document.getElementById('menu-list'),
    sectionHeading: document.getElementById('menu-section-heading'),
  });

  const cartManager = createCartManager({
    storageKey: APP_CONFIG.storageKey,
    elements: {
      cartBarWrap: document.getElementById('cart-bar-wrap'),
      cartBarSummary: document.getElementById('cart-bar-summary'),
      cartBarTotal: document.getElementById('cart-bar-total'),
      drawerBackdrop: document.getElementById('drawer-backdrop'),
      cartDrawer: document.getElementById('cart-drawer'),
      drawerBody: document.getElementById('drawer-body'),
      drawerTotalAmount: document.getElementById('drawer-total-amount'),
      clearCartBtn: document.getElementById('clear-cart-btn'),
    },
    onCartChange: () => renderMenu(),
    onShowToast: showToast,
    onSubmitOrder: (orderData) => {
      const message = buildWhatsAppOrderMessage(orderData, APP_CONFIG.businessName);
      const url = buildWhatsAppUrl(APP_CONFIG.whatsappNumber, message);
      window.open(url, '_blank', 'noopener,noreferrer');
      showToast('Abriendo WhatsApp con tu pedido...');
    },
  });

  function renderTabs() {
    menuRenderer.renderCategories(APP_CONFIG.categories, activeCategory, (selected) => {
      activeCategory = selected;
      renderTabs();
      renderMenu();
    });
  }

  function renderMenu() {
    menuRenderer.renderMenuItems(MENU_ITEMS, cartManager.getQuantitiesMap(), {
      activeCategory,
      searchQuery,
      onAddItem: (item) => cartManager.addItem(item),
    });
  }

  searchInput.addEventListener('input', (event) => {
    searchQuery = event.target.value;
    searchClearBtn.hidden = searchQuery.length === 0;
    renderMenu();
  });

  searchClearBtn.addEventListener('click', () => {
    searchQuery = '';
    searchInput.value = '';
    searchClearBtn.hidden = true;
    searchInput.focus();
    renderMenu();
  });

  document.getElementById('open-cart-btn').addEventListener('click', () => cartManager.openDrawer());
  document.getElementById('close-drawer-btn').addEventListener('click', () => cartManager.closeDrawer());
  document.getElementById('drawer-backdrop').addEventListener('click', () => cartManager.closeDrawer());
  document.getElementById('clear-cart-btn').addEventListener('click', () => cartManager.handleClearCartClick());
  document.getElementById('send-whatsapp-btn').addEventListener('click', () => cartManager.handleSubmit());

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      cartManager.closeDrawer();
    }
  });

  renderTabs();
  renderMenu();
  cartManager.updateCartBar();
}

bootstrap();
