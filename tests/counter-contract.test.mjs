import assert from 'node:assert/strict';
import fs from 'node:fs';

const production = fs.readFileSync('assets/js/app.js', 'utf8');
const cloudflareTemplate = fs.readFileSync('backend/cloudflare-support/frontend-app.template.js', 'utf8');
const html = fs.readFileSync('index.html', 'utf8');

function occurrences(source, fragment) {
  return source.split(fragment).length - 1;
}

assert.equal(occurrences(production, "requestCounter('/up')"), 1, 'produkcja może mieć tylko jedno miejsce wysyłające zapis');
assert.match(production, /Math\.max\(current\.value, normalized\)/, 'wartość w cache nie może się cofać');
assert.match(production, /storeCachedCounter\(event\.data\.value, \{ broadcast: false \}\)/, 'wiadomość z innej karty nie może zostać nadana ponownie');
assert.match(production, /storePendingSupport\(\);[\s\S]*requestCounter\('\/up'\)/, 'znacznik niejednoznacznego zapisu musi powstać przed żądaniem');

const productionOnlineStart = production.indexOf("window.addEventListener('online'");
const productionOfflineStart = production.indexOf("window.addEventListener('offline'", productionOnlineStart);
assert(productionOnlineStart >= 0 && productionOfflineStart > productionOnlineStart, 'brak obsługi online/offline');
assert(!production.slice(productionOnlineStart, productionOfflineStart).includes('submitSupport'), 'publiczne API nie może automatycznie ponawiać zapisu po odzyskaniu internetu');

assert.match(cloudflareTemplate, /const SUPPORT_API_BASE = '__SUPPORT_API_BASE__';/, 'szablon musi zawierać placeholder Workera');
assert(!cloudflareTemplate.includes('api.counterapi.dev'), 'szablon Cloudflare nie może odwoływać się do starego API');
assert.match(cloudflareTemplate, /method: 'POST'/, 'backend idempotentny wymaga POST');
assert.match(cloudflareTemplate, /'X-Support-Device': getDeviceId\(\)/, 'zapis musi zawierać identyfikator urządzenia');
assert.match(cloudflareTemplate, /requestId: pending\.requestId/, 'ponowienia muszą używać tego samego requestId');
assert.match(cloudflareTemplate, /Math\.max\(current\.value, normalized\)/, 'szablon Cloudflare musi zachować monotoniczny cache');
assert.match(cloudflareTemplate, /storeCachedCount\(event\.data\.value, \{ broadcast: false \}\)/, 'szablon Cloudflare nie może tworzyć pętli BroadcastChannel');

assert.match(html, /assets\/js\/app\.js\?v=39/, 'HTML musi wymuszać pobranie naprawionego skryptu');
assert.match(html, /<script src="assets\/js\/app\.js\?v=39" defer><\/script>/, 'skrypt musi być ładowany przez defer');
assert.equal(occurrences(html, 'id="support-button"'), 1, 'przycisk wsparcia musi mieć unikalny identyfikator');
assert.equal(occurrences(html, 'id="support-count"'), 1, 'licznik musi mieć unikalny identyfikator');
assert.match(html, /Aktualnie zbieramy podpisy mieszkańców pod petycją\./, 'strona musi rozróżniać internetowe poparcie od formalnej zbiórki podpisów');
assert.equal(fs.existsSync('.github/workflows/add-petition-status-once.yml'), false, 'wykonany workflow jednorazowy powinien zostać usunięty');

console.log('Counter contract: OK');
