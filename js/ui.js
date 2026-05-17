window.HorseyUI = {
  createHorseCard(horse) {
    const link = document.createElement("a");
    link.className = "horse-card";
    link.href = "horse.html?id=" + encodeURIComponent(horse.id);

    const imageWrapper = document.createElement("div");
    imageWrapper.className = "horse-card-image";

    const image = document.createElement("img");
    image.src = horse.image || window.HORSEY_CONFIG.placeholderImage;
    image.alt = horse.name ? horse.name + " 的图片" : "马匹图片";
    image.addEventListener("error", () => {
      image.src = window.HORSEY_CONFIG.placeholderImage;
    });

    const body = document.createElement("div");
    body.className = "horse-card-body";

    const id = document.createElement("p");
    id.className = "horse-card-id";
    id.textContent = "#" + (horse.display_code || horse.id || "---");

    const name = document.createElement("h3");
    name.className = "horse-card-name";
    name.textContent = horse.name || "未命名马匹";

    const meta = document.createElement("p");
    meta.className = "horse-card-meta";
    meta.textContent = "By " + (horse.owner || "未知") + " · ♥ " + Number(horse.like_count || 0);

    imageWrapper.appendChild(image);
    body.appendChild(id);
    body.appendChild(name);
    body.appendChild(meta);
    link.appendChild(imageWrapper);
    link.appendChild(body);

    return link;
  },

  createCommentItem(comment, handlers = {}) {
    const item = document.createElement("article");
    item.className = "comment-item";

    if (comment.parent_comment_id) {
      item.classList.add("comment-reply");
    }

    const avatar = this.createAvatar(comment.avatar_url, comment.username);
    const body = document.createElement("div");
    body.className = "comment-body";

    const meta = document.createElement("div");
    meta.className = "comment-meta";

    const author = document.createElement("span");
    author.className = "comment-author";
    author.textContent = comment.username || "匿名用户";

    const time = document.createElement("time");
    time.className = "comment-time";
    time.textContent = comment.created_at || "";

    const content = document.createElement("p");
    content.className = "comment-content";
    content.textContent = comment.content || "";

    const actions = document.createElement("div");
    actions.className = "inline-actions";

    const likeButton = document.createElement("button");
    likeButton.className = "icon-button" + (comment.liked_by_me ? " active" : "");
    likeButton.type = "button";
    likeButton.textContent = "♥ " + Number(comment.like_count || 0);
    likeButton.title = "点赞";
    likeButton.addEventListener("click", () => handlers.onLike?.(comment));
    actions.appendChild(likeButton);

    const replyButton = document.createElement("button");
    replyButton.className = "icon-button";
    replyButton.type = "button";
    replyButton.textContent = "↩";
    replyButton.title = "回复";
    replyButton.addEventListener("click", () => handlers.onReply?.(comment));
    actions.appendChild(replyButton);

    if (comment.can_delete) {
      const deleteButton = document.createElement("button");
      deleteButton.className = "icon-button";
      deleteButton.type = "button";
      deleteButton.textContent = "×";
      deleteButton.title = "删除";
      deleteButton.addEventListener("click", () => handlers.onDelete?.(comment));
      actions.appendChild(deleteButton);
    }

    meta.appendChild(author);
    meta.appendChild(time);
    body.appendChild(meta);
    body.appendChild(content);
    body.appendChild(actions);
    item.appendChild(avatar);
    item.appendChild(body);

    return item;
  },

  createAvatar(url, username) {
    if (url) {
      const image = document.createElement("img");
      image.className = "comment-avatar";
      image.src = url;
      image.alt = (username || "用户") + " 的头像";
      image.addEventListener("error", () => {
        image.replaceWith(this.createAvatar("", username));
      });
      return image;
    }

    const fallback = document.createElement("span");
    fallback.className = "comment-avatar";
    fallback.textContent = (username || "U").slice(0, 1);
    return fallback;
  },

  showStatus(elementId, text) {
    const element = document.getElementById(elementId);

    if (element) {
      element.textContent = text;
      element.classList.remove("hidden");
    }
  },

  hideElement(elementId) {
    const element = document.getElementById(elementId);

    if (element) {
      element.classList.add("hidden");
    }
  },

  setText(elementId, text) {
    const element = document.getElementById(elementId);

    if (element) {
      element.textContent = text;
    }
  }
};
