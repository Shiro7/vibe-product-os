'use strict';

const root = document.documentElement;
const themeButton = document.querySelector('.theme-button');
const menuButton = document.querySelector('.menu-button');
const navigation = document.querySelector('.site-nav');
const darkPreference = window.matchMedia('(prefers-color-scheme: dark)');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function currentTheme() {
  return root.dataset.theme || (darkPreference.matches ? 'dark' : 'light');
}

function updateThemeControl() {
  if (!themeButton) return;
  const isDark = currentTheme() === 'dark';
  themeButton.textContent = isDark ? 'Light mode' : 'Dark mode';
  themeButton.setAttribute('aria-pressed', String(isDark));
  themeButton.setAttribute('aria-label', isDark ? 'Use light mode' : 'Use dark mode');
}

function setTheme(theme) {
  root.dataset.theme = theme;
  try {
    localStorage.setItem('vpos-theme', theme);
  } catch (_) {}
  updateThemeControl();
}

themeButton?.addEventListener('click', () => {
  setTheme(currentTheme() === 'dark' ? 'light' : 'dark');
});

darkPreference.addEventListener('change', () => {
  if (!root.dataset.theme) updateThemeControl();
});

function setMenu(open) {
  if (!menuButton || !navigation) return;
  menuButton.setAttribute('aria-expanded', String(open));
  navigation.dataset.open = String(open);
  menuButton.textContent = open ? 'Close' : 'Menu';
}

menuButton?.addEventListener('click', () => {
  setMenu(menuButton.getAttribute('aria-expanded') !== 'true');
});

navigation?.addEventListener('click', (event) => {
  if (event.target instanceof HTMLAnchorElement) setMenu(false);
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') setMenu(false);
});

async function copyText(value) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const temporary = document.createElement('textarea');
  temporary.value = value;
  temporary.setAttribute('readonly', '');
  temporary.style.position = 'fixed';
  temporary.style.opacity = '0';
  document.body.appendChild(temporary);
  temporary.select();
  const copied = document.execCommand('copy');
  temporary.remove();
  if (!copied) throw new Error('Copy was not available.');
}

for (const button of document.querySelectorAll('[data-copy]')) {
  button.addEventListener('click', async () => {
    const target = document.querySelector(button.dataset.copy);
    const status = document.querySelector('#copy-status');
    if (!target || !status) return;

    button.disabled = true;
    try {
      await copyText(target.textContent.trim());
      button.textContent = 'Copied';
      status.textContent = 'Command copied. Run it inside the project you want VPOS to govern.';
    } catch (_) {
      button.textContent = 'Try again';
      status.textContent = 'Copy failed. Select the command and copy it manually.';
    } finally {
      window.setTimeout(() => {
        button.disabled = false;
        button.textContent = 'Copy';
      }, 2200);
    }
  });
}

const revealItems = document.querySelectorAll('.reveal');
if (reducedMotion.matches || !('IntersectionObserver' in window)) {
  for (const item of revealItems) item.dataset.visible = 'true';
} else {
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.dataset.visible = 'true';
      observer.unobserve(entry.target);
    }
  }, { threshold: 0.14, rootMargin: '0px 0px -5% 0px' });

  for (const item of revealItems) observer.observe(item);
}

updateThemeControl();
