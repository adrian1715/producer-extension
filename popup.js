class ProducerPopup {
  constructor() {
    this.isActive = false;
    this.rules = [];
    this.sessionBlocks = 0;
    this.sessionTime = 0; // in seconds
    this.focusedTime = 0; // in seconds
    this.timerInterval = null;
    this.lastTimerUpdate = 0; // Track when we last received a timer update

    this.initializeElements();
    this.bindEvents();
    this.loadState();
  }

  initializeElements() {
    this.statusIndicator = document.getElementById("statusIndicator");
    this.statusIcon = document.getElementById("statusIcon");
    this.toggleBtn = document.getElementById("toggleBtn");
    this.urlInput = document.getElementById("urlInput");
    this.ruleType = document.getElementById("ruleType");
    this.addRuleBtn = document.getElementById("addRule");
    this.rulesList = document.getElementById("rulesList");
    this.ruleCount = document.getElementById("ruleCount");
    this.blockedCount = document.getElementById("blockedCount");
    this.totalBlockedCountEl = document.getElementById("totalBlockedCount");
    this.totalFocusedTimeEl = document.getElementById("totalFocusedTime");
    this.sessionBlocksEl = document.getElementById("sessionBlocks");
    this.sessionStatusText = document.getElementById("sessionStatusText");
    this.sessionTimerEl = document.getElementById("sessionTimer");
    this.focusedTimeEl = document.getElementById("focusedTime");
    this.clearInfoBtn = document.getElementById("clearInfoBtn");
    this.exportRulesBtn = document.getElementById("exportRulesBtn");
    this.importRulesBtn = document.getElementById("importRulesBtn");
    this.importFileInput = document.getElementById("importFileInput");
    this.clearRulesBtn = document.getElementById("clearRulesBtn");
    this.urlInputContainer = document.getElementById("urlInputContainer");
    this.paramKeyInput = document.getElementById("paramKeyInput");
    this.paramValueInput = document.getElementById("paramValueInput");
    this.paramInputsContainer = document.getElementById("paramInputsContainer");
    this.addParamRuleBtn = document.getElementById("addParamRule");

    // Tab elements
    this.tabBtns = document.querySelectorAll(".tab-btn");
    this.tabContents = document.querySelectorAll(".tab-content");

    // Personalization elements
    this.themeOptions = document.querySelectorAll(".theme-option");
    this.blockPageTitle = document.getElementById("blockPageTitle");
    this.blockPageMessage = document.getElementById("blockPageMessage");
    this.previewTitle = document.getElementById("previewTitle");
    this.previewMessage = document.getElementById("previewMessage");
    this.savePersonalizationBtn = document.getElementById(
      "savePersonalizationBtn"
    );
    this.resetPersonalizationBtn = document.getElementById(
      "resetPersonalizationBtn"
    );

    // Navigation elements for block page settings
    this.openBlockPageSettingsBtn = document.getElementById(
      "openBlockPageSettingsBtn"
    );
    this.backToThemeBtn = document.getElementById("backToThemeBtn");
    this.themeMainView = document.getElementById("theme-main-view");
    this.blockPageSettingsView = document.getElementById(
      "block-page-settings-view"
    );
  }

  bindEvents() {
    this.toggleBtn.addEventListener("click", () => this.toggleProducing());
    this.addRuleBtn.addEventListener("click", () => this.addRule());
    this.urlInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") this.addRule();
    });
    this.clearRulesBtn.addEventListener("click", () => this.clearRules());
    this.importRulesBtn.addEventListener("click", async () =>
      this.importFileInput.click()
    );
    this.importFileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) this.importRules(file);
      e.target.value = ""; // Reset file input
    });
    this.exportRulesBtn.addEventListener("click", () => this.exportRules());
    this.clearInfoBtn.addEventListener("click", () => this.clearInfo());
    this.ruleType.addEventListener("change", () => {
      if (this.paramInputsContainer) {
        const isParamRule = this.ruleType.value === "allowParam";
        this.paramInputsContainer.style.display = isParamRule ? "flex" : "none";
        this.urlInputContainer.style.display = isParamRule ? "none" : "flex";
      }
      if (this.paramKeyInput) this.paramKeyInput.value = "";
      if (this.paramValueInput) this.paramValueInput.value = "";
      if (this.urlInput) this.urlInput.value = "";
    });
    this.addParamRuleBtn.addEventListener("click", () => this.addRule());
    if (this.paramKeyInput) {
      this.paramKeyInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") this.addRule();
      });
    }
    if (this.paramValueInput) {
      this.paramValueInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") this.addRule();
      });
    }

    // Tab switching
    this.tabBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const targetTab = btn.getAttribute("data-tab");
        this.switchTab(targetTab);
      });
    });

    // Personalization events
    this.themeOptions.forEach((option) => {
      option.addEventListener("click", () => {
        this.selectTheme(option.getAttribute("data-theme"));
      });
    });

    if (this.blockPageTitle) {
      this.blockPageTitle.addEventListener("input", () => this.updatePreview());
    }
    if (this.blockPageMessage) {
      this.blockPageMessage.addEventListener("input", () =>
        this.updatePreview()
      );
    }
    if (this.savePersonalizationBtn) {
      this.savePersonalizationBtn.addEventListener("click", () =>
        this.savePersonalization()
      );
    }
    if (this.resetPersonalizationBtn) {
      this.resetPersonalizationBtn.addEventListener("click", () =>
        this.resetPersonalization()
      );
    }

    // Block page settings navigation
    if (this.openBlockPageSettingsBtn) {
      this.openBlockPageSettingsBtn.addEventListener("click", () =>
        this.showBlockPageSettings()
      );
    }
    if (this.backToThemeBtn) {
      this.backToThemeBtn.addEventListener("click", () =>
        this.showThemeMainView()
      );
    }
  }

  switchTab(tabName) {
    // Remove active class from all tabs and contents
    this.tabBtns.forEach((btn) => btn.classList.remove("active"));
    this.tabContents.forEach((content) => content.classList.remove("active"));

    // Add active class to selected tab and content
    const activeBtn = document.querySelector(`[data-tab="${tabName}"]`);
    const activeContent = document.getElementById(`tab-${tabName}`);

    if (activeBtn) activeBtn.classList.add("active");
    if (activeContent) activeContent.classList.add("active");

    // If switching to personalize tab, always show main theme view
    if (tabName === "personalize") {
      this.showThemeMainView();
    }
  }

  async loadState() {
    try {
      const data = await chrome.storage.local.get([
        "isActive",
        "rules",
        "sessionBlocks",
        "focusedTime",
        "theme",
        "blockPageTitle",
        "blockPageMessage",
      ]);

      this.isActive = data.isActive || false;
      this.rules = data.rules || [];
      this.sessionBlocks = data.sessionBlocks || 0;
      this.focusedTime = data.focusedTime || 0;

      // Load personalization settings
      this.currentTheme = data.theme || "blue";
      this.currentBlockPageTitle = data.blockPageTitle || "🎯 Stay Focused!";
      this.currentBlockPageMessage =
        data.blockPageMessage ||
        "This site is blocked during your focus session.";

      // Apply loaded personalization
      this.applyTheme(this.currentTheme);
      this.loadPersonalizationUI();

      // Request current timer state from background script
      if (this.isActive) {
        await this.ensureBackgroundTimerRunning();
        this.requestTimerUpdate();
        this.startTimerUpdates();
      }

      this.updateUI();
    } catch (error) {
      console.error("Failed to load state:", error);
    }
  }

  async ensureBackgroundTimerRunning() {
    try {
      // Send a sync message to ensure background timer is running
      await chrome.runtime.sendMessage({
        action: "ensureTimerRunning",
      });
    } catch (error) {
      console.error("Failed to ensure background timer is running:", error);
    }
  }

  async requestTimerUpdate() {
    try {
      const response = await chrome.runtime.sendMessage({
        action: "getTimerState",
      });

      if (response) {
        this.sessionTime = response.sessionTime || 0;
        this.focusedTime = response.focusedTime || 0;
        this.lastTimerUpdate = Date.now();
        this.updateTimerDisplay();
        // this.updateUI(); // to updateUI every second the timer changes
      }
    } catch (error) {
      console.error("Failed to get timer state:", error);
      // If we can't get timer state and we think we should be active,
      // try to restart the background timer
      if (this.isActive) {
        this.ensureBackgroundTimerRunning();
      }
    }
  }

  startTimerUpdates() {
    // Clear any existing interval
    if (this.timerInterval) clearInterval(this.timerInterval);

    // Update timer display every second by requesting from background
    this.timerInterval = setInterval(() => {
      this.requestTimerUpdate();

      // Check if we haven't received updates for too long (5 seconds)
      // This indicates the background timer might have stopped
      if (this.isActive && Date.now() - this.lastTimerUpdate > 5000) {
        console.warn(
          "Timer updates stopped, attempting to restart background timer"
        );
        this.ensureBackgroundTimerRunning();
      }
    }, 1000);
  }

  stopTimerUpdates() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  async saveState(action, oldRules) {
    try {
      const before =
        oldRules || (await chrome.storage.local.get(["rules", "isActive"]));

      await chrome.storage.local.set({
        isActive: this.isActive,
        rules: this.rules,
        sessionBlocks: this.sessionBlocks,
        focusedTime: this.focusedTime,
      });

      chrome.runtime.sendMessage({
        action: "updateRules",
        isActive: this.isActive,
        rules: this.rules,
      });

      // Only reload affected tabs
      if (
        (this.isActive || action === "toggleProducing") &&
        action !== "clearInfo"
      ) {
        chrome.runtime.sendMessage({
          action: "reloadAffectedTabs",
          rulesBefore: before.rules || [],
          rulesAfter: this.rules,
          isActiveBefore: before.isActive || false,
          isActiveAfter: this.isActive,
        });
      }
    } catch (error) {
      console.error("Failed to save state:", error);
    }
  }

  async toggleProducing() {
    this.isActive = !this.isActive;

    if (this.isActive) {
      // this.sessionBlocks = 0;
      this.sessionTime = 0;
      this.startTimerUpdates();

      // Tell background script to start timer
      chrome.runtime.sendMessage({
        action: "startTimer",
      });
    } else {
      this.stopTimerUpdates();

      // Tell background script to stop timer
      chrome.runtime.sendMessage({
        action: "stopTimer",
      });
    }

    this.saveState("toggleProducing");
    this.updateUI();

    // Show feedback
    this.showNotification(
      this.isActive ? "Focus mode activated!" : "Focus mode deactivated"
    );
  }

  updateUI() {
    // Update toggle button
    this.toggleBtn.textContent = this.isActive
      ? "Stop Producing"
      : "Start Producing";
    this.toggleBtn.classList.toggle("active", this.isActive);

    // Update status indicator
    this.statusIndicator.classList.toggle("active", this.isActive);
    this.statusIndicator.classList.toggle("inactive", !this.isActive);
    this.statusIcon.textContent = this.isActive ? "⏸️" : "🎯";

    // Update stats in home tab
    this.blockedCount.textContent = this.sessionBlocks || 0;
    this.ruleCount.textContent = this.rules.length;

    // Update focused time in home tab
    if (this.focusedTimeEl) {
      const hours = Math.floor(this.focusedTime / 3600);
      const minutes = Math.floor((this.focusedTime % 3600) / 60);
      this.focusedTimeEl.textContent = `${hours
        .toString()
        .padStart(2, "0")}h${minutes.toString().padStart(2, "0")}m`;
    }

    // Update stats in stats tab
    if (this.totalBlockedCountEl) {
      this.totalBlockedCountEl.textContent = this.sessionBlocks || 0;
    }
    if (this.totalFocusedTimeEl) {
      const hours = Math.floor(this.focusedTime / 3600);
      const minutes = Math.floor((this.focusedTime % 3600) / 60);
      this.totalFocusedTimeEl.textContent = `${hours
        .toString()
        .padStart(2, "0")}h${minutes.toString().padStart(2, "0")}m`;
    }

    // Update rules list
    this.renderRulesList();

    // Update timer display
    this.updateTimerDisplay();

    // Update session status text
    this.sessionStatusText.textContent = this.isActive
      ? "Session Active"
      : "Session Inactive";
    this.sessionStatusText.style.color = this.isActive ? "#2ecc71" : "#e74c3c";

    // Update Clear and Export Rules buttons visibility
    if (this.rules.length > 0) {
      this.clearRulesBtn.style.display = "inline-block";
      this.exportRulesBtn.style.display = "inline-block";
    } else {
      this.clearRulesBtn.style.display = "none";
      this.exportRulesBtn.style.display = "none";
    }

    // Clear parameter inputs if they exist
    if (this.paramKeyInput) this.paramKeyInput.value = "";
    if (this.paramValueInput) this.paramValueInput.value = "";
  }

  // update timer display
  updateTimerDisplay() {
    if (this.sessionTimerEl && this.focusedTimeEl) {
      const hours = Math.floor(this.sessionTime / 3600);
      const minutes = Math.floor((this.sessionTime % 3600) / 60);
      const seconds = this.sessionTime % 60;

      // Format as HH:MM:SS
      const sessionTimeString = `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

      const focusedTimeString = `${Math.floor(this.focusedTime / 3600)
        .toString()
        .padStart(2, "0")}h${Math.floor((this.focusedTime % 3600) / 60)
        .toString()
        .padStart(2, "0")}m`;

      this.sessionTimerEl.textContent = sessionTimeString;
      this.focusedTimeEl.textContent = focusedTimeString;

      // Also update stats tab if element exists
      if (this.totalFocusedTimeEl) {
        this.totalFocusedTimeEl.textContent = focusedTimeString;
      }
    }
  }

  addRule() {
    const url = this.urlInput.value.trim();
    const type = this.ruleType.value;

    // Check if a rule type is selected (assuming empty string or 'select' is default)
    if (!type || type === "Select one option") {
      this.showNotification("Please select a block rule option", "error");
      return;
    }

    // Check if URL is valid
    if (
      (!url || !this.isValidUrl(this.cleanUrl(url))) &&
      this.ruleType.value !== "allowParam"
    ) {
      this.showNotification("Please enter a valid URL or domain", "error");
      return;
    }

    // Clean and validate URL
    const cleanUrl = this.cleanUrl(url);

    // For parameter-based rules, validate parameter inputs
    let paramKey = "";
    let paramValue = "";
    if (type === "allowParam") {
      if (!this.paramKeyInput || !this.paramValueInput) {
        this.showNotification("Parameter input fields not found", "error");
        return;
      }
      paramKey = this.paramKeyInput.value.trim();
      paramValue = this.paramValueInput.value.trim();
      if (!paramKey) {
        this.showNotification("Please enter a parameter key", "error");
        return;
      }
      // Parameter value can be empty (to allow any value for the key)
    }

    // Check for duplicates
    const exists = this.rules.some((rule) => {
      if (rule.type === type) {
        if (type === "allowParam") {
          return rule.paramKey === paramKey && rule.paramValue === paramValue;
        } else {
          return rule.url === cleanUrl;
        }
      }
      return false;
    });
    if (exists) {
      this.showNotification("This rule already exists", "error");
      return;
    }

    // Add rule
    const rule = {
      id: Date.now(),
      type: type,
      created: new Date().toISOString(),
    };

    // Set URL or parameters based on rule type
    if (type === "allowParam") {
      rule.paramKey = paramKey;
      rule.paramValue = paramValue;
    } else {
      rule.url = cleanUrl;
    }

    this.rules.push(rule);
    this.urlInput.value = "";

    this.saveState();
    this.updateUI();

    this.showNotification("Rule added successfully!");
  }

  removeRule(ruleId) {
    this.rules = this.rules.filter((rule) => rule.id !== ruleId);
    this.saveState();
    this.updateUI();
    this.showNotification("Rule removed");
  }

  renderRulesList() {
    this.rulesList.innerHTML = "";

    if (this.rules.length === 0) {
      this.rulesList.innerHTML = `
            <div class="empty-state">
                No blocking rules configured yet.<br>
                Add or import some rules to get started!
            </div>
        `;
      return;
    }

    this.rules.forEach((rule) => {
      const item = document.createElement("div");
      item.className = "rule-item";

      const info = document.createElement("div");
      info.className = "rule-info";

      const url = document.createElement("div");
      url.className = "rule-url";
      if (rule.type !== "allowParam") {
        url.textContent = this.formatUrl(rule.url);
      } else {
        url.textContent = `?${rule.paramKey}=${rule.paramValue || "any"}`;
      }

      const type = document.createElement("div");
      type.className = "rule-type";
      type.textContent = this.formatRuleType(rule.type);

      info.appendChild(url);
      info.appendChild(type);

      const removeBtn = document.createElement("button");
      removeBtn.className = "btn btn-xsmall btn-danger";
      removeBtn.textContent = "✕";
      removeBtn.title = "Delete Rule";
      // removeBtn.style.padding = "8px 12px";
      removeBtn.addEventListener("click", () => {
        this.removeRule(rule.id);
      });

      item.appendChild(info);
      item.appendChild(removeBtn);
      this.rulesList.appendChild(item);
    });
  }

  cleanUrl(url) {
    // Remove protocol if present
    return url.replace(/^https?:\/\//, "").replace(/^www\./, "");
  }

  isValidUrl(url) {
    // Basic URL validation
    const urlPattern =
      /^[a-zA-Z0-9][a-zA-Z0-9-._]*[a-zA-Z0-9](\.[a-zA-Z]{2,})?([\/\w\-._~:?#[\]@!$&'()*+,;=]*)?$/;
    return urlPattern.test(url);
  }

  formatUrl(url) {
    return url.length > 35 ? url.substring(0, 35) + "..." : url;
  }

  formatRuleType(type) {
    const typeMap = {
      domain: "🚫 Block Domain",
      url: "🎯 Block URL",
      allow: "✅ Allow URL",
      allowParam: "🔗 Allow with Parameter",
    };
    return typeMap[type] || type;
  }

  showNotification(message, type = "success") {
    const existingNotification = document.querySelector(".notification");
    if (existingNotification)
      document.querySelectorAll(".notification").forEach((n) => n.remove());

    // Create notification element
    const notification = document.createElement("div");
    notification.className = "notification";
    notification.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: ${type === "error" ? "#e74c3c" : "#2ecc71"};
            color: white;
            padding: 8px 16px;
            border-radius: 6px;
            font-size: 12px;
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  async importRules(file) {
    try {
      // Read file contents
      const text = await file.text();
      const lines = text.split("\n");

      // Parse rules from file
      const importedRules = [];
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;

        const [type, ...valueParts] = trimmed.split(" ");
        const value = valueParts.join(" ").trim();

        if (!type || !value) continue;

        const baseRule = {
          id: Math.floor(Date.now() * Math.random()),
          created: new Date().toISOString(),
          type,
        };

        // Properly split query parameter rules
        if (type === "allowParam") {
          const [param, paramValue = ""] = value.split("=");
          baseRule.paramKey = param.trim();
          baseRule.paramValue = paramValue.trim();
        } else {
          baseRule.url = this.cleanUrl(value);
        }

        importedRules.push(baseRule);
      }

      // Keep a copy of old rules for comparison (to reload affected tabs properly)
      const oldRules = this.rules.slice();

      // Saving imported rules
      this.rules = importedRules;
      await chrome.storage.local.set({ rules: importedRules });

      // Updating popup
      await this.saveState("import", oldRules); // passing oldRules to compare rules and reload affected tabs properly
      this.updateUI();

      this.showNotification("Rules imported successfully", "success");
    } catch (err) {
      console.error("Failed to import rules:", err);
    }
  }

  exportRules() {
    if (this.rules.length === 0) {
      this.showNotification("No rules to export", "error");
      return;
    }

    chrome.storage.local.get(["rules"], (data) => {
      const rules = data.rules || [];

      const lines = rules.map(
        (rule) =>
          `${rule.type} ${rule.url || rule.paramKey + "=" + rule.paramValue}`
      );

      const fileContent =
        "# Producer Rules File\n" +
        "# Format: RULE_TYPE RULE_VALUE\n" +
        "# Types: BLOCK_DOMAIN | BLOCK_URL | ALLOW_URL | ALLOW_PARAM\n\n" +
        lines.join("\n");

      // Create a downloadable Blob
      const blob = new Blob([fileContent], { type: "text/plain" });
      const url = URL.createObjectURL(blob);

      // Trigger download
      const a = document.createElement("a");
      a.href = url;
      a.download = "rules.txt";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      URL.revokeObjectURL(url);
    });
  }

  clearRules() {
    if (this.rules.length === 0) {
      this.showNotification("No rules to clear", "error");
      return;
    }

    this.rules = [];
    this.saveState();
    this.updateUI();
    this.showNotification("All rules cleared");
  }

  async clearInfo() {
    if (
      this.sessionTime === 0 &&
      this.focusedTime === 0 &&
      this.sessionBlocks === 0
    ) {
      this.showNotification("No info to clear", "error");
      return;
    }

    this.sessionTime = 0;
    this.focusedTime = 0;
    this.sessionBlocks = 0;

    // Tell background script to clear focused time and reset session blocks
    chrome.runtime.sendMessage({
      action: "clearTimers",
    });

    // Also send message to reset session blocks in background
    chrome.runtime.sendMessage({
      action: "resetSessionBlocks",
    });

    this.saveState("clearInfo");
    this.updateUI();
    this.showNotification("Timers and session blocks cleared");
  }

  // Personalization methods
  async selectTheme(theme) {
    this.currentTheme = theme;

    // Update active state on theme options
    this.themeOptions.forEach((option) => {
      if (option.getAttribute("data-theme") === theme) {
        option.classList.add("active");
      } else {
        option.classList.remove("active");
      }
    });

    // If theme is already applied, do nothing and display a message
    if (document.body.classList.contains(`theme-${theme}`)) {
      this.showNotification(`Theme ${theme} is already applied!`, "error");
      return;
    }

    // Apply theme immediately
    this.applyTheme(theme);

    // Auto-save theme to storage
    try {
      await chrome.storage.local.set({ theme });

      // Send message to background script to update block page theme
      chrome.runtime.sendMessage({
        action: "updatePersonalization",
        theme,
        blockPageTitle: this.currentBlockPageTitle,
        blockPageMessage: this.currentBlockPageMessage,
      });

      this.showNotification(`Theme changed to ${theme}!`);
    } catch (error) {
      console.error("Failed to save theme:", error);
      this.showNotification("Failed to save theme", "error");
    }
  }

  applyTheme(theme) {
    // Remove all theme classes
    document.body.className = document.body.className
      .split(" ")
      .filter((c) => !c.startsWith("theme-"))
      .join(" ");

    // Add new theme class
    document.body.classList.add(`theme-${theme}`);
  }

  loadPersonalizationUI() {
    // Set input values
    if (this.blockPageTitle) {
      this.blockPageTitle.value = this.currentBlockPageTitle;
    }
    if (this.blockPageMessage) {
      this.blockPageMessage.value = this.currentBlockPageMessage;
    }

    // Update preview
    this.updatePreview();

    // Set active theme option
    this.themeOptions.forEach((option) => {
      if (option.getAttribute("data-theme") === this.currentTheme) {
        option.classList.add("active");
      } else {
        option.classList.remove("active");
      }
    });
  }

  updatePreview() {
    if (this.previewTitle && this.blockPageTitle) {
      this.previewTitle.textContent =
        this.blockPageTitle.value || "🎯 Stay Focused!";
    }
    if (this.previewMessage && this.blockPageMessage) {
      this.previewMessage.textContent =
        this.blockPageMessage.value ||
        "This site is blocked during your focus session.";
    }
  }

  async savePersonalization() {
    try {
      const blockPageTitle = this.blockPageTitle?.value || "🎯 Stay Focused!";
      const blockPageMessage =
        this.blockPageMessage?.value ||
        "This site is blocked during your focus session.";

      // Save to storage
      await chrome.storage.local.set({
        blockPageTitle,
        blockPageMessage,
      });

      // Update current values
      this.currentBlockPageTitle = blockPageTitle;
      this.currentBlockPageMessage = blockPageMessage;

      // Send message to background script to update block page
      chrome.runtime.sendMessage({
        action: "updatePersonalization",
        theme: this.currentTheme,
        blockPageTitle,
        blockPageMessage,
      });

      this.showNotification("Block page settings saved!");
    } catch (error) {
      console.error("Failed to save block page settings:", error);
      this.showNotification("Failed to save settings", "error");
    }
  }

  resetPersonalization() {
    // Reset to defaults
    this.currentTheme = "blue";
    this.currentBlockPageTitle = "🎯 Stay Focused!";
    this.currentBlockPageMessage =
      "This site is blocked during your focus session.";

    // Update UI
    this.applyTheme(this.currentTheme);
    this.loadPersonalizationUI();

    this.showNotification("Reset to default settings");
  }

  // Navigation methods for block page settings
  showBlockPageSettings() {
    if (this.themeMainView && this.blockPageSettingsView) {
      this.themeMainView.style.display = "none";
      this.blockPageSettingsView.style.display = "block";
    }
  }

  showThemeMainView() {
    if (this.themeMainView && this.blockPageSettingsView) {
      this.themeMainView.style.display = "block";
      this.blockPageSettingsView.style.display = "none";
    }
  }
}

// Initialize popup
const popup = new ProducerPopup();

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "updateBlockCount") {
    popup.sessionBlocks = message.count;
    if (popup.sessionBlocksEl) {
      popup.sessionBlocksEl.textContent = popup.sessionBlocks;
    }
    chrome.storage.local.set({ sessionBlocks: popup.sessionBlocks });
  }

  if (message.action === "timerUpdate") {
    popup.sessionTime = message.sessionTime;
    popup.focusedTime = message.focusedTime;
    popup.lastTimerUpdate = Date.now(); // Track when we received the update
    popup.updateTimerDisplay();
  }
});

// Add CSS for notification animation
const style = document.createElement("style");
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);
