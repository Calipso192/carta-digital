/**
 * Formatea un monto numérico en Soles peruanos (normativa Indecopi: precio final).
 * @param {number} amount
 * @returns {string}
 */
export function formatCurrency(amount) {
  const safeValue = Number.isFinite(Number(amount)) ? Number(amount) : 0;
  return `S/ ${safeValue.toFixed(2)}`;
}

/**
 * Normaliza un número de teléfono dejando solo dígitos.
 * @param {string} phone
 * @returns {string}
 */
function sanitizePhone(phone) {
  return String(phone || '').replace(/\D/g, '');
}

/**
 * Construye el mensaje estructurado para enviar el pedido por WhatsApp.
 * @param {object} orderData
 * @param {Array} orderData.items
 * @param {number} orderData.total
 * @param {object} orderData.customer
 * @param {string} businessName
 * @returns {string}
 */
export function buildWhatsAppOrderMessage(orderData, businessName) {
  const { items, total, customer } = orderData;

  const itemLines = items.map((item) => {
    const subtotal = formatCurrency(item.price * item.quantity);
    return `• ${item.quantity}x ${item.name} (${subtotal})`;
  });

  const lines = [
    `*Nuevo Pedido - ${businessName}*`,
    '',
    '*Detalle del pedido:*',
    ...itemLines,
    '',
    `*Total:* ${formatCurrency(total)}`,
    `*Modalidad:* ${customer.modality}`,
    `*Cliente:* ${customer.name.trim()}`,
  ];

  if (customer.modality === 'Delivery' && customer.address.trim()) {
    lines.push(`*Dirección:* ${customer.address.trim()}`);
  }

  lines.push(`*Método de pago:* ${customer.paymentMethod}`);

  if (customer.notes && customer.notes.trim()) {
    lines.push(`*Notas:* ${customer.notes.trim()}`);
  }

  return lines.join('\n');
}

/**
 * Genera el enlace oficial wa.me con el mensaje codificado.
 * @param {string} phoneNumber
 * @param {string} message
 * @returns {string}
 */
export function buildWhatsAppUrl(phoneNumber, message) {
  const cleanPhone = sanitizePhone(phoneNumber);
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * Genera el enlace directo de consulta por WhatsApp para el encabezado.
 * @param {string} phoneNumber
 * @param {string} businessName
 * @returns {string}
 */
export function buildDirectContactUrl(phoneNumber, businessName) {
  const greeting = `Hola ${businessName}, quisiera hacer una consulta sobre la carta.`;
  return buildWhatsAppUrl(phoneNumber, greeting);
}
