document.addEventListener("DOMContentLoaded", async () => {
  const grid = document.getElementById("horse-grid");
  const count = document.getElementById("horse-count");
  const title = document.getElementById("archive-title");
  const kicker = document.getElementById("archive-kicker");
  const tagRow = document.getElementById("tag-filter-row");
  const avatarPanel = document.getElementById("home-avatar-panel");
  const tabs = Array.from(document.querySelectorAll("[data-home-area]"));
  const areaLabels = {
    horses: {
      kicker: "Archive",
      title: "马匹列表",
      loading: "正在读取马匹帖子...",
      empty: "还没有发布的马匹。",
      count: "篇"
    },
    editor: {
      kicker: "Editor Pack",
      title: "编辑包列表",
      loading: "正在读取编辑包帖子...",
      empty: "还没有发布的编辑包。",
      count: "篇"
    },
    gene: {
      kicker: "Gene Editor",
      title: "基因编辑",
      loading: "",
      empty: "基因编辑区暂未开放。",
      count: "暂未开放"
    }
  };
  let allPosts = [];
  let activeArea = "horses";
  let activeTag = "全部";

  if (avatarPanel) {
    avatarPanel.remove();
  }

  async function renderSiteSettings() {
    try {
      const result = await window.HorseyApi.getSiteSettings();
      const settings = result.settings || result.data?.settings || {};
      const heroTitle = String(settings.home_hero_title || "").trim();
      const heroText = String(settings.home_hero_text || "").trim();

      if (heroTitle) {
        document.getElementById("home-hero-title").textContent = heroTitle;
      }

      if (heroText) {
        document.getElementById("home-hero-text").textContent = heroText;
      }
    } catch (error) {
      // Keep the built-in homepage copy when settings are unavailable.
    }
  }

  function normalizeArea(post) {
    return post.post_area || "horses";
  }

  function sortPosts(posts) {
    return posts.slice().sort((a, b) => {
      if (Boolean(a.is_pinned) !== Boolean(b.is_pinned)) {
        return a.is_pinned ? -1 : 1;
      }

      return String(b.created_at || "").localeCompare(String(a.created_at || ""));
    });
  }

  function getTags(posts) {
    const defaults = ["可爱", "猎奇", "速度"];
    const tags = new Set(defaults);

    posts.forEach((post) => {
      (post.tags || (post.tag ? [post.tag] : [])).forEach((item) => {
        const tag = String(item || "").trim();
        if (tag && tag !== "__custom__" && tag !== "自选标签") tags.add(tag);
      });
    });

    return ["全部", ...Array.from(tags)];
  }

  function renderTags(posts) {
    tagRow.innerHTML = "";
    tagRow.classList.toggle("hidden", activeArea !== "horses");

    if (activeArea !== "horses") {
      activeTag = "全部";
      return;
    }

    const tags = getTags(posts);
    if (!tags.includes(activeTag)) {
      activeTag = "全部";
    }

    tags.forEach((tag) => {
      const button = document.createElement("button");
      button.className = "tag-filter-button" + (tag === activeTag ? " active" : "");
      button.type = "button";
      button.textContent = tag;
      button.addEventListener("click", () => {
        const beforeTop = tagRow.getBoundingClientRect().top;
        activeTag = tag;
        renderCurrentArea();
        const afterTop = tagRow.getBoundingClientRect().top;
        window.scrollBy({ top: afterTop - beforeTop, left: 0, behavior: "auto" });
      });
      tagRow.appendChild(button);
    });
  }

  function renderCurrentArea() {
    const labels = areaLabels[activeArea];
    title.textContent = labels.title;
    kicker.textContent = labels.kicker;
    grid.innerHTML = "";

    tabs.forEach((tab) => {
      tab.classList.toggle("active", tab.dataset.homeArea === activeArea);
    });

    if (activeArea === "gene") {
      tagRow.classList.add("hidden");
      count.textContent = labels.count;
      window.HorseyUI.showStatus("home-status", labels.empty);
      return;
    }

    const areaPosts = allPosts.filter((post) => normalizeArea(post) === activeArea);
    renderTags(areaPosts);

    const filteredPosts = areaPosts.filter((post) => (
      activeArea !== "horses" || activeTag === "全部" || (post.tags || []).includes(activeTag)
    ));
    const sortedPosts = sortPosts(filteredPosts);

    count.textContent = "共 " + sortedPosts.length + " " + labels.count;

    if (sortedPosts.length === 0) {
      window.HorseyUI.showStatus("home-status", labels.empty);
      return;
    }

    window.HorseyUI.hideElement("home-status");
    sortedPosts.forEach((post) => {
      grid.appendChild(window.HorseyUI.createHorseCard(post));
    });
  }

  async function loadPosts() {
    window.HorseyUI.showStatus("home-status", areaLabels[activeArea].loading);

    try {
      allPosts = await window.HorseyHorses.loadAllHorses();
      renderCurrentArea();
    } catch (error) {
      window.HorseyUI.showStatus("home-status", error.message || "读取帖子失败");
      count.textContent = "读取失败";
    }
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      activeArea = tab.dataset.homeArea;
      activeTag = "全部";
      renderCurrentArea();
    });
  });

  await Promise.all([renderSiteSettings(), loadPosts()]);
});
