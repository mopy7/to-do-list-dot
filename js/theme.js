const THEME_KEY = "kanban-theme";
const THEME_DARK = "dark";
const THEME_LIGHT = "light";
const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

export function initTheme() {
  const savedTheme = localStorage.getItem(THEME_KEY);
  if (savedTheme === THEME_LIGHT || savedTheme === THEME_DARK) {
    document.documentElement.dataset.theme = savedTheme;
  }

  const toggleButton = document.querySelector("[data-theme-toggle]");
  if (!toggleButton) {
    return;
  }

  syncToggleLabel(toggleButton);

  toggleButton.addEventListener("click", () => {
    const nextTheme = getActiveTheme() === THEME_DARK ? THEME_LIGHT : THEME_DARK;
    document.documentElement.dataset.theme = nextTheme;
    localStorage.setItem(THEME_KEY, nextTheme);
    syncToggleLabel(toggleButton);
  });

  mediaQuery.addEventListener("change", () => {
    const hasManualTheme = localStorage.getItem(THEME_KEY);
    if (!hasManualTheme) {
      syncToggleLabel(toggleButton);
    }
  });
}

function getActiveTheme() {
  const manualTheme = document.documentElement.dataset.theme;
  if (manualTheme === THEME_LIGHT || manualTheme === THEME_DARK) {
    return manualTheme;
  }
  return mediaQuery.matches ? THEME_DARK : THEME_LIGHT;
}

function syncToggleLabel(button) {
  button.textContent = getActiveTheme() === THEME_DARK ? "Light mode" : "Dark mode";
}
