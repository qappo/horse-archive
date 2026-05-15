document.addEventListener("DOMContentLoaded", async () => {
  if (!window.HorseyAuth.isLoggedIn()) {
    window.location.href = "login.html";
    return;
  }

  const uploadForm = document.getElementById("horse-upload-form");
  const uploadStatus = "horse-upload-status";

  function insertAtCursor(field, text) {
    const start = field.selectionStart || 0;
    const end = field.selectionEnd || 0;
    field.value = field.value.slice(0, start) + text + field.value.slice(end);
    field.focus();
    field.selectionStart = field.selectionEnd = start + text.length;
  }

  async function renderEmojiBars() {
    const bars = Array.from(document.querySelectorAll("[data-emoji-target]"));

    if (bars.length === 0) return;

    try {
      const result = await window.HorseyApi.getEmojis();
      const emojis = result.emojis || result.data?.emojis || [];

      bars.forEach((bar) => {
        const target = document.getElementById(bar.dataset.emojiTarget);
        bar.innerHTML = "";

        emojis.forEach((emoji) => {
          const button = document.createElement("button");
          button.className = "emoji-button";
          button.type = "button";
          button.title = emoji.label || emoji.code;

          if (emoji.image_url) {
            const image = document.createElement("img");
            image.src = emoji.image_url;
            image.alt = emoji.label || emoji.code;
            button.appendChild(image);
          } else {
            button.textContent = emoji.value || "";
          }

          button.addEventListener("click", () => {
            insertAtCursor(target, emoji.value || ":" + emoji.code + ":");
          });
          bar.appendChild(button);
        });
      });
    } catch (error) {
      bars.forEach((bar) => {
        bar.innerHTML = "";
      });
    }
  }

  await renderEmojiBars();

  uploadForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = document.getElementById("horse-upload-name").value.trim();
    const description = document.getElementById("horse-upload-description").value.trim();
    const dna = document.getElementById("horse-upload-dna").value.trim();
    const file = document.getElementById("horse-upload-image").files[0];
    const typedImageUrl = document.getElementById("horse-upload-image-url").value.trim();
    let imageUrl = typedImageUrl;

    if (!name || (!file && !typedImageUrl)) {
      window.HorseyUI.showStatus(uploadStatus, "请填写马匹名称，并选择图片或填写图片 URL。");
      return;
    }

    try {
      if (file) {
        window.HorseyUI.showStatus(uploadStatus, "正在上传图片...");
        imageUrl = await window.HorseyApi.uploadFileToOss(file, "horse");
      }

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
