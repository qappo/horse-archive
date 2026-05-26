window.HorseyFilePicker = {
  create(options = {}) {
    const input = document.getElementById(options.inputId);
    const label = options.label || "选择文件，也可以拖到这里";
    let status = null;

    if (!input || input.dataset.filePickerReady === "true") {
      return;
    }

    function updateStatus(file) {
      if (!status) return;
      status.textContent = file ? "已选择：" + file.name : "未选择文件";
    }

    const wrap = document.createElement("div");
    const button = document.createElement("button");
    status = document.createElement("span");

    wrap.className = "media-picker-control file-picker-control";
    button.className = "media-picker-dropzone file-picker-dropzone";
    button.type = "button";
    button.textContent = label;
    status.className = "media-picker-status";

    input.dataset.filePickerReady = "true";
    input.classList.add("media-picker-input");
    input.parentNode.insertBefore(wrap, input);
    wrap.appendChild(input);
    wrap.appendChild(button);
    wrap.appendChild(status);

    button.addEventListener("click", () => input.click());
    button.addEventListener("dragover", (event) => {
      event.preventDefault();
      button.classList.add("drag-over");
    });
    button.addEventListener("dragleave", () => button.classList.remove("drag-over"));
    button.addEventListener("drop", (event) => {
      event.preventDefault();
      button.classList.remove("drag-over");
      input.files = event.dataTransfer.files;
      updateStatus(input.files[0] || null);
    });
    input.addEventListener("change", () => updateStatus(input.files[0] || null));
    updateStatus(input.files[0] || null);
  }
};
