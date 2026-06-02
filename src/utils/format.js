export function money(value) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

export function shortDate(value) {
  return String(value || '').slice(0, 10);
}

export function boolLabel(value) {
  return value ? 'Pagada' : 'Pendiente';
}

export function movementLabel(value) {
  if (value === 'in') return 'Entrada';
  if (value === 'out') return 'Salida';
  if (value === 'adjustment') return 'Ajuste';
  return value;
}
