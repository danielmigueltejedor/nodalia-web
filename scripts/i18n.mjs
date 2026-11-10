// Traducción de las páginas generadas.
// El español es el idioma de origen: la plantilla y los datos se escriben en español y cada
// texto visible se sustituye por su traducción de i18n/<idioma>.json (clave = texto en español).
// Un texto sin traducción y que no figure en i18n/keep.json hace fallar las pruebas.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const load = (name) => JSON.parse(readFileSync(path.join(root, 'i18n', name), 'utf8'));

export const DEFAULT_LOCALE = 'es';
export const locales = [
  { code: 'es', name: 'Español', og: 'es_ES' },
  { code: 'en', name: 'English', og: 'en_US' },
  { code: 'fr', name: 'Français', og: 'fr_FR' },
  { code: 'de', name: 'Deutsch', og: 'de_DE' },
  { code: 'pt', name: 'Português', og: 'pt_PT' },
];
export const localeCodes = locales.map((locale) => locale.code);
export const localePath = (code) => (code === DEFAULT_LOCALE ? '/' : `/${code}/`);

export const keep = new Set(load('keep.json'));
export const dictionaries = Object.fromEntries(
  localeCodes.filter((code) => code !== DEFAULT_LOCALE).map((code) => [code, load(`${code}.json`)]),
);

const decode = (text) => text.replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&quot;', '"').replaceAll('&#39;', "'").replaceAll('&amp;', '&');
const encode = (text) => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
const hasWords = (text) => /\p{L}{2,}/u.test(text);

const TEXT_ATTRIBUTES = ['alt', 'aria-label', 'title'];
const META_CONTENT = /(?:name="description"|property="og:(?:title|description|image:alt)")/;
const SKIPPED_ELEMENTS = new Set(['script', 'style', 'code', 'pre']);
const INTERNAL_ROOT = /^(https:\/\/(?:[a-z0-9-]+\.)?getnodalia\.com)\/?(#[^"]*)?$/;

// Separa el documento en etiquetas y texto sin expresiones regulares.
function tokenize(html) {
  const tokens = [];
  let position = 0;
  while (position < html.length) {
    const open = html.indexOf('<', position);
    if (open === -1) { tokens.push(html.slice(position)); break; }
    const close = html.indexOf('>', open + 2);
    if (close === -1) { tokens.push(html.slice(position)); break; }
    if (open > position) tokens.push(html.slice(position, open));
    tokens.push(html.slice(open, close + 1));
    position = close + 1;
  }
  return tokens;
}

/**
 * Traduce un documento HTML. `lookup(key)` devuelve la traducción o undefined.
 * Con `collect` se registran las claves encontradas (para extraer textos o detectar los que faltan).
 */
export function translateHtml(html, code, { lookup = () => undefined, collect = null } = {}) {
  const translate = (raw) => {
    const body = raw.trim();
    const start = raw.indexOf(body);
    const key = decode(body).replace(/\s+/g, ' ');
    if (!key || !hasWords(key)) return raw;
    collect?.add(key);
    const value = lookup(key);
    return value === undefined ? raw : `${raw.slice(0, start)}${encode(value)}${raw.slice(start + body.length)}`;
  };
  const deep = (value) => {
    if (typeof value === 'string') return lookup(value.replace(/\s+/g, ' ')) ?? value;
    if (Array.isArray(value)) return value.map(deep);
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, k.startsWith('@') || k === 'url' ? v : deep(v)]));
    return value;
  };

  const tokens = tokenize(html);
  const stack = [];
  let out = '';
  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];
    if (!token) continue;
    if (!token.startsWith('<')) {
      const parent = stack[stack.length - 1];
      if (parent === 'script:ld') out += JSON.stringify(deep(JSON.parse(token))).replaceAll('<', '\\u003c');
      else out += stack.some((name) => SKIPPED_ELEMENTS.has(name.split(':')[0]) || name.endsWith(':keep')) ? token : translate(token);
      continue;
    }
    if (token.startsWith('<!')) { out += token; continue; }
    const closing = /^<\/([a-zA-Z0-9]+)/.exec(token);
    if (closing) {
      const name = closing[1].toLowerCase();
      const index = stack.map((item) => item.split(':')[0]).lastIndexOf(name);
      if (index >= 0) stack.length = index;
      out += token;
      continue;
    }
    const name = /^<([a-zA-Z0-9]+)/.exec(token)[1].toLowerCase();
    let tag = token;
    if (!stack.some((item) => SKIPPED_ELEMENTS.has(item.split(':')[0]))) {
      for (const attribute of TEXT_ATTRIBUTES) {
        tag = tag.replace(new RegExp(`(\\s${attribute}=")([^"]*)(")`), (_, a, value, b) => `${a}${translate(value)}${b}`);
      }
      if (name === 'meta' && META_CONTENT.test(tag)) tag = tag.replace(/(\scontent=")([^"]*)(")/, (_, a, value, b) => `${a}${translate(value)}${b}`);
      if ((name === 'a') && code !== DEFAULT_LOCALE && !/\shreflang=/.test(tag)) {
        tag = tag.replace(/(\shref=")([^"]*)(")/, (whole, a, value, b) => {
          const internal = INTERNAL_ROOT.exec(value);
          return internal ? `${a}${internal[1]}/${code}/${internal[2] || ''}${b}` : whole;
        });
      }
    }
    out += tag;
    const voidElement = /\/>$/.test(token) || ['meta', 'link', 'img', 'br', 'hr', 'input'].includes(name);
    // translate="no" marks names that must stay as written (an app called Luz is not the word "luz").
    const keepText = /\stranslate="no"/.test(token);
    if (!voidElement) stack.push(name === 'script' && /application\/ld\+json/.test(token) ? 'script:ld' : keepText ? `${name}:keep` : name);
  }
  return out;
}

/** Textos en español de una página que necesitan traducción. */
export function extractStrings(html) {
  const found = new Set();
  translateHtml(html, DEFAULT_LOCALE, { collect: found });
  return [...found].filter((key) => !keep.has(key));
}

/** Traduce y devuelve además las claves sin traducción. */
export function localize(html, code) {
  if (code === DEFAULT_LOCALE) return { html, missing: [] };
  const dictionary = dictionaries[code];
  const found = new Set();
  const output = translateHtml(html, code, { lookup: (key) => (keep.has(key) ? key : dictionary[key]), collect: found });
  return { html: output, missing: [...found].filter((key) => !keep.has(key) && dictionary[key] === undefined) };
}

/** Claves usadas por los scripts del navegador: llamadas t('…') con literal. */
export function clientKeys(source) {
  const keys = new Set();
  for (const match of source.matchAll(/\bt\(\s*'((?:[^'\\]|\\.)*)'/g)) keys.add(match[1].replaceAll("\\'", "'"));
  return [...keys];
}
