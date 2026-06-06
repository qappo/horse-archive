document.addEventListener("DOMContentLoaded", async () => {
  const grid = document.getElementById("favorite-grid");
  const count = document.getElementById("favorite-count");
  const areaTabs = Array.from(document.querySelectorAll("[data-favorite-area]"));
  let allFavorites = [];
  let activeArea = "horses";

  function renderFavorites() {
    grid.innerHTML = "";
    areaTabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.favoriteArea === activeArea));
    const items = allFavorites.filter((horse) => (horse.post_area || "horses") === activeArea);
    const emptyText = activeArea === "editor" ? "没有收藏编辑包。" : "没有收藏马匹。";

    count.textContent = "共 " + items.length + " 篇";

    if (items.length === 0) {
      window.HorseyUI.showStatus("favorites-status", emptyText);
      return;
    }

    window.HorseyUI.hideElement("favorites-status");
    items.forEach((horse) => {
      grid.appendChild(window.HorseyUI.createHorseCard(horse));
    });
  }

  if (!window.HorseyAuth.isLoggedIn()) {
    count.textContent = "";
    window.HorseyUI.showStatus("favorites-status", "请先登录后查看收藏。");
    return;
  }

  try {
    window.HorseyUI.showStatus("favorites-status", "正在读取收藏...");
    const result = await window.HorseyApi.getFavorites();
    allFavorites = window.HorseyApi
      .normalizeHorsesResult(result)
      .map((horse) => window.HorseyHorses.normalizeHorse(horse));

    renderFavorites();
  } catch (error) {
    count.textContent = "";
    window.HorseyUI.showStatus("favorites-status", error.message || "读取收藏失败");
  }

  areaTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      activeArea = tab.dataset.favoriteArea || "horses";
      renderFavorites();
    });
  });
});
