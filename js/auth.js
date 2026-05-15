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

    if (user) {
      const avatar = user.avatar_url
        ? "<img class='user-avatar' src='" + this.escapeHtml(user.avatar_url) + "' alt='头像'>"
        : "<span class='user-avatar user-avatar-empty'>" + this.escapeHtml((user.username || "U").slice(0, 1).toUpperCase()) + "</span>";
      const adminLink = user.role === "admin"
        ? "<a class='button button-secondary' href='admin.html'>后台</a>"
        : "";

      container.innerHTML = [
        "<a class='button button-secondary' href='login.html'>登录 / 注册</a>",
        "<span class='user-chip'>",
        avatar,
        "<span>" + this.escapeHtml(user.username || "用户") + "</span>",
        "</span>",
        adminLink,
        "<button class='button' id='logout-button' type='button'>退出</button>"
      ].join("");

      document.getElementById("logout-button").addEventListener("click", () => this.logout());
      return;
    }

    container.innerHTML = "<a class='button' href='login.html'>登录 / 注册</a>";
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
