window.HorseyTheme = {
  storageKey: "horsey_theme",

  getTheme() {
    return localStorage.getItem(this.storageKey) || "light";
  },

  setTheme(theme) {
    const nextTheme = theme === "dark" ? "dark" : "light";
    localStorage.setItem(this.storageKey, nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    this.updateButton();
  },

  toggle() {
    this.setTheme(this.getTheme() === "dark" ? "light" : "dark");
  },

  init() {
    document.documentElement.dataset.theme = this.getTheme();
  },

  renderButton() {
    return [
      "<button class='theme-toggle' id='theme-toggle-button' type='button' aria-label='切换夜间模式'>",
      "<span class='theme-toggle-track' aria-hidden='true'>",
      "<span class='theme-toggle-icon theme-toggle-sun'>☀</span>",
      "<span class='theme-toggle-icon theme-toggle-moon'>☾</span>",
      "<span class='theme-toggle-knob'></span>",
      "</span>",
      "</button>"
    ].join("");
  },

  bindButton() {
    const button = document.getElementById("theme-toggle-button");

    if (!button) {
      return;
    }

    button.addEventListener("click", () => this.toggle());
    this.updateButton();
  },

  updateButton() {
    const button = document.getElementById("theme-toggle-button");

    if (!button) {
      return;
    }

    const isDark = this.getTheme() === "dark";
    button.classList.toggle("is-dark", isDark);
    button.setAttribute("aria-pressed", String(isDark));
    button.title = isDark ? "切换到日间模式" : "切换到夜间模式";
  }
};

window.HorseyTheme.init();
