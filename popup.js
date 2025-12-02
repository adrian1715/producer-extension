class ProducerPopup {
  constructor() {
    this.isActive = false;
    this.customRules = []; // Array of rule sets
    this.activeRuleSetId = null; // ID of currently active rule set
    this.currentEditingRuleSetId = null; // ID of rule set being edited
    this.isCreatingNewRuleSet = false; // Flag to track if we're creating a new rule set
    this.tempRuleSet = null; // Temporary rule set for unsaved changes
    this.sessionHistory = []; // Array of completed sessions
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

    // Custom rule sets elements
    this.createRuleSetBtn = document.getElementById("createRuleSetBtn");
    this.ruleSetsList = document.getElementById("ruleSetsList");
    this.activeRuleSetSelect = document.getElementById("activeRuleSetSelect");
    this.rulesMainView = document.getElementById("rules-main-view");
    this.rulesEditView = document.getElementById("rules-edit-view");
    this.backToRuleSetListBtn = document.getElementById("backToRuleSetListBtn");
    this.ruleSetNameInput = document.getElementById("ruleSetNameInput");
    this.ruleSetNameSection = document.getElementById("ruleSetNameSection");
    this.saveRuleSetBtn = document.getElementById("saveRuleSetBtn");
    this.cancelRuleSetBtn = document.getElementById("cancelRuleSetBtn");
    this.ruleSetActionButtons = document.getElementById("ruleSetActionButtons");
    this.ruleSetEditTitle = document.getElementById("ruleSetEditTitle");

    // Sessions elements
    this.sessionsList = document.getElementById("sessionsList");
    this.clearSessionsBtn = document.getElementById("clearSessionsBtn");
    this.totalSessionsCount = document.getElementById("totalSessionsCount");
    this.avgSessionDuration = document.getElementById("avgSessionDuration");

    // Stats tab navigation elements
    this.statsMainView = document.getElementById("stats-main-view");
    this.sessionHistoryView = document.getElementById("session-history-view");
    this.viewSessionHistoryBtn = document.getElementById(
      "viewSessionHistoryBtn"
    );
    this.backToStatsBtn = document.getElementById("backToStatsBtn");
    this.statsTabTotalSessions = document.getElementById(
      "statsTabTotalSessions"
    );
    this.statsTabAvgSession = document.getElementById("statsTabAvgSession");

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

    // Custom rule sets events
    if (this.createRuleSetBtn) {
      this.createRuleSetBtn.addEventListener("click", () =>
        this.startCreatingRuleSet()
      );
    }
    if (this.saveRuleSetBtn) {
      this.saveRuleSetBtn.addEventListener("click", () =>
        this.saveNewRuleSet()
      );
    }
    if (this.cancelRuleSetBtn) {
      this.cancelRuleSetBtn.addEventListener("click", () =>
        this.cancelRuleSetCreation()
      );
    }
    if (this.backToRuleSetListBtn) {
      this.backToRuleSetListBtn.addEventListener("click", () =>
        this.showRulesMainView()
      );
    }
    if (this.activeRuleSetSelect) {
      this.activeRuleSetSelect.addEventListener("change", () =>
        this.selectActiveRuleSet()
      );
    }

    // Sessions events
    if (this.clearSessionsBtn) {
      this.clearSessionsBtn.addEventListener("click", () =>
        this.clearSessions()
      );
    }

    // Stats tab navigation events
    if (this.viewSessionHistoryBtn) {
      this.viewSessionHistoryBtn.addEventListener("click", () =>
        this.showSessionHistoryView()
      );
    }
    if (this.backToStatsBtn) {
      this.backToStatsBtn.addEventListener("click", () =>
        this.showStatsMainView()
      );
    }
  }

  switchTab(tabName) {
    // If switching away from rules tab and there are unsaved changes, discard them
    if (tabName !== "rules" && this.isCreatingNewRuleSet) {
      this.cancelRuleSetCreation();
    }

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

    // If switching to rules tab, always show main view (list of rule sets)
    if (tabName === "rules") {
      this.showRulesMainView();
    }

    // If switching to stats tab, always show main stats view
    if (tabName === "stats") {
      this.showStatsMainView();
    }
  }

  async loadState() {
    try {
      const data = await chrome.storage.local.get([
        "isActive",
        "rules", // Old format for migration
        "customRules",
        "activeRuleSetId",
        "sessionHistory",
        "sessionBlocks",
        "focusedTime",
        "theme",
        "blockPageTitle",
        "blockPageMessage",
      ]);

      // Data migration: Convert old rules to custom rules structure
      if (!data.customRules && data.rules && data.rules.length > 0) {
        // Migrate old rules to a default rule set
        const defaultRuleSet = {
          id: "default-" + Date.now(),
          name: "Default",
          rules: data.rules,
        };
        this.customRules = [defaultRuleSet];
        this.activeRuleSetId = defaultRuleSet.id;

        // Save migrated data
        await chrome.storage.local.set({
          customRules: this.customRules,
          activeRuleSetId: this.activeRuleSetId,
        });

        console.log("Migrated old rules to custom rules structure");
      } else {
        this.customRules = data.customRules || [];
        this.activeRuleSetId = data.activeRuleSetId || null;
      }

      this.sessionHistory = data.sessionHistory || [];
      this.isActive = data.isActive || false;
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

  async saveState(action, oldData) {
    try {
      const before =
        oldData ||
        (await chrome.storage.local.get([
          "customRules",
          "activeRuleSetId",
          "isActive",
        ]));

      await chrome.storage.local.set({
        isActive: this.isActive,
        customRules: this.customRules,
        activeRuleSetId: this.activeRuleSetId,
        sessionHistory: this.sessionHistory,
        sessionBlocks: this.sessionBlocks,
        focusedTime: this.focusedTime,
      });

      // Get active rule set's rules
      const activeRules = this.getActiveRules();

      chrome.runtime.sendMessage({
        action: "updateRules",
        isActive: this.isActive,
        rules: activeRules,
      });

      // Only reload affected tabs
      if (
        (this.isActive || action === "toggleProducing") &&
        action !== "clearInfo"
      ) {
        const beforeRules = this.getRulesFromData(
          before.customRules,
          before.activeRuleSetId
        );
        chrome.runtime.sendMessage({
          action: "reloadAffectedTabs",
          rulesBefore: beforeRules,
          rulesAfter: activeRules,
          isActiveBefore: before.isActive || false,
          isActiveAfter: this.isActive,
        });
      }
    } catch (error) {
      console.error("Failed to save state:", error);
    }
  }

  async toggleProducing() {
    const wasActive = this.isActive;
    this.isActive = !this.isActive;

    if (this.isActive) {
      // Starting a new session
      this.sessionTime = 0;
      this.sessionStartTime = Date.now(); // Track start time for session history
      this.startTimerUpdates();

      // Tell background script to start timer
      chrome.runtime.sendMessage({
        action: "startTimer",
      });
    } else {
      // Stopping session
      this.stopTimerUpdates();

      // Save session to history
      if (wasActive && this.sessionStartTime) {
        const activeRuleSet = this.customRules.find(
          (rs) => rs.id === this.activeRuleSetId
        );
        const session = {
          id: "session-" + Date.now(),
          startTime: this.sessionStartTime,
          endTime: Date.now(),
          duration: this.sessionTime, // in seconds
          blocksCount: this.sessionBlocks,
          ruleSetId: this.activeRuleSetId,
          ruleSetName: activeRuleSet ? activeRuleSet.name : "Unknown",
        };
        this.sessionHistory.unshift(session); // Add to beginning of array
        this.sessionStartTime = null;
      }

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

    // Update rule sets list and active dropdown
    this.renderRuleSetsList();
    this.renderActiveRuleSetDropdown();

    // Update rules list (if in edit view)
    if (this.currentEditingRuleSetId) {
      this.renderRulesList();
    }

    // Update session history
    this.renderSessionHistory();

    // Update timer display
    this.updateTimerDisplay();

    // Update session status text
    this.sessionStatusText.textContent = this.isActive
      ? "Session Active"
      : "Session Inactive";
    this.sessionStatusText.style.color = this.isActive ? "#2ecc71" : "#e74c3c";

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
    if (!this.currentEditingRuleSetId) {
      this.showNotification("No rule set selected", "error");
      return;
    }

    const url = this.urlInput.value.trim();
    const type = this.ruleType.value;

    // Check if a rule type is selected
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
    }

    // Find the rule set (from temp if creating, otherwise from custom rules)
    let ruleSet;
    if (this.isCreatingNewRuleSet && this.tempRuleSet) {
      ruleSet = this.tempRuleSet;
    } else {
      ruleSet = this.customRules.find(
        (rs) => rs.id === this.currentEditingRuleSetId
      );
    }

    if (!ruleSet) {
      this.showNotification("Rule set not found", "error");
      return;
    }

    // Check for duplicates
    const exists = ruleSet.rules.some((rule) => {
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

    ruleSet.rules.push(rule);
    this.urlInput.value = "";

    // Only save state if not creating (temp changes don't get saved until confirmation)
    if (!this.isCreatingNewRuleSet) {
      this.saveState();
    }
    this.updateUI();

    this.showNotification("Rule added successfully!");
  }

  removeRule(ruleId) {
    if (!this.currentEditingRuleSetId) return;

    // Find the rule set (from temp if creating, otherwise from custom rules)
    let ruleSet;
    if (this.isCreatingNewRuleSet && this.tempRuleSet) {
      ruleSet = this.tempRuleSet;
    } else {
      ruleSet = this.customRules.find(
        (rs) => rs.id === this.currentEditingRuleSetId
      );
    }

    if (!ruleSet) return;

    ruleSet.rules = ruleSet.rules.filter((rule) => rule.id !== ruleId);

    // Only save state if not creating (temp changes don't get saved until confirmation)
    if (!this.isCreatingNewRuleSet) {
      this.saveState();
    }
    this.updateUI();
    this.showNotification("Rule removed");
  }

  renderRulesList() {
    this.rulesList.innerHTML = "";

    if (!this.currentEditingRuleSetId) {
      this.rulesList.innerHTML = `
        <div class="empty-state">
          No rule set selected.<br>
          Select a rule set to edit.
        </div>
      `;
      return;
    }

    // Get rule set from temp if creating, otherwise from custom rules
    let ruleSet;
    if (this.isCreatingNewRuleSet && this.tempRuleSet) {
      ruleSet = this.tempRuleSet;
    } else {
      ruleSet = this.customRules.find(
        (rs) => rs.id === this.currentEditingRuleSetId
      );
    }

    if (!ruleSet) {
      this.rulesList.innerHTML = `
        <div class="empty-state">
          Rule set not found.
        </div>
      `;
      return;
    }

    // Update rule count
    if (this.ruleCount) {
      this.ruleCount.textContent = ruleSet.rules.length;
    }

    // Update export/clear/import button visibility
    if (ruleSet.rules.length > 0) {
      if (this.clearRulesBtn) this.clearRulesBtn.style.display = "inline-block";
      if (this.exportRulesBtn)
        this.exportRulesBtn.style.display = "inline-block";
    } else {
      if (this.clearRulesBtn) this.clearRulesBtn.style.display = "none";
      if (this.exportRulesBtn) this.exportRulesBtn.style.display = "none";
    }

    if (ruleSet.rules.length === 0) {
      this.rulesList.innerHTML = `
        <div class="empty-state">
          No blocking rules configured yet.<br>
          Add or import some rules to get started!
        </div>
      `;
      return;
    }

    ruleSet.rules.forEach((rule) => {
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
    if (!this.currentEditingRuleSetId) {
      this.showNotification("No rule set selected", "error");
      return;
    }

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

      // Find the rule set and update its rules (from temp if creating)
      let ruleSet;
      if (this.isCreatingNewRuleSet && this.tempRuleSet) {
        ruleSet = this.tempRuleSet;
      } else {
        ruleSet = this.customRules.find(
          (rs) => rs.id === this.currentEditingRuleSetId
        );
      }

      if (!ruleSet) {
        this.showNotification("Rule set not found", "error");
        return;
      }

      ruleSet.rules = importedRules;

      // Only save state if not creating (temp changes don't get saved until confirmation)
      if (!this.isCreatingNewRuleSet) {
        await this.saveState("import");
      }
      this.updateUI();

      this.showNotification("Rules imported successfully", "success");
    } catch (err) {
      console.error("Failed to import rules:", err);
      this.showNotification("Failed to import rules", "error");
    }
  }

  exportRules() {
    if (!this.currentEditingRuleSetId) {
      this.showNotification("No rule set selected", "error");
      return;
    }

    // Find the rule set (from temp if creating)
    let ruleSet;
    if (this.isCreatingNewRuleSet && this.tempRuleSet) {
      ruleSet = this.tempRuleSet;
    } else {
      ruleSet = this.customRules.find(
        (rs) => rs.id === this.currentEditingRuleSetId
      );
    }

    if (!ruleSet || ruleSet.rules.length === 0) {
      this.showNotification("No rules to export", "error");
      return;
    }

    const lines = ruleSet.rules.map(
      (rule) =>
        `${rule.type} ${rule.url || rule.paramKey + "=" + rule.paramValue}`
    );

    const fileContent =
      "# Producer Rules File\n" +
      "# Format: RULE_TYPE RULE_VALUE\n" +
      "# Types: domain | url | allow | allowParam\n\n" +
      lines.join("\n");

    // Create a downloadable Blob
    const blob = new Blob([fileContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    // Trigger download
    const a = document.createElement("a");
    a.href = url;
    a.download = `${ruleSet.name.replace(/[^a-z0-9]/gi, "_")}_rules.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
  }

  clearRules() {
    if (!this.currentEditingRuleSetId) {
      this.showNotification("No rule set selected", "error");
      return;
    }

    // Find the rule set (from temp if creating)
    let ruleSet;
    if (this.isCreatingNewRuleSet && this.tempRuleSet) {
      ruleSet = this.tempRuleSet;
    } else {
      ruleSet = this.customRules.find(
        (rs) => rs.id === this.currentEditingRuleSetId
      );
    }

    if (!ruleSet || ruleSet.rules.length === 0) {
      this.showNotification("No rules to clear", "error");
      return;
    }

    ruleSet.rules = [];

    // Only save state if not creating (temp changes don't get saved until confirmation)
    if (!this.isCreatingNewRuleSet) {
      this.saveState();
    }
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

  // Helper methods
  getActiveRules() {
    if (!this.activeRuleSetId) return [];
    const ruleSet = this.customRules.find(
      (rs) => rs.id === this.activeRuleSetId
    );
    return ruleSet ? ruleSet.rules : [];
  }

  getRulesFromData(customRules, activeRuleSetId) {
    if (!activeRuleSetId || !customRules) return [];
    const ruleSet = customRules.find((rs) => rs.id === activeRuleSetId);
    return ruleSet ? ruleSet.rules : [];
  }

  // Custom rule set management methods
  clearAllInputs() {
    // Clear rule set name
    if (this.ruleSetNameInput) this.ruleSetNameInput.value = "";

    // Clear URL input
    if (this.urlInput) this.urlInput.value = "";

    // Reset rule type dropdown to default
    if (this.ruleType) this.ruleType.selectedIndex = 0;

    // Clear parameter inputs
    if (this.paramKeyInput) this.paramKeyInput.value = "";
    if (this.paramValueInput) this.paramValueInput.value = "";

    // Reset the visibility of param inputs container (hide it)
    if (this.paramInputsContainer) {
      this.paramInputsContainer.style.display = "none";
    }
    if (this.urlInputContainer) {
      this.urlInputContainer.style.display = "flex";
    }
  }

  startCreatingRuleSet() {
    // Create a temporary rule set
    this.tempRuleSet = {
      id: "temp-" + Date.now(),
      name: "",
      rules: [],
    };
    this.isCreatingNewRuleSet = true;
    this.currentEditingRuleSetId = this.tempRuleSet.id;

    // Show edit view with save/cancel buttons (inputs will be cleared automatically)
    this.showRulesEditView();

    // Focus on name input
    if (this.ruleSetNameInput) {
      setTimeout(() => this.ruleSetNameInput.focus(), 100);
    }
  }

  saveNewRuleSet() {
    if (!this.tempRuleSet || !this.ruleSetNameInput) {
      this.showNotification("Configure a custom rule to save", "error");
      return;
    }

    const name = this.ruleSetNameInput.value.trim();
    if (!name) {
      this.showNotification("Please enter a name for the rule set", "error");
      return;
    }

    // Update temp rule set name
    this.tempRuleSet.name = name;

    // Generate proper ID
    this.tempRuleSet.id = "ruleset-" + Date.now();

    // Add to custom rules
    this.customRules.push(this.tempRuleSet);

    // Clear temporary state
    this.tempRuleSet = null;
    this.isCreatingNewRuleSet = false;
    this.currentEditingRuleSetId = null;

    // Save and update UI
    this.saveState();
    this.updateUI();

    // Show success message and return to main view
    this.showNotification("Custom rules saved successfully!");
    this.showRulesMainView();
  }

  cancelRuleSetCreation() {
    // Discard temporary rule set
    this.tempRuleSet = null;
    this.isCreatingNewRuleSet = false;
    this.currentEditingRuleSetId = null;

    // Return to main view
    this.showRulesMainView();
  }

  deleteRuleSet(id) {
    const ruleSet = this.customRules.find((rs) => rs.id === id);
    if (!ruleSet) return;

    const confirmDelete = confirm(
      `Delete rule set "${ruleSet.name}"?\n\nThis will permanently delete ${ruleSet.rules.length} rules.`
    );
    if (!confirmDelete) return;

    // If deleting the active rule set, clear active selection
    if (this.activeRuleSetId === id) {
      this.activeRuleSetId = null;
    }

    this.customRules = this.customRules.filter((rs) => rs.id !== id);
    this.saveState();
    this.updateUI();
    this.showNotification("Rule set deleted");
  }

  editRuleSet(id) {
    this.currentEditingRuleSetId = id;
    this.showRulesEditView();

    // Populate name after inputs are cleared
    const ruleSet = this.customRules.find((rs) => rs.id === id);
    if (ruleSet && this.ruleSetNameInput) {
      this.ruleSetNameInput.value = ruleSet.name;
    }
  }

  saveRuleSetName() {
    if (!this.currentEditingRuleSetId || !this.ruleSetNameInput) return;

    const newName = this.ruleSetNameInput.value.trim();
    if (!newName) {
      this.showNotification("Please enter a name", "error");
      return;
    }

    const ruleSet = this.customRules.find(
      (rs) => rs.id === this.currentEditingRuleSetId
    );
    if (!ruleSet) return;

    ruleSet.name = newName;
    this.saveState();
    this.updateUI();
    this.showNotification("Name saved!");
  }

  selectActiveRuleSet() {
    if (!this.activeRuleSetSelect) return;

    const selectedId = this.activeRuleSetSelect.value;
    this.activeRuleSetId = selectedId || null;
    this.saveState();
    this.showNotification(
      selectedId ? "Active rule set changed!" : "No rule set active"
    );
  }

  showRulesMainView() {
    if (this.rulesMainView) this.rulesMainView.style.display = "block";
    if (this.rulesEditView) this.rulesEditView.style.display = "none";
    this.currentEditingRuleSetId = null;
    this.isCreatingNewRuleSet = false;
    this.tempRuleSet = null;
  }

  showRulesEditView() {
    // Clear all inputs first to ensure clean state
    this.clearAllInputs();

    if (this.rulesMainView) this.rulesMainView.style.display = "none";
    if (this.rulesEditView) this.rulesEditView.style.display = "block";

    // Show/hide name section and appropriate buttons based on whether we're creating or editing
    if (this.isCreatingNewRuleSet) {
      // Show name section when creating
      if (this.ruleSetNameSection) {
        this.ruleSetNameSection.style.display = "block";
      }
      // Show save/cancel buttons, hide back button
      if (this.ruleSetActionButtons) {
        this.ruleSetActionButtons.style.display = "flex";
      }
      if (this.backToRuleSetListBtn) {
        this.backToRuleSetListBtn.style.display = "none";
      }
    } else {
      // Hide name section when editing
      if (this.ruleSetNameSection) {
        this.ruleSetNameSection.style.display = "none";
      }
      // Hide save/cancel buttons, show back button
      if (this.ruleSetActionButtons) {
        this.ruleSetActionButtons.style.display = "none";
      }
      if (this.backToRuleSetListBtn) {
        this.backToRuleSetListBtn.style.display = "block";
      }
    }

    this.updateUI();
  }

  renderRuleSetsList() {
    if (!this.ruleSetsList) return;

    this.ruleSetsList.innerHTML = "";

    if (this.customRules.length === 0) {
      this.ruleSetsList.innerHTML = `
        <div class="empty-state">
          No custom rule sets yet.<br />
          Create one to get started!
        </div>
      `;
      return;
    }

    this.customRules.forEach((ruleSet) => {
      const item = document.createElement("div");
      item.className = "rule-set-item";

      const info = document.createElement("div");
      info.className = "rule-set-info";

      const name = document.createElement("div");
      name.className = "rule-set-name";
      name.textContent = ruleSet.name;

      // Add double-click to edit name
      name.addEventListener("dblclick", (e) => {
        e.stopPropagation();
        const input = document.createElement("input");
        input.type = "text";
        input.className = "rule-set-name-input";
        input.value = ruleSet.name;
        input.style.width = "100%";
        input.style.fontSize = "inherit";
        input.style.fontWeight = "inherit";
        input.style.padding = "4px";
        input.style.border = "1px solid #ccc";
        input.style.borderRadius = "4px";

        const saveEdit = () => {
          const newName = input.value.trim();
          if (newName && newName !== ruleSet.name) {
            ruleSet.name = newName;
            this.saveState();
            this.updateUI();
            this.showNotification("Name updated!");
          } else if (!newName) {
            this.showNotification("Name cannot be empty", "error");
          }
          name.textContent = ruleSet.name;
          name.style.display = "";
          input.remove();
        };

        const cancelEdit = () => {
          name.textContent = ruleSet.name;
          name.style.display = "";
          input.remove();
        };

        input.addEventListener("blur", saveEdit);
        input.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            input.blur();
          } else if (e.key === "Escape") {
            cancelEdit();
          }
        });

        name.style.display = "none";
        name.parentNode.insertBefore(input, name);
        input.focus();
        input.select();
      });

      const details = document.createElement("div");
      details.className = "rule-set-details";
      details.textContent = `${ruleSet.rules.length} rule${
        ruleSet.rules.length !== 1 ? "s" : ""
      }`;

      info.appendChild(name);
      info.appendChild(details);

      const editBtn = document.createElement("button");
      editBtn.className = "btn btn-xsmall btn-secondary";
      editBtn.innerHTML = '<i class="bi bi-pencil"></i>';
      editBtn.title = "Edit Rules";
      editBtn.style.margin = "0 4px";
      editBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.editRuleSet(ruleSet.id);
      });

      const deleteBtn = document.createElement("button");
      deleteBtn.className = "btn btn-xsmall btn-danger";
      deleteBtn.innerHTML = '<i class="bi bi-trash"></i>';
      deleteBtn.title = "Delete Rules";
      deleteBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.deleteRuleSet(ruleSet.id);
      });

      item.appendChild(info);
      item.appendChild(editBtn);
      item.appendChild(deleteBtn);
      this.ruleSetsList.appendChild(item);
    });
  }

  renderActiveRuleSetDropdown() {
    if (!this.activeRuleSetSelect) return;

    // Save current selection
    const currentValue = this.activeRuleSetSelect.value;

    // Clear and repopulate
    this.activeRuleSetSelect.innerHTML = '<option value="">No Rules</option>';

    this.customRules.forEach((ruleSet) => {
      const option = document.createElement("option");
      option.value = ruleSet.id;
      option.textContent = ruleSet.name;
      this.activeRuleSetSelect.appendChild(option);
    });

    // Restore selection
    if (this.activeRuleSetId) {
      this.activeRuleSetSelect.value = this.activeRuleSetId;
    } else {
      this.activeRuleSetSelect.value = "";
    }
  }

  // Session history methods
  renderSessionHistory() {
    if (!this.sessionsList) return;

    this.sessionsList.innerHTML = "";

    // Update statistics in session history view
    if (this.totalSessionsCount) {
      this.totalSessionsCount.textContent = this.sessionHistory.length;
    }

    if (this.avgSessionDuration && this.sessionHistory.length > 0) {
      const totalDuration = this.sessionHistory.reduce(
        (sum, s) => sum + s.duration,
        0
      );
      const avgDuration = totalDuration / this.sessionHistory.length;
      const hours = Math.floor(avgDuration / 3600);
      const minutes = Math.floor((avgDuration % 3600) / 60);
      const avgString = `${hours.toString().padStart(2, "0")}h${minutes
        .toString()
        .padStart(2, "0")}m`;
      this.avgSessionDuration.textContent = avgString;

      // Also update stats in main stats view
      if (this.statsTabAvgSession) {
        this.statsTabAvgSession.textContent = avgString;
      }
    } else if (this.avgSessionDuration) {
      this.avgSessionDuration.textContent = "00h00m";
      if (this.statsTabAvgSession) {
        this.statsTabAvgSession.textContent = "00h00m";
      }
    }

    // Update total sessions in stats tab main view
    if (this.statsTabTotalSessions) {
      this.statsTabTotalSessions.textContent = this.sessionHistory.length;
    }

    // Show/hide clear button
    if (this.clearSessionsBtn) {
      this.clearSessionsBtn.style.display =
        this.sessionHistory.length > 0 ? "inline-block" : "none";
    }

    if (this.sessionHistory.length === 0) {
      this.sessionsList.innerHTML = `
        <div class="empty-state">
          No sessions recorded yet.<br />
          Start a focus session to track your productivity!
        </div>
      `;
      return;
    }

    this.sessionHistory.forEach((session) => {
      const item = document.createElement("div");
      item.className = "session-item";

      const header = document.createElement("div");
      header.className = "session-header";

      const date = document.createElement("div");
      date.className = "session-date";
      const sessionDate = new Date(session.startTime);
      date.textContent =
        sessionDate.toLocaleDateString() +
        " " +
        sessionDate.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });

      const duration = document.createElement("div");
      duration.className = "session-duration";
      const hours = Math.floor(session.duration / 3600);
      const minutes = Math.floor((session.duration % 3600) / 60);
      duration.textContent = `${hours}h ${minutes}m`;

      header.appendChild(date);
      header.appendChild(duration);

      const details = document.createElement("div");
      details.className = "session-details";
      details.textContent = `${session.ruleSetName} • ${
        session.blocksCount
      } block${session.blocksCount !== 1 ? "s" : ""}`;

      item.appendChild(header);
      item.appendChild(details);
      this.sessionsList.appendChild(item);
    });
  }

  clearSessions() {
    if (this.sessionHistory.length === 0) {
      this.showNotification("No sessions to clear", "error");
      return;
    }

    const confirmClear = confirm(
      "Clear all session history?\n\nThis cannot be undone."
    );
    if (!confirmClear) return;

    this.sessionHistory = [];
    this.saveState();
    this.updateUI();
    this.showNotification("Session history cleared");
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

  // Navigation methods for stats tab
  showSessionHistoryView() {
    if (this.statsMainView && this.sessionHistoryView) {
      this.statsMainView.style.display = "none";
      this.sessionHistoryView.style.display = "block";
    }
  }

  showStatsMainView() {
    if (this.statsMainView && this.sessionHistoryView) {
      this.statsMainView.style.display = "block";
      this.sessionHistoryView.style.display = "none";
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
