document.addEventListener("DOMContentLoaded", async () => {
  if (!window.HorseyAuth.isLoggedIn()) {
    window.location.href = "login.html";
    return;
  }

  const uploadForm = document.getElementById("horse-upload-form");
  const uploadStatus = "horse-upload-status";

  async function renderEmojiBars() {
    const pickers = Array.from(document.querySelectorAll("[data-emoji-target]"));
    await Promise.all(pickers.map((picker) => window.HorseyEmojiPicker.mount(
      picker,
      document.getElementById(picker.dataset.emojiTarget),
      { label: "添加表情" }
    )));
  }

  await renderEmojiBars();

  uploadForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = document.getElementById("horse-upload-name").value.trim();
    const description = document.getElementById("horse-upload-description").value.trim();
    const dna = document.getElementById("horse-upload-dna").value.trim();
    const file = document.getElementById("horse-upload-image").files[0];

    if (!name || !file) {
      window.HorseyUI.showStatus(uploadStatus, "请填写马匹名称，并选择图片。");
      return;
    }

    try {
      window.HorseyUI.showStatus(uploadStatus, "正在上传图片...");
      const imageUrl = await window.HorseyApi.uploadFileToOss(file, "horse");

      window.HorseyUI.showStatus(uploadStatus, "正在保存马匹...");
      const result = await window.HorseyApi.createHorse({
        name,
        description,
        dna,
        image_url: imageUrl
      });
      const horse = result.horse || result.data?.horse;

      window.HorseyUI.showStatus(uploadStatus, "创建成功，正在打开详情页...");
      window.setTimeout(() => {
        window.location.href = "horse.html?id=" + encodeURIComponent(horse?.id || "");
      }, 600);
    } catch (error) {
      window.HorseyUI.showStatus(uploadStatus, error.message || "创建失败");
    }
  });
});
