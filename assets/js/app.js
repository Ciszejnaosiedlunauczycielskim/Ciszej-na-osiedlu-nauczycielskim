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

const year = document.querySelector('#year');
if (year) year.textContent = new Date().getFullYear();

const shareButton = document.querySelector('#share-button');
const shareStatus = document.querySelector('#share-status');

if (shareButton) {
  const shareData = {
    title: 'Ciszej na Osiedlu Nauczycielskim',
    text: 'Poznaj historię pomiarów hałasu przy Osiedlu Nauczycielskim w Tarnowie i poprzyj na stronie inicjatywę mieszkańców osiedla dotyczącą wykonania aktualnych pomiarów oraz wdrożenia zabezpieczeń przed hałasem.',
    url: 'https://ciszejnaosiedlunauczycielskim.pl/'
  };

  shareButton.addEventListener('click', async () => {
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareData.url);
        const originalLabel = shareButton.textContent;
        shareButton.textContent = 'Link skopiowany';
        if (shareStatus) shareStatus.textContent = 'Link do strony został skopiowany.';
        window.setTimeout(() => {
          shareButton.textContent = originalLabel;
          if (shareStatus) shareStatus.textContent = '';
        }, 2200);
        return;
      }

      window.prompt('Skopiuj link do petycji:', shareData.url);
    } catch (error) {
      if (error?.name !== 'AbortError') {
        console.error('Nie udało się udostępnić petycji.', error);
      }
    }
  });
}
