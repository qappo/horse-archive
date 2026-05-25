document.addEventListener("DOMContentLoaded", async () => {
  const list = document.getElementById("updates-list");
  const status = document.getElementById("updates-status");
  let emojiCatalog = null;

  function setStatus(text, hidden = false) {
    status.textContent = text;
    status.classList.toggle("hidden", hidden);
  }

  async function getEmojiCatalog() {
    if (!emojiCatalog) {
      try {
        const result = await window.HorseyApi.getEmojis();
        emojiCatalog = window.HorseyEmojiPicker.sortEmojis(result.emojis || result.data?.emojis || []);
      } catch (error) {
        emojiCatalog = [];
      }
    }

    return emojiCatalog;
  }

  function getEmojiValue(emoji) {
    return emoji.value || ":" + emoji.code + ":";
  }

  function renderReactionContent(container, value) {
    const emoji = (emojiCatalog || []).find((item) => getEmojiValue(item) === value);

    container.innerHTML = "";

    if (emoji?.image_url) {
      const image = document.createElement("img");
      image.src = emoji.image_url;
      image.alt = emoji.label || emoji.code || value;
      container.appendChild(image);
      return;
    }

    container.textContent = value;
  }

  async function reactToUpdate(update, reactionValue) {
    if (!window.HorseyAuth.isLoggedIn()) {
      window.location.href = "login.html";
      return;
    }

    if (!reactionValue) {
      return;
    }

    if (update.my_reaction === reactionValue) {
      await window.HorseyApi.unlike("update", String(update.id));
    } else {
      await window.HorseyApi.like("update", String(update.id), reactionValue);
    }
    await renderUpdates();
  }

  function createReactionButton(update, reaction) {
    const button = document.createElement("button");
    button.className = "update-reaction-chip" + (update.my_reaction === reaction.value ? " active" : "");
    button.type = "button";
    button.title = update.my_reaction === reaction.value ? "取消这个表情" : "添加这个表情";

    const emojiSpan = document.createElement("span");
    emojiSpan.className = "update-reaction-emoji";
    renderReactionContent(emojiSpan, reaction.value);

    const count = document.createElement("span");
    count.className = "update-reaction-count";
    count.textContent = Number(reaction.count || 0);

    button.appendChild(emojiSpan);
    button.appendChild(count);
    button.addEventListener("click", async () => {
      try {
        await reactToUpdate(update, reaction.value);
      } catch (error) {
        setStatus(error.message || "添加表情失败");
      }
    });

    return button;
  }

  async function createEmojiMenu(update) {
    const wrap = document.createElement("div");
    wrap.className = "update-emoji-menu";

    const trigger = document.createElement("button");
    trigger.className = "emoji-trigger update-add-reaction";
    trigger.type = "button";
    trigger.title = "添加表情";
    trigger.setAttribute("aria-label", "添加表情");
    trigger.textContent = "☺";

    const popover = document.createElement("div");
    popover.className = "update-emoji-popover hidden";

    trigger.addEventListener("click", async (event) => {
      event.stopPropagation();
      const isHidden = popover.classList.toggle("hidden");

      if (!isHidden && popover.childElementCount === 0) {
        const emojis = await getEmojiCatalog();
        popover.innerHTML = "";

        emojis.forEach((emoji) => {
          const button = document.createElement("button");
          button.className = "emoji-button";
          button.type = "button";
          button.title = emoji.label || emoji.code || "";

          if (emoji.image_url) {
            const image = document.createElement("img");
            image.src = emoji.image_url;
            image.alt = emoji.label || emoji.code || "";
            button.appendChild(image);
          } else {
            button.textContent = getEmojiValue(emoji);
          }

          button.addEventListener("click", async () => {
            try {
              await reactToUpdate(update, getEmojiValue(emoji));
            } catch (error) {
              setStatus(error.message || "添加表情失败");
            }
          });

          popover.appendChild(button);
        });

        if (emojis.length === 0) {
          popover.innerHTML = "<span class='emoji-empty'>暂无表情</span>";
        }
      }
    });

    document.addEventListener("click", (event) => {
      if (!wrap.contains(event.target)) {
        popover.classList.add("hidden");
      }
    });

    wrap.appendChild(trigger);
    wrap.appendChild(popover);
    return wrap;
  }

  async function createUpdateCard(update) {
    const card = document.createElement("article");
    card.className = "update-card";

    const meta = document.createElement("div");
    meta.className = "update-meta";

    if (update.version) {
      const version = document.createElement("span");
      version.className = "update-version";
      version.textContent = update.version;
      meta.appendChild(version);
    }

    const time = document.createElement("time");
    time.textContent = update.created_at || "";
    meta.appendChild(time);

    const title = document.createElement("h2");
    title.className = "update-title";
    title.textContent = update.title || "未命名更新";

    const content = document.createElement("p");
    content.className = "update-content";
    content.textContent = update.content || "";

    const actions = document.createElement("div");
    actions.className = "update-reactions";

    (update.reactions || []).forEach((reaction) => {
      actions.appendChild(createReactionButton(update, reaction));
    });
    actions.appendChild(await createEmojiMenu(update));

    card.appendChild(meta);
    card.appendChild(title);
    card.appendChild(content);
    card.appendChild(actions);
    return card;
  }

  async function renderUpdates() {
    try {
      await getEmojiCatalog();
      const result = await window.HorseyApi.getUpdates();
      const updates = result.updates || result.data?.updates || [];
      list.innerHTML = "";

      if (updates.length === 0) {
        setStatus("还没有更新日志。");
        return;
      }

      for (const update of updates) {
        list.appendChild(await createUpdateCard(update));
      }

      setStatus("", true);
    } catch (error) {
      setStatus(error.message || "读取更新日志失败");
    }
  }

  setStatus("正在读取更新日志...");
  await renderUpdates();
});
