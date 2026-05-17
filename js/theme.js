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
      "<button class='button button-secondary theme-toggle' id='theme-toggle-button' type='button'>",
      "<span class='theme-toggle-icon' aria-hidden='true'></span>",
      "<span class='theme-toggle-text'></span>",
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
    const icon = button.querySelector(".theme-toggle-icon");
    const text = button.querySelector(".theme-toggle-text");

    if (icon) {
      icon.textContent = isDark ? "\u2600" : "\u263E";
    }

    if (text) {
      text.textContent = isDark ? "\u65e5\u95f4" : "\u591c\u95f4";
    }
  }
};

window.HorseyTheme.init();
