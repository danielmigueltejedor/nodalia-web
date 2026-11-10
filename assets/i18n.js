// Traducciones para los scripts del navegador. La página incluye solo las claves que usan (elemento #i18n);
// en español no hay diccionario y se devuelve el texto original.
let dictionary = null;

function load() {
  if (dictionary) return dictionary;
  dictionary = {};
  try {
    const element = typeof document !== 'undefined' && document.getElementById('i18n');
    if (element) dictionary = JSON.parse(element.textContent);
  } catch { /* se mantiene el español */ }
  return dictionary;
}

export const lang = () => (typeof document !== 'undefined' && document.documentElement.lang) || 'es';

export function t(text, values) {
  let out = load()[text] ?? text;
  if (values) for (const [key, value] of Object.entries(values)) out = out.replaceAll(`{${key}}`, value);
  return out;
}

export const formatNumber = (value, digits = 1) => value.toLocaleString(lang(), { minimumFractionDigits: digits, maximumFractionDigits: digits });
