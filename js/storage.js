window.HorseyStorage = {
  getToken() {
    return localStorage.getItem(window.HORSEY_CONFIG.storageKeys.token) || "";
  },

  setToken(token) {
    localStorage.setItem(window.HORSEY_CONFIG.storageKeys.token, token);
  },

  removeToken() {
    localStorage.removeItem(window.HORSEY_CONFIG.storageKeys.token);
  },

  getUser() {
    const raw = localStorage.getItem(window.HORSEY_CONFIG.storageKeys.user);

    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw);
    } catch (error) {
      localStorage.removeItem(window.HORSEY_CONFIG.storageKeys.user);
      return null;
    }
  },

  setUser(user) {
    localStorage.setItem(window.HORSEY_CONFIG.storageKeys.user, JSON.stringify(user));
  },

  removeUser() {
    localStorage.removeItem(window.HORSEY_CONFIG.storageKeys.user);
  },

  clearAuth() {
    this.removeToken();
    this.removeUser();
  }
};
