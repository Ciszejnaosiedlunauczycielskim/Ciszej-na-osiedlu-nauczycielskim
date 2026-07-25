const menu = document.querySelector('#menu');
const nav = document.querySelector('#nav');

function closeMenu({ returnFocus = false } = {}) {
  if (!menu || !nav) return;
  nav.classList.remove('open');
  menu.setAttribute('aria-expanded', 'false');
  if (returnFocus) menu.focus();
}

if (menu && nav) {
  menu.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    menu.setAttribute('aria-expanded', String(open));
    if (open) nav.querySelector('a')?.focus();
  });

  nav.addEventListener('click', event => {
    if (event.target.matches('a')) closeMenu();
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && nav.classList.contains('open')) {
      closeMenu({ returnFocus: true });
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 980 && nav.classList.contains('open')) closeMenu();
  });
}

const mapScroll = document.querySelector('#map-scroll');

function focusMapOnEstate() {
  if (!mapScroll || window.innerWidth > 700) return;
  mapScroll.scrollLeft = mapScroll.scrollWidth - mapScroll.clientWidth;
}

if (mapScroll) {
  const mapImage = mapScroll.querySelector('img');
  if (mapImage?.complete) {
    requestAnimationFrame(focusMapOnEstate);
  } else {
    mapImage?.addEventListener('load', focusMapOnEstate, { once: true });
  }
}

const year = document.querySelector('#year');
if (year) year.textContent = new Date().getFullYear();
