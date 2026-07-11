interface BlockPageThemeStyle {
  background: string;
  containerBg: string;
  borderColor: string;
  textColor: string;
  accentColor: string;
}

class ProducerBlockedPage {
  blockedUrl: string;
  blockNumber: number;
  originalFavIcon: string;
  isPermanent: boolean;
  statsInterval: ReturnType<typeof setInterval> | null = null;
  unblockCheckInterval: ReturnType<typeof setInterval> | null = null;
  lastKnownBlockState = true;
  themeStyles: Record<string, BlockPageThemeStyle>;

  constructor() {
    const params = new URLSearchParams(window.location.search);
    this.blockedUrl = params.get("blockedUrl") || "";
    const parsedBlockNumber = parseInt(params.get("blockNumber") || "1", 10);
    this.blockNumber = Number.isFinite(parsedBlockNumber)
      ? Math.max(1, parsedBlockNumber)
      : 1;
    this.originalFavIcon = params.get("originalFavIcon") || "";
    this.isPermanent = params.get("isPermanent") === "1";

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

  truncateUrl(url: string) {
    const maxUrlLength = 100;
    if (!url || url.length <= maxUrlLength) return url;
    const keepLength = Math.floor((maxUrlLength - 3) / 2);
    return (
      url.substring(0, keepLength) +
      "..." +
      url.substring(url.length - keepLength)
    );
  }

  formatTime(seconds: number) {
    if (!seconds || seconds < 0) return "0m";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours >= 24) return `${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  }

  sanitizeHexColor(color: string | undefined, fallback: string): string {
    return color && /^#[0-9a-fA-F]{6}$/.test(color) ? color : fallback;
  }

  hexToRgba(hex: string, alpha: number) {
    const safeHex = this.sanitizeHexColor(hex, "#667eea").replace("#", "");
    const int = parseInt(safeHex, 16);
    const r = (int >> 16) & 255;
    const g = (int >> 8) & 255;
    const b = int & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  buildBackground(
    themeBackground: string,
    primaryColor: string,
    imageUrl: string,
  ) {
    const overlay = `linear-gradient(140deg, ${this.hexToRgba(primaryColor, 0.5)}, rgba(15, 23, 42, 0.74))`;
    if (!imageUrl) {
      return `${overlay}, ${themeBackground}`;
    }
    return `${overlay}, url("${imageUrl}"), ${themeBackground}`;
  }

  async applyThemeAndText() {
    const data = await chrome.storage.local.get([
      "theme",
      "blockPageTitle",
      "blockPageMessage",
      "blockPageShowQuotes",
      "blockPageBackgroundImage",
      "blockPagePrimaryColor",
      "blockPageAccentColor",
      "blockPageShowActionButtons",
      "isActive",
    ]);

    const currentTheme = this.themeStyles[data.theme] || this.themeStyles.blue;
    const primaryColor = this.sanitizeHexColor(
      data.blockPagePrimaryColor,
      "#667eea",
    );
    const accentColor = this.sanitizeHexColor(
      data.blockPageAccentColor,
      currentTheme.accentColor,
    );
    document.body.style.background = this.buildBackground(
      currentTheme.background,
      primaryColor,
      data.blockPageBackgroundImage || "",
    );
    document.body.style.backgroundSize = data.blockPageBackgroundImage
      ? "cover"
      : "auto";
    document.body.style.backgroundPosition = "center";

    const container = document.querySelector<HTMLElement>(".block-container");
    if (container) {
      container.style.background = this.hexToRgba(primaryColor, 0.2);
      container.style.border = `1px solid ${this.hexToRgba(accentColor, 0.4)}`;
      container.style.color = currentTheme.textColor;
      container.style.boxShadow = `0 24px 48px ${this.hexToRgba(
        primaryColor,
        0.24,
      )}`;
    }

    const titleEl = document.getElementById("blockTitle");
    const messageEl = document.getElementById("blockMessage");
    const blockNumberEl = document.getElementById("blockNumber");
    const blockedUrlEl = document.getElementById("blockedUrl");
    const timeEl = document.getElementById("sessionTime");
    const quoteEl = document.getElementById("motivationalQuote");
    const statsEl = document.querySelector<HTMLElement>(".stats");
    const iconEl = document.querySelector<HTMLElement>(".icon");
    const closeBtn = document.getElementById("close-btn");
    const allowOnceBtn = document.getElementById("allow-once-btn");
    const addExceptionBtn = document.getElementById("add-exception-btn");
    const undoPermanentRuleBtn = document.getElementById("undo-permanent-rule-btn");
    const warningButtons = document.querySelectorAll<HTMLElement>(".btn-warning");
    const utilityActions = allowOnceBtn?.parentElement || null;
    const showActionButtons =
      data.blockPageShowActionButtons !== undefined
        ? data.blockPageShowActionButtons
        : true;
    const showQuotes =
      data.blockPageShowQuotes !== undefined ? data.blockPageShowQuotes : true;

    if (titleEl) {
      titleEl.textContent = data.blockPageTitle || "Stay Focused";
      titleEl.style.background = "none";
      titleEl.style.backgroundClip = "border-box";
      titleEl.style.webkitTextFillColor = currentTheme.textColor;
      titleEl.style.color = currentTheme.textColor;
    }
    if (messageEl) {
      messageEl.textContent =
        data.blockPageMessage ||
        "This site is blocked during your focus session";
    }
    if (blockNumberEl) {
      blockNumberEl.textContent = `Block #${this.blockNumber}`;
      blockNumberEl.style.display = this.isPermanent ? "none" : "";
    }
    if (addExceptionBtn)
      addExceptionBtn.style.display = this.isPermanent ? "none" : "";
    if (undoPermanentRuleBtn)
      undoPermanentRuleBtn.style.display = this.isPermanent ? "" : "none";
    if (blockedUrlEl) {
      const displayUrl = this.truncateUrl(this.blockedUrl);
      blockedUrlEl.textContent = displayUrl;
      blockedUrlEl.title = this.blockedUrl;
    }
    if (timeEl) {
      timeEl.style.color = accentColor;
    }
    if (quoteEl) {
      quoteEl.style.borderLeftColor = this.hexToRgba(accentColor, 0.85);
      quoteEl.style.background = this.hexToRgba(primaryColor, 0.12);
      quoteEl.style.display = showQuotes ? "block" : "none";
    }
    if (statsEl) {
      statsEl.style.background = this.hexToRgba(primaryColor, 0.12);
      statsEl.style.display = this.isPermanent ? "none" : "";
    }
    if (iconEl) {
      iconEl.style.textShadow = `0 0 24px ${this.hexToRgba(accentColor, 0.45)}`;
    }
    if (closeBtn) {
      closeBtn.style.background = this.hexToRgba(accentColor, 0.28);
      closeBtn.style.borderColor = this.hexToRgba(accentColor, 0.8);
    }
    if (utilityActions) {
      utilityActions.style.display = showActionButtons ? "flex" : "none";
    }
    warningButtons.forEach((button) => {
      const warningBackground =
        data.theme === "blackwhite"
          ? "rgba(255, 255, 255, 0.14)"
          : this.hexToRgba(primaryColor, 0.2);
      const warningBorder =
        data.theme === "blackwhite"
          ? "rgba(255, 255, 255, 0.32)"
          : this.hexToRgba(primaryColor, 0.46);
      button.style.background = warningBackground;
      button.style.borderColor = warningBorder;
    });
  }

  async loadMotivationalQuote() {
    const quoteEl = document.getElementById("motivationalQuote");
    if (!quoteEl) return;

    const defaultQuote = "Stay focused and keep pushing forward!";
    const personalization = await chrome.storage.local.get([
      "blockPageShowQuotes",
    ]);
    if (personalization.blockPageShowQuotes === false) {
      quoteEl.style.display = "none";
      return;
    }

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

  isUsableOriginalFavicon(faviconHref: string) {
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
    faviconHref: string,
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

  updateBlockTypeUI() {
    const show = this.isPermanent ? "none" : "";
    const hide = this.isPermanent ? "" : "none";
    const addExceptionBtn = document.getElementById("add-exception-btn");
    const undoPermanentRuleBtn = document.getElementById("undo-permanent-rule-btn");
    const blockNumberEl = document.getElementById("blockNumber");
    const statsEl = document.querySelector<HTMLElement>(".stats");
    if (addExceptionBtn) addExceptionBtn.style.display = show;
    if (undoPermanentRuleBtn) undoPermanentRuleBtn.style.display = hide;
    if (blockNumberEl) blockNumberEl.style.display = show;
    if (statsEl) statsEl.style.display = show;
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
      } else if (response?.isPermanent !== undefined) {
        const wasPermanent = this.isPermanent;
        this.isPermanent = !!response.isPermanent;
        if (this.isPermanent !== wasPermanent) {
          this.updateBlockTypeUI();
        }
      }
    } catch (error) {
      // If background is temporarily unavailable, keep page and retry.
    }
  }

  startUnblockWatcher() {
    this.unblockCheckInterval = setInterval(() => {
      this.checkStillBlocked();
    }, 2000);

    chrome.runtime.onMessage.addListener((message) => {
      if (message.action === "updatePermanentStatus") {
        const wasPermanent = this.isPermanent;
        this.isPermanent = !!message.isPermanent;
        if (this.isPermanent !== wasPermanent) {
          this.updateBlockTypeUI();
        }
      }
    });

    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== "local") return;
      if (
        changes.isActive ||
        changes.activeRuleSetId ||
        changes.customModes ||
        changes.customRules ||
        changes.rules ||
        changes.permanentRules
      ) {
        this.checkStillBlocked();
      }
      if (changes.isActive) {
        this.applyThemeAndText();
        if (changes.isActive.newValue) {
          this.updateFocusedTime();
          this.startStatsPolling();
        } else {
          this.stopStatsPolling();
        }
      }
      if (
        changes.theme ||
        changes.blockPageTitle ||
        changes.blockPageMessage ||
        changes.blockPageShowQuotes ||
        changes.blockPageBackgroundImage ||
        changes.blockPagePrimaryColor ||
        changes.blockPageAccentColor ||
        changes.blockPageShowActionButtons
      ) {
        this.applyThemeAndText();
        this.loadMotivationalQuote();
      }
    });
  }

  setupActions() {
    const backBtn = document.getElementById("go-back-btn");
    const closeBtn = document.getElementById("close-btn");
    const allowOnceBtn = document.getElementById("allow-once-btn");
    const addExceptionBtn = document.getElementById("add-exception-btn");
    const undoPermanentRuleBtn = document.getElementById("undo-permanent-rule-btn");

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

    undoPermanentRuleBtn?.addEventListener("click", async () => {
      if (!this.blockedUrl) return;
      try {
        const response = await chrome.runtime.sendMessage({
          action: "removePermanentRule",
          url: this.blockedUrl,
        });
        if (response && response.success) {
          // Let checkStillBlocked decide: if still blocked by focus mode, switch
          // to the focus block UI in place; if fully unblocked, navigate away.
          await this.checkStillBlocked();
        }
      } catch (err) {
        // ignore
      }
    });
  }

  setupVisibilityHandler() {
    document.addEventListener("visibilitychange", async () => {
      if (document.visibilityState === "visible") {
        const { isActive } = await chrome.storage.local.get(["isActive"]);
        if (isActive) this.updateFocusedTime();
        this.checkStillBlocked();
      }
    });
  }

  async init() {
    // Set up interactions and polling immediately — before any async work —
    // so buttons respond and the service worker stays alive from the first tick.
    this.setupActions();
    this.setupVisibilityHandler();
    this.startUnblockWatcher();

    // Proactively wake the service worker so the first button click is instant.
    chrome.runtime.sendMessage({ action: "ping" }).catch(() => {});

    this.applyOriginalFavicon();
    await this.applyThemeAndText();

    // Load quote in the background — don't block setup on a network request.
    this.loadMotivationalQuote();

    const { isActive } = await chrome.storage.local.get(["isActive"]);
    if (isActive) {
      await this.updateFocusedTime();
      this.startStatsPolling();
    }
    await this.checkStillBlocked();
  }
}

new ProducerBlockedPage().init();
