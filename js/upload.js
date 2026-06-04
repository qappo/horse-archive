document.addEventListener("DOMContentLoaded", async () => {
  if (!window.HorseyAuth.isLoggedIn()) {
    window.location.href = "login.html";
    return;
  }

  const uploadForm = document.getElementById("horse-upload-form");
  const uploadStatus = "horse-upload-status";
  const areaInput = document.getElementById("horse-upload-area");
  const tagField = document.getElementById("horse-upload-tag-field");
  const tagInput = document.getElementById("horse-upload-tag");
  const customTagInput = document.getElementById("horse-upload-custom-tag");
  const mediaPicker = window.HorseyMediaPicker.create({
    inputId: "horse-upload-image",
    listId: "horse-upload-preview",
    limit: 5
  });
  window.HorseyFilePicker?.create({
    inputId: "horse-upload-file",
    label: "选择附加文件，也可以拖到这里"
  });

  async function renderEmojiBars() {
    const pickers = Array.from(document.querySelectorAll("[data-emoji-target]"));
    await Promise.all(pickers.map((picker) => window.HorseyEmojiPicker.mount(
      picker,
      document.getElementById(picker.dataset.emojiTarget),
      { label: "添加表情" }
    )));
  }

  await renderEmojiBars();

  async function renderTagOptions() {
    const defaults = ["可爱", "猎奇", "速度"];
    const tags = new Set(defaults);

    try {
      const posts = await window.HorseyHorses.loadAllHorses();
      posts
        .filter((post) => (post.post_area || "horses") === "horses")
        .forEach((post) => {
          const tag = String(post.tag || "").trim();
          if (tag) tags.add(tag);
        });
    } catch (error) {
      // The create page should still be usable if the public list is temporarily unavailable.
    }

    tagInput.innerHTML = "";
    [
      ["", "不选择标签"],
      ...Array.from(tags).map((tag) => [tag, tag]),
      ["__custom__", "自选标签"]
    ].forEach(([value, label]) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = label;
      tagInput.appendChild(option);
    });
  }

  function updateAreaFields() {
    const isHorsePost = areaInput.value === "horses";
    const customTagWrap = customTagInput.closest(".emoji-field-wrap") || customTagInput;
    const showCustomTag = isHorsePost && tagInput.value === "__custom__";
    tagField.classList.toggle("hidden", !isHorsePost);
    customTagInput.classList.toggle("hidden", !showCustomTag);
    customTagWrap.classList.toggle("hidden", !showCustomTag);
  }

  await renderTagOptions();
  updateAreaFields();
  areaInput.addEventListener("change", updateAreaFields);
  tagInput.addEventListener("change", updateAreaFields);

  function validateAttachedFile(file) {
    const maxBytes = 50 * 1024 * 1024;

    if (file && file.size > maxBytes) {
      throw new Error("附加文件过大，请上传 50MB 以内的文件。");
    }
  }

  function getAttachedFileType(file) {
    const mime = String(file?.type || "").toLowerCase();
    const name = String(file?.name || "").toLowerCase();

    if (mime.startsWith("video/") || /\.(mp4|m4v|mov|webm)$/i.test(name)) {
      return "video";
    }

    if (mime.startsWith("audio/") || /\.(mp3|m4a|aac|wav|ogg)$/i.test(name)) {
      return "audio";
    }

    if (/\.(zip|rar|7z)$/i.test(name)) {
      return "archive";
    }

    return "file";
  }

  uploadForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = document.getElementById("horse-upload-name").value.trim();
    const description = document.getElementById("horse-upload-description").value.trim();
    const dna = document.getElementById("horse-upload-dna").value.trim();
    const postArea = areaInput.value === "editor" ? "editor" : "horses";
    const selectedTag = tagInput.value || "";
    const customTag = customTagInput.value.trim();
    const tag = postArea === "horses"
      ? (selectedTag === "__custom__" ? customTag : selectedTag)
      : "";
    const attachedFile = document.getElementById("horse-upload-file").files[0] || null;
    const mediaItems = mediaPicker.getItems();

    try {
      validateAttachedFile(attachedFile);
    } catch (error) {
      window.HorseyUI.showStatus(uploadStatus, error.message);
      return;
    }

    if (!name || mediaItems.length === 0) {
      window.HorseyUI.showStatus(uploadStatus, "请填写帖子标题，并选择 1 到 5 张图片或 GIF。");
      return;
    }

    try {
      const imageUrls = await window.HorseyMediaPicker.uploadItems(mediaItems, uploadStatus);

      window.HorseyUI.showStatus(uploadStatus, "正在保存帖子...");
      const result = await window.HorseyApi.createHorse({
        name,
        description,
        dna,
        post_area: postArea,
        tag,
        image_url: imageUrls[0],
        image_urls: imageUrls
      });
      const horse = result.horse || result.data?.horse;

      if (attachedFile && horse?.id) {
        try {
          window.HorseyUI.showStatus(uploadStatus, "正在上传附加文件...");
          const fileUrl = await window.HorseyApi.uploadFileToOss(attachedFile, "media");

          window.HorseyUI.showStatus(uploadStatus, "正在保存附加文件...");
          await window.HorseyApi.createMediaAsset({
            horse_id: horse.id,
            title: attachedFile.name,
            file_url: fileUrl,
            file_name: attachedFile.name,
            file_type: getAttachedFileType(attachedFile),
            mime_type: attachedFile.type || "",
            file_size: attachedFile.size
          });
        } catch (fileError) {
          window.HorseyUI.showStatus(
            uploadStatus,
            "帖子已创建，但附加文件上传或保存失败：" + (fileError.message || "未知错误")
          );
          return;
        }
      }

      window.HorseyUI.showStatus(uploadStatus, "创建成功，正在打开详情页...");
      window.setTimeout(() => {
        window.location.href = "horse.html?id=" + encodeURIComponent(horse?.id || "");
      }, 600);
    } catch (error) {
      window.HorseyUI.showStatus(uploadStatus, error.message || "创建失败");
    }
  });
});
