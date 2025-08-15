class ProducerBackground {
  constructor() {
    this.rules = [];
    this.isActive = false;
    this.sessionBlocks = 0;

    this.init();
  }

  async init() {
    // Load saved state
    await this.loadState();

    // Set up listeners
    this.setupListeners();

    // Update rules on startup
    this.updateBlockingRules();
  }

  async loadState() {
    try {
      const data = await chrome.storage.local.get([
        "rules",
        "isActive",
        "sessionBlocks",
      ]);
      this.rules = data.rules || [];
      this.isActive = data.isActive || false;
      this.sessionBlocks = data.sessionBlocks || 0;
    } catch (error) {
      console.error("Failed to load state:", error);
    }
  }

  setupListeners() {
    // Listen for messages from popup
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      if (message.action === "checkBlock") {
        sendResponse({ shouldBlock: true }); // or false
        return true; // if you want to send response asynchronously
      }
    });

    // Listen for tab updates to check for blocks
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status === "loading" && tab.url) {
        this.checkAndBlockTab(tab);
      }
    });

    // Reset session blocks when extension is restarted
    chrome.runtime.onStartup.addListener(() => {
      this.sessionBlocks = 0;
      chrome.storage.local.set({ sessionBlocks: 0 });
    });
  }

  async handleMessage(message, sender, sendResponse) {
    switch (message.action) {
      case "updateRules":
        this.rules = message.rules;
        this.isActive = message.isActive;
        await this.updateBlockingRules();
        break;

      case "checkBlock":
        const shouldBlock = this.shouldBlockUrl(message.url);
        sendResponse({ shouldBlock });
        break;

      case "reportBlock":
        this.sessionBlocks++;
        chrome.storage.local.set({ sessionBlocks: this.sessionBlocks });
        // Notify popup if it's open
        this.notifyPopup("updateBlockCount", { count: this.sessionBlocks });
        break;
    }
  }

  async checkAndBlockTab(tab) {
    if (!this.isActive || !tab.url) return;

    if (this.shouldBlockUrl(tab.url)) {
      // Inject the blocking content
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: this.injectBlockPage,
          args: [tab.url],
        });

        this.sessionBlocks++;
        chrome.storage.local.set({ sessionBlocks: this.sessionBlocks });
        this.notifyPopup("updateBlockCount", { count: this.sessionBlocks });
      } catch (error) {
        console.error("Failed to inject block page:", error);
      }
    }
  }

  shouldBlockUrl(url) {
    if (!this.isActive || !url) return false;

    const cleanUrl = this.cleanUrl(url);

    // Check regular allow rules first (they take precedence)
    const allowRules = this.rules.filter((rule) => rule.type === "allow");
    for (const rule of allowRules) {
      if (this.matchesRule(cleanUrl, rule)) {
        return false; // Explicitly allowed
      }
    }

    // Check if URL would be blocked by domain/url rules
    const blockRules = this.rules.filter(
      (rule) => rule.type === "domain" || rule.type === "url"
    );

    let wouldBeBlocked = false;
    for (const rule of blockRules) {
      if (this.matchesRule(cleanUrl, rule)) {
        wouldBeBlocked = true;
        break;
      }
    }

    // If URL would be blocked, check for allowParam exceptions
    if (wouldBeBlocked) {
      const allowParamRules = this.rules.filter(
        (rule) => rule.type === "allowParam"
      );
      for (const rule of allowParamRules) {
        if (this.matchesParamRule(url, rule)) {
          return false; // Allowed by parameter rule
        }
      }
      return true; // Blocked and no parameter exception found
    }

    return false; // Not blocked
  }

  matchesRule(url, rule) {
    const ruleUrl = rule.url.toLowerCase();
    const checkUrl = url.toLowerCase();

    switch (rule.type) {
      case "domain":
        // Block entire domain and all subdomains
        return (
          checkUrl === ruleUrl ||
          checkUrl.startsWith(ruleUrl + "/") ||
          checkUrl.includes("." + ruleUrl) ||
          checkUrl.includes("//" + ruleUrl)
        );

      case "url":
      case "allow":
        // Exact URL match or starts with the URL
        return checkUrl === ruleUrl || checkUrl.startsWith(ruleUrl);

      default:
        return false;
    }
  }

  matchesParamRule(url, rule) {
    try {
      const urlObj = new URL(url);
      const paramValue = urlObj.searchParams.get(rule.paramKey);

      // Parameter must exist
      if (paramValue === null) {
        return false;
      }

      // If rule has no specific value requirement, any value is allowed
      if (!rule.paramValue || rule.paramValue === "") {
        return true;
      }

      // Check if parameter value matches exactly
      return paramValue === rule.paramValue;
    } catch (error) {
      console.error("Error parsing URL for parameter matching:", error);
      return false;
    }
  }

  cleanUrl(url) {
    try {
      const urlObj = new URL(url);
      return (urlObj.hostname + urlObj.pathname + urlObj.search).replace(
        /^www\./,
        ""
      );
    } catch {
      return url.replace(/^https?:\/\//, "").replace(/^www\./, "");
    }
  }

  async updateBlockingRules() {
    // This method updates the declarative net request rules
    // For now, we'll handle blocking in content scripts for more flexibility
    console.log("Updated blocking rules:", this.rules);
  }

  notifyPopup(action, data) {
    // Try to send message to popup if it's open
    chrome.runtime.sendMessage({ action, ...data }).catch(() => {
      // Popup is closed, ignore error
    });
  }

  // Function to inject into blocked pages
  injectBlockPage(blockedUrl) {
    // Only inject if not already blocked
    if (document.querySelector(".producer-block-page")) return;

    document.documentElement.innerHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Producer - Site Blocked</title>
                <style>
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        height: 100vh;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        text-align: center;
                    }
                    
                    .producer-block-page {
                        max-width: 500px;
                        padding: 40px;
                    }
                    
                    .icon {
                        font-size: 80px;
                        margin-bottom: 20px;
                    }
                    
                    .title {
                        font-size: 32px;
                        font-weight: 700;
                        margin-bottom: 16px;
                    }
                    
                    .message {
                        font-size: 18px;
                        opacity: 0.9;
                        margin-bottom: 8px;
                    }
                    
                    .url {
                        font-size: 14px;
                        opacity: 0.7;
                        background: rgba(255, 255, 255, 0.1);
                        padding: 8px 16px;
                        border-radius: 20px;
                        display: inline-block;
                        margin: 20px 0;
                    }
                    
                    .motivational {
                        font-size: 16px;
                        opacity: 0.8;
                        font-style: italic;
                        margin-top: 20px;
                    }
                    
                    .back-btn {
                        margin-top: 30px;
                        background: rgba(255, 255, 255, 0.2);
                        border: none;
                        color: white;
                        padding: 12px 24px;
                        border-radius: 25px;
                        font-size: 16px;
                        cursor: pointer;
                        transition: all 0.3s ease;
                    }
                    
                    .back-btn:hover {
                        background: rgba(255, 255, 255, 0.3);
                        transform: translateY(-2px);
                    }
                </style>
            </head>
            <body>
                <div class="producer-block-page">
                    <div class="icon">🎯</div>
                    <div class="title">Stay Focused!</div>
                    <div class="message">This site is blocked during your focus session.</div>
                    <div class="url">${blockedUrl}</div>
                    <div class="motivational">"The successful warrior is the average man with laser-like focus."</div>
                    <button class="back-btn" onclick="history.back()">← Go Back</button>
                </div>
            </body>
            </html>
        `;
  }
}

// Initialize background script
new ProducerBackground();
