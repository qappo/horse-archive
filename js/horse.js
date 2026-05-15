document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const horseId = params.get("id");
  const commentForm = document.getElementById("comment-form");
  const commentInput = document.getElementById("comment-content");
  const commentList = document.getElementById("comment-list");
  const commentLabel = document.getElementById("comment-label");
  const cancelReplyButton = document.getElementById("cancel-reply-button");
  const likeButton = document.getElementById("horse-like-button");
  const deleteHorseButton = document.getElementById("horse-delete-button");
  let currentHorse = null;
  let replyToComment = null;
  let dnaStatusTimer = null;

  if (!horseId) {
    window.HorseyUI.showStatus("detail-status", "缺少马匹 ID，请从图鉴页重新进入。");
    return;
  }

  function insertAtCursor(textarea, text) {
    const start = textarea.selectionStart || 0;
    const end = textarea.selectionEnd || 0;
    textarea.value = textarea.value.slice(0, start) + text + textarea.value.slice(end);
    textarea.focus();
    textarea.selectionStart = textarea.selectionEnd = start + text.length;
  }

  async function renderEmojis() {
    const bar = document.getElementById("emoji-bar");

    if (!bar) return;

    try {
      const result = await window.HorseyApi.getEmojis();
      const emojis = result.emojis || result.data?.emojis || [];
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
          insertAtCursor(commentInput, emoji.value || ":" + emoji.code + ":");
        });
        bar.appendChild(button);
      });
    } catch (error) {
      bar.innerHTML = "";
    }
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

      context.fillStyle = "rgba(5, 10, 9, 0.28)";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = "rgba(163, 255, 213, 0.55)";
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

    document.title = "Horsey Web - " + currentHorse.name;
    document.getElementById("horse-id").textContent = "#" + (currentHorse.display_code || currentHorse.id || horseId);
    document.getElementById("horse-name").textContent = currentHorse.name || "未命名马匹";
    document.getElementById("horse-owner").textContent = currentHorse.owner || "未知";
    document.getElementById("horse-like-count").textContent = Number(currentHorse.like_count || 0);
    document.getElementById("horse-description").textContent = currentHorse.description || "暂无简介";
    document.getElementById("horse-dna").textContent = currentHorse.dna || "暂无 DNA 数据";
    document.getElementById("dna-target-name").textContent = currentHorse.display_code || currentHorse.name || "horse";
    document.getElementById("dna-length").textContent = String(currentHorse.dna || "").length;

    likeButton.classList.toggle("active", Boolean(currentHorse.liked_by_me));
    likeButton.textContent = currentHorse.liked_by_me ? "取消点赞" : "点赞";

    if (currentHorse.can_edit) {
      deleteHorseButton.classList.remove("hidden");
    }

    const image = document.getElementById("horse-image");
    image.src = currentHorse.image || window.HORSEY_CONFIG.placeholderImage;
    image.alt = (currentHorse.name || "马匹") + " 的图片";
    image.addEventListener("error", () => {
      image.src = window.HORSEY_CONFIG.placeholderImage;
    });

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
      document.getElementById("horse-like-count").textContent = Number(currentHorse.like_count || 0);
      likeButton.classList.toggle("active", Boolean(currentHorse.liked_by_me));
      likeButton.textContent = currentHorse.liked_by_me ? "取消点赞" : "点赞";
    } catch (error) {
      window.HorseyUI.showStatus("detail-status", error.message || "点赞失败");
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
