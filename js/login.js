document.addEventListener("DOMContentLoaded", () => {
  const status = document.getElementById("auth-status");
  const user = window.HorseyAuth.getCurrentUser();
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");

  function setStatus(text) {
    status.textContent = text;
  }

  function redirectHome() {
    window.setTimeout(() => {
      window.location.href = "index.html";
    }, 700);
  }

  if (user) {
    setStatus("当前已登录用户：" + (user.username || "用户"));
  } else {
    setStatus("请输入用户名和密码进行登录或注册。");
  }

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = document.getElementById("login-username").value.trim();
    const password = document.getElementById("login-password").value;

    if (!username || !password) {
      setStatus("登录时必须填写用户名和密码。");
      return;
    }

    setStatus("正在登录...");

    try {
      const result = await window.HorseyApi.login({ username, password });
      const auth = window.HorseyApi.normalizeAuthResult(result, username);

      if (!auth.token) {
        throw new Error("登录成功，但接口没有返回 token。");
      }

      window.HorseyStorage.setToken(auth.token);
      window.HorseyStorage.setUser(auth.user || { username });
      window.HorseyAuth.renderHeaderActions();
      setStatus("登录成功，正在返回主页...");
      redirectHome();
    } catch (error) {
      setStatus(error.message || "登录失败");
    }
  });

  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = document.getElementById("register-username").value.trim();
    const password = document.getElementById("register-password").value;
    const confirmPassword = document.getElementById("register-confirm-password").value;

    if (!username || !password) {
      setStatus("注册时必须填写用户名和密码。");
      return;
    }

    if (password !== confirmPassword) {
      setStatus("两次输入的密码不一致。");
      return;
    }

    setStatus("正在注册...");

    try {
      const result = await window.HorseyApi.register({ username, password });
      const auth = window.HorseyApi.normalizeAuthResult(result, username);

      if (auth.token) {
        window.HorseyStorage.setToken(auth.token);
        window.HorseyStorage.setUser(auth.user || { username });
        window.HorseyAuth.renderHeaderActions();
      }

      setStatus(auth.token ? "注册成功，正在返回主页..." : "注册成功，请继续登录。");

      if (auth.token) {
        redirectHome();
      }
    } catch (error) {
      setStatus(error.message || "注册失败");
    }
  });
});
