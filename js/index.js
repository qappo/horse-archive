document.addEventListener("DOMContentLoaded", async () => {
  const grid = document.getElementById("horse-grid");
  const count = document.getElementById("horse-count");
  const avatarPanel = document.getElementById("home-avatar-panel");

  if (avatarPanel) {
    avatarPanel.remove();
  }

  async function renderHorses() {
    grid.innerHTML = "";
    window.HorseyUI.showStatus("home-status", "Loading horses...");

    try {
      const horses = await window.HorseyHorses.loadAllHorses();

      window.HorseyUI.hideElement("home-status");
      count.textContent = "Total " + horses.length;

      if (horses.length === 0) {
        window.HorseyUI.showStatus("home-status", "No horses yet.");
        return;
      }

      horses.forEach((horse) => {
        grid.appendChild(window.HorseyUI.createHorseCard(horse));
      });
    } catch (error) {
      window.HorseyUI.showStatus("home-status", error.message || "Failed to load horses");
      count.textContent = "Load failed";
    }
  }

  await renderHorses();
});
