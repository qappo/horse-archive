document.addEventListener("DOMContentLoaded", async () => {
  const user = window.HorseyAuth.getCurrentUser();
  const content = document.getElementById("admin-content");
  const status = document.getElementById("admin-status");
  let activeTab = "users";

  if (!user || user.role !== "admin") {
    status.textContent = "只有管理员可以访问后台。请先登录管理员账号。";
    return;
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function setStatus(text, hidden = false) {
    status.textContent = text;
    status.classList.toggle("hidden", hidden);
  }

  function table(headers, rows) {
    const bodyRows = Array.isArray(rows) ? rows : [String(rows || "")];

    return [
      "<table class='admin-table'>",
      "<thead><tr>",
      headers.map((header) => "<th>" + escapeHtml(header) + "</th>").join(""),
      "</tr></thead>",
      "<tbody>",
      bodyRows.join(""),
      "</tbody>",
      "</table>"
    ].join("");
  }

  function textInput(name, id, value) {
    return "<input data-" + name + "='" + escapeHtml(id) + "' value='" + escapeHtml(value || "") + "'>";
  }

  function textareaInput(name, id, value) {
    return "<textarea rows='4' data-" + name + "='" + escapeHtml(id) + "'>" + escapeHtml(value || "") + "</textarea>";
  }

  async function renderUsers() {
    const result = await window.HorseyApi.adminList("users");
    const users = result.users || [];

    content.innerHTML = table(["ID", "用户名", "头像 URL", "角色", "注册时间", "状态", "操作"], users.map((item) => [
      "<tr>",
      "<td>" + item.id + "</td>",
      "<td>" + escapeHtml(item.username) + "</td>",
      "<td>" + textInput("user-avatar", item.id, item.avatar_url) + "</td>",
      "<td><select data-user-role='" + item.id + "'>",
      "<option value='user'" + (item.role === "user" ? " selected" : "") + ">user</option>",
      "<option value='admin'" + (item.role === "admin" ? " selected" : "") + ">admin</option>",
      "</select></td>",
      "<td>" + escapeHtml(item.created_at) + "</td>",
      "<td>" + (item.deleted_at ? "已删除 " + escapeHtml(item.deleted_at) : "正常") + "</td>",
      "<td class='inline-actions'>",
      "<button class='button button-secondary' data-save-user='" + item.id + "' type='button'>保存</button>",
      "<button class='button' data-delete-user='" + item.id + "' type='button'>删除</button>",
      "</td>",
      "</tr>"
    ].join("")));

    content.querySelectorAll("[data-save-user]").forEach((button) => {
      button.addEventListener("click", async () => {
        const id = button.dataset.saveUser;
        await window.HorseyApi.adminUpdateUser(id, {
          role: content.querySelector("[data-user-role='" + id + "']").value,
          avatar_url: content.querySelector("[data-user-avatar='" + id + "']").value
        });
        setStatus("用户已保存。");
      });
    });

    content.querySelectorAll("[data-delete-user]").forEach((button) => {
      button.addEventListener("click", async () => {
        const id = button.dataset.deleteUser;

        if (!confirm("确认标记删除这个用户？用户会保留在后台列表中，并显示为已删除。")) {
          return;
        }

        await window.HorseyApi.adminDeleteUser(id);
        await loadTab("users");
      });
    });
  }

  async function renderHorses() {
    const result = await window.HorseyApi.adminList("horses");
    const horses = result.horses || [];

    content.innerHTML = table(["编号", "内部 ID", "图", "名称", "上传者", "图片 URL", "简介", "DNA", "状态", "操作"], horses.map((item) => [
      "<tr>",
      "<td>#" + escapeHtml(item.display_code || item.display_number || "") + "</td>",
      "<td>" + escapeHtml(item.id) + "</td>",
      "<td>" + (item.image_url ? "<img class='admin-mini-image' src='" + escapeHtml(item.image_url) + "' alt=''>" : "") + "</td>",
      "<td>" + textInput("horse-name", item.id, item.name) + "</td>",
      "<td>" + escapeHtml(item.owner || item.owner_user_id) + "</td>",
      "<td>" + textInput("horse-image", item.id, item.image_url) + "</td>",
      "<td>" + textareaInput("horse-description", item.id, item.description) + "</td>",
      "<td>" + textareaInput("horse-dna", item.id, item.dna) + "</td>",
      "<td>" + (item.deleted_at ? "已删除 " + escapeHtml(item.deleted_at) : "正常") + "</td>",
      "<td class='inline-actions'>",
      "<button class='button button-secondary' data-save-horse='" + escapeHtml(item.id) + "' type='button'>保存</button>",
      "<button class='button' data-delete-horse='" + escapeHtml(item.id) + "' type='button'>删除</button>",
      "</td>",
      "</tr>"
    ].join("")));

    content.querySelectorAll("[data-save-horse]").forEach((button) => {
      button.addEventListener("click", async () => {
        const id = button.dataset.saveHorse;
        await window.HorseyApi.updateHorse(id, {
          name: content.querySelector("[data-horse-name='" + CSS.escape(id) + "']").value,
          image_url: content.querySelector("[data-horse-image='" + CSS.escape(id) + "']").value,
          description: content.querySelector("[data-horse-description='" + CSS.escape(id) + "']").value,
          dna: content.querySelector("[data-horse-dna='" + CSS.escape(id) + "']").value
        });
        setStatus("马匹已保存。");
      });
    });

    content.querySelectorAll("[data-delete-horse]").forEach((button) => {
      button.addEventListener("click", async () => {
        const id = button.dataset.deleteHorse;

        if (!confirm("确认删除这匹马？")) {
          return;
        }

        await window.HorseyApi.deleteHorse(id);
        await loadTab("horses");
      });
    });
  }

  async function renderComments() {
    const result = await window.HorseyApi.adminList("comments");
    const comments = result.comments || [];

    content.innerHTML = table(["ID", "马匹", "用户", "内容", "时间", "状态", "操作"], comments.map((item) => [
      "<tr>",
      "<td>" + item.id + "</td>",
      "<td>" + escapeHtml(item.horse_id) + "</td>",
      "<td>" + escapeHtml(item.username) + "</td>",
      "<td>" + textareaInput("comment-content", item.id, item.content) + "</td>",
      "<td>" + escapeHtml(item.created_at) + "</td>",
      "<td>" + (item.deleted_at ? "已删除 " + escapeHtml(item.deleted_at) : "正常") + "</td>",
      "<td class='inline-actions'>",
      "<button class='button button-secondary' data-save-comment='" + item.id + "' type='button'>保存</button>",
      "<button class='button' data-delete-comment='" + item.id + "' type='button'>删除</button>",
      "</td>",
      "</tr>"
    ].join("")));

    content.querySelectorAll("[data-save-comment]").forEach((button) => {
      button.addEventListener("click", async () => {
        const id = button.dataset.saveComment;
        await window.HorseyApi.updateComment(id, {
          content: content.querySelector("[data-comment-content='" + id + "']").value
        });
        setStatus("评论已保存。");
      });
    });

    content.querySelectorAll("[data-delete-comment]").forEach((button) => {
      button.addEventListener("click", async () => {
        const id = button.dataset.deleteComment;

        if (!confirm("确认删除这条评论？")) {
          return;
        }

        await window.HorseyApi.deleteComment(id);
        await loadTab("comments");
      });
    });
  }

  async function renderEmojis() {
    const result = await window.HorseyApi.adminList("emojis");
    const emojis = result.emojis || [];

    content.innerHTML = [
      "<form class='admin-form' id='emoji-create-form'>",
      "<input id='emoji-code' placeholder='code' required>",
      "<input id='emoji-label' placeholder='label' required>",
      "<input id='emoji-value' placeholder='emoji 文本'>",
      "<input id='emoji-sort-order' type='number' placeholder='排序' value='0'>",
      "<button class='button' type='submit'>新增</button>",
      "</form>",
      table(["ID", "Code", "Label", "Value", "排序", "启用", "操作"], emojis.map((item) => [
        "<tr>",
        "<td>" + item.id + "</td>",
        "<td>" + textInput("emoji-code", item.id, item.code) + "</td>",
        "<td>" + textInput("emoji-label", item.id, item.label) + "</td>",
        "<td>" + textInput("emoji-value", item.id, item.value) + "</td>",
        "<td><input data-emoji-sort='" + item.id + "' type='number' value='" + Number(item.sort_order || 0) + "'></td>",
        "<td><select data-emoji-enabled='" + item.id + "'>",
        "<option value='1'" + (Number(item.enabled) === 1 ? " selected" : "") + ">是</option>",
        "<option value='0'" + (Number(item.enabled) === 0 ? " selected" : "") + ">否</option>",
        "</select></td>",
        "<td><button class='button button-secondary' data-save-emoji='" + item.id + "' type='button'>保存</button></td>",
        "</tr>"
      ].join("")))
    ].join("");

    document.getElementById("emoji-create-form").addEventListener("submit", async (event) => {
      event.preventDefault();
      await window.HorseyApi.adminCreateEmoji({
        code: document.getElementById("emoji-code").value,
        label: document.getElementById("emoji-label").value,
        value: document.getElementById("emoji-value").value,
        image_url: "",
        sort_order: Number(document.getElementById("emoji-sort-order").value || 0),
        enabled: true
      });
      await loadTab("emojis");
    });

    content.querySelectorAll("[data-save-emoji]").forEach((button) => {
      button.addEventListener("click", async () => {
        const id = button.dataset.saveEmoji;
        await window.HorseyApi.adminUpdateEmoji(id, {
          code: content.querySelector("[data-emoji-code='" + id + "']").value,
          label: content.querySelector("[data-emoji-label='" + id + "']").value,
          value: content.querySelector("[data-emoji-value='" + id + "']").value,
          image_url: "",
          sort_order: Number(content.querySelector("[data-emoji-sort='" + id + "']").value || 0),
          enabled: content.querySelector("[data-emoji-enabled='" + id + "']").value === "1"
        });
        setStatus("Emoji 已保存。");
      });
    });
  }

  async function loadTab(tab) {
    activeTab = tab;
    setStatus("正在读取后台数据...");
    content.innerHTML = "";

    try {
      if (tab === "users") {
        await renderUsers();
      } else if (tab === "horses") {
        await renderHorses();
      } else if (tab === "comments") {
        await renderComments();
      } else if (tab === "emojis") {
        await renderEmojis();
      }

      setStatus("", true);
    } catch (error) {
      setStatus(error.message || "后台数据读取失败");
    }
  }

  document.querySelectorAll("[data-admin-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll("[data-admin-tab]").forEach((tab) => {
        tab.classList.toggle("active", tab === button);
      });
      loadTab(button.dataset.adminTab);
    });
  });

  await loadTab(activeTab);
});
