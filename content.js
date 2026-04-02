class ProducerContentScript {
  constructor() {
    this.lastUrl = window.location.href;
    this.isBlocked = false;
    this.checkTimeout = null;
    this.pollInterval = null;
    this.observer = null;
    this.blockPageSetupTimeout = null;
    this.blockStatsInterval = null;
    this.blockVisibilityHandler = null;
    this.blockPageTheme = "blue"; // Default theme
    this.blockPageTitle = "Stay Focused!";
    this.blockPageMessage = "This site is blocked during your focus session.";
    this.init();
    this.interceptNavigationAttempts();
    this.observeUrlChanges();
    this.setupThemeListener();
  }

  setupThemeListener() {
    // Listen for theme updates from background script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log("[Producer] Received message:", message);

      if (message.action === "applyBlockPageTheme") {
        this.blockPageTheme = message.theme || "blue";
        this.blockPageTitle = message.blockPageTitle || "🎯 Stay Focused!";
        this.blockPageMessage =
          message.blockPageMessage ||
          "This site is blocked during your focus session.";
        sendResponse({ success: true });
      } else if (message.action === "toggleGrayscale") {
        console.log(
          "[Producer] Received toggleGrayscale message, enabled:",
          message.enabled,
        );
        this.toggleGrayscaleFilter(message.enabled);
        sendResponse({ success: true });
      }
      return true; // Keep the message channel open for async response
    });

    // Load current theme and grayscale setting from storage on initialization
    chrome.storage.local.get(
      [
        "theme",
        "blockPageTitle",
        "blockPageMessage",
        "grayscaleEnabled",
        "isActive",
      ],
      (data) => {
        console.log("[Producer] Initial storage data:", data);

        if (data.theme) {
          this.blockPageTheme = data.theme;
        }
        if (data.blockPageTitle) {
          this.blockPageTitle = data.blockPageTitle;
        }
        if (data.blockPageMessage) {
          this.blockPageMessage = data.blockPageMessage;
        }
        // Apply grayscale if it's enabled AND focus mode is active
        if (data.grayscaleEnabled && data.isActive) {
          console.log(
            "[Producer] Applying grayscale on init - grayscaleEnabled:",
            data.grayscaleEnabled,
            "isActive:",
            data.isActive,
          );
          this.toggleGrayscaleFilter(true);
        }
      },
    );

    // Listen for storage changes to react to grayscale setting changes
    // This is the PRIMARY method for instant updates across all tabs
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === "local") {
        // Check if grayscale or isActive changed
        if (
          changes.grayscaleEnabled ||
          changes.isActive ||
          changes.activeRuleSetId
        ) {
          // Always re-read fresh values from storage when any relevant key changes
          chrome.storage.local.get(["grayscaleEnabled", "isActive"], (data) => {
            const shouldEnable = !!(data.grayscaleEnabled && data.isActive);
            console.log(
              "[Producer] Storage changed - updating grayscale:",
              shouldEnable,
              "grayscaleEnabled:",
              data.grayscaleEnabled,
              "isActive:",
              data.isActive,
            );

            // Force update the grayscale filter
            this.toggleGrayscaleFilter(shouldEnable);

            // Force a reflow to ensure the change is applied immediately
            if (document.documentElement) {
              void document.documentElement.offsetHeight;
            }
          });
        }
      }
    });
  }

  toggleGrayscaleFilter(enabled) {
    // Check if we're on a blocked page - don't apply grayscale to block pages
    if (document.getElementById("producer-block-overlay")) {
      return;
    }

    console.log("[Producer] Toggling grayscale filter:", enabled);

    const styleId = "producer-grayscale-filter";
    let style = document.getElementById(styleId);

    if (enabled) {
      // Remove existing style first to ensure clean state
      if (style) {
        style.remove();
      }

      // Wait for DOM to be ready
      const applyFilter = () => {
        if (!document.head && !document.documentElement) {
          setTimeout(applyFilter, 10);
          return;
        }

        const newStyle = document.createElement("style");
        newStyle.id = styleId;
        newStyle.textContent = `
          html {
            filter: grayscale(100%) !important;
            -webkit-filter: grayscale(100%) !important;
          }
        `;

        // Append to head if available, otherwise to documentElement
        const target = document.head || document.documentElement;
        target.appendChild(newStyle);

        console.log("[Producer] Grayscale filter applied");

        // Force reflow to ensure filter is applied
        if (document.documentElement) {
          document.documentElement.offsetHeight;
        }
      };

      applyFilter();
    } else {
      if (style) {
        style.remove();
        console.log("[Producer] Grayscale filter removed");
      }
    }
  }

  async init() {
    await this.checkAndBlock(window.location.href);
  }

  async checkAndBlock(url) {
    // Skip if already blocked or same URL
    if (
      this.isBlocked ||
      (url === this.lastUrl &&
        document.getElementById("producer-block-overlay"))
    ) {
      return;
    }

    this.lastUrl = url;

    try {
      const response = await chrome.runtime.sendMessage({
        action: "checkBlock",
        url: url,
      });

      if (response && response.shouldBlock) {
        this.blockPage();
        return true;
      }
      return false;
    } catch (err) {
      console.error("Could not contact background script:", err);
      return false;
    }
  }

  // Debounced URL check to prevent race conditions
  debouncedCheck(url) {
    if (this.checkTimeout) {
      clearTimeout(this.checkTimeout);
    }

    this.checkTimeout = setTimeout(() => {
      this.checkAndBlock(url);
    }, 100); // 100ms debounce
  }

  // Intercept all navigation attempts before they happen
  interceptNavigationAttempts() {
    // Store reference to this instance for use in event listeners
    const self = this;

    // Intercept all clicks on links
    document.addEventListener(
      "click",
      async (e) => {
        const target =
          e.target instanceof Element ? e.target : e.target.parentElement;
        if (!target) return;
        const link = target.closest("a[href]");
        if (link) {
          const href = link.getAttribute("href");
          let targetUrl;

          // Handle different types of links
          if (href.startsWith("http")) {
            targetUrl = href;
          } else if (href.startsWith("/")) {
            targetUrl = window.location.origin + href;
          } else if (href.startsWith("#")) {
            targetUrl =
              window.location.origin + window.location.pathname + href;
          } else {
            // Use URL constructor for better reliability
            try {
              targetUrl = new URL(href, window.location.href).href;
            } catch (e) {
              return; // Invalid URL, let it proceed
            }
          }

          // Check if target URL should be blocked
          try {
            const response = await chrome.runtime.sendMessage({
              action: "checkBlock",
              url: targetUrl,
            });

            if (response && response.shouldBlock) {
              e.preventDefault();
              e.stopPropagation();
              e.stopImmediatePropagation();

              // Show block page immediately with correct URL (this will report the block)
              self.blockPage(targetUrl);

              return false;
            }
          } catch (err) {
            console.error("Could not check URL:", err);
          }
        }
      },
      true,
    );

    // Intercept form submissions
    document.addEventListener(
      "submit",
      async (e) => {
        const form = e.target;
        if (form.action) {
          try {
            const response = await chrome.runtime.sendMessage({
              action: "checkBlock",
              url: form.action,
            });

            if (response && response.shouldBlock) {
              e.preventDefault();
              e.stopPropagation();

              // Show block page immediately with correct URL (this will report the block)
              self.blockPage(form.action);

              return false;
            }
          } catch (err) {
            console.error("Could not check form action:", err);
          }
        }
      },
      true,
    );

    // Override history methods with better error handling
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function (state, title, url) {
      try {
        if (url) {
          const fullUrl = new URL(url, window.location.href).href;
          // Use debounced check to prevent race conditions
          setTimeout(() => self.debouncedCheck(fullUrl), 0);
        }
        originalPushState.apply(this, arguments);
        window.dispatchEvent(new Event("producer-urlchange"));
      } catch (err) {
        // Fallback to original behavior if our override fails
        originalPushState.apply(this, arguments);
      }
    };

    history.replaceState = function (state, title, url) {
      try {
        if (url) {
          const fullUrl = new URL(url, window.location.href).href;
          setTimeout(() => self.debouncedCheck(fullUrl), 0);
        }
        originalReplaceState.apply(this, arguments);
        window.dispatchEvent(new Event("producer-urlchange"));
      } catch (err) {
        originalReplaceState.apply(this, arguments);
      }
    };

    // Additional navigation interception
    this.interceptAdditionalNavigation();
  }

  // Intercept additional navigation methods
  interceptAdditionalNavigation() {
    // Store reference to this instance
    const self = this;

    // Override window.open (this one works reliably)
    const originalOpen = window.open;
    window.open = async function (url, ...args) {
      if (url) {
        try {
          const fullUrl = new URL(url, window.location.href).href;
          const response = await chrome.runtime.sendMessage({
            action: "checkBlock",
            url: fullUrl,
          });

          if (response && response.shouldBlock) {
            // Report block (no block page shown for window.open, so report here)
            chrome.runtime.sendMessage({
              action: "reportBlock",
              url: fullUrl,
            });
            return null;
          }
        } catch (err) {
          // Allow if check fails
        }
      }
      return originalOpen.apply(this, arguments);
    };

    // skipped location.assign and location.replace overrides entirely
  }

  // fetch motivational quote from background script
  async getMotivationalQuote() {
    const defaultQuote = "Stay focused and keep pushing forward!";
    try {
      const response = await chrome.runtime.sendMessage({
        action: "getMotivationalQuote",
      });

      if (!response || !response.success) {
        console.warn("No quote received, using default.");
        return defaultQuote;
      }

      return response.quote;
    } catch (error) {
      console.error("Error getting motivational quote:", error);
      return defaultQuote;
    }
  }

  async blockPage(blockedUrl = null) {
    this.isBlocked = true;

    // Use provided URL or fall back to current location
    const urlToReport = blockedUrl || window.location.href;

    // Report the block to background script and get block number + redirect URL.
    let blockNumber = 0;
    let blockedPageUrl = null;
    try {
      const response = await chrome.runtime.sendMessage({
        action: "reportBlock",
        url: urlToReport,
      });
      if (response && response.blockNumber) {
        blockNumber = response.blockNumber;
      }
      if (response && response.blockedPageUrl) {
        blockedPageUrl = response.blockedPageUrl;
      }
    } catch (err) {
      console.error("Could not report block:", err);
    }

    this.cleanup();

    if (!blockedPageUrl) {
      try {
        const url = new URL(chrome.runtime.getURL("blocked.html"));
        url.searchParams.set("blockedUrl", urlToReport);
        url.searchParams.set("blockNumber", String(blockNumber));
        blockedPageUrl = url.toString();
      } catch (error) {
        console.error("Could not build blocked page URL:", error);
        return;
      }
    }

    try {
      window.location.replace(blockedPageUrl);
    } catch (error) {
      console.error("Could not navigate to blocked page:", error);
    }
  }

  observeUrlChanges() {
    // Listen for popstate, hashchange, and custom urlchange events
    window.addEventListener("popstate", () => {
      this.debouncedCheck(window.location.href);
    });

    window.addEventListener("hashchange", () => {
      this.debouncedCheck(window.location.href);
    });

    window.addEventListener("producer-urlchange", () => {
      this.debouncedCheck(window.location.href);
    });

    // More efficient MutationObserver - only observe significant changes
    const startObserver = () => {
      if (document.body) {
        this.observer = new MutationObserver((mutations) => {
          if (window.location.href !== this.lastUrl) {
            this.debouncedCheck(window.location.href);
          }
        });

        this.observer.observe(document.body, {
          childList: true,
          subtree: false, // Less aggressive - only direct children
        });
      } else {
        setTimeout(startObserver, 100);
      }
    };

    startObserver();

    // Less aggressive polling - 2 seconds instead of 500ms
    this.pollInterval = setInterval(() => {
      if (window.location.href !== this.lastUrl && !this.isBlocked) {
        this.debouncedCheck(window.location.href);
      }
    }, 2000);
  }

  // Cleanup method to prevent memory leaks
  cleanup() {
    if (this.checkTimeout) {
      clearTimeout(this.checkTimeout);
      this.checkTimeout = null;
    }

    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }

    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    if (this.blockPageSetupTimeout) {
      clearTimeout(this.blockPageSetupTimeout);
      this.blockPageSetupTimeout = null;
    }

    if (this.blockStatsInterval) {
      clearInterval(this.blockStatsInterval);
      this.blockStatsInterval = null;
    }

    if (this.blockVisibilityHandler) {
      document.removeEventListener(
        "visibilitychange",
        this.blockVisibilityHandler,
      );
      this.blockVisibilityHandler = null;
    }
  }

  // Cleanup when page unloads
  destroy() {
    this.cleanup();
  }
}

// Initialize content script if not in an iframe
if (window === window.top) {
  const producer = new ProducerContentScript();

  // Cleanup on page unload
  window.addEventListener("beforeunload", () => {
    producer.destroy();
  });
}
