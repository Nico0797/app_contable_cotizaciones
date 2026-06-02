import * as SQLite from 'expo-sqlite';

let connection;

export async function getDatabase() {
  if (!connection) connection = SQLite.openDatabaseAsync('cotizaciones_offline.db');
  return connection;
}

export function today() {
  return new Date().toISOString().slice(0, 10);
}

export function money(value) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}
