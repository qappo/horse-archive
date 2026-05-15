document.addEventListener("DOMContentLoaded", async () => {
  const grid = document.getElementById("horse-grid");
  const count = document.getElementById("horse-count");

  async function renderHorses() {
    grid.innerHTML = "";
    window.HorseyUI.showStatus("home-status", "正在读取马匹数据...");

    try {
      const horses = await window.HorseyHorses.loadAllHorses();

      window.HorseyUI.hideElement("home-status");
      count.textContent = "共 " + horses.length + " 匹";

      if (horses.length === 0) {
        window.HorseyUI.showStatus("home-status", "还没有马匹，先创建第一匹吧。");
        return;
      }

      horses.forEach((horse) => {
        grid.appendChild(window.HorseyUI.createHorseCard(horse));
      });
    } catch (error) {
      window.HorseyUI.showStatus("home-status", error.message || "加载失败");
      count.textContent = "读取失败";
    }
  }

  await renderHorses();
});
