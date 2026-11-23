import { formatCurrency } from '../utils/whatsapp-formatter.js';

/**
 * Normaliza texto para búsquedas sin distinguir tildes ni mayúsculas.
 * @param {string} value
 * @returns {string}
 */
function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Devuelve una ilustración SVG minimalista local según el tipo de plato.
 * Evita dependencias externas rotas y mantiene la paleta cálida.
 * @param {string} type
 * @returns {string}
 */
function getDishIllustrationSvg(type) {
  switch (type) {
    case 'burger':
      return `
        <svg width="52" height="52" viewBox="0 0 64 64" fill="none" aria-hidden="true">
          <path d="M12 28C12 18 20 12 32 12C44 12 52 18 52 28H12Z" fill="#D98A4E" stroke="#2C1A12" stroke-width="2.2"/>
          <circle cx="24" cy="20" r="1.6" fill="#FDFBF9"/>
          <circle cx="33" cy="17" r="1.6" fill="#FDFBF9"/>
          <circle cx="41" cy="21" r="1.6" fill="#FDFBF9"/>
          <path d="M10 32C14 29 18 35 23 32C28 29 33 35 38 32C43 29 48 35 54 32" stroke="#1E8E5A" stroke-width="3.2" stroke-linecap="round"/>
          <rect x="11" y="35" width="42" height="7" rx="3.5" fill="#6E3B26" stroke="#2C1A12" stroke-width="2.2"/>
          <path d="M16 35L22 41L28 35" fill="#F2B84B"/>
          <path d="M13 44H51V47C51 50.3 48.3 53 45 53H19C15.7 53 13 50.3 13 47V44Z" fill="#D98A4E" stroke="#2C1A12" stroke-width="2.2"/>
        </svg>`;
    case 'wings':
      return `
        <svg width="52" height="52" viewBox="0 0 64 64" fill="none" aria-hidden="true">
          <path d="M16 38C14 27 22 18 33 19C41 20 46 26 45 34C44 41 37 46 28 45C21 44 17 42 16 38Z" fill="#B84A27" stroke="#2C1A12" stroke-width="2.2"/>
          <path d="M43 32L50 38C52 39.5 52 42 50 43.5C48.5 45 46 44.5 44.5 43L38 37" fill="#F5ECD9" stroke="#2C1A12" stroke-width="2.2" stroke-linecap="round"/>
          <circle cx="27" cy="28" r="2" fill="#F5ECD9"/>
          <circle cx="34" cy="31" r="1.6" fill="#F5ECD9"/>
        </svg>`;
    case 'broaster':
      return `
        <svg width="52" height="52" viewBox="0 0 64 64" fill="none" aria-hidden="true">
          <path d="M14 42H50L46 53H18L14 42Z" fill="#B84A27" stroke="#2C1A12" stroke-width="2.2" stroke-linejoin="round"/>
          <path d="M18 42C18 30 25 22 33 22C41 22 47 30 46 42H18Z" fill="#D98A4E" stroke="#2C1A12" stroke-width="2.2"/>
          <path d="M25 32C27 29 30 29 32 31" stroke="#2C1A12" stroke-width="2" stroke-linecap="round"/>
          <path d="M35 34C37 32 40 32 41 34" stroke="#2C1A12" stroke-width="2" stroke-linecap="round"/>
        </svg>`;
    case 'combo':
      return `
        <svg width="52" height="52" viewBox="0 0 64 64" fill="none" aria-hidden="true">
          <rect x="13" y="29" width="24" height="20" rx="5" fill="#D98A4E" stroke="#2C1A12" stroke-width="2.2"/>
          <line x1="13" y1="39" x2="37" y2="39" stroke="#6E3B26" stroke-width="4"/>
          <path d="M40 24H52L50 49H42L40 24Z" fill="#B84A27" stroke="#2C1A12" stroke-width="2.2" stroke-linejoin="round"/>
          <path d="M46 24V15L51 12" stroke="#2C1A12" stroke-width="2.2" stroke-linecap="round"/>
        </svg>`;
    case 'drink':
    default:
      return `
        <svg width="52" height="52" viewBox="0 0 64 64" fill="none" aria-hidden="true">
          <path d="M21 22H43L40 51H24L21 22Z" fill="#F2B84B" fill-opacity="0.35" stroke="#2C1A12" stroke-width="2.2" stroke-linejoin="round"/>
          <path d="M23 32H41L39.5 49H24.5L23 32Z" fill="#B84A27" fill-opacity="0.8"/>
          <path d="M33 22L37 11L43 10" stroke="#2C1A12" stroke-width="2.2" stroke-linecap="round"/>
          <rect x="27" y="35" width="5" height="5" rx="1" fill="#FDFBF9" fill-opacity="0.75"/>
        </svg>`;
  }
}

/**
 * Devuelve la clase CSS para la etiqueta opcional del plato.
 * @param {string} tag
 * @returns {string}
 */
function getTagClass(tag) {
  const normalized = normalizeText(tag);
  if (normalized.includes('picante')) return 'dish-tag--spicy';
  if (normalized.includes('nuevo')) return 'dish-tag--new';
  return 'dish-tag--fav';
}

/**
 * Crea el renderizador del catálogo y categorías.
 * @param {object} elements
 * @param {HTMLElement} elements.tabsContainer
 * @param {HTMLElement} elements.listContainer
 * @param {HTMLElement} elements.sectionHeading
 */
export function createMenuRenderer({ tabsContainer, listContainer, sectionHeading }) {
  /**
   * Renderiza las pestañas horizontales de categorías.
   * @param {string[]} categories
   * @param {string} activeCategory
   * @param {Function} onSelect
   */
  function renderCategories(categories, activeCategory, onSelect) {
    tabsContainer.innerHTML = '';

    categories.forEach((category) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `category-tab${category === activeCategory ? ' category-tab--active' : ''}`;
      btn.textContent = category;
      btn.setAttribute('aria-pressed', String(category === activeCategory));
      btn.addEventListener('click', () => onSelect(category));
      tabsContainer.appendChild(btn);
    });
  }

  /**
   * Renderiza la lista de platos filtrada por categoría y texto de búsqueda.
   * @param {Array} items
   * @param {Map<string, number>} cartQuantities
   * @param {object} state
   * @param {string} state.activeCategory
   * @param {string} state.searchQuery
   * @param {Function} state.onAddItem
   */
  function renderMenuItems(items, cartQuantities, { activeCategory, searchQuery, onAddItem }) {
    const query = normalizeText(searchQuery.trim());

    const filtered = items.filter((item) => {
      const matchesCategory = activeCategory === 'Todos' || item.category === activeCategory;
      if (!matchesCategory) return false;
      if (!query) return true;

      const searchable = normalizeText(`${item.name} ${item.description} ${item.category}`);
      return searchable.includes(query);
    });

    sectionHeading.textContent = activeCategory === 'Todos'
      ? `Nuestra Carta (${filtered.length})`
      : `${activeCategory} (${filtered.length})`;

    listContainer.innerHTML = '';

    if (filtered.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.textContent = 'No encontramos platos con esa búsqueda. Prueba con otro término o categoría.';
      listContainer.appendChild(empty);
      return;
    }

    const fragment = document.createDocumentFragment();

    filtered.forEach((item) => {
      const qtyInCart = cartQuantities.get(item.id) || 0;
      const card = document.createElement('article');
      card.className = 'dish-card';

      const tagHtml = item.tag
        ? `<span class="dish-tag ${getTagClass(item.tag)}">${item.tag}</span>`
        : '';

      card.innerHTML = `
        <div class="dish-info">
          <div class="dish-header">
            <h3 class="dish-name">${item.name}</h3>
            ${tagHtml}
          </div>
          <p class="dish-desc">${item.description}</p>
          <span class="dish-price">${formatCurrency(item.price)}</span>
        </div>
        <div class="dish-media">
          <div class="dish-thumb">
            ${getDishIllustrationSvg(item.illustrationType)}
          </div>
          <button
            type="button"
            class="dish-add-btn${qtyInCart > 0 ? ' dish-add-btn--has-qty' : ''}"
            data-item-id="${item.id}"
            aria-label="Agregar ${item.name} al pedido"
          >
            ${qtyInCart > 0 ? `${qtyInCart} +` : '+'}
          </button>
        </div>
      `;

      const addBtn = card.querySelector('.dish-add-btn');
      addBtn.addEventListener('click', () => onAddItem(item));

      fragment.appendChild(card);
    });

    listContainer.appendChild(fragment);
  }

  return {
    renderCategories,
    renderMenuItems,
  };
}
