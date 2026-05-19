window.HorseyApi = {
  async request(path, options = {}) {
    const url = window.HORSEY_CONFIG.apiBaseUrl + path;
    const headers = options.headers ? { ...options.headers } : {};
    const token = window.HorseyStorage?.getToken?.() || "";
    let response;

    if (token && !headers.Authorization) {
      headers.Authorization = "Bearer " + token;
    }

    try {
      response = await fetch(url, {
        ...options,
        headers
      });
    } catch (error) {
      if (error instanceof TypeError) {
        throw new Error("无法连接到 API。通常是接口未部署、CORS 未配置，或浏览器预检请求被拒绝。");
      }

      throw error;
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || "请求失败");
    }

    if (data && typeof data === "object" && data.success === false) {
      throw new Error(data.message || "请求失败");
    }

    return data;
  },

  async register(payload) {
    return this.request("/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  },

  async login(payload) {
    return this.request("/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  },

  async getMe() {
    return this.request("/me", { method: "GET" });
  },

  async updateAvatar(avatarUrl) {
    return this.request("/me/avatar", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ avatar_url: avatarUrl })
    });
  },

  async getUploadPolicy(kind, filename) {
    return this.request("/upload-policy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, filename })
    });
  },

  async uploadFileToOss(file, kind) {
    const result = await this.getUploadPolicy(kind, file.name);
    const upload = result.upload || result.data?.upload;

    if (!upload) {
      throw new Error("没有获取到上传凭证");
    }

    const formData = new FormData();
    formData.append("key", upload.key);
    formData.append("policy", upload.policy);
    formData.append("OSSAccessKeyId", upload.access_id);
    formData.append("success_action_status", "200");
    formData.append("Signature", upload.signature);
    formData.append("file", file);

    const response = await fetch(upload.host, {
      method: "POST",
      body: formData
    });

    if (!response.ok) {
      throw new Error("上传 OSS 失败，请检查 OSS CORS 和上传凭证配置。");
    }

    return upload.url;
  },

  async getHorses() {
    return this.request("/horses", { method: "GET" });
  },

  async getHorse(id) {
    return this.request("/horses/" + encodeURIComponent(id), { method: "GET" });
  },

  async createHorse(payload) {
    return this.request("/horses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  },

  async updateHorse(id, payload) {
    return this.request("/horses/" + encodeURIComponent(id), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  },

  async deleteHorse(id) {
    return this.request("/horses/" + encodeURIComponent(id), { method: "DELETE" });
  },

  async getComments(horseId) {
    return this.request("/comments?horse_id=" + encodeURIComponent(horseId), {
      method: "GET"
    });
  },

  async createComment(payload) {
    return this.request("/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  },

  async updateComment(commentId, payload) {
    return this.request("/comments/" + encodeURIComponent(commentId), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  },

  async deleteComment(commentId) {
    return this.request("/comments/" + encodeURIComponent(commentId), {
      method: "DELETE"
    });
  },

  async like(targetType, targetId) {
    return this.request("/likes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target_type: targetType, target_id: targetId })
    });
  },

  async unlike(targetType, targetId) {
    return this.request("/likes", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target_type: targetType, target_id: targetId })
    });
  },

  async getFavorites() {
    return this.request("/favorites", { method: "GET" });
  },

  async favoriteHorse(horseId) {
    return this.request("/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ horse_id: horseId })
    });
  },

  async unfavoriteHorse(horseId) {
    return this.request("/favorites", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ horse_id: horseId })
    });
  },

  async getEmojis() {
    return this.request("/emojis", { method: "GET" });
  },

  async getUpdates() {
    return this.request("/updates", { method: "GET" });
  },

  async adminList(resource) {
    return this.request("/admin/" + encodeURIComponent(resource), { method: "GET" });
  },

  async adminUpdateUser(id, payload) {
    return this.request("/admin/users/" + encodeURIComponent(id), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  },

  async adminDeleteUser(id) {
    return this.request("/admin/users/" + encodeURIComponent(id), {
      method: "DELETE"
    });
  },

  async adminCreateEmoji(payload) {
    return this.request("/admin/emojis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  },

  async adminUpdateEmoji(id, payload) {
    return this.request("/admin/emojis/" + encodeURIComponent(id), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  },

  async adminCreateUpdate(payload) {
    return this.request("/admin/updates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  },

  async adminUpdateUpdate(id, payload) {
    return this.request("/admin/updates/" + encodeURIComponent(id), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  },

  normalizeAuthResult(result, fallbackUsername) {
    const candidateUser =
      result.user ||
      result.data?.user ||
      result.result?.user ||
      (result.username ? { username: result.username } : null) ||
      (result.data?.username ? { username: result.data.username } : null);

    const user = candidateUser
      ? {
          id: candidateUser.id || candidateUser.user_id || candidateUser.uid || null,
          username: candidateUser.username || candidateUser.name || fallbackUsername || "用户",
          avatar_url: candidateUser.avatar_url || "",
          role: candidateUser.role || "user"
        }
      : null;

    const token =
      result.token ||
      result.access_token ||
      result.jwt ||
      result.data?.token ||
      result.data?.access_token ||
      result.result?.token ||
      "";

    return { token, user };
  },

  normalizeCommentsResult(result) {
    if (Array.isArray(result)) return result;
    if (Array.isArray(result.comments)) return result.comments;
    if (Array.isArray(result.data)) return result.data;
    if (Array.isArray(result.data?.comments)) return result.data.comments;
    return [];
  },

  normalizeHorsesResult(result) {
    if (Array.isArray(result)) return result;
    if (Array.isArray(result.horses)) return result.horses;
    if (Array.isArray(result.data)) return result.data;
    if (Array.isArray(result.data?.horses)) return result.data.horses;
    return [];
  },

  normalizeHorseResult(result) {
    return result.horse || result.data?.horse || result.data || result;
  }
};
