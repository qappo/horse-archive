window.HorseyTagPicker = {
  defaultTags: ["可爱", "猎奇", "速度"],

  normalizeTags(value) {
    const values = Array.isArray(value)
      ? value
      : String(value || "").split(/[,\n，、]/);
    const tags = [];
    const seen = new Set();

    values.forEach((item) => {
      const tag = String(item || "").trim().slice(0, 24);

      if (!tag || ["__custom__", "自选标签", "不选择标签", "其他"].includes(tag) || seen.has(tag)) {
        return;
      }

      seen.add(tag);
      tags.push(tag);
    });

    return tags.slice(0, 10);
  },

  async loadAvailableTags() {
    const tags = new Set(this.defaultTags);

    try {
      const result = await window.HorseyApi.getTags();
      (result.tags || result.data?.tags || []).forEach((item) => {
        const name = typeof item === "string" ? item : item.name;
        this.normalizeTags([name]).forEach((tag) => tags.add(tag));
      });
    } catch (error) {
      try {
        const posts = await window.HorseyHorses.loadAllHorses();
        posts
          .filter((post) => (post.post_area || "horses") === "horses")
          .forEach((post) => this.normalizeTags(post.tags || post.tag).forEach((tag) => tags.add(tag)));
      } catch (fallbackError) {
        // Keep defaults when the public data source is unavailable.
      }
    }

    return Array.from(tags);
  },

  create(options) {
    const root = document.getElementById(options.rootId);
    const input = document.getElementById(options.inputId);
    const max = options.max || 10;
    let availableTags = this.normalizeTags(options.availableTags || this.defaultTags);
    let selectedTags = this.normalizeTags(options.selectedTags || []);

    function syncInput() {
      input.value = JSON.stringify(selectedTags);
    }

    function render() {
      root.innerHTML = "";

      const box = document.createElement("div");
      box.className = "tag-picker-box";

      const selected = document.createElement("div");
      selected.className = "tag-picker-selected";

      selectedTags.forEach((tag) => {
        const chip = document.createElement("button");
        chip.className = "tag-picker-chip";
        chip.type = "button";
        chip.textContent = tag + " ×";
        chip.addEventListener("click", () => {
          selectedTags = selectedTags.filter((item) => item !== tag);
          render();
        });
        selected.appendChild(chip);
      });

      const customInput = document.createElement("input");
      customInput.className = "tag-picker-input";
      customInput.type = "text";
      customInput.maxLength = 24;
      customInput.placeholder = selectedTags.length ? "按回车键 Enter 创建标签" : "不选择标签，或输入后按 Enter 创建标签";
      customInput.addEventListener("keydown", (event) => {
        if (event.key !== "Enter") return;
        event.preventDefault();
        const tag = customInput.value.trim().slice(0, 24);

        if (!tag || selectedTags.includes(tag) || selectedTags.length >= max) {
          customInput.value = "";
          return;
        }

        selectedTags.push(tag);
        if (!availableTags.includes(tag)) {
          availableTags.push(tag);
        }
        customInput.value = "";
        render();
      });

      selected.appendChild(customInput);

      const limit = document.createElement("span");
      limit.className = "tag-picker-limit";
      limit.textContent = "还可以添加" + Math.max(0, max - selectedTags.length) + "个标签";
      selected.appendChild(limit);
      box.appendChild(selected);

      const recommend = document.createElement("div");
      recommend.className = "tag-picker-recommend";
      const label = document.createElement("span");
      label.textContent = "推荐标签：";
      recommend.appendChild(label);

      availableTags.forEach((tag) => {
        const button = document.createElement("button");
        button.className = "tag-picker-recommend-button" + (selectedTags.includes(tag) ? " active" : "");
        button.type = "button";
        button.textContent = tag;
        button.addEventListener("click", () => {
          if (selectedTags.includes(tag)) {
            selectedTags = selectedTags.filter((item) => item !== tag);
          } else if (selectedTags.length < max) {
            selectedTags.push(tag);
          }

          render();
        });
        recommend.appendChild(button);
      });

      root.appendChild(box);
      root.appendChild(recommend);
      syncInput();
    }

    render();

    return {
      getTags() {
        return [...selectedTags];
      },
      setTags(tags) {
        selectedTags = window.HorseyTagPicker.normalizeTags(tags);
        selectedTags.forEach((tag) => {
          if (!availableTags.includes(tag)) {
            availableTags.push(tag);
          }
        });
        render();
      },
      setAvailableTags(tags) {
        availableTags = window.HorseyTagPicker.normalizeTags(tags);
        selectedTags.forEach((tag) => {
          if (!availableTags.includes(tag)) {
            availableTags.push(tag);
          }
        });
        render();
      }
    };
  }
};
