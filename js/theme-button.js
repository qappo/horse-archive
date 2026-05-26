(() => {
  const template = [
    "<div class='components' role='switch' tabindex='0' aria-label='切换日间夜间模式'>",
    "<div class='main-button'><div class='moon'></div><div class='moon'></div><div class='moon'></div></div>",
    "<div class='daytime-background'></div><div class='daytime-background'></div><div class='daytime-background'></div>",
    "<div class='cloud'><div class='cloud-son'></div><div class='cloud-son'></div><div class='cloud-son'></div><div class='cloud-son'></div><div class='cloud-son'></div><div class='cloud-son'></div></div>",
    "<div class='cloud-light'><div class='cloud-son'></div><div class='cloud-son'></div><div class='cloud-son'></div><div class='cloud-son'></div><div class='cloud-son'></div><div class='cloud-son'></div></div>",
    "<div class='stars'>",
    "<div class='star big'><div class='star-son'></div><div class='star-son'></div><div class='star-son'></div><div class='star-son'></div></div>",
    "<div class='star big'><div class='star-son'></div><div class='star-son'></div><div class='star-son'></div><div class='star-son'></div></div>",
    "<div class='star medium'><div class='star-son'></div><div class='star-son'></div><div class='star-son'></div><div class='star-son'></div></div>",
    "<div class='star medium'><div class='star-son'></div><div class='star-son'></div><div class='star-son'></div><div class='star-son'></div></div>",
    "<div class='star small'><div class='star-son'></div><div class='star-son'></div><div class='star-son'></div><div class='star-son'></div></div>",
    "<div class='star small'><div class='star-son'></div><div class='star-son'></div><div class='star-son'></div><div class='star-son'></div></div>",
    "</div></div>"
  ].join("");

  const styles = `
    * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: rgba(0,0,0,0); }
    :host { display: inline-block; width: 92px; height: 38px; vertical-align: middle; }
    .components {
      position: relative;
      width: 100%;
      height: 100%;
      overflow: hidden;
      border: 1px solid rgba(255,255,255,0.62);
      border-radius: 999px;
      background: rgba(70, 133, 192, 1);
      box-shadow: inset 0 0 5px 2px rgba(0,0,0,0.24), 0 4px 12px rgba(68,52,42,0.16);
      cursor: pointer;
      transition: background-color 0.62s cubic-bezier(0,0.5,1,1), border-color 0.24s ease, transform 0.2s ease;
    }
    .components:hover { transform: translateY(-1px); }
    .main-button {
      position: relative;
      z-index: 5;
      width: 30px;
      height: 30px;
      margin: 3px 0 0 4px;
      border-radius: 50%;
      background: rgba(255, 195, 35, 1);
      box-shadow: 2px 2px 8px rgba(0,0,0,0.38), inset -3px -5px 4px -4px rgba(0,0,0,0.45), inset 4px 5px 3px -4px rgba(255,230,80,1);
      transition: transform 0.72s cubic-bezier(0.56,1.35,0.52,1), background-color 0.45s ease, box-shadow 0.45s ease;
    }
    .moon {
      position: absolute;
      border-radius: 50%;
      background: rgba(150,160,180,1);
      box-shadow: inset 0 0 2px 1px rgba(0,0,0,0.28);
      opacity: 0;
      transition: opacity 0.42s ease;
    }
    .moon:nth-child(1) { top: 4px; left: 14px; width: 7px; height: 7px; }
    .moon:nth-child(2) { top: 12px; left: 4px; width: 11px; height: 11px; }
    .moon:nth-child(3) { top: 20px; left: 18px; width: 7px; height: 7px; }
    .daytime-background {
      position: absolute;
      z-index: 1;
      border-radius: 50%;
      transition: transform 0.72s cubic-bezier(0.56,1.35,0.52,1);
    }
    .daytime-background:nth-child(2) { top: -11px; left: -11px; width: 58px; height: 58px; background: rgba(255,255,255,0.2); }
    .daytime-background:nth-child(3) { top: -17px; left: -9px; width: 72px; height: 72px; background: rgba(255,255,255,0.1); }
    .daytime-background:nth-child(4) { top: -24px; left: -8px; width: 86px; height: 86px; background: rgba(255,255,255,0.05); }
    .cloud, .cloud-light {
      position: absolute;
      inset: 0;
      z-index: 2;
      transform: translateY(5px);
      transition: transform 0.72s cubic-bezier(0.56,1.35,0.52,1), opacity 0.42s ease;
    }
    .cloud-light { opacity: 0.5; transform: translateY(10px); }
    .cloud-son {
      position: absolute;
      border-radius: 50%;
      background: #fff;
      transition: transform 4.8s ease, right 0.72s ease, bottom 0.72s ease;
    }
    .cloud-son:nth-child(6n+1){ right: -10px; bottom: 5px; width: 26px; height: 26px; }
    .cloud-son:nth-child(6n+2){ right: -5px; bottom: -13px; width: 31px; height: 31px; }
    .cloud-son:nth-child(6n+3){ right: 10px; bottom: -21px; width: 31px; height: 31px; }
    .cloud-son:nth-child(6n+4){ right: 26px; bottom: -18px; width: 31px; height: 31px; }
    .cloud-son:nth-child(6n+5){ right: 39px; bottom: -32px; width: 39px; height: 39px; }
    .cloud-son:nth-child(6n+6){ right: 57px; bottom: -26px; width: 31px; height: 31px; }
    .stars {
      position: absolute;
      inset: 0;
      z-index: 2;
      opacity: 0;
      transform: translateY(-44px);
      transition: transform 0.72s cubic-bezier(0.56,1.35,0.52,1), opacity 0.42s ease;
    }
    .big { --size: 4px; }
    .medium { --size: 3px; }
    .small { --size: 2px; }
    .star {
      position: absolute;
      width: calc(2 * var(--size));
      height: calc(2 * var(--size));
      animation: star 3s linear infinite alternate;
      transition: top 0.72s ease, left 0.72s ease;
    }
    .star:nth-child(1){ top: 6px; left: 20px; animation-duration: 3.5s; }
    .star:nth-child(2){ top: 21px; left: 48px; animation-duration: 4.1s; }
    .star:nth-child(3){ top: 14px; left: 10px; animation-duration: 4.9s; }
    .star:nth-child(4){ top: 20px; left: 35px; animation-duration: 5.3s; }
    .star:nth-child(5){ top: 11px; left: 40px; animation-duration: 3s; }
    .star:nth-child(6){ top: 27px; left: 20px; animation-duration: 2.2s; }
    .star-son { float: left; width: var(--size); height: var(--size); background-image: radial-gradient(circle var(--size) at var(--pos), transparent var(--size), #fff); }
    .star-son:nth-child(1) { --pos: left 0; }
    .star-son:nth-child(2) { --pos: right 0; }
    .star-son:nth-child(3) { --pos: 0 bottom; }
    .star-son:nth-child(4) { --pos: right bottom; }
    @keyframes star { 0%, 20% { transform: scale(0); } 20%, 100% { transform: scale(1); } }
    :host([data-theme="dark"]) .components { border-color: rgba(119,135,169,0.62); background: rgba(25,30,50,1); }
    :host([data-theme="dark"]) .main-button {
      transform: translateX(54px);
      background: rgba(195,200,210,1);
      box-shadow: 2px 2px 8px rgba(0,0,0,0.38), inset -3px -5px 4px -4px rgba(0,0,0,0.45), inset 4px 5px 3px -4px rgba(255,255,210,1);
    }
    :host([data-theme="dark"]) .moon { opacity: 1; }
    :host([data-theme="dark"]) .daytime-background:nth-child(2) { transform: translateX(54px); }
    :host([data-theme="dark"]) .daytime-background:nth-child(3) { transform: translateX(42px); }
    :host([data-theme="dark"]) .daytime-background:nth-child(4) { transform: translateX(30px); }
    :host([data-theme="dark"]) .cloud,
    :host([data-theme="dark"]) .cloud-light { opacity: 0; transform: translateY(42px); }
    :host([data-theme="dark"]) .stars { opacity: 1; transform: translateY(0); }
    @media (prefers-reduced-motion: reduce) {
      *, .star { transition-duration: 0.01ms !important; animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; }
    }
  `;

  class ThemeButton extends HTMLElement {
    connectedCallback() {
      if (this.shadowRoot) return;
      this.attachShadow({ mode: "open" });
      const style = document.createElement("style");
      style.textContent = styles;
      const container = document.createElement("div");
      container.innerHTML = template;
      this.shadowRoot.append(style, container.firstElementChild);
      this._button = this.shadowRoot.querySelector(".components");
      this._clouds = this.shadowRoot.querySelectorAll(".cloud-son");
      this._button.addEventListener("click", () => this.toggle());
      this._button.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          this.toggle();
        }
      });
      this._cloudTimer = window.setInterval(() => this.floatClouds(), 1300);
      this.syncTheme(this.getAttribute("value") || "light");
    }

    disconnectedCallback() {
      window.clearInterval(this._cloudTimer);
    }

    static get observedAttributes() {
      return ["value"];
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (name === "value" && oldValue !== newValue && this.shadowRoot) {
        this.syncTheme(newValue);
      }
    }

    toggle() {
      const nextTheme = this.getAttribute("value") === "dark" ? "light" : "dark";
      this.syncTheme(nextTheme);
      this.dispatchEvent(new CustomEvent("change", { detail: nextTheme }));
    }

    syncTheme(theme) {
      const nextTheme = theme === "dark" ? "dark" : "light";
      this.setAttribute("value", nextTheme);
      this.dataset.theme = nextTheme;
      this.setAttribute("aria-pressed", String(nextTheme === "dark"));
      this._button?.setAttribute("aria-checked", String(nextTheme === "dark"));
    }

    floatClouds() {
      if (this.getAttribute("value") === "dark") return;
      this._clouds.forEach((cloud) => {
        const x = Math.random() > 0.5 ? 1 : -1;
        const y = Math.random() > 0.5 ? 1 : -1;
        cloud.style.transform = `translate(${x}px, ${y}px)`;
      });
    }
  }

  if (!customElements.get("theme-button")) {
    customElements.define("theme-button", ThemeButton);
  }
})();
