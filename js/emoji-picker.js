window.HorseyEmojiPicker = {
  async getEmojis() {
    const result = await window.HorseyApi.getEmojis();
    return result.emojis || result.data?.emojis || [];
  },

  insertAtCursor(field, text) {
    const start = field.selectionStart || 0;
    const end = field.selectionEnd || 0;
    field.value = field.value.slice(0, start) + text + field.value.slice(end);
    field.focus();
    field.selectionStart = field.selectionEnd = start + text.length;
  },

  async mount(container, target, options = {}) {
    if (!container || !target) {
      return;
    }

    const wrapper = this.wrapTarget(container, target);
    const label = options.label || "添加表情";
    const pickerId = "emoji-picker-" + Math.random().toString(36).slice(2);

    container.className = "emoji-picker-anchor";
    container.innerHTML = [
      "<button class='emoji-trigger' type='button' aria-label='" + this.escapeHtml(label) + "' title='" + this.escapeHtml(label) + "' aria-expanded='false' aria-controls='" + pickerId + "'>",
      "<span aria-hidden='true'>&#9786;</span>",
      "</button>",
      "<div class='emoji-popover hidden' id='" + pickerId + "'></div>"
    ].join("");

    wrapper.appendChild(container);

    const trigger = container.querySelector(".emoji-trigger");
    const popover = container.querySelector(".emoji-popover");

    const renderEmojis = async () => {
      popover.innerHTML = "<span class='emoji-empty'>正在读取表情...</span>";

      try {
        const emojis = this.sortEmojis(await this.getEmojis());
        popover.innerHTML = "";

        let lastCategory = "";

        emojis.forEach((emoji) => {
          const category = this.getCategory(emoji);

          if (category !== lastCategory) {
            const heading = document.createElement("span");
            heading.className = "emoji-category";
            heading.textContent = category || "\u5176\u4ed6";
            popover.appendChild(heading);
            lastCategory = category;
          }

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
            button.textContent = emoji.value || ":" + emoji.code + ":";
          }

          button.addEventListener("click", () => {
            this.insertAtCursor(target, emoji.value || ":" + emoji.code + ":");
          });

          popover.appendChild(button);
        });

        if (emojis.length === 0) {
          popover.innerHTML = "<span class='emoji-empty'>暂无表情</span>";
        }
      } catch (error) {
        popover.innerHTML = "<span class='emoji-empty'>读取表情失败</span>";
      }
    };

    trigger.addEventListener("click", async () => {
      const isHidden = popover.classList.toggle("hidden");
      trigger.setAttribute("aria-expanded", String(!isHidden));

      if (!isHidden) {
        await renderEmojis();
      }
    });

    document.addEventListener("click", (event) => {
      if (!container.contains(event.target)) {
        popover.classList.add("hidden");
        trigger.setAttribute("aria-expanded", "false");
      }
    });
  },

  wrapTarget(container, target) {
    if (target.parentElement?.classList.contains("emoji-field-wrap")) {
      return target.parentElement;
    }

    const wrapper = document.createElement("div");
    wrapper.className = "emoji-field-wrap";
    target.parentNode.insertBefore(wrapper, target);
    wrapper.appendChild(target);
    container.remove();
    return wrapper;
  },

  getCategory(emoji) {
    const parts = String(emoji.label || "").split(" - ");
    return parts.length > 1 ? parts[0] : "";
  },

  sortEmojis(emojis) {
    return [...emojis].sort((left, right) => {
      const categoryDiff = this.categoryRank(this.getCategory(left)) - this.categoryRank(this.getCategory(right));

      if (categoryDiff !== 0) {
        return categoryDiff;
      }

      return Number(left.sort_order || 0) - Number(right.sort_order || 0);
    });
  },

  categoryRank(category) {
    const normalized = String(category || "").toLowerCase();

    if (
      normalized.includes("face") ||
      normalized.includes("symbol") ||
      normalized.includes("party") ||
      category.includes("\u5e38\u7528") ||
      category.includes("\u5c0f\u9ec4\u8138")
    ) {
      return 0;
    }

    if (normalized.includes("animal") || category.includes("\u52a8\u7269")) {
      return 1;
    }

    if (
      normalized.includes("weather") ||
      normalized.includes("sky") ||
      category.includes("\u5929\u6c14") ||
      category.includes("\u5929\u6587")
    ) {
      return 2;
    }

    if (
      normalized.includes("fruit") ||
      normalized.includes("veg") ||
      category.includes("\u6c34\u679c") ||
      category.includes("\u852c\u83dc")
    ) {
      return 3;
    }

    if (
      normalized.includes("food") ||
      category.includes("\u98df\u7269") ||
      category.includes("\u4e8b\u7269")
    ) {
      return 4;
    }

    return 99;
  },

  escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }
};
