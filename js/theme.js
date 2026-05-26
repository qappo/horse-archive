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
    return "<theme-button class='theme-toggle-web' id='theme-toggle-button' value='" + this.getTheme() + "'></theme-button>";
  },

  bindButton() {
    const button = document.getElementById("theme-toggle-button");

    if (!button) {
      return;
    }

    button.addEventListener("change", (event) => this.setTheme(event.detail));
    this.updateButton();
  },

  updateButton() {
    const button = document.getElementById("theme-toggle-button");

    if (!button) {
      return;
    }

    const isDark = this.getTheme() === "dark";
    button.setAttribute("value", isDark ? "dark" : "light");
    button.setAttribute("aria-pressed", String(isDark));
    button.title = isDark ? "切换到日间模式" : "切换到夜间模式";
  }
};

window.HorseyTheme.init();
