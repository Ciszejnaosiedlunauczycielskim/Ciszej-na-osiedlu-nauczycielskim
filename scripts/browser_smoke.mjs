import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const base = 'http://127.0.0.1:8765/';
const pages = [
  'index.html',
  'historia-sprawy.html',
  'dane.html',
  'inwestycje.html',
  'aktualnosci.html',
  'media.html',
  'zrodla.html',
];
const viewports = [
  { width: 390, height: 844, label: 'iphone' },
  { width: 768, height: 1024, label: 'tablet' },
  { width: 1280, height: 900, label: 'desktop' },
];
const errors = [];
const browser = await chromium.launch({ headless: true });
fs.mkdirSync('browser-audit-screenshots', { recursive: true });

for (const viewport of viewports) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
  const jsErrors = [];
  page.on('pageerror', error => jsErrors.push(error.message));
  for (const file of pages) {
    const res = await page.goto(base + file, { waitUntil: 'load', timeout: 20000 });
    if (!res || res.status() !== 200) errors.push(file + ' ' + viewport.label + ': status HTTP ' + res?.status());
    const info = await page.evaluate(() => {
      const menu = document.getElementById('menu');
      const nav = document.getElementById('nav');
      return {
        h1: document.querySelectorAll('h1').length,
        main: !!document.querySelector('main'),
        lang: document.documentElement.lang,
        width: document.documentElement.scrollWidth,
        viewportWidth: window.innerWidth,
        menu: !!menu,
        nav: !!nav,
        badImages: [...document.images].filter(i => i.loading !== 'lazy' && i.complete && !i.naturalWidth).map(i => i.src),
      };
    });
    if (info.h1 !== 1 || !info.main || info.lang !== 'pl' || !info.menu || !info.nav) {
      errors.push(file + ' ' + viewport.label + ': błędna struktura ' + JSON.stringify(info));
    }
    if (info.width > info.viewportWidth + 3) {
      const overflowing = await page.evaluate(() =>
        [...document.querySelectorAll('body *')].filter(el => {
          const r = el.getBoundingClientRect();
          return r.width > window.innerWidth + 3 || r.right > window.innerWidth + 4;
        }).slice(0, 12).map(el => {
          const r = el.getBoundingClientRect();
          return { tag: el.tagName.toLowerCase(), cls: String(el.className).slice(0, 90),
                   width: Math.round(r.width), right: Math.round(r.right) };
        })
      );
      errors.push(file + ' ' + viewport.label + ': przewijanie poziome całej strony ' + info.width + '>' + info.viewportWidth + ', elementy: ' + JSON.stringify(overflowing));
    }
    if (info.badImages.length) errors.push(file + ' ' + viewport.label + ': niezaładowane obrazy ' + info.badImages.join(', '));

    if (viewport.width === 390 && file === 'index.html') {
      const button = page.locator('#menu');
      await button.click();
      const expanded = await button.getAttribute('aria-expanded');
      const opened = await page.locator('#nav').evaluate(el => el.classList.contains('open'));
      if (expanded !== 'true' || !opened) errors.push('Mobilne menu nie otwiera się poprawnie');
      await page.keyboard.press('Escape');
      if ((await button.getAttribute('aria-expanded')) !== 'false') errors.push('Mobilne menu nie zamyka się po Escape');
    }
    if ((file === 'index.html' || file === 'dane.html') && viewport.label !== 'tablet') {
      await page.screenshot({ path: path.join('browser-audit-screenshots', file.replace('.html','') + '-' + viewport.label + '.png'), fullPage: true });
    }
  }
  if (jsErrors.length) errors.push(viewport.label + ': błędy JS: ' + [...new Set(jsErrors)].join(' | '));
  await page.close();
}
await browser.close();

if (errors.length) {
  console.error('Audyt przeglądarkowy wykrył błędy:');
  errors.forEach(err => console.error('- ' + err));
  process.exitCode = 1;
} else {
  console.log('Audyt przeglądarkowy: 7 podstron x 3 szerokości, 0 błędów JS, 0 globalnych przepełnień i poprawne menu.');
}