class ProducerContentScript {
  constructor() {
    this.lastUrl = window.location.href;
    this.isBlocked = false;
    this.checkTimeout = null;
    this.pollInterval = null;
    this.observer = null;
    this.blockPageTheme = 'blue'; // Default theme
    this.blockPageTitle = '🎯 Stay Focused!';
    this.blockPageMessage = 'This site is blocked during your focus session.';
    this.init();
    this.interceptNavigationAttempts();
    this.observeUrlChanges();
    this.setupThemeListener();
  }

  setupThemeListener() {
    // Listen for theme updates from background script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log('[Producer] Received message:', message);

      if (message.action === "applyBlockPageTheme") {
        this.blockPageTheme = message.theme || 'blue';
        this.blockPageTitle = message.blockPageTitle || '🎯 Stay Focused!';
        this.blockPageMessage = message.blockPageMessage || 'This site is blocked during your focus session.';
      } else if (message.action === "toggleGrayscale") {
        console.log('[Producer] Received toggleGrayscale message, enabled:', message.enabled);
        this.toggleGrayscaleFilter(message.enabled);
      }
    });

    // Load current theme and grayscale setting from storage on initialization
    chrome.storage.local.get(['theme', 'blockPageTitle', 'blockPageMessage', 'grayscaleEnabled', 'isActive'], (data) => {
      console.log('[Producer] Initial storage data:', data);

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
        console.log('[Producer] Applying grayscale on init - grayscaleEnabled:', data.grayscaleEnabled, 'isActive:', data.isActive);
        this.toggleGrayscaleFilter(true);
      }
    });
  }

  toggleGrayscaleFilter(enabled) {
    // Check if we're on a blocked page - don't apply grayscale to block pages
    if (document.getElementById("producer-block-overlay")) {
      return;
    }

    console.log('[Producer] Toggling grayscale filter:', enabled);

    const styleId = 'producer-grayscale-filter';
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

        const newStyle = document.createElement('style');
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

        console.log('[Producer] Grayscale filter applied');

        // Force reflow to ensure filter is applied
        if (document.documentElement) {
          document.documentElement.offsetHeight;
        }
      };

      applyFilter();
    } else {
      if (style) {
        style.remove();
        console.log('[Producer] Grayscale filter removed');
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
        const link = e.target.closest("a[href]");
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
      true
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
      true
    );

    // Override history methods with better error handling
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function (state, title, url) {
      try {
        if (url) {
          const fullUrl = new URL(url, window.location.href).href;
          // Use debounced check to prevent race conditions
          setTimeout(() => this.debouncedCheck(fullUrl), 0);
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
          setTimeout(() => this.debouncedCheck(fullUrl), 0);
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
    const phrase = await this.getMotivationalQuote();

    // Use provided URL or fall back to current location
    const urlToReport = blockedUrl || window.location.href;

    // Report the block to background script and get block number
    let blockNumber = 0;
    try {
      const response = await chrome.runtime.sendMessage({
        action: "reportBlock",
        url: urlToReport,
      });
      if (response && response.blockNumber) {
        blockNumber = response.blockNumber;
      }
    } catch (err) {
      console.error("Could not report block:", err);
    }

    // Cleanup intervals and timeouts
    this.cleanup();

    // Prevent the page from loading further
    if (typeof window.stop === "function") window.stop();

    // Avoid injecting multiple overlays
    if (document.getElementById("producer-block-overlay")) return;

    // Define theme styles
    const themeStyles = {
      blackwhite: {
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
        containerBg: 'rgba(255, 255, 255, 0.05)',
        borderColor: 'rgba(255, 255, 255, 0.15)',
        textColor: '#ffffff',
        accentColor: '#ffffff'
      },
      blue: {
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        containerBg: 'rgba(255, 255, 255, 0.1)',
        borderColor: 'rgba(255, 255, 255, 0.3)',
        textColor: '#ffffff',
        accentColor: '#2ecc71'
      },
      red: {
        background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
        containerBg: 'rgba(255, 255, 255, 0.1)',
        borderColor: 'rgba(255, 255, 255, 0.3)',
        textColor: '#ffffff',
        accentColor: '#2ecc71'
      },
      orange: {
        background: 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)',
        containerBg: 'rgba(255, 255, 255, 0.1)',
        borderColor: 'rgba(255, 255, 255, 0.3)',
        textColor: '#ffffff',
        accentColor: '#2ecc71'
      },
      purple: {
        background: 'linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%)',
        containerBg: 'rgba(255, 255, 255, 0.1)',
        borderColor: 'rgba(255, 255, 255, 0.3)',
        textColor: '#ffffff',
        accentColor: '#2ecc71'
      },
      teal: {
        background: 'linear-gradient(135deg, #1abc9c 0%, #16a085 100%)',
        containerBg: 'rgba(255, 255, 255, 0.1)',
        borderColor: 'rgba(255, 255, 255, 0.3)',
        textColor: '#ffffff',
        accentColor: '#3498db'
      }
    };

    // Get current theme or default to blue
    const currentTheme = themeStyles[this.blockPageTheme] || themeStyles.blue;

    // Replace page content with block message
    document.documentElement.innerHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Producer - Site Blocked</title>
                <meta charset="utf-8">
                <style>
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }

                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
                        background: ${currentTheme.background};
                        color: ${currentTheme.textColor};
                        height: 100vh;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        text-align: center;
                        animation: fadeIn 0.5s ease-in;
                    }
                    
                    @keyframes fadeIn {
                        from { opacity: 0; transform: translateY(20px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    
                    .block-container {
                        width: 600px;
                        max-height: 100vh;
                        padding: 40px;
                        background: ${currentTheme.containerBg};
                        border-radius: 20px;
                        backdrop-filter: blur(10px);
                        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
                        border: 1px solid ${currentTheme.borderColor};
                    }
                    
                    .icon {
                        font-size: 80px;
                        margin-bottom: 20px;
                        animation: pulse 2s infinite;
                    }
                    
                    @keyframes pulse {
                        0%, 100% { transform: scale(1); }
                        50% { transform: scale(1.1); }
                    }
                    
                    .title {
                        font-size: 32px;
                        font-weight: 700;
                        margin-bottom: 8px;
                        background: linear-gradient(45deg, #fff, #f0f0f0);
                        -webkit-background-clip: text;
                        -webkit-text-fill-color: transparent;
                        background-clip: text;
                    }
                    
                    .message {
                        font-size: 18px;
                        opacity: 0.9;
                        margin-bottom: 16px;
                        line-height: 1.5;
                    }
                    
                    .blocked-url {
                        font-size: 14px;
                        opacity: 0.7;
                        background: rgba(255, 255, 255, 0.1);
                        padding: 8px 16px;
                        border-radius: 20px;
                        display: inline-block;
                        margin-bottom: 8px;
                        word-break: break-all;
                    }
                    
                    .motivational {
                        font-size: 16px;
                        opacity: 0.8;
                        font-style: italic;
                        margin: 20px 0;
                        padding: 16px;
                        background: rgba(255, 255, 255, 0.05);
                        border-radius: 12px;
                        border-left: 3px solid rgba(255, 255, 255, 0.3);
                    }
                    
                    .actions {
                        display: flex;
                        gap: 12px;
                        justify-content: center;
                        margin-top: 30px;
                        flex-wrap: wrap;
                    }
                    
                    .btn {
                        background: rgba(255, 255, 255, 0.2);
                        border: 2px solid rgba(255, 255, 255, 0.3);
                        color: white;
                        padding: 12px 24px;
                        border-radius: 25px;
                        font-size: 16px;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        text-decoration: none;
                        font-family: inherit;
                    }
                    
                    .btn:hover {
                        background: rgba(255, 255, 255, 0.3);
                        transform: translateY(-2px);
                        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
                    }
                    
                    .btn-primary {
                        background: rgba(46, 204, 113, 0.3);
                        border-color: #2ecc71;
                    }
                    
                    .btn-primary:hover {
                        background: rgba(46, 204, 113, 0.5);
                    }

                    .btn-warning {
                        background: rgba(231, 76, 60, 0.2);
                        border-color: rgba(231, 76, 60, 0.5);
                        font-size: 14px;
                        padding: 10px 20px;
                    }

                    .btn-warning:hover {
                        background: rgba(231, 76, 60, 0.4);
                    }

                    .block-number {
                        font-size: 14px;
                        opacity: 0.7;
                        margin-bottom: 8px;
                    }

                    .stats {
                        margin-top: 20px;
                        padding: 16px;
                        background: rgba(255, 255, 255, 0.05);
                        border-radius: 12px;
                        font-size: 14px;
                    }
                    
                    .time {
                        font-size: 18px;
                        font-weight: 600;
                        color: ${currentTheme.accentColor};
                        margin-bottom: 8px;
                        white-space: pre;
                    }
                </style>
            </head>
            <body>
                <div class="block-container" id="producer-block-overlay">
                    <div class="icon">🎯</div>
                    <div class="title">${this.blockPageTitle}</div>
                    <div class="message">${this.blockPageMessage}</div>
                    <div style="margin: 20px 0;">
                      <div class="block-number">Block #${blockNumber}</div>                    
                      <div class="blocked-url">${urlToReport}</div>
                      <div class="actions" style="margin-top: 0;">
                          <button id="allow-once-btn" class="btn btn-warning" title="Allow this site only this time">Allow Once</button>
                          <button id="add-exception-btn" class="btn btn-warning" title="Add allowed URL in the rules list">Add Exception</button>
                      </div>
                    </div>
                    <div class="motivational">${phrase}</div>

                    <div class="stats">
                        <div class="time" id="sessionTime">Focus Session Active</div>
                        <div>Keep going! Every moment of focus counts.</div>
                    </div>

                    <div class="actions">
                        <button id="go-back-btn" class="btn">← Go Back</button>
                        <button id="close-btn" class="btn btn-primary">Close Tab</button>
                    </div>
                </div>
            </body>
            </html>
        `;

    // Wait for DOM to be ready and attach event listeners
    setTimeout(() => {
      const backBtn = document.getElementById("go-back-btn");
      const closeBtn = document.getElementById("close-btn");
      const allowOnceBtn = document.getElementById("allow-once-btn");
      const addExceptionBtn = document.getElementById("add-exception-btn");

      backBtn.addEventListener("click", () => {
        history.back();
        // Reload the page to actually navigate to the previous URL
        setTimeout(() => {
          window.location.reload();
        }, 100);
      });
      closeBtn.addEventListener("click", async () => {
        try {
          await chrome.runtime.sendMessage({
            action: "closeTab",
          });
        } catch (err) {
          console.error("Could not close tab:", err);
        }
      });
      allowOnceBtn.addEventListener("click", async () => {
        try {
          // Request temporary exception for this URL
          await chrome.runtime.sendMessage({
            action: "allowOnce",
            url: urlToReport,
          });
          // Refresh the page to load the allowed content
          window.location.reload();
        } catch (err) {
          console.error("Could not allow once:", err);
        }
      });
      addExceptionBtn.addEventListener("click", async () => {
        try {
          // Add URL as permanent allow rule to the active rule set
          const response = await chrome.runtime.sendMessage({
            action: "addException",
            url: urlToReport,
          });
          if (response && response.success) {
            // Refresh the page to load the allowed content
            window.location.reload();
          } else {
            console.error("Could not add exception:", response?.error);
          }
        } catch (err) {
          console.error("Could not add exception:", err);
        }
      });

      // Format time helper function
      function formatTime(seconds) {
        if (!seconds || seconds < 0) return "0m";
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = (seconds % 60) + 1;
        if (hours > 0) return `${hours}h ${minutes}m`;
        else if (minutes > 0) return `${minutes}m ${secs}s`;
        else return `${secs}s`;
      }

      // Timer - show focused time instead of local time
      async function updateFocusedTime() {
        try {
          const response = await chrome.runtime.sendMessage({
            action: "getTimerState",
          });

          if (response) {
            const focusedTimeFormatted = formatTime(response.focusedTime);
            const totalSessionTimeFormatted = formatTime(
              response.totalSessionTime
            );

            const el = document.getElementById("sessionTime");
            if (el) {
              el.textContent = "Focus Session Active\r\n";
              el.textContent += `Focused Time: ${focusedTimeFormatted} | Session Time: ${totalSessionTimeFormatted}`;
            }
          }
        } catch (error) {
          console.error("Error getting timer state:", error);
          const el = document.getElementById("sessionTime");
          if (el) el.textContent = "Focus Session Active";
        }
      }

      updateFocusedTime();
      setInterval(updateFocusedTime, 1000);
    }, 100);
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
