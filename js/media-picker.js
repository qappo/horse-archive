window.HorseyMediaPicker = {
  create(options = {}) {
    const input = document.getElementById(options.inputId);
    const list = document.getElementById(options.listId);
    const limit = options.limit || 5;
    const items = [];
    let status = null;
    let dragIndex = null;

    function setupInput() {
      const wrap = document.createElement("div");
      const button = document.createElement("button");
      status = document.createElement("span");

      wrap.className = "media-picker-control";
      button.className = "button button-secondary";
      button.type = "button";
      button.textContent = "选择图片 / GIF";
      status.className = "media-picker-status";

      input.classList.add("media-picker-input");
      input.parentNode.insertBefore(wrap, input);
      wrap.appendChild(input);
      wrap.appendChild(button);
      wrap.appendChild(status);

      button.addEventListener("click", () => input.click());
    }

    function getItems() {
      return items.map((item) => ({ ...item }));
    }

    function setExisting(urls) {
      items.length = 0;
      (urls || []).slice(0, limit).forEach((url) => {
        items.push({
          url,
          file: null,
          name: url.split("/").pop() || "image",
          type: url.toLowerCase().includes(".gif") ? "image/gif" : "image"
        });
      });
      render();
    }

    function move(fromIndex, toIndex) {
      if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return;
      const [item] = items.splice(fromIndex, 1);
      items.splice(toIndex, 0, item);
      render();
    }

    function addFiles(files) {
      const available = limit - items.length;
      Array.from(files).slice(0, available).forEach((file) => {
        if (!file.type.startsWith("image/")) return;

        items.push({
          file,
          url: URL.createObjectURL(file),
          name: file.name,
          type: file.type
        });
      });
      input.value = "";
      render();
    }

    function remove(index) {
      const [item] = items.splice(index, 1);

      if (item?.file && item.url) {
        URL.revokeObjectURL(item.url);
      }

      render();
    }

    function render() {
      list.innerHTML = "";
      list.classList.toggle("empty", items.length === 0);

      if (status) {
        status.textContent = items.length
          ? "已选择 " + items.length + "/" + limit + " 张"
          : "未选择图片";
      }

      if (items.length === 0) {
        const empty = document.createElement("p");
        empty.className = "media-preview-empty";
        empty.textContent = "选择图片或 GIF 后会在这里预览，可拖动调整顺序。";
        list.appendChild(empty);
        return;
      }

      items.forEach((item, index) => {
        const card = document.createElement("article");
        card.className = "media-preview-card";
        card.draggable = true;

        const image = document.createElement("img");
        image.src = item.url;
        image.alt = item.name || "horse image";

        const indexBadge = document.createElement("span");
        indexBadge.className = "media-preview-index";
        indexBadge.textContent = String(index + 1);

        const removeButton = document.createElement("button");
        removeButton.className = "media-preview-remove";
        removeButton.type = "button";
        removeButton.textContent = "×";
        removeButton.title = "移除";
        removeButton.addEventListener("click", () => remove(index));

        card.addEventListener("dragstart", () => {
          dragIndex = index;
          card.classList.add("dragging");
        });

        card.addEventListener("dragend", () => {
          dragIndex = null;
          card.classList.remove("dragging");
        });

        card.addEventListener("dragover", (event) => {
          event.preventDefault();
        });

        card.addEventListener("drop", (event) => {
          event.preventDefault();
          move(dragIndex, index);
        });

        card.appendChild(image);
        card.appendChild(indexBadge);
        card.appendChild(removeButton);
        list.appendChild(card);
      });
    }

    input.addEventListener("change", () => addFiles(input.files));
    setupInput();
    render();

    return {
      getItems,
      setExisting,
      addFiles
    };
  },

  async uploadItems(items, statusId, statusPrefix = "正在上传图片") {
    const urls = [];

    for (let index = 0; index < items.length; index += 1) {
      const item = items[index];

      if (item.file) {
        window.HorseyUI.showStatus(statusId, statusPrefix + " " + (index + 1) + "/" + items.length + "...");
        urls.push(await window.HorseyApi.uploadFileToOss(item.file, "horse"));
      } else if (item.url) {
        urls.push(item.url);
      }
    }

    return urls;
  }
};
