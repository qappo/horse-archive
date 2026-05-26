document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const horseId = params.get("id");
  const commentForm = document.getElementById("comment-form");
  const commentInput = document.getElementById("comment-content");
  const commentList = document.getElementById("comment-list");
  const commentLabel = document.getElementById("comment-label");
  const cancelReplyButton = document.getElementById("cancel-reply-button");
  const likeButton = document.getElementById("horse-like-button");
  const favoriteButton = document.getElementById("horse-favorite-button");
  const editHorseButton = document.getElementById("horse-edit-button");
  const deleteHorseButton = document.getElementById("horse-delete-button");
  const editHorsePanel = document.getElementById("horse-edit-panel");
  const editHorseForm = document.getElementById("horse-edit-form");
  const cancelEditButton = document.getElementById("horse-cancel-edit-button");
  const galleryPrev = document.getElementById("horse-gallery-prev");
  const galleryNext = document.getElementById("horse-gallery-next");
  const galleryCounter = document.getElementById("horse-gallery-counter");
  const galleryDots = document.getElementById("horse-gallery-dots");
  const editMediaPicker = window.HorseyMediaPicker.create({
    inputId: "horse-edit-image",
    listId: "horse-edit-preview",
    limit: 5
  });
  window.HorseyFilePicker?.create({
    inputId: "horse-edit-file",
    label: "选择附加文件，也可以拖到这里"
  });
  let currentHorse = null;
  let currentImageIndex = 0;
  let replyToComment = null;
  let dnaStatusTimer = null;

  function getAttachedFileType(file) {
    const mime = String(file?.type || "").toLowerCase();
    const name = String(file?.name || "").toLowerCase();

    if (mime.startsWith("video/") || /\.(mp4|m4v|mov|webm)$/i.test(name)) return "video";
    if (mime.startsWith("audio/") || /\.(mp3|m4a|aac|wav|ogg)$/i.test(name)) return "audio";
    if (/\.(zip|rar|7z)$/i.test(name)) return "archive";
    return "file";
  }

  function validateAttachedFile(file) {
    const maxBytes = 50 * 1024 * 1024;

    if (file && file.size > maxBytes) {
      throw new Error("附加文件过大，请上传 50MB 以内的文件。");
    }
  }

  if (!horseId) {
    window.HorseyUI.showStatus("detail-status", "缺少马匹 ID，请从图鉴页重新进入。");
    return;
  }

  function getHorseImages() {
    const urls = Array.isArray(currentHorse?.image_urls) ? currentHorse.image_urls : [];
    return (urls.length ? urls : [currentHorse?.image || currentHorse?.image_url || window.HORSEY_CONFIG.placeholderImage])
      .filter(Boolean)
      .slice(0, 5);
  }

  function renderGallery() {
    const images = getHorseImages();
    const image = document.getElementById("horse-image");
    const mediaPanel = document.querySelector(".horse-detail-media");
    currentImageIndex = Math.min(currentImageIndex, Math.max(images.length - 1, 0));
    image.src = images[currentImageIndex] || window.HORSEY_CONFIG.placeholderImage;
    image.alt = (currentHorse?.name || "马匹") + " 的图片";
    image.addEventListener("error", () => {
      image.src = window.HORSEY_CONFIG.placeholderImage;
    }, { once: true });

    const hasMultiple = images.length > 1;
    mediaPanel?.classList.toggle("has-multiple", hasMultiple);
    galleryPrev.classList.toggle("hidden", !hasMultiple);
    galleryNext.classList.toggle("hidden", !hasMultiple);
    galleryCounter.classList.toggle("hidden", !hasMultiple);
    galleryCounter.textContent = (currentImageIndex + 1) + "/" + images.length;
    galleryDots.innerHTML = "";

    images.forEach((_, index) => {
      const dot = document.createElement("button");
      dot.className = "horse-gallery-dot" + (index === currentImageIndex ? " active" : "");
      dot.type = "button";
      dot.title = "第 " + (index + 1) + " 张";
      dot.addEventListener("click", () => {
        currentImageIndex = index;
        renderGallery();
      });
      galleryDots.appendChild(dot);
    });
  }

  function moveGallery(step) {
    const images = getHorseImages();
    if (images.length <= 1) return;
    currentImageIndex = (currentImageIndex + step + images.length) % images.length;
    renderGallery();
  }

  function formatFileSize(bytes) {
    if (bytes >= 1024 * 1024) {
      return (bytes / 1024 / 1024).toFixed(1) + " MB";
    }

    return Math.max(1, Math.round(bytes / 1024)) + " KB";
  }

  function getMediaKind(file) {
    const type = String(file.file_type || "").toLowerCase();
    const mime = String(file.mime_type || "").toLowerCase();
    const name = String(file.file_name || file.title || file.file_url || "").toLowerCase();

    if (type === "video" || mime.startsWith("video/") || /\.(mp4|m4v|mov|webm)(\?|$)/i.test(name)) {
      return "video";
    }

    if (type === "audio" || mime.startsWith("audio/") || /\.(mp3|m4a|aac|wav|ogg)(\?|$)/i.test(name)) {
      return "audio";
    }

    return "file";
  }

  function createMediaPlayer(file) {
    const mediaKind = getMediaKind(file);

    if (mediaKind === "video") {
      const video = document.createElement("video");
      video.className = "horse-file-player";
      video.src = file.file_url;
      video.controls = true;
      video.preload = "metadata";
      video.playsInline = true;
      return video;
    }

    if (mediaKind === "audio") {
      const audio = document.createElement("audio");
      audio.className = "horse-file-player";
      audio.src = file.file_url;
      audio.controls = true;
      audio.preload = "metadata";
      return audio;
    }

    return null;
  }

  async function renderHorseFiles() {
    const panel = document.getElementById("horse-files-panel");
    const fileList = document.getElementById("horse-file-list");

    try {
      const result = await window.HorseyApi.getHorseMediaAssets(horseId);
      const files = result.media || result.data?.media || [];
      fileList.innerHTML = "";

      if (files.length === 0) {
        delete panel.dataset.hasFiles;
        panel.classList.add("hidden");
        return;
      }

      files.forEach((file) => {
        const item = document.createElement("article");
        item.className = "horse-file-item";

        const body = document.createElement("div");
        const name = document.createElement("p");
        name.className = "horse-file-name";
        name.textContent = file.title || file.file_name || "未命名文件";

        const meta = document.createElement("p");
        meta.className = "horse-file-meta";
        meta.textContent = [formatFileSize(Number(file.file_size || 0)), file.created_at]
          .filter(Boolean)
          .join(" · ");

        const player = createMediaPlayer(file);
        const missingUrl = !String(file.file_url || "").trim();

        body.appendChild(name);
        body.appendChild(meta);
        if (player) {
          body.appendChild(player);
        }
        if (missingUrl) {
          const warning = document.createElement("p");
          warning.className = "horse-file-warning";
          warning.textContent = "这个附件缺少文件地址，无法播放或下载。";
          body.appendChild(warning);
        }
        if (!player && !missingUrl) {
          const download = document.createElement("a");
          download.className = "button button-secondary horse-file-download";
          download.href = file.file_url;
          download.target = "_blank";
          download.rel = "noopener";
          download.download = file.file_name || file.title || "";
          download.textContent = "下载文件";
          body.appendChild(download);
        }
        item.appendChild(body);
        fileList.appendChild(item);
      });

      panel.dataset.hasFiles = "true";
      panel.classList.remove("hidden");
    } catch (error) {
      delete panel.dataset.hasFiles;
      fileList.innerHTML = "";
      const message = document.createElement("div");
      message.className = "status-box";
      message.textContent = error.message || "附加文件读取失败，请检查接口和数据库。";
      fileList.appendChild(message);
      panel.classList.remove("hidden");
    }
  }

  async function renderEmojis() {
    await window.HorseyEmojiPicker.mount(
      document.getElementById("emoji-picker"),
      commentInput,
      { label: "添加表情" }
    );
  }

  async function renderEditEmojis() {
    const pickers = Array.from(editHorsePanel.querySelectorAll("[data-emoji-target]"));
    await Promise.all(pickers.map((picker) => window.HorseyEmojiPicker.mount(
      picker,
      document.getElementById(picker.dataset.emojiTarget),
      { label: "添加表情" }
    )));
  }

  async function renderComments() {
    window.HorseyUI.showStatus("comment-status", "正在读取评论...");

    try {
      const comments = await window.HorseyComments.fetchComments(horseId);
      commentList.innerHTML = "";

      if (comments.length === 0) {
        window.HorseyUI.showStatus("comment-status", "还没有评论，来发表第一条吧。");
        return;
      }

      window.HorseyUI.hideElement("comment-status");
      comments.forEach((comment) => {
        commentList.appendChild(window.HorseyUI.createCommentItem(comment, {
          onLike: async (target) => {
            if (!window.HorseyAuth.isLoggedIn()) {
              window.location.href = "login.html";
              return;
            }

            if (target.liked_by_me) {
              await window.HorseyApi.unlike("comment", String(target.id));
            } else {
              await window.HorseyApi.like("comment", String(target.id));
            }

            await renderComments();
          },
          onReply: (target) => {
            if (!window.HorseyAuth.isLoggedIn()) {
              window.location.href = "login.html";
              return;
            }

            replyToComment = target;
            commentLabel.textContent = "回复 " + (target.username || "用户");
            cancelReplyButton.classList.remove("hidden");
            commentInput.focus();
          },
          onDelete: async (target) => {
            if (!confirm("确认删除这条评论？")) return;
            await window.HorseyComments.deleteComment(target.id);
            await renderComments();
          }
        }));
      });
    } catch (error) {
      window.HorseyUI.showStatus("comment-status", error.message || "读取评论失败");
    }
  }

  function updateFavoriteButton() {
    favoriteButton.classList.toggle("active", Boolean(currentHorse?.favorited_by_me));
    favoriteButton.textContent = currentHorse?.favorited_by_me ? "取消收藏" : "收藏";
  }

  function updateHorseView() {
    document.title = "Horse_Archive - " + currentHorse.name;
    document.getElementById("horse-id").textContent = "#" + (currentHorse.display_code || currentHorse.id || horseId);
    document.getElementById("horse-name").textContent = currentHorse.name || "未命名马匹";
    document.getElementById("horse-owner").textContent = currentHorse.owner || "未知";
    const ownerLink = document.getElementById("horse-owner-link");
    if (ownerLink) {
      ownerLink.href = currentHorse.owner_user_id
        ? "profile.html?user_id=" + encodeURIComponent(currentHorse.owner_user_id)
        : "profile.html";
    }
    document.getElementById("horse-created-at").textContent = currentHorse.created_at || "";
    document.getElementById("horse-like-count").textContent = Number(currentHorse.like_count || 0);
    document.getElementById("horse-description").textContent = currentHorse.description || "暂无简介";
    const hasDna = Boolean(String(currentHorse.dna || "").trim());
    const dnaPanel = document.getElementById("dna-panel");
    dnaPanel.classList.toggle("hidden", !hasDna);

    if (hasDna) {
      document.getElementById("horse-dna").textContent = currentHorse.dna;
      document.getElementById("dna-target-name").textContent = currentHorse.display_code || currentHorse.name || "horse";
      document.getElementById("dna-length").textContent = String(currentHorse.dna || "").length;
    }

    likeButton.classList.toggle("active", Boolean(currentHorse.liked_by_me));
    likeButton.textContent = currentHorse.liked_by_me ? "取消点赞" : "点赞";
    updateFavoriteButton();
    renderGallery();

    const ownerAvatar = document.getElementById("horse-owner-avatar");
    const ownerAvatarFallback = document.getElementById("horse-owner-avatar-fallback");
    ownerAvatarFallback.textContent = (currentHorse.owner || "?").slice(0, 1).toUpperCase();

    if (currentHorse.owner_avatar_url) {
      ownerAvatar.src = currentHorse.owner_avatar_url;
      ownerAvatar.alt = (currentHorse.owner || "Uploader") + " avatar";
      ownerAvatar.classList.remove("hidden");
      ownerAvatarFallback.classList.add("hidden");
      ownerAvatar.addEventListener("error", () => {
        ownerAvatar.classList.add("hidden");
        ownerAvatarFallback.classList.remove("hidden");
      }, { once: true });
    } else {
      ownerAvatar.classList.add("hidden");
      ownerAvatarFallback.classList.remove("hidden");
    }
  }

  function fillEditForm() {
    document.getElementById("horse-edit-name").value = currentHorse.name || "";
    document.getElementById("horse-edit-image").value = "";
    document.getElementById("horse-edit-file").value = "";
    document.getElementById("horse-edit-description").value = currentHorse.description || "";
    document.getElementById("horse-edit-dna").value = currentHorse.dna || "";
    editMediaPicker.setExisting(getHorseImages());
    window.HorseyUI.hideElement("horse-edit-status");
  }

  function setEditMode(isEditing) {
    const detailPanel = document.getElementById("horse-detail");
    const dnaPanel = document.getElementById("dna-panel");
    const filesPanel = document.getElementById("horse-files-panel");
    const commentPanel = document.querySelector(".comment-panel");
    const hasDna = Boolean(String(currentHorse?.dna || "").trim());

    editHorsePanel.classList.toggle("hidden", !isEditing);
    detailPanel.classList.toggle("hidden", isEditing);
    dnaPanel.classList.toggle("hidden", isEditing || !hasDna);
    filesPanel.classList.toggle("hidden", isEditing || !filesPanel.dataset.hasFiles);
    commentPanel?.classList.toggle("hidden", isEditing);
    editHorseButton.textContent = "编辑/删除我的马";

    if (isEditing) {
      fillEditForm();
      editHorsePanel.scrollIntoView({ block: "start" });
      document.getElementById("horse-edit-name").focus();
    } else {
      detailPanel.scrollIntoView({ block: "start" });
    }
  }

  function startDnaRain() {
    const canvas = document.getElementById("dna-canvas");
    const panel = document.getElementById("dna-panel");
    if (!canvas || !panel) return;

    const context = canvas.getContext("2d");
    const fontSize = 15;
    const columnGap = 26;
    const frameInterval = 5;
    let drops = [];
    let frame = 0;

    function getDnaColor(name, fallback) {
      const value = window.getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      return value || fallback;
    }

    function resize() {
      canvas.width = panel.clientWidth;
      canvas.height = panel.clientHeight;
      drops = Array.from({ length: Math.ceil(canvas.width / columnGap) }, () => (
        Math.floor(Math.random() * -24)
      ));
    }

    function draw() {
      frame += 1;
      if (frame % frameInterval !== 0) {
        window.requestAnimationFrame(draw);
        return;
      }

      context.fillStyle = getDnaColor("--dna-rain-bg", "rgba(248, 243, 232, 0.34)");
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = getDnaColor("--dna-rain", "rgba(94, 117, 86, 0.42)");
      context.font = fontSize + "px Consolas, monospace";

      drops.forEach((drop, index) => {
        if (drop >= 0) {
          context.fillText(Math.random() > 0.5 ? "1" : "0", index * columnGap, drop * fontSize);
        }

        if (drop * fontSize > canvas.height && Math.random() > 0.988) {
          drops[index] = Math.floor(Math.random() * -18);
        } else {
          drops[index] += 1;
        }
      });

      window.requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener("resize", resize);
    draw();
  }

  try {
    currentHorse = await window.HorseyHorses.loadHorseById(horseId);
    updateHorseView();

    if (currentHorse.can_edit) {
      editHorseButton.classList.remove("hidden");
    }

    window.HorseyUI.hideElement("detail-status");
    document.getElementById("horse-detail").classList.remove("hidden");
    if (String(currentHorse.dna || "").trim()) {
      startDnaRain();
    }

    const authBox = document.getElementById("comment-auth-box");
    if (window.HorseyAuth.isLoggedIn()) {
      const currentUser = window.HorseyAuth.getCurrentUser();
      authBox.textContent = "当前登录用户：" + (currentUser.username || "用户");
      commentForm.classList.remove("hidden");
      await renderEmojis();
      await renderEditEmojis();
    } else {
      authBox.innerHTML = "请先<a href='login.html'>登录</a>后再发表评论。";
    }

    await renderComments();
    await renderHorseFiles();
  } catch (error) {
    window.HorseyUI.showStatus("detail-status", error.message || "加载详情失败");
  }

  galleryPrev.addEventListener("click", () => moveGallery(-1));
  galleryNext.addEventListener("click", () => moveGallery(1));
  document.querySelector(".horse-detail-media")?.addEventListener("click", (event) => {
    if (!window.matchMedia("(hover: none)").matches) return;
    if (event.target.closest("button")) return;
    document.querySelector(".horse-detail-media")?.classList.toggle("show-controls");
  });

  likeButton.addEventListener("click", async () => {
    if (!window.HorseyAuth.isLoggedIn()) {
      window.location.href = "login.html";
      return;
    }
    try {
      if (currentHorse.liked_by_me) {
        await window.HorseyApi.unlike("horse", currentHorse.id);
      } else {
        await window.HorseyApi.like("horse", currentHorse.id);
      }

      currentHorse = await window.HorseyHorses.loadHorseById(horseId);
      updateHorseView();
    } catch (error) {
      window.HorseyUI.showStatus("detail-status", error.message || "点赞失败");
    }
  });

  favoriteButton.addEventListener("click", async () => {
    if (!window.HorseyAuth.isLoggedIn()) {
      window.location.href = "login.html";
      return;
    }

    try {
      if (currentHorse.favorited_by_me) {
        await window.HorseyApi.unfavoriteHorse(currentHorse.id);
      } else {
        await window.HorseyApi.favoriteHorse(currentHorse.id);
      }

      currentHorse = await window.HorseyHorses.loadHorseById(horseId);
      updateHorseView();
    } catch (error) {
      window.HorseyUI.showStatus("detail-status", error.message || "收藏失败");
    }
  });

  editHorseButton.addEventListener("click", () => {
    setEditMode(true);
  });

  cancelEditButton.addEventListener("click", () => {
    setEditMode(false);
  });

  editHorseForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = document.getElementById("horse-edit-name").value.trim();
    const description = document.getElementById("horse-edit-description").value.trim();
    const dna = document.getElementById("horse-edit-dna").value.trim();
    const attachedFile = document.getElementById("horse-edit-file").files[0] || null;
    const mediaItems = editMediaPicker.getItems();

    try {
      validateAttachedFile(attachedFile);
    } catch (error) {
      window.HorseyUI.showStatus("horse-edit-status", error.message);
      return;
    }

    if (!name || mediaItems.length === 0) {
      window.HorseyUI.showStatus("horse-edit-status", "请填写马匹名称，并保留至少一张图片或 GIF。");
      return;
    }

    try {
      const imageUrls = await window.HorseyMediaPicker.uploadItems(mediaItems.slice(0, 5), "horse-edit-status", "正在上传新图片");

      window.HorseyUI.showStatus("horse-edit-status", "正在保存修改...");
      await window.HorseyApi.updateHorse(currentHorse.id || horseId, {
        name,
        description,
        dna,
        image_url: imageUrls[0],
        image_urls: imageUrls
      });

      if (attachedFile) {
        window.HorseyUI.showStatus("horse-edit-status", "正在上传附加文件...");
        const fileUrl = await window.HorseyApi.uploadFileToOss(attachedFile, "media");

        window.HorseyUI.showStatus("horse-edit-status", "正在保存附加文件...");
        await window.HorseyApi.createMediaAsset({
          horse_id: currentHorse.id || horseId,
          title: attachedFile.name,
          file_url: fileUrl,
          file_name: attachedFile.name,
          file_type: getAttachedFileType(attachedFile),
          mime_type: attachedFile.type || "",
          file_size: attachedFile.size
        });
      }

      currentHorse = await window.HorseyHorses.loadHorseById(horseId);
      currentImageIndex = 0;
      updateHorseView();
      await renderHorseFiles();
      setEditMode(false);
      document.getElementById("horse-detail").scrollIntoView({ block: "start" });
      window.HorseyUI.showStatus("detail-status", "马匹资料已更新。");
      window.setTimeout(() => {
        window.HorseyUI.hideElement("detail-status");
      }, 2200);
    } catch (error) {
      window.HorseyUI.showStatus("horse-edit-status", error.message || "保存失败");
    }
  });

  deleteHorseButton.addEventListener("click", async () => {
    if (!confirm("确认删除这匹马？")) return;

    try {
      await window.HorseyApi.deleteHorse(horseId);
      window.location.href = "index.html";
    } catch (error) {
      window.HorseyUI.showStatus("detail-status", error.message || "删除失败");
    }
  });

  document.getElementById("copy-dna-button").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(currentHorse?.dna || "");
      window.HorseyUI.showStatus("dna-status", "DNA 已复制。");
      window.clearTimeout(dnaStatusTimer);
      dnaStatusTimer = window.setTimeout(() => {
        window.HorseyUI.hideElement("dna-status");
      }, 2200);
    } catch (error) {
      window.HorseyUI.showStatus("dna-status", "复制失败，请手动选中 DNA 文本。");
    }
  });

  cancelReplyButton.addEventListener("click", () => {
    replyToComment = null;
    commentLabel.textContent = "发表评论";
    cancelReplyButton.classList.add("hidden");
  });

  commentForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const content = commentInput.value.trim();

    if (!content) {
      window.HorseyUI.showStatus("comment-status", "评论内容不能为空。");
      return;
    }

    window.HorseyUI.showStatus("comment-status", "正在提交评论...");

    try {
      await window.HorseyComments.submitComment(horseId, content, replyToComment?.id || null);
      commentInput.value = "";
      replyToComment = null;
      commentLabel.textContent = "发表评论";
      cancelReplyButton.classList.add("hidden");
      await renderComments();
    } catch (error) {
      window.HorseyUI.showStatus("comment-status", error.message || "发表评论失败");
    }
  });
});
