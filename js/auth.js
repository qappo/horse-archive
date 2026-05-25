window.HorseyAuth = {
  getCurrentUser() {
    return window.HorseyStorage.getUser();
  },

  isLoggedIn() {
    return Boolean(window.HorseyStorage.getToken() && window.HorseyStorage.getUser());
  },

  logout() {
    window.HorseyStorage.clearAuth();
    window.location.href = "index.html";
  },

  async refreshMe() {
    if (!this.isLoggedIn()) {
      return null;
    }

    try {
      const result = await window.HorseyApi.getMe();
      const user = result.user || result.data?.user;

      if (user) {
        window.HorseyStorage.setUser(user);
      }

      return user;
    } catch (error) {
      return this.getCurrentUser();
    }
  },

  renderHeaderActions() {
    const container = document.getElementById("header-actions");

    if (!container) {
      return;
    }

    const user = this.getCurrentUser();
    const themeButton = window.HorseyTheme ? window.HorseyTheme.renderButton() : "";

    if (user) {
      const avatar = user.avatar_url
        ? "<img class='user-avatar' src='" + this.escapeHtml(user.avatar_url) + "' alt='Avatar'>"
        : "<span class='user-avatar user-avatar-empty'>" + this.escapeHtml((user.username || "U").slice(0, 1).toUpperCase()) + "</span>";
      const adminLink = user.role === "admin"
        ? "<a class='button button-secondary' href='admin.html'>&#21518;&#21488;</a>"
        : "";

      container.innerHTML = [
        themeButton,
        "<a class='user-chip user-chip-link' href='profile.html' title='个人主页'>",
        avatar,
        "<span>" + this.escapeHtml(user.username || "User") + "</span>",
        "</a>",
        adminLink,
        "<button class='button' id='logout-button' type='button'>&#36864;&#20986;</button>"
      ].join("");

      window.HorseyTheme?.bindButton();
      document.getElementById("logout-button").addEventListener("click", () => this.logout());
      return;
    }

    container.innerHTML = [
      themeButton,
      "<a class='button' href='login.html'>&#30331;&#24405; / &#27880;&#20876;</a>"
    ].join("");
    window.HorseyTheme?.bindButton();
  },

  escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }
};

document.addEventListener("DOMContentLoaded", () => {
  window.HorseyAuth.renderHeaderActions();
});
