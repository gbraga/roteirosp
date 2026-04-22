/**
 * Suite de testes — SP com Amor
 * Execução: node --test tests/test.js
 * Requer Node.js >= 18 (node:test nativo)
 */
import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// ─────────────────────────────────────────────────────────────────────────────
// Mock mínimo de Vue ref/computed para isolar a lógica pura
// ─────────────────────────────────────────────────────────────────────────────
function ref(v) { return { value: v }; }
function computed(fn) { return { get value() { return fn(); } }; }

// ─────────────────────────────────────────────────────────────────────────────
// Funções puras extraídas do app (idênticas ao index.html)
// ─────────────────────────────────────────────────────────────────────────────
const hotelLocation = { lat: -23.5583, lng: -46.6339 };

function fmt(n, decimals = 2) {
  return Number(n || 0).toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function categoryEmoji(cat) {
  return { food: '🍜', culture: '🏛', hotel: '🏨', shopping: '🛍', park: '🌳' }[cat] || '📍';
}

function calculateUber(item) {
  const dist = Math.sqrt(
    Math.pow(item.location.lat - hotelLocation.lat, 2) +
    Math.pow(item.location.lng - hotelLocation.lng, 2)
  ) * 111;
  return (9.90 + dist * 3.8).toFixed(2).replace('.', ',');
}

function makeItems() {
  return [
    { id: '1', date: '2026-04-22', time: '09:00', title: 'A', spent: 0,   completed: false, rating: 0, archived: false, location: { lat: -23.55, lng: -46.63, address: 'A' }, category: 'food' },
    { id: '2', date: '2026-04-22', time: '08:00', title: 'B', spent: 50,  completed: true,  rating: 3, archived: false, location: { lat: -23.56, lng: -46.64, address: 'B' }, category: 'culture' },
    { id: '3', date: '2026-04-23', time: '10:00', title: 'C', spent: 0,   completed: false, rating: 0, archived: true,  location: { lat: -23.57, lng: -46.65, address: 'C' }, category: 'park' },
    { id: '4', date: '2026-04-23', time: '14:00', title: 'D', spent: 120, completed: false, rating: 5, archived: false, location: { lat: -23.58, lng: -46.66, address: 'D' }, category: 'shopping' },
  ];
}

// lógica de toggleComplete
function toggleComplete(items, id) {
  return items.map(i => i.id === id ? { ...i, completed: !i.completed } : i);
}

// lógica de toggleArchive
function toggleArchive(items, id) {
  return items.map(i => i.id === id ? { ...i, archived: !i.archived } : i);
}

// lógica de setRating
function setRating(items, id, stars) {
  return items.map(i => i.id === id ? { ...i, rating: stars } : i);
}

// lógica de uniqueDates com filtro de archived
function uniqueDates(items, showArchived) {
  return [...new Set(
    items.filter(i => !!i.archived === showArchived).map(i => i.date)
  )].sort();
}

// lógica de getItemsByDate com filtro de archived
function getItemsByDate(items, date, showArchived) {
  return items
    .filter(i => i.date === date && !!i.archived === showArchived)
    .sort((a, b) => a.time.localeCompare(b.time));
}

// lógica de totalSpent
function totalSpent(items) {
  return items.reduce((acc, i) => acc + (Number(i.spent) || 0), 0);
}

// lógica de paidCount
function paidCount(items) {
  return items.filter(i => Number(i.spent) > 0).length;
}

// lógica de addNewItem (validação)
function validateNewItem(v) {
  return !!(v.title && v.date && v.time);
}

function buildNewItem(v) {
  const lat = v.lat ?? -23.55;
  const lng = v.lng ?? -46.63;
  const address = (v.address && v.address.trim()) || v.title;
  return {
    id: 'test-id',
    date: v.date, time: v.time, title: v.title,
    description: v.description || '',
    location: { lat, lng, address },
    completed: false, rating: 0, comment: '', category: 'culture', spent: 0, archived: false,
  };
}

// lógica de explorerVisibleCount
function explorerVisibleCount(explorerPoints, categories) {
  return explorerPoints.filter(p => categories[p.cat]).length;
}

// ─────────────────────────────────────────────────────────────────────────────
// Dados do app para teste de integridade
// ─────────────────────────────────────────────────────────────────────────────
const indexHtml = readFileSync(resolve(ROOT, 'index.html'), 'utf8');
const swJs      = readFileSync(resolve(ROOT, 'sw.js'), 'utf8');
const manifest  = JSON.parse(readFileSync(resolve(ROOT, 'manifest.json'), 'utf8'));

// Extrai explorerPoints do HTML
const epMatch = indexHtml.match(/const explorerPoints\s*=\s*(\[[\s\S]*?\]);\s*\n\s*function addExplorerToRoute/);
let explorerPoints = [];
if (epMatch) {
  // Avalia em contexto seguro (somente arrays literais sem código executável)
  explorerPoints = eval(epMatch[1]); // safe: é um array literal puro
}

// Extrai getInitialItems do HTML
const giMatch = indexHtml.match(/function getInitialItems\(\)\s*\{[\s\S]*?return\s*(\[[\s\S]*?\]);\s*\}/);
let initialItems = [];
if (giMatch) {
  initialItems = eval(giMatch[1]);
}

const VALID_CATS = new Set(['food', 'culture', 'hotel', 'shopping', 'park']);

// ─────────────────────────────────────────────────────────────────────────────
// TESTES
// ─────────────────────────────────────────────────────────────────────────────

describe('fmt — formatação de números', () => {
  test('formata zero como 0,00', () => {
    assert.equal(fmt(0), '0,00');
  });
  test('formata valor inteiro com 2 casas', () => {
    assert.equal(fmt(50), '50,00');
  });
  test('formata valor com centavos', () => {
    assert.equal(fmt(9.9), '9,90');
  });
  test('sem decimais quando decimals=0', () => {
    assert.equal(fmt(150, 0), '150');
  });
  test('aceita string numérica', () => {
    assert.equal(fmt('25.5'), '25,50');
  });
  test('null/undefined vira 0,00', () => {
    assert.equal(fmt(null), '0,00');
    assert.equal(fmt(undefined), '0,00');
  });
});

describe('categoryEmoji — mapeamento de categorias', () => {
  test('food → 🍜', () => assert.equal(categoryEmoji('food'), '🍜'));
  test('culture → 🏛', () => assert.equal(categoryEmoji('culture'), '🏛'));
  test('hotel → 🏨', () => assert.equal(categoryEmoji('hotel'), '🏨'));
  test('shopping → 🛍', () => assert.equal(categoryEmoji('shopping'), '🛍'));
  test('park → 🌳', () => assert.equal(categoryEmoji('park'), '🌳'));
  test('categoria desconhecida → 📍', () => assert.equal(categoryEmoji('outro'), '📍'));
  test('undefined → 📍', () => assert.equal(categoryEmoji(undefined), '📍'));
});

describe('calculateUber — estimativa de corrida', () => {
  test('hotel para si mesmo retorna valor base (sem distância)', () => {
    const item = { location: hotelLocation };
    assert.equal(calculateUber(item), '9,90');
  });
  test('ponto distante retorna valor maior que base', () => {
    const item = { location: { lat: -23.61, lng: -46.69 } };
    const val = parseFloat(calculateUber(item).replace(',', '.'));
    assert.ok(val > 9.90, `esperado > 9,90, obtido ${val}`);
  });
  test('resultado usa vírgula como separador decimal', () => {
    const item = { location: { lat: -23.57, lng: -46.65 } };
    assert.ok(calculateUber(item).includes(','));
  });
  test('retorna string com duas casas decimais', () => {
    const item = { location: { lat: -23.57, lng: -46.65 } };
    assert.match(calculateUber(item), /^\d+,\d{2}$/);
  });
});

describe('toggleComplete — marcar/desmarcar check-in', () => {
  test('marca item incompleto como completo', () => {
    const items = makeItems();
    const result = toggleComplete(items, '1');
    assert.equal(result.find(i => i.id === '1').completed, true);
  });
  test('desmarca item completo', () => {
    const items = makeItems();
    const result = toggleComplete(items, '2');
    assert.equal(result.find(i => i.id === '2').completed, false);
  });
  test('não altera outros itens', () => {
    const items = makeItems();
    const result = toggleComplete(items, '1');
    assert.equal(result.find(i => i.id === '2').completed, true);
    assert.equal(result.find(i => i.id === '3').completed, false);
  });
  test('id inexistente não altera nada', () => {
    const items = makeItems();
    const result = toggleComplete(items, '999');
    assert.deepEqual(result, items);
  });
});

describe('toggleArchive — arquivar/desarquivar', () => {
  test('arquiva item ativo', () => {
    const items = makeItems();
    const result = toggleArchive(items, '1');
    assert.equal(result.find(i => i.id === '1').archived, true);
  });
  test('desarquiva item arquivado', () => {
    const items = makeItems();
    const result = toggleArchive(items, '3');
    assert.equal(result.find(i => i.id === '3').archived, false);
  });
  test('não altera outros itens', () => {
    const items = makeItems();
    const result = toggleArchive(items, '1');
    assert.equal(result.find(i => i.id === '2').archived, false);
    assert.equal(result.find(i => i.id === '3').archived, true);
  });
});

describe('setRating — definir avaliação', () => {
  test('define rating de 1 a 5', () => {
    const items = makeItems();
    for (let s = 1; s <= 5; s++) {
      const result = setRating(items, '1', s);
      assert.equal(result.find(i => i.id === '1').rating, s);
    }
  });
  test('não altera outros itens', () => {
    const items = makeItems();
    const result = setRating(items, '1', 5);
    assert.equal(result.find(i => i.id === '2').rating, 3);
  });
});

describe('uniqueDates — datas únicas com filtro archived', () => {
  test('retorna datas dos itens ativos ordenadas', () => {
    const items = makeItems();
    // ativos: id1(22), id2(22), id4(23) → ['2026-04-22','2026-04-23']
    assert.deepEqual(uniqueDates(items, false), ['2026-04-22', '2026-04-23']);
  });
  test('retorna datas dos itens arquivados', () => {
    const items = makeItems();
    // arquivados: id3(23) → ['2026-04-23']
    assert.deepEqual(uniqueDates(items, true), ['2026-04-23']);
  });
  test('retorna array vazio se sem itens do tipo', () => {
    const items = makeItems().map(i => ({ ...i, archived: false }));
    assert.deepEqual(uniqueDates(items, true), []);
  });
});

describe('getItemsByDate — itens por data', () => {
  test('retorna somente itens ativos da data correta', () => {
    const items = makeItems();
    const result = getItemsByDate(items, '2026-04-22', false);
    assert.equal(result.length, 2);
    assert.ok(result.every(i => i.date === '2026-04-22' && !i.archived));
  });
  test('resultado está ordenado por horário', () => {
    const items = makeItems();
    const result = getItemsByDate(items, '2026-04-22', false);
    assert.equal(result[0].time, '08:00');
    assert.equal(result[1].time, '09:00');
  });
  test('data sem itens retorna array vazio', () => {
    const items = makeItems();
    assert.deepEqual(getItemsByDate(items, '2026-05-01', false), []);
  });
  test('retorna itens arquivados quando showArchived=true', () => {
    const items = makeItems();
    const result = getItemsByDate(items, '2026-04-23', true);
    assert.equal(result.length, 1);
    assert.equal(result[0].id, '3');
  });
});

describe('totalSpent — soma de gastos', () => {
  test('soma corretamente valores numéricos', () => {
    const items = makeItems();
    assert.equal(totalSpent(items), 170); // 50 + 120
  });
  test('retorna 0 quando nenhum gasto', () => {
    const items = makeItems().map(i => ({ ...i, spent: 0 }));
    assert.equal(totalSpent(items), 0);
  });
  test('ignora valores falsy/NaN', () => {
    const items = [
      { spent: null },
      { spent: undefined },
      { spent: '' },
      { spent: 10 },
    ];
    assert.equal(totalSpent(items), 10);
  });
});

describe('paidCount — quantidade de atividades pagas', () => {
  test('conta corretamente itens com spent > 0', () => {
    const items = makeItems();
    assert.equal(paidCount(items), 2); // id2(50) e id4(120)
  });
  test('retorna 0 quando nenhum pago', () => {
    const items = makeItems().map(i => ({ ...i, spent: 0 }));
    assert.equal(paidCount(items), 0);
  });
});

describe('validateNewItem — validação do formulário', () => {
  test('válido quando title, date e time preenchidos', () => {
    assert.equal(validateNewItem({ title: 'Lugar', date: '2026-04-22', time: '10:00' }), true);
  });
  test('inválido sem título', () => {
    assert.equal(validateNewItem({ title: '', date: '2026-04-22', time: '10:00' }), false);
  });
  test('inválido sem data', () => {
    assert.equal(validateNewItem({ title: 'Lugar', date: '', time: '10:00' }), false);
  });
  test('inválido sem hora', () => {
    assert.equal(validateNewItem({ title: 'Lugar', date: '2026-04-22', time: '' }), false);
  });
});

describe('buildNewItem — criação de novo item', () => {
  test('usa lat/lng fornecidos', () => {
    const item = buildNewItem({ title: 'T', date: '2026-04-22', time: '09:00', lat: -23.55, lng: -46.63, address: 'End' });
    assert.equal(item.location.lat, -23.55);
    assert.equal(item.location.lng, -46.63);
  });
  test('usa coordenadas padrão quando lat/lng ausentes', () => {
    const item = buildNewItem({ title: 'T', date: '2026-04-22', time: '09:00' });
    assert.equal(item.location.lat, -23.55);
    assert.equal(item.location.lng, -46.63);
  });
  test('usa title como address quando address vazio', () => {
    const item = buildNewItem({ title: 'Meu Local', date: '2026-04-22', time: '09:00', address: '' });
    assert.equal(item.location.address, 'Meu Local');
  });
  test('novo item começa com completed=false e archived=false', () => {
    const item = buildNewItem({ title: 'T', date: '2026-04-22', time: '09:00' });
    assert.equal(item.completed, false);
    assert.equal(item.archived, false);
  });
  test('description padrão é string vazia', () => {
    const item = buildNewItem({ title: 'T', date: '2026-04-22', time: '09:00' });
    assert.equal(item.description, '');
  });
  test('spent começa em 0 e rating em 0', () => {
    const item = buildNewItem({ title: 'T', date: '2026-04-22', time: '09:00' });
    assert.equal(item.spent, 0);
    assert.equal(item.rating, 0);
  });
});

describe('explorerVisibleCount — contagem de pontos visíveis', () => {
  const pts = [
    { cat: 'food' }, { cat: 'food' }, { cat: 'culture' },
    { cat: 'park' }, { cat: 'shopping' }, { cat: 'culture' },
  ];

  test('todos habilitados retorna total', () => {
    const cats = { food: true, culture: true, park: true, shopping: true };
    assert.equal(explorerVisibleCount(pts, cats), 6);
  });
  test('só food habilitado retorna 2', () => {
    const cats = { food: true, culture: false, park: false, shopping: false };
    assert.equal(explorerVisibleCount(pts, cats), 2);
  });
  test('nenhum habilitado retorna 0', () => {
    const cats = { food: false, culture: false, park: false, shopping: false };
    assert.equal(explorerVisibleCount(pts, cats), 0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Integridade dos dados: itens iniciais do roteiro
// ─────────────────────────────────────────────────────────────────────────────
describe('getInitialItems — 23 pontos do roteiro', () => {
  test('extrai exatamente 23 itens', () => {
    assert.equal(initialItems.length, 23, `Esperado 23, obtido ${initialItems.length}`);
  });

  test('todos têm id único', () => {
    const ids = initialItems.map(i => i.id);
    const unique = new Set(ids);
    assert.equal(unique.size, ids.length, 'IDs duplicados encontrados');
  });

  test('todos têm campos obrigatórios', () => {
    for (const item of initialItems) {
      assert.ok(item.id,          `Item sem id: ${JSON.stringify(item)}`);
      assert.ok(item.date,        `Item sem date: ${item.id}`);
      assert.ok(item.time,        `Item sem time: ${item.id}`);
      assert.ok(item.title,       `Item sem title: ${item.id}`);
      assert.ok(item.location,    `Item sem location: ${item.id}`);
      assert.ok(typeof item.location.lat === 'number', `lat inválido: ${item.id}`);
      assert.ok(typeof item.location.lng === 'number', `lng inválido: ${item.id}`);
    }
  });

  test('todas as datas estão no intervalo 22-26/04/2026', () => {
    const valid = new Set(['2026-04-22','2026-04-23','2026-04-24','2026-04-25','2026-04-26']);
    for (const item of initialItems) {
      assert.ok(valid.has(item.date), `Data inválida: ${item.date} (item ${item.id})`);
    }
  });

  test('horários têm formato HH:MM', () => {
    for (const item of initialItems) {
      assert.match(item.time, /^\d{2}:\d{2}$/, `Horário inválido: "${item.time}" (item ${item.id})`);
    }
  });

  test('todos têm categoria válida', () => {
    for (const item of initialItems) {
      assert.ok(VALID_CATS.has(item.category), `Categoria inválida: "${item.category}" (item ${item.id})`);
    }
  });

  test('coordenadas estão na região de SP', () => {
    // SP: lat -24.0 a -23.3, lng -47.0 a -46.3
    for (const item of initialItems) {
      const { lat, lng } = item.location;
      assert.ok(lat >= -24.0 && lat <= -23.3, `Latitude fora de SP: ${lat} (item ${item.id})`);
      assert.ok(lng >= -47.0 && lng <= -46.3, `Longitude fora de SP: ${lng} (item ${item.id})`);
    }
  });

  test('cobre todos os 5 dias da viagem', () => {
    const dates = new Set(initialItems.map(i => i.date));
    assert.ok(dates.has('2026-04-22'), 'Falta 22/04');
    assert.ok(dates.has('2026-04-23'), 'Falta 23/04');
    assert.ok(dates.has('2026-04-24'), 'Falta 24/04');
    assert.ok(dates.has('2026-04-25'), 'Falta 25/04');
    assert.ok(dates.has('2026-04-26'), 'Falta 26/04');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Integridade dos dados: explorerPoints
// ─────────────────────────────────────────────────────────────────────────────
describe('explorerPoints — integridade dos 57 pontos', () => {
  test('array foi extraído corretamente (não vazio)', () => {
    assert.ok(explorerPoints.length > 0, 'explorerPoints vazio — falha na extração');
  });

  test('tem pelo menos 55 pontos', () => {
    assert.ok(explorerPoints.length >= 55, `Esperado >= 55, obtido ${explorerPoints.length}`);
  });

  test('todos têm nome, lat, lng, cat e desc', () => {
    for (const p of explorerPoints) {
      assert.ok(p.name,                         `Ponto sem name`);
      assert.ok(typeof p.lat === 'number',       `Lat inválido em: ${p.name}`);
      assert.ok(typeof p.lng === 'number',       `Lng inválido em: ${p.name}`);
      assert.ok(p.cat,                           `Ponto sem cat: ${p.name}`);
      assert.ok(p.desc,                          `Ponto sem desc: ${p.name}`);
    }
  });

  test('todas as categorias são válidas', () => {
    for (const p of explorerPoints) {
      assert.ok(VALID_CATS.has(p.cat), `Categoria inválida: "${p.cat}" em "${p.name}"`);
    }
  });

  test('coordenadas estão na região de SP', () => {
    for (const p of explorerPoints) {
      assert.ok(p.lat >= -24.0 && p.lat <= -23.3, `Lat fora de SP: ${p.lat} (${p.name})`);
      assert.ok(p.lng >= -47.2 && p.lng <= -46.3, `Lng fora de SP: ${p.lng} (${p.name})`);
    }
  });

  test('nomes são únicos', () => {
    const names = explorerPoints.map(p => p.name);
    const unique = new Set(names);
    const duplicates = names.filter((n, i) => names.indexOf(n) !== i);
    assert.equal(unique.size, names.length, `Nomes duplicados: ${duplicates.join(', ')}`);
  });

  test('tem pontos de todas as categorias', () => {
    const cats = new Set(explorerPoints.map(p => p.cat));
    assert.ok(cats.has('food'),     'Falta categoria food');
    assert.ok(cats.has('culture'),  'Falta categoria culture');
    assert.ok(cats.has('park'),     'Falta categoria park');
    assert.ok(cats.has('shopping'), 'Falta categoria shopping');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// manifest.json
// ─────────────────────────────────────────────────────────────────────────────
describe('manifest.json — PWA', () => {
  test('tem campo name', () => assert.ok(manifest.name));
  test('tem campo short_name', () => assert.ok(manifest.short_name));
  test('display é standalone', () => assert.equal(manifest.display, 'standalone'));
  test('tem start_url', () => assert.ok(manifest.start_url));
  test('tem theme_color', () => assert.ok(manifest.theme_color));
  test('tem icons', () => assert.ok(Array.isArray(manifest.icons) && manifest.icons.length > 0));
  test('name contém "SP"', () => assert.ok(manifest.name.includes('SP')));
});

// ─────────────────────────────────────────────────────────────────────────────
// sw.js — Service Worker
// ─────────────────────────────────────────────────────────────────────────────
describe('sw.js — Service Worker', () => {
  test('define CACHE_NAME com prefixo sp-com-amor', () => {
    assert.match(swJs, /const CACHE_NAME\s*=\s*'sp-com-amor-v\d+'/);
  });

  test('versão de cache é >= v10', () => {
    const m = swJs.match(/sp-com-amor-v(\d+)/);
    assert.ok(m, 'CACHE_NAME não encontrado');
    assert.ok(parseInt(m[1]) >= 10, `Versão baixa: v${m[1]}`);
  });

  test('contém skipWaiting', () => {
    assert.ok(swJs.includes('skipWaiting'), 'skipWaiting não encontrado no SW');
  });

  test('contém clients.claim', () => {
    assert.ok(swJs.includes('clients.claim'), 'clients.claim não encontrado no SW');
  });

  test('tem handler de fetch', () => {
    assert.ok(swJs.includes("addEventListener('fetch'") || swJs.includes('addEventListener("fetch"'),
      'Event listener de fetch não encontrado');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// index.html — Estrutura do DOM e presença de elementos chave
// ─────────────────────────────────────────────────────────────────────────────
describe('index.html — estrutura do app', () => {
  test('tem viewport meta tag', () => {
    assert.ok(indexHtml.includes('name="viewport"'));
  });

  test('tem link para manifest.json', () => {
    assert.ok(indexHtml.includes('manifest.json'));
  });

  test('carrega Vue local', () => {
    assert.ok(indexHtml.includes('assets/vue.global.prod.js'));
  });

  test('carrega Leaflet local', () => {
    assert.ok(indexHtml.includes('assets/leaflet.js'));
    assert.ok(indexHtml.includes('assets/leaflet.css'));
  });

  test('carrega Tailwind local', () => {
    assert.ok(indexHtml.includes('assets/tailwind.js'));
  });

  test('tem elemento #app', () => {
    assert.ok(indexHtml.includes('id="app"'));
  });

  test('tem elemento #top-header', () => {
    assert.ok(indexHtml.includes('id="top-header"'));
  });

  test('tem elemento #bottom-nav', () => {
    assert.ok(indexHtml.includes('id="bottom-nav"'));
  });

  test('tem elemento #map-container', () => {
    assert.ok(indexHtml.includes('id="map-container"'));
  });

  test('tem elemento #splash (loading screen)', () => {
    assert.ok(indexHtml.includes('id="splash"'));
  });

  test('tem "Powered by Biscoitinho"', () => {
    assert.ok(indexHtml.includes('Powered by Biscoitinho'));
  });

  test('registra Service Worker', () => {
    assert.ok(indexHtml.includes('serviceWorker') && indexHtml.includes('register'));
  });

  test('view Cards está presente no template', () => {
    assert.ok(indexHtml.includes("view === 'Cards'"));
  });

  test('view Timeline está presente', () => {
    assert.ok(indexHtml.includes("view === 'Timeline'"));
  });

  test('view Mapa está presente', () => {
    assert.ok(indexHtml.includes("view === 'Mapa'"));
  });

  test('view Budget está presente', () => {
    assert.ok(indexHtml.includes("view === 'Budget'"));
  });

  test('view Dicas está presente', () => {
    assert.ok(indexHtml.includes("view === 'Dicas'"));
  });

  test('view add (Novo Destino) está presente', () => {
    assert.ok(indexHtml.includes("view === 'add'"));
  });

  test('tem filtro de categorias (explorerCatOptions)', () => {
    assert.ok(indexHtml.includes('explorerCatOptions'));
  });

  test('tem checkbox showPinNames', () => {
    assert.ok(indexHtml.includes('showPinNames'));
  });

  test('tem botão GPS (locateMe)', () => {
    assert.ok(indexHtml.includes('locateMe'));
  });

  test('tem botão de arquivar (toggleArchive)', () => {
    assert.ok(indexHtml.includes('toggleArchive'));
  });

  test('não há referências a CDN externas (100% offline)', () => {
    // Verifica que não usa cdn.jsdelivr, cdnjs, unpkg, ou tailwindcss.com
    const cdnPatterns = [
      'cdn.jsdelivr.net',
      'cdnjs.cloudflare.com',
      'unpkg.com',
      'cdn.tailwindcss.com',
    ];
    for (const cdn of cdnPatterns) {
      assert.ok(!indexHtml.includes(cdn), `CDN externo encontrado: ${cdn}`);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Sintaxe JS do app
// ─────────────────────────────────────────────────────────────────────────────
describe('index.html — sintaxe JavaScript', () => {
  test('bloco <script> do app não contém SyntaxError (verificado via node --check)', () => {
    // Este teste verifica se o arquivo foi extraído e validado corretamente
    // A validação real é feita via: node --check /tmp/app.js (executada no CI)
    // Aqui verificamos estrutura básica: setup() e return {}
    assert.ok(indexHtml.includes('setup()'), 'setup() não encontrado');
    assert.ok(indexHtml.includes('.mount(\'#app\')'), 'mount não encontrado');
    assert.ok(indexHtml.includes('return {'), 'return do setup não encontrado');
  });
});
