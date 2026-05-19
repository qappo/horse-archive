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
  const editHorseForm = document.getElementById("horse-edit-form");
  const cancelEditButton = document.getElementById("horse-cancel-edit-button");
  let currentHorse = null;
  let replyToComment = null;
  let dnaStatusTimer = null;

  if (!horseId) {
    window.HorseyUI.showStatus("detail-status", "缺少马匹 ID，请从图鉴页重新进入。");
    return;
  }

  async function renderEmojis() {
    await window.HorseyEmojiPicker.mount(
      document.getElementById("emoji-picker"),
      commentInput,
      { label: "添加表情" }
    );
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
    document.getElementById("horse-created-at").textContent = currentHorse.created_at || "";
    document.getElementById("horse-like-count").textContent = Number(currentHorse.like_count || 0);
    document.getElementById("horse-description").textContent = currentHorse.description || "暂无简介";
    document.getElementById("horse-dna").textContent = currentHorse.dna || "暂无 DNA 数据";
    document.getElementById("dna-target-name").textContent = currentHorse.display_code || currentHorse.name || "horse";
    document.getElementById("dna-length").textContent = String(currentHorse.dna || "").length;

    likeButton.classList.toggle("active", Boolean(currentHorse.liked_by_me));
    likeButton.textContent = currentHorse.liked_by_me ? "取消点赞" : "点赞";
    updateFavoriteButton();

    const image = document.getElementById("horse-image");
    image.src = currentHorse.image || currentHorse.image_url || window.HORSEY_CONFIG.placeholderImage;
    image.alt = (currentHorse.name || "马匹") + " 的图片";
    image.addEventListener("error", () => {
      image.src = window.HORSEY_CONFIG.placeholderImage;
    }, { once: true });

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
    document.getElementById("horse-edit-image-url").value = currentHorse.image_url || currentHorse.image || "";
    document.getElementById("horse-edit-description").value = currentHorse.description || "";
    document.getElementById("horse-edit-dna").value = currentHorse.dna || "";
    window.HorseyUI.hideElement("horse-edit-status");
  }

  function setEditMode(isEditing) {
    document.getElementById("horse-detail").classList.toggle("is-editing", isEditing);
    editHorseForm.classList.toggle("hidden", !isEditing);
    editHorseButton.textContent = isEditing ? "收起编辑" : "编辑我的马";

    if (isEditing) {
      fillEditForm();
      document.getElementById("horse-edit-name").focus();
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
      deleteHorseButton.classList.remove("hidden");
    }

    window.HorseyUI.hideElement("detail-status");
    document.getElementById("horse-detail").classList.remove("hidden");
    document.getElementById("dna-panel").classList.remove("hidden");
    startDnaRain();

    const authBox = document.getElementById("comment-auth-box");

    if (window.HorseyAuth.isLoggedIn()) {
      const currentUser = window.HorseyAuth.getCurrentUser();
      authBox.textContent = "当前登录用户：" + (currentUser.username || "用户");
      commentForm.classList.remove("hidden");
      await renderEmojis();
    } else {
      authBox.innerHTML = "请先<a href='login.html'>登录</a>后再发表评论。";
    }

    await renderComments();
  } catch (error) {
    window.HorseyUI.showStatus("detail-status", error.message || "加载详情失败");
  }

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
    setEditMode(editHorseForm.classList.contains("hidden"));
  });

  cancelEditButton.addEventListener("click", () => {
    setEditMode(false);
  });

  editHorseForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = document.getElementById("horse-edit-name").value.trim();
    const description = document.getElementById("horse-edit-description").value.trim();
    const dna = document.getElementById("horse-edit-dna").value.trim();
    const file = document.getElementById("horse-edit-image").files[0];
    const typedImageUrl = document.getElementById("horse-edit-image-url").value.trim();
    let imageUrl = typedImageUrl;

    if (!name) {
      window.HorseyUI.showStatus("horse-edit-status", "请填写马匹名称。");
      return;
    }

    try {
      if (file) {
        window.HorseyUI.showStatus("horse-edit-status", "正在上传新图片...");
        imageUrl = await window.HorseyApi.uploadFileToOss(file, "horse");
      }

      window.HorseyUI.showStatus("horse-edit-status", "正在保存修改...");
      await window.HorseyApi.updateHorse(currentHorse.id || horseId, {
        name,
        description,
        dna,
        image_url: imageUrl
      });

      currentHorse = await window.HorseyHorses.loadHorseById(horseId);
      updateHorseView();
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
