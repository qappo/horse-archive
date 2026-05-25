window.HorseyHorses = {
  normalizeHorse(horse) {
    const currentUser = window.HorseyAuth?.getCurrentUser?.() || {};
    const displayNumber = horse.display_number || null;
    const displayCode = horse.display_code || (displayNumber
      ? String(displayNumber).padStart(3, "0")
      : horse.id || "");
    const imageUrls = Array.isArray(horse.image_urls) ? horse.image_urls.filter(Boolean).slice(0, 5) : [];

    return {
      id: horse.id || "",
      display_number: displayNumber,
      display_code: displayCode,
      name: horse.name || "未命名马匹",
      owner: horse.owner || horse.owner_username || horse.username || "未知",
      owner_user_id: horse.owner_user_id || horse.user_id || null,
      owner_avatar_url: horse.owner_avatar_url || horse.avatar_url || "",
      created_at: horse.created_at || horse.createdAt || "",
      description: horse.description || "",
      image_urls: imageUrls,
      image: imageUrls[0] || horse.image || horse.image_url || window.HORSEY_CONFIG.placeholderImage,
      image_url: imageUrls[0] || horse.image_url || horse.image || "",
      dna: horse.dna || "",
      like_count: Number(horse.like_count || 0),
      liked_by_me: Boolean(horse.liked_by_me),
      favorite_count: Number(horse.favorite_count || 0),
      favorited_by_me: Boolean(horse.favorited_by_me),
      can_edit: Boolean(horse.can_edit) || currentUser.role === "admin"
    };
  },

  async loadHorseById(id) {
    const result = await window.HorseyApi.getHorse(id);
    return this.normalizeHorse(window.HorseyApi.normalizeHorseResult(result));
  },

  async loadAllHorses() {
    const result = await window.HorseyApi.getHorses();
    const horses = window.HorseyApi.normalizeHorsesResult(result);
    return horses.map((horse) => this.normalizeHorse(horse));
  }
};
