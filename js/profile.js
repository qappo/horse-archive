document.addEventListener("DOMContentLoaded", async () => {
  if (!window.HorseyAuth.isLoggedIn()) {
    window.location.href = "login.html";
    return;
  }

  const avatar = document.getElementById("profile-avatar");
  const form = document.getElementById("avatar-form");
  const status = document.getElementById("profile-status");
  const user = await window.HorseyAuth.refreshMe();

  avatar.src = user?.avatar_url || window.HORSEY_CONFIG.placeholderImage;
  document.getElementById("avatar-url").value = user?.avatar_url || "";

  function showStatus(text) {
    status.textContent = text;
    status.classList.remove("hidden");
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const file = document.getElementById("avatar-file").files[0];
    const typedUrl = document.getElementById("avatar-url").value.trim();
    let avatarUrl = typedUrl;

    if (!file && !typedUrl) {
      showStatus("请选择头像图片，或填写头像图片 URL。");
      return;
    }

    try {
      if (file) {
        showStatus("正在上传头像...");
        avatarUrl = await window.HorseyApi.uploadFileToOss(file, "avatar");
      }

      showStatus("正在保存头像...");
      const result = await window.HorseyApi.updateAvatar(avatarUrl);
      const updatedUser = result.user || result.data?.user;

      if (updatedUser) {
        window.HorseyStorage.setUser(updatedUser);
      }

      avatar.src = avatarUrl;
      showStatus("头像已更新。");
      window.HorseyAuth.renderHeaderActions();
    } catch (error) {
      showStatus(error.message || "头像保存失败");
    }
  });
});
