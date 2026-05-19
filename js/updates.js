document.addEventListener("DOMContentLoaded", async () => {
  const list = document.getElementById("updates-list");
  const status = document.getElementById("updates-status");

  function setStatus(text, hidden = false) {
    status.textContent = text;
    status.classList.toggle("hidden", hidden);
  }

  function createUpdateCard(update) {
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

    card.appendChild(meta);
    card.appendChild(title);
    card.appendChild(content);
    return card;
  }

  try {
    const result = await window.HorseyApi.getUpdates();
    const updates = result.updates || [];
    list.innerHTML = "";

    if (updates.length === 0) {
      setStatus("还没有更新日志。");
      return;
    }

    updates.forEach((update) => {
      list.appendChild(createUpdateCard(update));
    });
    setStatus("", true);
  } catch (error) {
    setStatus(error.message || "读取更新日志失败");
  }
});
