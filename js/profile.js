document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const requestedUserId = params.get("user_id");
  const currentUser = window.HorseyAuth.getCurrentUser();
  const targetUserId = requestedUserId || currentUser?.id || "";
  const isOwnProfile = Boolean(currentUser?.id && String(currentUser.id) === String(targetUserId));

  const avatar = document.getElementById("profile-avatar");
  const form = document.getElementById("profile-form");
  const nameInput = document.getElementById("profile-name");
  const status = document.getElementById("profile-status");
  const title = document.getElementById("profile-title");
  const meta = document.getElementById("profile-meta");
  const horseTitle = document.getElementById("profile-horses-title");
  const horseCount = document.getElementById("profile-horses-count");
  const horseStatus = document.getElementById("profile-horses-status");
  const horseGrid = document.getElementById("profile-horse-grid");
  const areaTabs = Array.from(document.querySelectorAll("[data-profile-area]"));
  let profileUser = null;
  let allPosts = [];
  let activeArea = "horses";

  window.HorseyFilePicker?.create({
    inputId: "avatar-file",
    label: "选择头像图片，也可以拖到这里"
  });

  window.HorseyEmojiPicker?.mount(
    document.querySelector("[data-emoji-target='profile-name']"),
    nameInput,
    { label: "添加表情" }
  );

  if (!targetUserId) {
    window.location.href = "login.html";
    return;
  }

  function showStatus(text) {
    status.textContent = text;
    status.classList.remove("hidden");
  }

  function hideStatus() {
    status.classList.add("hidden");
  }

  function renderUser(user) {
    profileUser = user;
    avatar.src = user.avatar_url || window.HORSEY_CONFIG.placeholderImage;
    title.textContent = user.username || "用户";
    meta.textContent = "发布 " + Number(user.horse_count || 0) + " 篇";
    horseTitle.textContent = isOwnProfile ? "我发布的帖子" : (user.username || "这个用户") + " 发布的帖子";
    document.title = "Horse_Archive - " + (user.username || "个人主页");

    if (isOwnProfile) {
      form.classList.remove("hidden");
      nameInput.value = user.username || "";
    }
  }

  async function loadUser() {
    if (isOwnProfile) {
      const user = await window.HorseyAuth.refreshMe();
      renderUser(user || currentUser);
      return;
    }

    const result = await window.HorseyApi.getUser(targetUserId);
    renderUser(result.user || result.data?.user || result.data || {});
  }

  function renderPosts() {
    horseGrid.innerHTML = "";
    areaTabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.profileArea === activeArea));
    const posts = allPosts.filter((post) => (post.post_area || "horses") === activeArea);
    const areaLabel = activeArea === "editor" ? "编辑包" : "马匹";

    horseCount.textContent = "共 " + posts.length + " 篇";
    meta.textContent = "发布 " + allPosts.length + " 篇";

    if (posts.length === 0) {
      horseStatus.textContent = isOwnProfile ? "你还没有发布" + areaLabel + "。" : "这个用户还没有发布" + areaLabel + "。";
      horseStatus.classList.remove("hidden");
      return;
    }

    horseStatus.classList.add("hidden");
    posts.forEach((horse) => {
      horseGrid.appendChild(window.HorseyUI.createHorseCard(horse));
    });
  }

  async function loadHorses() {
    horseGrid.innerHTML = "";
    horseStatus.textContent = "正在读取发布的帖子...";
    horseStatus.classList.remove("hidden");

    const result = await window.HorseyApi.getUserHorses(targetUserId);
    allPosts = window.HorseyApi
      .normalizeHorsesResult(result)
      .map((horse) => window.HorseyHorses.normalizeHorse(horse));
    renderPosts();
  }

  try {
    await loadUser();
    await loadHorses();
  } catch (error) {
    window.HorseyUI.showStatus("profile-horses-status", error.message || "读取个人主页失败");
    horseCount.textContent = "";
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = nameInput.value.trim();
    const file = document.getElementById("avatar-file").files[0];
    let avatarUrl = profileUser?.avatar_url || "";

    if (!username) {
      showStatus("请填写名字。");
      return;
    }

    try {
      showStatus("正在保存资料...");

      if (file) {
        showStatus("正在上传头像...");
        avatarUrl = await window.HorseyApi.uploadFileToOss(file, "avatar");
      }

      const result = await window.HorseyApi.updateMe({
        username,
        avatar_url: avatarUrl
      });
      const updatedUser = result.user || result.data?.user;

      if (updatedUser) {
        window.HorseyStorage.setUser(updatedUser);
        profileUser = updatedUser;
        renderUser(updatedUser);
      }

      if (result.token) {
        window.HorseyStorage.setToken(result.token);
      }

      avatar.src = avatarUrl || window.HORSEY_CONFIG.placeholderImage;
      showStatus("资料已更新。");
      window.HorseyAuth.renderHeaderActions();
      await loadHorses();
      window.setTimeout(hideStatus, 2200);
    } catch (error) {
      showStatus(error.message || "资料保存失败");
    }
  });

  areaTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      activeArea = tab.dataset.profileArea || "horses";
      renderPosts();
    });
  });
});
