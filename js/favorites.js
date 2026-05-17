document.addEventListener("DOMContentLoaded", async () => {
  const grid = document.getElementById("favorite-grid");
  const count = document.getElementById("favorite-count");

  if (!window.HorseyAuth.isLoggedIn()) {
    count.textContent = "";
    window.HorseyUI.showStatus("favorites-status", "请先登录后查看收藏。");
    return;
  }

  try {
    window.HorseyUI.showStatus("favorites-status", "正在读取收藏...");
    const result = await window.HorseyApi.getFavorites();
    const horses = window.HorseyApi
      .normalizeHorsesResult(result)
      .map((horse) => window.HorseyHorses.normalizeHorse(horse));

    grid.innerHTML = "";
    count.textContent = "Total " + horses.length;

    if (horses.length === 0) {
      window.HorseyUI.showStatus("favorites-status", "还没有收藏马匹。");
      return;
    }

    window.HorseyUI.hideElement("favorites-status");
    horses.forEach((horse) => {
      grid.appendChild(window.HorseyUI.createHorseCard(horse));
    });
  } catch (error) {
    count.textContent = "";
    window.HorseyUI.showStatus("favorites-status", error.message || "读取收藏失败");
  }
});
