document.addEventListener("DOMContentLoaded", async () => {
  const user = window.HorseyAuth.getCurrentUser();
  const content = document.getElementById("admin-content");
  const status = document.getElementById("admin-status");
  let activeTab = "overview";

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

  function formatFileSize(bytes) {
    const size = Number(bytes || 0);

    if (size >= 1024 * 1024) {
      return (size / 1024 / 1024).toFixed(1) + " MB";
    }

    if (size >= 1024) {
      return Math.round(size / 1024) + " KB";
    }

    return size + " B";
  }

  function renderReactionSummary(reactions) {
    if (!Array.isArray(reactions) || reactions.length === 0) {
      return "无";
    }

    return reactions
      .map((reaction) => escapeHtml(reaction.value) + " × " + Number(reaction.count || 0))
      .join("<br>");
  }

  async function renderOverview() {
    const result = await window.HorseyApi.adminStats();
    const stats = result.stats || {};
    const cards = [
      ["用户总数", stats.users_total],
      ["正常用户", stats.users_active],
      ["管理员", stats.admins_active],
      ["马匹总数", stats.horses_total],
      ["正常马匹", stats.horses_active],
      ["评论总数", stats.comments_total],
      ["正常评论", stats.comments_active],
      ["附件总数", stats.media_total],
      ["正常附件", stats.media_active],
      ["附件占用", formatFileSize(stats.media_bytes)],
      ["马匹点赞", stats.horse_likes],
      ["评论点赞", stats.comment_likes],
      ["日志表情", stats.update_reactions],
      ["收藏总数", stats.favorite_count],
      ["启用 Emoji", stats.emoji_enabled],
      ["更新日志", stats.updates_total],
      ["已发布日志", stats.updates_published]
    ];

    content.innerHTML = "<div class='admin-stat-grid'>" + cards.map(([label, value]) => [
      "<article class='admin-stat-card'>",
      "<span>" + escapeHtml(label) + "</span>",
      "<strong>" + escapeHtml(value) + "</strong>",
      "</article>"
    ].join("")).join("") + "</div>";
  }

  async function renderUsers() {
    const result = await window.HorseyApi.adminList("users");
    const users = result.users || [];

    content.innerHTML = table(["ID", "用户名", "头像 URL", "角色", "马匹", "评论", "收藏", "点赞/表情", "附件", "注册时间", "更新时间", "状态", "操作"], users.map((item) => [
      "<tr>",
      "<td>" + item.id + "</td>",
      "<td>" + escapeHtml(item.username) + "</td>",
      "<td>" + textInput("user-avatar", item.id, item.avatar_url) + "</td>",
      "<td><select data-user-role='" + item.id + "'>",
      "<option value='user'" + (item.role === "user" ? " selected" : "") + ">user</option>",
      "<option value='admin'" + (item.role === "admin" ? " selected" : "") + ">admin</option>",
      "</select></td>",
      "<td>" + Number(item.horse_count || 0) + "</td>",
      "<td>" + Number(item.comment_count || 0) + "</td>",
      "<td>" + Number(item.favorite_count || 0) + "</td>",
      "<td>" + Number(item.like_count || 0) + " / " + Number(item.update_reaction_count || 0) + "</td>",
      "<td>" + Number(item.media_asset_count || 0) + "</td>",
      "<td>" + escapeHtml(item.created_at) + "</td>",
      "<td>" + escapeHtml(item.updated_at) + "</td>",
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

    content.innerHTML = table(["编号", "内部 ID", "图", "名称", "上传者", "图片数", "点赞", "收藏", "评论", "附件", "图片 URL", "简介", "DNA", "创建时间", "更新时间", "状态", "操作"], horses.map((item) => [
      "<tr>",
      "<td>#" + escapeHtml(item.display_code || item.display_number || "") + "</td>",
      "<td>" + escapeHtml(item.id) + "</td>",
      "<td>" + (item.image_url ? "<img class='admin-mini-image' src='" + escapeHtml(item.image_url) + "' alt=''>" : "") + "</td>",
      "<td>" + textInput("horse-name", item.id, item.name) + "</td>",
      "<td>" + escapeHtml(item.owner || item.owner_user_id) + "</td>",
      "<td>" + (Array.isArray(item.image_urls) ? item.image_urls.length : 0) + "</td>",
      "<td>" + Number(item.like_count || 0) + "</td>",
      "<td>" + Number(item.favorite_count || 0) + "</td>",
      "<td>" + Number(item.comment_count || 0) + "</td>",
      "<td>" + Number(item.file_count || 0) + "</td>",
      "<td>" + textInput("horse-image", item.id, item.image_url) + "</td>",
      "<td>" + textareaInput("horse-description", item.id, item.description) + "</td>",
      "<td>" + textareaInput("horse-dna", item.id, item.dna) + "</td>",
      "<td>" + escapeHtml(item.created_at) + "</td>",
      "<td>" + escapeHtml(item.updated_at) + "</td>",
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

    content.innerHTML = table(["ID", "马匹", "回复对象", "用户", "点赞", "内容", "时间", "状态", "操作"], comments.map((item) => [
      "<tr>",
      "<td>" + item.id + "</td>",
      "<td>" + escapeHtml(item.horse_name || item.horse_id) + "<br><span class='admin-muted'>" + escapeHtml(item.horse_id) + "</span></td>",
      "<td>" + (item.parent_comment_id || "无") + "</td>",
      "<td>" + escapeHtml(item.username) + "</td>",
      "<td>" + Number(item.like_count || 0) + "</td>",
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
      "<input id='emoji-image-url' placeholder='图片 URL，可留空'>",
      "<input id='emoji-sort-order' type='number' placeholder='排序' value='0'>",
      "<button class='button' type='submit'>新增</button>",
      "</form>",
      table(["ID", "预览", "Code", "Label", "Value", "图片 URL", "使用次数", "排序", "启用", "操作"], emojis.map((item) => [
        "<tr>",
        "<td>" + item.id + "</td>",
        "<td>" + (item.image_url ? "<img class='admin-mini-image' src='" + escapeHtml(item.image_url) + "' alt=''>" : escapeHtml(item.value || "")) + "</td>",
        "<td>" + textInput("emoji-code", item.id, item.code) + "</td>",
        "<td>" + textInput("emoji-label", item.id, item.label) + "</td>",
        "<td>" + textInput("emoji-value", item.id, item.value) + "</td>",
        "<td>" + textInput("emoji-image-url", item.id, item.image_url) + "</td>",
        "<td>" + Number(item.use_count || 0) + "</td>",
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
        image_url: document.getElementById("emoji-image-url").value,
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
          image_url: content.querySelector("[data-emoji-image-url='" + id + "']").value,
          sort_order: Number(content.querySelector("[data-emoji-sort='" + id + "']").value || 0),
          enabled: content.querySelector("[data-emoji-enabled='" + id + "']").value === "1"
        });
        setStatus("Emoji 已保存。");
      });
    });
  }

  async function renderUpdates() {
    const result = await window.HorseyApi.adminList("updates");
    const updates = result.updates || [];

    content.innerHTML = [
      "<form class='admin-form admin-update-form' id='update-create-form'>",
      "<input id='update-title' placeholder='标题' required>",
      "<input id='update-version' placeholder='版本号，可留空'>",
      "<select id='update-published'>",
      "<option value='1' selected>发布</option>",
      "<option value='0'>隐藏</option>",
      "</select>",
      "<button class='button' type='submit'>新增</button>",
      "<textarea id='update-content' rows='5' placeholder='更新内容' required></textarea>",
      "</form>",
      table(["ID", "标题", "版本", "内容", "表情总数", "表情明细", "状态", "创建时间", "更新时间", "操作"], updates.map((item) => [
        "<tr>",
        "<td>" + item.id + "</td>",
        "<td>" + textInput("update-title", item.id, item.title) + "</td>",
        "<td>" + textInput("update-version", item.id, item.version) + "</td>",
        "<td>" + textareaInput("update-content", item.id, item.content) + "</td>",
        "<td>" + Number(item.like_count || 0) + "</td>",
        "<td class='admin-text-cell'>" + renderReactionSummary(item.reactions) + "</td>",
        "<td><select data-update-published='" + item.id + "'>",
        "<option value='1'" + (item.is_published ? " selected" : "") + ">发布</option>",
        "<option value='0'" + (!item.is_published ? " selected" : "") + ">隐藏</option>",
        "</select></td>",
        "<td>" + escapeHtml(item.created_at) + "</td>",
        "<td>" + escapeHtml(item.updated_at) + "</td>",
        "<td><button class='button button-secondary' data-save-update='" + item.id + "' type='button'>保存</button></td>",
        "</tr>"
      ].join("")))
    ].join("");

    document.getElementById("update-create-form").addEventListener("submit", async (event) => {
      event.preventDefault();
      await window.HorseyApi.adminCreateUpdate({
        title: document.getElementById("update-title").value,
        version: document.getElementById("update-version").value,
        content: document.getElementById("update-content").value,
        is_published: document.getElementById("update-published").value === "1"
      });
      await loadTab("updates");
    });

    content.querySelectorAll("[data-save-update]").forEach((button) => {
      button.addEventListener("click", async () => {
        const id = button.dataset.saveUpdate;
        await window.HorseyApi.adminUpdateUpdate(id, {
          title: content.querySelector("[data-update-title='" + id + "']").value,
          version: content.querySelector("[data-update-version='" + id + "']").value,
          content: content.querySelector("[data-update-content='" + id + "']").value,
          is_published: content.querySelector("[data-update-published='" + id + "']").value === "1"
        });
        setStatus("更新日志已保存。");
      });
    });
  }

  async function renderMedia() {
    const result = await window.HorseyApi.adminList("media");
    const media = result.media || [];

    content.innerHTML = table(["ID", "标题", "文件名", "类型", "MIME", "大小", "上传者", "关联马匹", "地址", "上传时间", "状态"], media.map((item) => [
      "<tr>",
      "<td>" + item.id + "</td>",
      "<td>" + escapeHtml(item.title) + "</td>",
      "<td>" + escapeHtml(item.file_name) + "</td>",
      "<td>" + escapeHtml(item.file_type) + "</td>",
      "<td>" + escapeHtml(item.mime_type) + "</td>",
      "<td>" + formatFileSize(item.file_size) + "</td>",
      "<td>" + escapeHtml(item.username || item.user_id) + "</td>",
      "<td>" + escapeHtml(item.horse_name || item.horse_id || "未关联") + "<br><span class='admin-muted'>" + escapeHtml(item.horse_id || "") + "</span></td>",
      "<td><a class='button button-secondary' href='" + escapeHtml(item.file_url) + "' target='_blank' rel='noopener' download>打开/下载</a></td>",
      "<td>" + escapeHtml(item.created_at) + "</td>",
      "<td>" + (item.deleted_at ? "已删除 " + escapeHtml(item.deleted_at) : "正常") + "</td>",
      "</tr>"
    ].join("")));
  }

  async function loadTab(tab) {
    activeTab = tab;
    setStatus("正在读取后台数据...");
    content.innerHTML = "";

    try {
      if (tab === "overview") {
        await renderOverview();
      } else if (tab === "users") {
        await renderUsers();
      } else if (tab === "horses") {
        await renderHorses();
      } else if (tab === "comments") {
        await renderComments();
      } else if (tab === "media") {
        await renderMedia();
      } else if (tab === "emojis") {
        await renderEmojis();
      } else if (tab === "updates") {
        await renderUpdates();
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
