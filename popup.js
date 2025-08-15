class ProducerPopup {
  constructor() {
    this.isActive = false;
    this.rules = [];
    this.sessionBlocks = 0;
    this.sessionTime = 0; // in seconds
    this.focusedTime = 0; // in seconds
    this.timerInterval = null;

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
    this.sessionBlocksEl = document.getElementById("sessionBlocks");
    this.sessionStatusText = document.getElementById("sessionStatusText");
    this.sessionTimerEl = document.getElementById("sessionTimer");
    this.focusedTimeEl = document.getElementById("focusedTime");
    this.clearFocusedTimeBtn = document.getElementById("clearFocusedTimeBtn");
    this.clearRulesBtn = document.getElementById("clearAllRluesBtn");
    this.settingsBtn = document.getElementById("settingsBtn");
    this.closeSettingsBtn = document.getElementById("closeSettingsBtn");
    this.settingsEl = document.getElementById("settings");
    this.mainControlsEl = document.getElementById("main-controls");
    this.urlInputContainer = document.getElementById("urlInputContainer");
    this.paramKeyInput = document.getElementById("paramKeyInput");
    this.paramValueInput = document.getElementById("paramValueInput");
    this.paramInputsContainer = document.getElementById("paramInputsContainer");
    this.addParamRuleBtn = document.getElementById("addParamRule");
  }

  bindEvents() {
    this.toggleBtn.addEventListener("click", () => this.toggleProducing());
    this.addRuleBtn.addEventListener("click", () => this.addRule());
    this.urlInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") this.addRule();
    });
    this.clearRulesBtn.addEventListener("click", () => this.clearRules());
    this.settingsBtn.addEventListener("click", () => {
      this.settingsEl.style.display = "block";
      this.mainControlsEl.style.display = "none";
    });
    this.closeSettingsBtn.addEventListener("click", () => {
      this.settingsEl.style.display = "none";
      this.mainControlsEl.style.display = "block";
    });
    this.clearFocusedTimeBtn.addEventListener("click", () =>
      this.clearFocusedTime()
    );
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
  }

  async loadState() {
    try {
      const data = await chrome.storage.local.get([
        "isActive",
        "rules",
        "sessionBlocks",
        "focusedTime",
      ]);

      this.isActive = data.isActive || false;
      this.rules = data.rules || [];
      this.sessionBlocks = data.sessionBlocks || 0;
      this.focusedTime = data.focusedTime || 0;

      // Request current timer state from background script
      if (this.isActive) {
        this.requestTimerUpdate();
        this.startTimerUpdates();
      }

      this.updateUI();
    } catch (error) {
      console.error("Failed to load state:", error);
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
        this.updateTimerDisplay();
      }
    } catch (error) {
      console.error("Failed to get timer state:", error);
    }
  }

  startTimerUpdates() {
    // Clear any existing interval
    if (this.timerInterval) clearInterval(this.timerInterval);

    // Update timer display every second by requesting from background
    this.timerInterval = setInterval(() => {
      this.requestTimerUpdate();
    }, 1000);
  }

  stopTimerUpdates() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  async saveState() {
    try {
      await chrome.storage.local.set({
        isActive: this.isActive,
        rules: this.rules,
        sessionBlocks: this.sessionBlocks,
        focusedTime: this.focusedTime,
      });

      // Notify background script of changes
      chrome.runtime.sendMessage({
        action: "updateRules",
        isActive: this.isActive,
        rules: this.rules,
      });
    } catch (error) {
      console.error("Failed to save state:", error);
    }
  }

  async toggleProducing() {
    this.isActive = !this.isActive;

    if (this.isActive) {
      this.sessionBlocks = 0;
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

    await this.saveState();
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

    // Update stats
    this.blockedCount.textContent = this.rules.length;
    // this.sessionBlocksEl.textContent = this.sessionBlocks;
    this.ruleCount.textContent = this.rules.length;

    // Update rules list
    this.renderRulesList();

    // Update timer display
    this.updateTimerDisplay();

    // Update session status text
    this.sessionStatusText.textContent = this.isActive
      ? "Session Active"
      : "Session Inactive";
    this.sessionStatusText.style.color = this.isActive ? "#2ecc71" : "#e74c3c";

    // Update Clear Rules button visibility
    if (this.rules.length > 0) {
      this.clearRulesBtn.style.display = "inline-block";
    } else {
      this.clearRulesBtn.style.display = "none";
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
        .padStart(2, "0")}:${Math.floor((this.focusedTime % 3600) / 60)
        .toString()
        .padStart(2, "0")}:${(this.focusedTime % 60)
        .toString()
        .padStart(2, "0")}`;

      this.sessionTimerEl.textContent = sessionTimeString;
      this.focusedTimeEl.textContent = focusedTimeString;
    }

    if (this.sessionTimerEl && !this.isActive)
      this.sessionTimerEl.textContent = "00:00:00";
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
                Add some rules above to get started!
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
      removeBtn.className = "btn btn-danger";
      removeBtn.textContent = "✕";
      removeBtn.style.padding = "8px 12px";
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
    if (existingNotification) existingNotification.remove();

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

  clearRules() {
    if (this.rules.length === 0) {
      this.showNotification("No rules to clear", "error");
      return;
    }

    // Confirm before clearing
    // if (confirm("Are you sure you want to clear all rules?")) {
    this.rules = [];
    this.saveState();
    this.updateUI();
    this.showNotification("All rules cleared");
    // }
  }

  async clearFocusedTime() {
    if (this.focusedTime === 0) {
      this.showNotification("No focused time to clear", "error");
      return;
    }

    this.focusedTime = 0;

    // Tell background script to clear focused time
    chrome.runtime.sendMessage({
      action: "clearFocusedTime",
    });

    this.saveState();
    this.updateUI();
    this.showNotification("Focused time cleared");
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
