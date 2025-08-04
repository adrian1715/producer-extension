class ProducerPopup {
  constructor() {
    this.isActive = false;
    this.rules = [];
    this.sessionBlocks = 0;

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
  }

  bindEvents() {
    this.toggleBtn.addEventListener("click", () => this.toggleProducing());
    this.addRuleBtn.addEventListener("click", () => this.addRule());
    this.urlInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") this.addRule();
    });
  }

  async loadState() {
    try {
      const data = await chrome.storage.local.get([
        "isActive",
        "rules",
        "sessionBlocks",
      ]);

      this.isActive = data.isActive || false;
      this.rules = data.rules || [];
      this.sessionBlocks = data.sessionBlocks || 0;

      this.updateUI();
    } catch (error) {
      console.error("Failed to load state:", error);
    }
  }

  async saveState() {
    try {
      await chrome.storage.local.set({
        isActive: this.isActive,
        rules: this.rules,
        sessionBlocks: this.sessionBlocks,
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
    this.statusIcon.textContent = this.isActive ? "🎯" : "⏸️";

    // Update stats
    this.blockedCount.textContent = this.rules.length;
    this.sessionBlocksEl.textContent = this.sessionBlocks;
    this.ruleCount.textContent = this.rules.length;

    // Update rules list
    this.renderRulesList();
  }

  addRule() {
    const url = this.urlInput.value.trim();
    const type = this.ruleType.value;

    if (!url) {
      this.showNotification("Please enter a URL or domain", "error");
      return;
    }

    // Verify that a rule type is selected (assuming empty string or 'select' is default)
    if (!type || type === "Select one option") {
      this.showNotification("Please select a block rule option", "error");
      return;
    }

    // Clean and validate URL
    const cleanUrl = this.cleanUrl(url);

    if (!this.isValidUrl(cleanUrl)) {
      this.showNotification("Please enter a valid URL or domain", "error");
      return;
    }

    // Check for duplicates
    const exists = this.rules.some(
      (rule) => rule.url === cleanUrl && rule.type === type
    );
    if (exists) {
      this.showNotification("This rule already exists", "error");
      return;
    }

    // Add rule
    const rule = {
      id: Date.now(),
      url: cleanUrl,
      type: type,
      created: new Date().toISOString(),
    };

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
      url.textContent = this.formatUrl(rule.url);

      const type = document.createElement("div");
      type.className = "rule-type";
      type.textContent = this.formatRuleType(rule.type);

      info.appendChild(url);
      info.appendChild(type);

      const removeBtn = document.createElement("button");
      removeBtn.className = "btn btn-danger";
      removeBtn.textContent = "✕";
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
    };
    return typeMap[type] || type;
  }

  showNotification(message, type = "success") {
    // Create notification element
    const notification = document.createElement("div");
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
}

// Initialize popup
const popup = new ProducerPopup();

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "updateBlockCount") {
    popup.sessionBlocks = message.count;
    popup.sessionBlocksEl.textContent = popup.sessionBlocks;
    chrome.storage.local.set({ sessionBlocks: popup.sessionBlocks });
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
