class ProducerBlockedPage {
  constructor() {
    const params = new URLSearchParams(window.location.search);
    this.blockedUrl = params.get("blockedUrl") || "";
    this.blockNumber = parseInt(params.get("blockNumber") || "0", 10) || 0;
    this.originalFavIcon = params.get("originalFavIcon") || "";
    this.statsInterval = null;
    this.unblockCheckInterval = null;
    this.lastKnownBlockState = true;

    this.themeStyles = {
      blackwhite: {
        background: "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)",
        containerBg: "rgba(255, 255, 255, 0.05)",
        borderColor: "rgba(255, 255, 255, 0.15)",
        textColor: "#ffffff",
        accentColor: "#ffffff",
      },
      blue: {
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        containerBg: "rgba(255, 255, 255, 0.1)",
        borderColor: "rgba(255, 255, 255, 0.3)",
        textColor: "#ffffff",
        accentColor: "#2ecc71",
      },
      red: {
        background: "linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)",
        containerBg: "rgba(255, 255, 255, 0.1)",
        borderColor: "rgba(255, 255, 255, 0.3)",
        textColor: "#ffffff",
        accentColor: "#2ecc71",
      },
      orange: {
        background: "linear-gradient(135deg, #f39c12 0%, #e67e22 100%)",
        containerBg: "rgba(255, 255, 255, 0.1)",
        borderColor: "rgba(255, 255, 255, 0.3)",
        textColor: "#ffffff",
        accentColor: "#2ecc71",
      },
      purple: {
        background: "linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%)",
        containerBg: "rgba(255, 255, 255, 0.1)",
        borderColor: "rgba(255, 255, 255, 0.3)",
        textColor: "#ffffff",
        accentColor: "#2ecc71",
      },
      teal: {
        background: "linear-gradient(135deg, #1abc9c 0%, #16a085 100%)",
        containerBg: "rgba(255, 255, 255, 0.1)",
        borderColor: "rgba(255, 255, 255, 0.3)",
        textColor: "#ffffff",
        accentColor: "#3498db",
      },
    };
  }

  truncateUrl(url) {
    const maxUrlLength = 100;
    if (!url || url.length <= maxUrlLength) return url;
    const keepLength = Math.floor((maxUrlLength - 3) / 2);
    return (
      url.substring(0, keepLength) +
      "..." +
      url.substring(url.length - keepLength)
    );
  }

  formatTime(seconds) {
    if (!seconds || seconds < 0) return "0m";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours >= 24) return `${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  }

  async applyThemeAndText() {
    const data = await chrome.storage.local.get([
      "theme",
      "blockPageTitle",
      "blockPageMessage",
    ]);

    const currentTheme = this.themeStyles[data.theme] || this.themeStyles.blue;
    document.body.style.background = currentTheme.background;

    const container = document.querySelector(".block-container");
    if (container) {
      container.style.background = currentTheme.containerBg;
      container.style.border = `1px solid ${currentTheme.borderColor}`;
      container.style.color = currentTheme.textColor;
    }

    const titleEl = document.getElementById("blockTitle");
    const messageEl = document.getElementById("blockMessage");
    const blockNumberEl = document.getElementById("blockNumber");
    const blockedUrlEl = document.getElementById("blockedUrl");
    const timeEl = document.getElementById("sessionTime");

    if (titleEl) {
      titleEl.textContent = data.blockPageTitle || "Stay Focused";
    }
    if (messageEl) {
      messageEl.textContent =
        data.blockPageMessage ||
        "This site is blocked during your focus session";
    }
    if (blockNumberEl) {
      blockNumberEl.textContent = `Block #${this.blockNumber}`;
    }
    if (blockedUrlEl) {
      const displayUrl = this.truncateUrl(this.blockedUrl);
      blockedUrlEl.textContent = displayUrl;
      blockedUrlEl.title = this.blockedUrl;
    }
    if (timeEl) {
      timeEl.style.color = currentTheme.accentColor;
    }
  }

  async loadMotivationalQuote() {
    const quoteEl = document.getElementById("motivationalQuote");
    if (!quoteEl) return;

    const defaultQuote = "Stay focused and keep pushing forward!";
    try {
      const response = await chrome.runtime.sendMessage({
        action: "getMotivationalQuote",
      });

      quoteEl.textContent =
        response && response.success && response.quote
          ? response.quote
          : defaultQuote;
    } catch (error) {
      quoteEl.textContent = defaultQuote;
    }
  }

  isUsableOriginalFavicon(faviconHref) {
    if (!faviconHref) return false;
    try {
      const parsed = new URL(faviconHref);
      if (parsed.protocol === "chrome:") return false;
      return true;
    } catch (error) {
      return false;
    }
  }

  applyFaviconLinks(
    faviconHref,
    fallbackFaviconHref = "",
    replaceExisting = false,
  ) {
    if (!faviconHref) return;
    const head = document.head || document.getElementsByTagName("head")[0];
    if (!head) return;
    if (replaceExisting) {
      const existingIcons = head.querySelectorAll("link[rel*='icon']");
      existingIcons.forEach((iconEl) => iconEl.remove());
    }

    ["icon", "shortcut icon", "apple-touch-icon"].forEach((rel) => {
      const link = document.createElement("link");
      link.rel = rel;
      link.type = faviconHref.endsWith(".png") ? "image/png" : "image/x-icon";
      link.href = faviconHref;
      if (fallbackFaviconHref) {
        link.addEventListener("error", () => {
          if (link.href !== fallbackFaviconHref) {
            link.href = fallbackFaviconHref;
            link.type = fallbackFaviconHref.endsWith(".png")
              ? "image/png"
              : "image/x-icon";
          }
        });
      }
      head.appendChild(link);
    });
  }

  restorePreviousFavicon() {
    if (!this.isUsableOriginalFavicon(this.originalFavIcon)) return;
    this.applyFaviconLinks(this.originalFavIcon, "", true);
  }

  navigateToOriginalUrl() {
    if (!this.blockedUrl) return;
    this.restorePreviousFavicon();
    setTimeout(() => {
      window.location.replace(this.blockedUrl);
    }, 40);
  }

  applyOriginalFavicon() {
    const producerFavicon = chrome.runtime.getURL("icon.png");
    let faviconHref = this.isUsableOriginalFavicon(this.originalFavIcon)
      ? this.originalFavIcon
      : "";

    if (!faviconHref && this.blockedUrl) {
      try {
        const url = new URL(this.blockedUrl);
        if (url.protocol === "http:" || url.protocol === "https:") {
          faviconHref = `${url.origin}/favicon.ico`;
        }
      } catch (error) {
        faviconHref = "";
      }
    }

    if (!faviconHref) {
      faviconHref = producerFavicon;
    }
    this.applyFaviconLinks(faviconHref, producerFavicon, true);
  }

  async updateFocusedTime() {
    try {
      const response = await chrome.runtime.sendMessage({
        action: "getTimerState",
      });
      const el = document.getElementById("sessionTime");
      if (!el || !response) return;

      const focusedTimeFormatted = this.formatTime(response.focusedTime);
      const totalSessionTimeFormatted = this.formatTime(
        response.totalSessionTime,
      );
      el.textContent = "Focus Session Active\r\n";
      el.textContent += `Focused Time: ${focusedTimeFormatted} | Session Time: ${totalSessionTimeFormatted}`;
    } catch (error) {
      const el = document.getElementById("sessionTime");
      if (el) el.textContent = "Focus Session Active";
    }
  }

  startStatsPolling() {
    if (this.statsInterval) return;
    this.statsInterval = setInterval(() => {
      this.updateFocusedTime();
    }, 1000);
  }

  stopStatsPolling() {
    if (!this.statsInterval) return;
    clearInterval(this.statsInterval);
    this.statsInterval = null;
  }

  async checkStillBlocked() {
    if (!this.blockedUrl) return;
    try {
      const response = await chrome.runtime.sendMessage({
        action: "checkBlock",
        url: this.blockedUrl,
      });
      const shouldBlock = !!response?.shouldBlock;
      this.lastKnownBlockState = shouldBlock;
      if (!shouldBlock) {
        this.navigateToOriginalUrl();
      }
    } catch (error) {
      // If background is temporarily unavailable, keep page and retry.
    }
  }

  startUnblockWatcher() {
    this.unblockCheckInterval = setInterval(() => {
      this.checkStillBlocked();
    }, 2000);

    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== "local") return;
      if (
        changes.isActive ||
        changes.activeRuleSetId ||
        changes.customModes ||
        changes.customRules ||
        changes.rules
      ) {
        this.checkStillBlocked();
      }
      if (changes.theme || changes.blockPageTitle || changes.blockPageMessage) {
        this.applyThemeAndText();
      }
    });
  }

  setupActions() {
    const backBtn = document.getElementById("go-back-btn");
    const closeBtn = document.getElementById("close-btn");
    const allowOnceBtn = document.getElementById("allow-once-btn");
    const addExceptionBtn = document.getElementById("add-exception-btn");

    backBtn?.addEventListener("click", () => {
      history.back();
      setTimeout(() => {
        window.location.reload();
      }, 100);
    });

    closeBtn?.addEventListener("click", async () => {
      try {
        await chrome.runtime.sendMessage({ action: "closeTab" });
      } catch (err) {
        // ignore
      }
    });

    allowOnceBtn?.addEventListener("click", async () => {
      if (!this.blockedUrl) return;
      try {
        await chrome.runtime.sendMessage({
          action: "allowOnce",
          url: this.blockedUrl,
        });
        this.navigateToOriginalUrl();
      } catch (err) {
        // ignore
      }
    });

    addExceptionBtn?.addEventListener("click", async () => {
      if (!this.blockedUrl) return;
      try {
        const response = await chrome.runtime.sendMessage({
          action: "addException",
          url: this.blockedUrl,
        });
        if (response && response.success) {
          this.navigateToOriginalUrl();
        }
      } catch (err) {
        // ignore
      }
    });
  }

  setupVisibilityHandler() {
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        this.updateFocusedTime();
        this.checkStillBlocked();
      }
    });
  }

  async init() {
    this.applyOriginalFavicon();
    await this.applyThemeAndText();
    await this.loadMotivationalQuote();
    this.setupActions();
    this.setupVisibilityHandler();
    this.startUnblockWatcher();

    await this.updateFocusedTime();
    await this.checkStillBlocked();
    this.startStatsPolling();
  }
}

new ProducerBlockedPage().init();
