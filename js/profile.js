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

  function showStatus(text) {
    status.textContent = text;
    status.classList.remove("hidden");
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const file = document.getElementById("avatar-file").files[0];

    if (!file) {
      showStatus("请选择头像图片。");
      return;
    }

    try {
      showStatus("正在上传头像...");
      const avatarUrl = await window.HorseyApi.uploadFileToOss(file, "avatar");

      showStatus("正在保存头像...");
      const result = await window.HorseyApi.updateAvatar(avatarUrl);
      const updatedUser = result.user || result.data?.user;

      if (updatedUser) {
        window.HorseyStorage.setUser(updatedUser);
      } else {
        const currentUser = window.HorseyAuth.getCurrentUser() || {};
        window.HorseyStorage.setUser({ ...currentUser, avatar_url: avatarUrl });
      }

      avatar.src = avatarUrl;
      showStatus("头像已更新。");
      window.HorseyAuth.renderHeaderActions();
    } catch (error) {
      showStatus(error.message || "头像保存失败");
    }
  });
});
