class ProducerPopup {
  constructor() {
    this.isActive = false;
    this.customRules = []; // Array of rule sets
    this.activeRuleSetId = null; // ID of currently active rule set
    this.currentEditingRuleSetId = null; // ID of rule set being edited
    this.isCreatingNewRuleSet = false; // Flag to track if we're creating a new rule set
    this.tempRuleSet = null; // Temporary rule set for unsaved changes

    // New session management structure
    this.sessions = []; // Array of all sessions (both active and paused)
    this.currentSessionId = null; // ID of currently selected session

    // Legacy fields for backward compatibility
    this.sessionHistory = []; // Array of completed sessions (deprecated)
    this.sessionBlocks = 0;
    this.sessionTime = 0; // in seconds
    this.focusedTime = 0; // in seconds
    this.timerInterval = null;
    this.lastTimerUpdate = 0; // Track when we last received a timer update

    // Session time tracking for stats display
    this.sessionStatsInterval = null; // Timer for updating session stats display
    this.sessionCommitInterval = null; // Timer for periodic commits
    this.sessionFocusStartTime = null; // When focus mode started for current session segment
    this.sessionPauseStartTime = null; // When session was paused (focus mode stopped)

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
    this.breakTimeEl = document.getElementById("breakTime");
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
    this.rulesMainView = document.getElementById("rules-main-view");
    this.rulesEditView = document.getElementById("rules-edit-view");
    this.backToRuleSetListBtn = document.getElementById("backToRuleSetListBtn");
    this.ruleSetNameInput = document.getElementById("ruleSetNameInput");
    this.ruleSetNameSection = document.getElementById("ruleSetNameSection");
    this.saveRuleSetBtn = document.getElementById("saveRuleSetBtn");
    this.cancelRuleSetBtn = document.getElementById("cancelRuleSetBtn");
    this.ruleSetActionButtons = document.getElementById("ruleSetActionButtons");
    this.ruleSetEditTitle = document.getElementById("ruleSetEditTitle");
    this.clearAllRuleSetsBtn = document.getElementById("clearAllRuleSetsBtn");

    // Sessions elements
    this.sessionsList = document.getElementById("sessionsList");
    this.clearSessionsBtn = document.getElementById("clearSessionsBtn");

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

    // Current session stats elements
    this.currentSessionName = document.getElementById("currentSessionName");
    this.currentSessionStats = document.getElementById("currentSessionStats");
    this.noSessionMessage = document.getElementById("noSessionMessage");
    this.deactivateSessionBtn = document.getElementById("deactivateSessionBtn");
    this.currentSessionInfo = document.getElementById("currentSessionInfo");
    this.currentSessionRules = document.getElementById("currentSessionRules");
    this.currentSessionBlocksCount = document.getElementById(
      "currentSessionBlocksCount"
    );
    this.currentSessionFocusTime = document.getElementById(
      "currentSessionFocusTime"
    );
    this.currentSessionBreakTime = document.getElementById(
      "currentSessionBreakTime"
    );
    this.currentSessionTotalTime = document.getElementById(
      "currentSessionTotalTime"
    );

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

    // Sessions events
    if (this.clearSessionsBtn) {
      this.clearSessionsBtn.addEventListener("click", () =>
        this.clearSessions()
      );
    }

    // Clear all rule sets event
    if (this.clearAllRuleSetsBtn) {
      this.clearAllRuleSetsBtn.addEventListener("click", () =>
        this.clearAllRuleSets()
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

    // Deactivate session button
    if (this.deactivateSessionBtn) {
      this.deactivateSessionBtn.addEventListener("click", () => {
        if (this.currentSessionId) {
          this.deactivateSession(this.currentSessionId);
        }
      });
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
        "sessions", // New session structure
        "currentSessionId",
        "sessionHistory", // Legacy
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

      // Load session data
      this.sessions = data.sessions || [];
      this.currentSessionId = data.currentSessionId || null;

      // Load legacy session data for backward compatibility
      this.sessionHistory = data.sessionHistory || [];
      this.isActive = data.isActive || false;

      // Load current session data if available
      if (this.currentSessionId) {
        const currentSession = this.sessions.find(
          (s) => s.id === this.currentSessionId
        );
        if (currentSession) {
          // Use storage sessionBlocks as source of truth (updated by background script)
          this.sessionBlocks = data.sessionBlocks || 0;
          this.sessionTime = 0; // Always start at zero when extension opens
          // focusedTime will be synced from background timer
          this.activeRuleSetId = currentSession.ruleSetId || null;
        } else {
          // Session not found, reset
          this.sessionBlocks = 0;
          this.sessionTime = 0;
        }
      } else {
        this.sessionBlocks = data.sessionBlocks || 0;
        this.sessionTime = 0; // Always start at zero when extension opens
      }

      // Always load focusedTime from storage (background timer's cumulative total)
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

      // Initialize session tracking times if there's a current session
      if (this.currentSessionId) {
        const currentSession = this.sessions.find(
          (s) => s.id === this.currentSessionId
        );
        if (currentSession) {
          // Initialize session tracking times if they don't exist
          if (
            !currentSession.sessionFocusStartTime &&
            !currentSession.sessionPauseStartTime
          ) {
            if (this.isActive) {
              currentSession.sessionFocusStartTime = Date.now();
              currentSession.sessionPauseStartTime = null;
            } else {
              currentSession.sessionPauseStartTime = Date.now();
              currentSession.sessionFocusStartTime = null;
            }
          }
        }
      }

      // Start session stats tracking if there are any sessions (for real-time average updates)
      if (this.sessions.length > 0) {
        this.startSessionStatsTracking();
      } else {
        // No sessions - set displays to zero
        if (this.focusedTimeEl) {
          this.focusedTimeEl.textContent = "00h00m";
        }
        if (this.breakTimeEl) {
          this.breakTimeEl.textContent = "00h00m";
        }
        if (this.totalFocusedTimeEl) {
          this.totalFocusedTimeEl.textContent = "00h00m";
        }
        if (this.currentSessionFocusTime) {
          this.currentSessionFocusTime.textContent = "00h00m";
        }
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

  startSessionStatsTracking() {
    // Clear any existing interval
    if (this.sessionStatsInterval) {
      clearInterval(this.sessionStatsInterval);
      this.sessionStatsInterval = null;
    }

    // Always run if there are sessions (to update average focused time)
    if (this.sessions.length === 0) return;

    // Update every second
    this.sessionStatsInterval = setInterval(() => {
      this.updateCurrentSessionStats();
      this.updateActiveSessionInHistory();
    }, 1000);

    // Update immediately
    this.updateCurrentSessionStats();
    this.updateActiveSessionInHistory();

    // Start periodic commit interval only if there's an active session (every 30 seconds)
    if (this.currentSessionId) {
      this.startPeriodicCommit();
    }
  }

  stopSessionStatsTracking() {
    if (this.sessionStatsInterval) {
      clearInterval(this.sessionStatsInterval);
      this.sessionStatsInterval = null;
    }
    this.stopPeriodicCommit();
  }

  startPeriodicCommit() {
    // Clear any existing interval
    if (this.sessionCommitInterval) {
      clearInterval(this.sessionCommitInterval);
      this.sessionCommitInterval = null;
    }

    if (!this.currentSessionId) return;

    // Commit accumulated time every 30 seconds
    this.sessionCommitInterval = setInterval(() => {
      this.commitCurrentSessionTime();
      this.saveState();
    }, 30000);
  }

  stopPeriodicCommit() {
    if (this.sessionCommitInterval) {
      clearInterval(this.sessionCommitInterval);
      this.sessionCommitInterval = null;
    }
  }

  commitCurrentSessionTime() {
    if (!this.currentSessionId) return;

    const currentSession = this.sessions.find(
      (s) => s.id === this.currentSessionId
    );
    if (!currentSession) return;

    // Commit any accumulated focus or break time using session's stored times
    if (currentSession.sessionFocusStartTime) {
      const focusElapsed = Math.floor(
        (Date.now() - currentSession.sessionFocusStartTime) / 1000
      );
      currentSession.focusedTime =
        (currentSession.focusedTime || 0) + focusElapsed;
      // Reset the start time to now
      currentSession.sessionFocusStartTime = Date.now();
    } else if (currentSession.sessionPauseStartTime) {
      const breakElapsed = Math.floor(
        (Date.now() - currentSession.sessionPauseStartTime) / 1000
      );
      currentSession.breakTime = (currentSession.breakTime || 0) + breakElapsed;
      // Reset the start time to now
      currentSession.sessionPauseStartTime = Date.now();
    }
  }

  updateActiveSessionInHistory() {
    if (!this.currentSessionId) return;

    const currentSession = this.sessions.find(
      (s) => s.id === this.currentSessionId
    );
    if (!currentSession) return;

    // Find the session details element in the session history
    const detailsElement = document.querySelector(
      `.session-details[data-session-id="${this.currentSessionId}"]`
    );
    if (!detailsElement) return;

    // Calculate total time with current elapsed time
    let totalTime =
      (currentSession.focusedTime || 0) + (currentSession.breakTime || 0);
    const now = Date.now();

    if (this.isActive && currentSession.sessionFocusStartTime) {
      const currentFocusElapsed = Math.floor(
        (now - currentSession.sessionFocusStartTime) / 1000
      );
      totalTime += currentFocusElapsed;
    } else if (!this.isActive && currentSession.sessionPauseStartTime) {
      const currentBreakElapsed = Math.floor(
        (now - currentSession.sessionPauseStartTime) / 1000
      );
      totalTime += currentBreakElapsed;
    }

    const hours = Math.floor(totalTime / 3600);
    const minutes = Math.floor((totalTime % 3600) / 60);

    const ruleSet = this.customRules.find(
      (rs) => rs.id === currentSession.ruleSetId
    );
    const ruleSetName = ruleSet ? ruleSet.name : "No Rules";

    detailsElement.textContent = `${ruleSetName} • ${
      currentSession.blocksCount || 0
    } block${
      (currentSession.blocksCount || 0) !== 1 ? "s" : ""
    } • ${hours}h${minutes}m`;
  }

  updateCurrentSessionStats() {
    try {
      // Always update average focused time regardless of current session
      this.updateAverageFocusedTime();

      if (!this.currentSessionId) {
        // No session active - show message and hide stats
        if (this.currentSessionStats) {
          this.currentSessionStats.style.display = "none";
        }
        if (this.noSessionMessage) {
          this.noSessionMessage.style.display = "block";
        }
        if (this.deactivateSessionBtn) {
          this.deactivateSessionBtn.style.display = "none";
        }
        if (this.currentSessionInfo) {
          this.currentSessionInfo.style.display = "none";
        }
        // Also update Home tab stats
        if (this.focusedTimeEl) {
          this.focusedTimeEl.textContent = "00h00m";
        }
        if (this.breakTimeEl) {
          this.breakTimeEl.textContent = "00h00m";
        }
        return;
      }

      // Session is active - show stats and hide message
      if (this.currentSessionStats) {
        this.currentSessionStats.style.display = "grid";
      }
      if (this.noSessionMessage) {
        this.noSessionMessage.style.display = "none";
      }
      // Show deactivate button
      if (this.deactivateSessionBtn) {
        this.deactivateSessionBtn.style.display = "block";
      }

      const currentSession = this.sessions.find(
        (s) => s.id === this.currentSessionId
      );
      if (!currentSession) {
        return;
      }

      // Update session info display (now includes session name in the info line)
      if (
        this.currentSessionInfo &&
        this.currentSessionName &&
        this.currentSessionRules &&
        this.currentSessionBlocksCount
      ) {
        this.currentSessionInfo.style.display = "block";

        // Update session name
        this.currentSessionName.textContent = currentSession.name;

        // Update rule set name
        const ruleSet = this.customRules.find(
          (rs) => rs.id === currentSession.ruleSetId
        );
        this.currentSessionRules.textContent = ruleSet ? ruleSet.name : "None";

        // Update blocks count
        this.currentSessionBlocksCount.textContent =
          currentSession.blocksCount || 0;
      }

      // Initialize session time tracking fields if they don't exist
      if (!currentSession.focusedTime) currentSession.focusedTime = 0;
      if (!currentSession.breakTime) currentSession.breakTime = 0;
      if (!currentSession.sessionStartTime) {
        currentSession.sessionStartTime = Date.now();
      }

      const now = Date.now();

      // Calculate current segment elapsed time using session's stored times
      let currentFocusElapsed = 0;
      let currentBreakElapsed = 0;

      if (this.isActive && currentSession.sessionFocusStartTime) {
        // Currently in focus mode - calculate elapsed focus time
        currentFocusElapsed = Math.floor(
          (now - currentSession.sessionFocusStartTime) / 1000
        );
      } else if (!this.isActive && currentSession.sessionPauseStartTime) {
        // Currently paused - calculate elapsed break time
        currentBreakElapsed = Math.floor(
          (now - currentSession.sessionPauseStartTime) / 1000
        );
      }

      // Calculate total times
      const totalFocusedTime = currentSession.focusedTime + currentFocusElapsed;
      const totalBreakTime = currentSession.breakTime + currentBreakElapsed;
      const totalSessionTime = totalFocusedTime + totalBreakTime;

      // Format time helper
      const formatTime = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${hours.toString().padStart(2, "0")}h${minutes
          .toString()
          .padStart(2, "0")}m`;
      };

      // Update UI
      if (this.currentSessionFocusTime) {
        this.currentSessionFocusTime.textContent = formatTime(totalFocusedTime);
      }
      if (this.currentSessionBreakTime) {
        this.currentSessionBreakTime.textContent = formatTime(totalBreakTime);
      }
      if (this.currentSessionTotalTime) {
        this.currentSessionTotalTime.textContent = formatTime(totalSessionTime);
      }

      // Also update the Home tab stats to match Stats tab
      if (this.focusedTimeEl) {
        this.focusedTimeEl.textContent = formatTime(totalFocusedTime);
      }
      if (this.breakTimeEl) {
        this.breakTimeEl.textContent = formatTime(totalBreakTime);
      }
    } catch (error) {
      console.error("Error updating current session stats:", error);
    }
  }

  updateAverageFocusedTime() {
    try {
      const totalSessions = this.sessions.length;
      if (totalSessions === 0) {
        if (this.totalFocusedTimeEl) {
          this.totalFocusedTimeEl.textContent = "00h00m";
        }
        return;
      }

      // Calculate total focused time across all sessions
      let totalFocusedTime = this.sessions.reduce((sum, s) => {
        let sessionFocusedTime = s.focusedTime || 0;

        // Add current elapsed focused time if this is the active session
        if (
          s.id === this.currentSessionId &&
          this.isActive &&
          s.sessionFocusStartTime
        ) {
          const currentFocusElapsed = Math.floor(
            (Date.now() - s.sessionFocusStartTime) / 1000
          );
          sessionFocusedTime += currentFocusElapsed;
        }

        return sum + sessionFocusedTime;
      }, 0);

      const avgTime = totalFocusedTime / totalSessions;
      const hours = Math.floor(avgTime / 3600);
      const minutes = Math.floor((avgTime % 3600) / 60);
      const avgString = `${hours.toString().padStart(2, "0")}h${minutes
        .toString()
        .padStart(2, "0")}m`;

      if (this.totalFocusedTimeEl) {
        this.totalFocusedTimeEl.textContent = avgString;
      }
    } catch (error) {
      console.error("Error updating average focused time:", error);
    }
  }

  async saveState(action, oldData) {
    try {
      // Commit accumulated time before saving
      this.commitCurrentSessionTime();

      const before =
        oldData ||
        (await chrome.storage.local.get([
          "customRules",
          "activeRuleSetId",
          "isActive",
        ]));

      // Update current session data if a session is selected
      if (this.currentSessionId) {
        const currentSession = this.sessions.find(
          (s) => s.id === this.currentSessionId
        );
        if (currentSession) {
          currentSession.blocksCount = this.sessionBlocks;
          currentSession.ruleSetId = this.activeRuleSetId;
          currentSession.lastActive = Date.now();
        }
      }

      await chrome.storage.local.set({
        isActive: this.isActive,
        customRules: this.customRules,
        activeRuleSetId: this.activeRuleSetId,
        sessions: this.sessions,
        currentSessionId: this.currentSessionId,
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
      // Starting focus mode - ensure there's an active session
      // Only create a new session if there's no active session selected
      if (!this.currentSessionId) {
        // Create a new session automatically
        this.sessionStartTime = Date.now();

        // Reset session blocks counter for the new session
        this.sessionBlocks = 0;

        const sessionId = "session-" + Date.now();
        const sessionDate = new Date(this.sessionStartTime);
        const defaultName = `Session ${sessionDate.toLocaleDateString()} ${sessionDate.toLocaleTimeString(
          [],
          { hour: "2-digit", minute: "2-digit" }
        )}`;

        const newSession = {
          id: sessionId,
          name: defaultName,
          ruleSetId: this.activeRuleSetId,
          startTime: this.sessionStartTime,
          blocksCount: 0,
          created: this.sessionStartTime,
          lastActive: this.sessionStartTime,
          isActive: true,
          focusedTime: 0,
          breakTime: 0,
          sessionStartTime: Date.now(),
          sessionFocusStartTime: Date.now(), // Store in session
          sessionPauseStartTime: null,
        };

        this.sessions.push(newSession);
        this.currentSessionId = sessionId;
        this.sessionTime = 0;

        // Update storage to reset the block counter for the new session
        await chrome.storage.local.set({ sessionBlocks: 0 });

        // Start session stats tracking
        this.startSessionStatsTracking();
      } else {
        // Continue with existing session
        this.sessionStartTime = Date.now();
        const currentSession = this.sessions.find(
          (s) => s.id === this.currentSessionId
        );
        if (currentSession) {
          currentSession.isActive = true;
          currentSession.lastActive = Date.now();
          // Session time continues from where it left off
          this.sessionTime = 0; // Reset session timer display

          // Commit any accumulated break time (before switching to focus tracking)
          this.commitCurrentSessionTime();

          // Start tracking focus time in the session
          currentSession.sessionFocusStartTime = Date.now();
          currentSession.sessionPauseStartTime = null;
        }
      }

      // Start timer updates
      this.startTimerUpdates();

      // Tell background script to start timer with current session's focused time
      const currentSession = this.currentSessionId
        ? this.sessions.find((s) => s.id === this.currentSessionId)
        : null;
      const sessionFocusedTime = currentSession
        ? currentSession.focusedTime || 0
        : 0;

      chrome.runtime.sendMessage({
        action: "startTimer",
        focusedTime: sessionFocusedTime,
      });

      // Count currently open blocked tabs and add to counter
      chrome.runtime.sendMessage(
        {
          action: "countCurrentlyBlockedTabs",
        },
        (response) => {
          if (response && response.blockedCount > 0) {
            // Counter is already updated by background script
            // Just show notification to user
            this.showNotification(
              `${response.blockedCount} blocked tab${
                response.blockedCount !== 1 ? "s" : ""
              } detected and counted`,
              "success"
            );
          }
        }
      );
    } else {
      // Stopping focus session (pausing)
      this.stopTimerUpdates();

      // Get final focused time from background script before stopping
      const response = await chrome.runtime.sendMessage({
        action: "getTimerState",
      });

      // Update current session with final data
      if (this.currentSessionId) {
        const currentSession = this.sessions.find(
          (s) => s.id === this.currentSessionId
        );
        if (currentSession) {
          currentSession.isActive = false;
          currentSession.blocksCount = this.sessionBlocks;
          currentSession.endTime = Date.now();
          currentSession.lastActive = Date.now();

          // Commit any accumulated focus time (before switching to break tracking)
          this.commitCurrentSessionTime();

          // Start tracking break time in the session
          currentSession.sessionPauseStartTime = Date.now();
          currentSession.sessionFocusStartTime = null;
        }
      }

      // Tell background script to stop timer
      chrome.runtime.sendMessage({
        action: "stopTimer",
      });

      this.sessionStartTime = null;
      // Don't clear currentSessionId - keep the session active for next time
    }

    this.saveState("toggleProducing");
    this.updateUI();

    // Show feedback
    this.showNotification(
      this.isActive ? "Focus mode activated!" : "Focus mode deactivated"
    );
  }

  updateUI() {
    // Ensure focus mode is off when there's no active session
    if (!this.currentSessionId && this.isActive) {
      this.isActive = false;
    }

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
    // Note: focusedTimeEl is updated in updateCurrentSessionStats() for real-time updates

    // Update stats tab session blocks element
    if (this.sessionBlocksEl) {
      this.sessionBlocksEl.textContent = this.sessionBlocks || 0;
    }

    // Update current session's blocksCount from sessionBlocks (source of truth)
    if (this.currentSessionId) {
      const currentSession = this.sessions.find(
        (s) => s.id === this.currentSessionId
      );
      if (currentSession) {
        currentSession.blocksCount = this.sessionBlocks;
      }
    }

    // Update Current Session section blocks count
    if (this.currentSessionBlocksCount) {
      this.currentSessionBlocksCount.textContent = this.sessionBlocks || 0;
    }

    // Update stats in stats tab - Total Blocks across all sessions
    if (this.totalBlockedCountEl) {
      const totalBlocks = this.sessions.reduce(
        (sum, s) => sum + (s.blocksCount || 0),
        0
      );
      this.totalBlockedCountEl.textContent = totalBlocks;
    }
    // Note: totalFocusedTimeEl (Avg Focus Time) is updated in updateAverageFocusedTime()

    // Update rule sets list
    this.renderRuleSetsList();

    // Update rules list (if in edit view)
    if (this.currentEditingRuleSetId) {
      this.renderRulesList();
    }

    // Update session history (will now have updated blocksCount)
    this.renderSessionHistory();

    // Update timer display
    this.updateTimerDisplay();

    // Update current session stats display
    this.updateCurrentSessionStats();

    // Update session status text
    this.sessionStatusText.textContent = this.isActive
      ? "Focus Active"
      : "Focus Inactive";
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

      this.sessionTimerEl.textContent = sessionTimeString;
      // Note: focusedTimeEl is updated in updateCurrentSessionStats() for consistency with Stats tab
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
      removeBtn.className = "btn btn-xsmall btn-squared btn-danger";
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

  async clearInfo(sessionId) {
    if (!sessionId) {
      this.showNotification("No session specified", "error");
      return;
    }

    const session = this.sessions.find((s) => s.id === sessionId);
    if (!session) {
      this.showNotification("Session not found", "error");
      return;
    }

    if (
      (session.focusedTime || 0) === 0 &&
      (session.breakTime || 0) === 0 &&
      (session.blocksCount || 0) === 0
    ) {
      this.showNotification("No stats to clear for this session", "error");
      return;
    }

    const confirmClear = confirm(
      `Clear stats for "${session.name}"?\n\nThis will reset the time and blocks count to zero.`
    );
    if (!confirmClear) return;

    // Clear the session's stats
    session.focusedTime = 0;
    session.breakTime = 0;
    session.blocksCount = 0;

    // If this is the currently active session, also clear the UI state
    if (this.currentSessionId === sessionId) {
      this.sessionTime = 0;
      this.sessionBlocks = 0;

      // Reset tracking times in the session
      if (this.isActive) {
        session.sessionFocusStartTime = Date.now();
        session.sessionPauseStartTime = null;
      } else {
        session.sessionPauseStartTime = Date.now();
        session.sessionFocusStartTime = null;
      }

      // Tell background script to clear focused time and reset session blocks
      chrome.runtime.sendMessage({
        action: "setFocusedTime",
        focusedTime: 0,
      });

      // Also send message to reset session blocks in background
      chrome.runtime.sendMessage({
        action: "resetSessionBlocks",
      });
    }

    this.saveState("clearInfo");
    this.updateUI();
    this.showNotification("Session stats cleared");
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

    // Auto-activate if no active rule set exists
    if (!this.activeRuleSetId) {
      this.activeRuleSetId = this.tempRuleSet.id;

      // Update current session's rule set if there's an active session
      if (this.currentSessionId) {
        const currentSession = this.sessions.find(
          (s) => s.id === this.currentSessionId
        );
        if (currentSession) {
          currentSession.ruleSetId = this.activeRuleSetId;
        }
      }

      // Reload affected tabs with the new active rules
      chrome.runtime.sendMessage({ action: "reloadAffectedTabs" });
    }

    // Clear temporary state
    this.tempRuleSet = null;
    this.isCreatingNewRuleSet = false;
    this.currentEditingRuleSetId = null;

    // Save and update UI
    this.saveState();
    this.updateUI();

    // Show success message and return to main view
    const activationMessage =
      this.activeRuleSetId === this.customRules[this.customRules.length - 1].id
        ? " and activated"
        : "";
    this.showNotification(
      `Custom rules successfully saved${activationMessage}!`
    );
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

  activateRuleSet(ruleSetId) {
    if (!ruleSetId) return;

    const ruleSet = this.customRules.find((rs) => rs.id === ruleSetId);
    if (!ruleSet) return;

    this.activeRuleSetId = ruleSetId;

    // Update current session's rule set if there's an active session
    if (this.currentSessionId) {
      const currentSession = this.sessions.find(
        (s) => s.id === this.currentSessionId
      );
      if (currentSession) {
        currentSession.ruleSetId = this.activeRuleSetId;
      }
    }

    this.saveState();
    this.updateUI();
    this.showNotification(`Custom Rules "${ruleSet.name}" activated!`);

    // Reload affected tabs with the new rules
    chrome.runtime.sendMessage({ action: "reloadAffectedTabs" });
  }

  deactivateRuleSet() {
    this.activeRuleSetId = null;

    // Update current session's rule set if there's an active session
    if (this.currentSessionId) {
      const currentSession = this.sessions.find(
        (s) => s.id === this.currentSessionId
      );
      if (currentSession) {
        currentSession.ruleSetId = null;
      }
    }

    this.saveState();
    this.updateUI();
    this.showNotification("Custom Rules deactivated!");

    // Reload affected tabs to remove blocking
    chrome.runtime.sendMessage({ action: "reloadAffectedTabs" });
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

    // Show/hide clear all button
    if (this.clearAllRuleSetsBtn) {
      this.clearAllRuleSetsBtn.style.display =
        this.customRules.length > 0 ? "inline-block" : "none";
    }

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
      name.style.cursor = "pointer";
      name.title = "Double-click to edit name";

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

      const buttonDiv = document.createElement("div");
      buttonDiv.style.display = "flex";
      buttonDiv.style.gap = "4px";
      buttonDiv.style.marginLeft = "4px";

      // Check if this rule set is active
      const isActive = this.activeRuleSetId === ruleSet.id;

      // Activate/Deactivate button
      const toggleBtn = document.createElement("button");
      toggleBtn.className = isActive
        ? "btn btn-xsmall btn-squared active"
        : "btn btn-xsmall btn-squared inactive";
      toggleBtn.innerHTML = isActive
        ? '<i class="bi bi-check-circle-fill"></i>'
        : '<i class="bi bi-play-circle"></i>';
      toggleBtn.title = isActive
        ? "Deactivate Custom Rules"
        : "Activate Custom Rules";

      toggleBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (isActive) {
          this.deactivateRuleSet();
        } else {
          this.activateRuleSet(ruleSet.id);
        }
      });

      const editBtn = document.createElement("button");
      editBtn.className = "btn btn-xsmall btn-squared btn-secondary";
      editBtn.innerHTML = '<i class="bi bi-pencil"></i>';
      editBtn.title = "Edit Rules";
      editBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.editRuleSet(ruleSet.id);
      });

      const deleteBtn = document.createElement("button");
      deleteBtn.className = "btn btn-small btn-squared btn-danger";
      deleteBtn.textContent = "✕";
      deleteBtn.title = "Delete Rule Set";
      deleteBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.deleteRuleSet(ruleSet.id);
      });

      item.appendChild(info);
      buttonDiv.appendChild(toggleBtn);
      buttonDiv.appendChild(editBtn);
      buttonDiv.appendChild(deleteBtn);
      item.appendChild(buttonDiv);
      this.ruleSetsList.appendChild(item);
    });
  }

  // Session history methods
  renderSessionHistory() {
    if (!this.sessionsList) return;

    this.sessionsList.innerHTML = "";

    // Update statistics in main stats view
    const totalSessions = this.sessions.length;
    if (this.statsTabTotalSessions) {
      this.statsTabTotalSessions.textContent = totalSessions;
    }

    if (totalSessions > 0) {
      const totalFocusedTime = this.sessions.reduce(
        (sum, s) => sum + (s.focusedTime || 0),
        0
      );
      const avgTime = totalFocusedTime / totalSessions;
      const hours = Math.floor(avgTime / 3600);
      const minutes = Math.floor((avgTime % 3600) / 60);
      const avgString = `${hours.toString().padStart(2, "0")}h${minutes
        .toString()
        .padStart(2, "0")}m`;

      if (this.statsTabAvgSession) {
        this.statsTabAvgSession.textContent = avgString;
      }
    } else if (this.statsTabAvgSession) {
      this.statsTabAvgSession.textContent = "00h00m";
    }

    // Update average focused time in Overall Stats (real-time updates handled separately)
    this.updateAverageFocusedTime();

    // Show/hide clear button
    if (this.clearSessionsBtn) {
      this.clearSessionsBtn.style.display =
        totalSessions > 0 ? "inline-block" : "none";
    }

    if (totalSessions === 0) {
      this.sessionsList.innerHTML = `
        <div class="empty-state">
          No sessions created yet.<br />
          Start the focus mode to create a new session!
        </div>
      `;
      return;
    }

    // Sort sessions by last active (most recent first)
    const sortedSessions = [...this.sessions].sort(
      (a, b) => b.lastActive - a.lastActive
    );

    sortedSessions.forEach((session) => {
      const item = document.createElement("div");
      item.className = "session-item";
      item.style.display = "flex";
      item.style.justifyContent = "space-between";
      item.style.alignItems = "center";
      item.style.textAlign = "left";

      // Highlight if this is the current active session
      const isActive = session.id === this.currentSessionId;
      if (isActive) {
        item.style.border = "2px solid rgba(46, 204, 113, 0.6)";
        item.style.background = "rgba(46, 204, 113, 0.1)";
      }

      const info = document.createElement("div");
      info.style.flex = "1";

      const name = document.createElement("div");
      name.className = "session-date";
      name.textContent = session.name;
      name.style.cursor = "pointer";
      name.title = "Double-click to edit name";
      name.style.marginBottom = "4px";

      // Double-click to edit name inline
      name.addEventListener("dblclick", (e) => {
        e.stopPropagation();
        const input = document.createElement("input");
        input.type = "text";
        input.value = session.name;
        input.style.width = "100%";
        input.style.fontSize = "inherit";
        input.style.fontWeight = "inherit";
        input.style.padding = "4px";
        input.style.border = "1px solid #ccc";
        input.style.borderRadius = "4px";

        const saveEdit = () => {
          const newName = input.value.trim();
          if (newName && newName !== session.name) {
            session.name = newName;
            this.saveState();
            this.updateUI();
            this.showNotification("Session name updated!");
          } else if (!newName) {
            this.showNotification("Name cannot be empty", "error");
          }
          name.textContent = session.name;
          name.style.display = "";
          input.remove();
        };

        const cancelEdit = () => {
          name.textContent = session.name;
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
      details.className = "session-details";
      details.setAttribute("data-session-id", session.id); // For real-time updates
      const ruleSet = this.customRules.find(
        (rs) => rs.id === session.ruleSetId
      );
      const ruleSetName = ruleSet ? ruleSet.name : "No Rules";

      // Calculate total time (focused + break)
      let totalTime = (session.focusedTime || 0) + (session.breakTime || 0);

      // Add current elapsed time if this is the active session
      if (session.id === this.currentSessionId) {
        const now = Date.now();
        if (this.isActive && session.sessionFocusStartTime) {
          const currentFocusElapsed = Math.floor(
            (now - session.sessionFocusStartTime) / 1000
          );
          totalTime += currentFocusElapsed;
        } else if (!this.isActive && session.sessionPauseStartTime) {
          const currentBreakElapsed = Math.floor(
            (now - session.sessionPauseStartTime) / 1000
          );
          totalTime += currentBreakElapsed;
        }
      }

      const hours = Math.floor(totalTime / 3600);
      const minutes = Math.floor((totalTime % 3600) / 60);
      details.textContent = `${ruleSetName} • ${
        session.blocksCount || 0
      } block${
        (session.blocksCount || 0) !== 1 ? "s" : ""
      } • ${hours}h${minutes}m`;

      info.appendChild(name);
      info.appendChild(details);

      // Action buttons
      const buttonDiv = document.createElement("div");
      buttonDiv.style.display = "flex";
      buttonDiv.style.gap = "4px";
      buttonDiv.style.marginLeft = "4px";

      // Activate/Deactivate button
      const toggleBtn = document.createElement("button");
      toggleBtn.className = isActive
        ? "btn btn-xsmall btn-squared active"
        : "btn btn-xsmall btn-squared inactive";
      toggleBtn.innerHTML = isActive
        ? '<i class="bi bi-check-circle-fill"></i>'
        : '<i class="bi bi-play-circle"></i>';
      toggleBtn.title = isActive ? "Deactivate Session" : "Activate Session";

      toggleBtn.addEventListener("click", () => {
        if (isActive) {
          this.deactivateSession(session.id);
        } else {
          this.activateSession(session.id);
        }
      });

      buttonDiv.appendChild(toggleBtn);

      // Clear Stats button - only show if session has stats to clear
      if (
        (session.focusedTime || 0) > 0 ||
        (session.breakTime || 0) > 0 ||
        (session.blocksCount || 0) > 0
      ) {
        const clearStatsBtn = document.createElement("button");
        clearStatsBtn.className = "btn btn-xsmall btn-squared";
        clearStatsBtn.innerHTML = '<i class="bi bi-stars"></i>';
        clearStatsBtn.title = "Clear Stats";
        clearStatsBtn.addEventListener("click", () => {
          this.clearInfo(session.id);
        });

        // Add hover effect
        clearStatsBtn.addEventListener("mouseenter", () => {
          clearStatsBtn.style.boxShadow = "0 2px 8px rgba(241, 196, 15, 0.3)";
        });
        clearStatsBtn.addEventListener("mouseleave", () => {
          clearStatsBtn.style.boxShadow = "none";
        });

        buttonDiv.appendChild(clearStatsBtn);
      }

      const deleteBtn = document.createElement("button");
      deleteBtn.className = "btn btn-small btn-squared btn-danger";
      deleteBtn.textContent = "✕";
      deleteBtn.title = "Delete Session";
      deleteBtn.addEventListener("click", () => {
        this.deleteSession(session.id);
      });

      buttonDiv.appendChild(deleteBtn);

      item.appendChild(info);
      item.appendChild(buttonDiv);
      this.sessionsList.appendChild(item);
    });
  }

  clearSessions() {
    if (this.sessions.length === 0) {
      this.showNotification("No sessions to clear", "error");
      return;
    }

    const confirmClear = confirm(
      "Clear all sessions?\n\nThis will permanently delete all sessions and their data. This cannot be undone."
    );
    if (!confirmClear) return;

    // Stop session stats tracking
    this.stopSessionStatsTracking();

    this.sessions = [];
    this.currentSessionId = null;
    this.sessionBlocks = 0;
    this.sessionTime = 0;

    this.saveState();
    this.updateUI();
    this.showNotification("All sessions cleared");
  }

  clearAllRuleSets() {
    if (this.customRules.length === 0) {
      this.showNotification("No custom rules to clear", "error");
      return;
    }

    const confirmClear = confirm(
      `Clear all custom rules?\n\nThis will permanently delete all ${
        this.customRules.length
      } rule set${
        this.customRules.length !== 1 ? "s" : ""
      }. This cannot be undone.`
    );
    if (!confirmClear) return;

    this.customRules = [];
    this.activeRuleSetId = null;
    this.saveState();
    this.updateUI();
    this.showNotification("All custom rules cleared");
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

  // Session management methods
  async activateSession(sessionId) {
    if (this.isActive) await this.toggleProducing();

    const session = this.sessions.find((s) => s.id === sessionId);
    if (!session) return;

    // If already the current session, just notify
    if (this.currentSessionId === sessionId) {
      this.showNotification(`"${session.name}" is already active`, "error");
      return;
    }

    // Save current session state before switching (if there is one)
    if (this.currentSessionId) {
      const currentSession = this.sessions.find(
        (s) => s.id === this.currentSessionId
      );
      if (currentSession) {
        // Commit any accumulated focus or break time
        this.commitCurrentSessionTime();

        currentSession.blocksCount = this.sessionBlocks;
        currentSession.lastActive = Date.now();
      }
    }

    // Restore the selected session data
    this.currentSessionId = sessionId;
    this.sessionBlocks = session.blocksCount || 0;
    this.sessionTime = 0; // Reset current timer (not cumulative)
    this.activeRuleSetId = session.ruleSetId || null;
    session.lastActive = Date.now();

    // Initialize session tracking times
    if (!session.focusedTime) session.focusedTime = 0;
    if (!session.breakTime) session.breakTime = 0;
    if (!session.sessionStartTime) session.sessionStartTime = Date.now();

    // Set tracking times in the session based on current state
    if (this.isActive) {
      session.sessionFocusStartTime = Date.now();
      session.sessionPauseStartTime = null;
    } else {
      session.sessionPauseStartTime = Date.now();
      session.sessionFocusStartTime = null;
    }

    // Update storage with the new session's block count to sync with background script
    await chrome.storage.local.set({ sessionBlocks: this.sessionBlocks });

    // Start session stats tracking
    this.startSessionStatsTracking();

    await this.saveState();
    this.updateUI();

    // Show notification
    this.showNotification(`Session "${session.name}" activated!`);
  }

  async deactivateSession(sessionId) {
    const session = this.sessions.find((s) => s.id === sessionId);
    if (!session) return;

    // If this is the current session, deactivate it
    if (this.currentSessionId === sessionId) {
      // Turn off focus mode if it's active
      if (this.isActive) {
        await this.toggleProducing();
      }

      // Commit any accumulated break or focus time
      this.commitCurrentSessionTime();

      // Save current session state
      session.blocksCount = this.sessionBlocks;
      session.lastActive = Date.now();

      // Clear session's tracking times
      session.sessionFocusStartTime = null;
      session.sessionPauseStartTime = null;

      // Stop session stats tracking
      this.stopSessionStatsTracking();

      // Clear current session
      this.currentSessionId = null;
      this.sessionBlocks = 0;
      this.sessionTime = 0;

      // Ensure focus mode is off and stopped
      this.isActive = false;
      this.stopTimerUpdates();

      await this.saveState();
      this.updateUI();

      this.showNotification(`Session "${session.name}" deactivated!`);
    }
  }

  async deleteSession(sessionId) {
    const session = this.sessions.find((s) => s.id === sessionId);
    if (!session) return;

    const totalTime = (session.focusedTime || 0) + (session.breakTime || 0);
    const confirmDelete = confirm(
      `Delete session "${
        session.name
      }"?\n\nThis will permanently delete all session data including ${Math.floor(
        totalTime / 3600
      )}h ${Math.floor((totalTime % 3600) / 60)}m of total time and ${
        session.blocksCount || 0
      } blocks.`
    );
    if (!confirmDelete) return;

    // If deleting the current session, clear it
    if (this.currentSessionId === sessionId) {
      // Turn off focus mode if active
      if (this.isActive) await this.toggleProducing();

      // Commit any accumulated break or focus time
      this.commitCurrentSessionTime();

      // Stop session stats tracking
      this.stopSessionStatsTracking();

      this.currentSessionId = null;
      this.sessionBlocks = 0;
      this.sessionTime = 0;

      // Ensure focus mode is off and stopped
      this.isActive = false;
      this.stopTimerUpdates();
    }

    this.sessions = this.sessions.filter((s) => s.id !== sessionId);
    await this.saveState();
    this.updateUI();
    this.showNotification("Session deleted");
  }

  editSessionRuleSet(sessionId) {
    const session = this.sessions.find((s) => s.id === sessionId);
    if (!session) return;

    // Create a simple UI to select rule set
    const currentRuleSet = this.customRules.find(
      (rs) => rs.id === session.ruleSetId
    );
    const currentRuleSetName = currentRuleSet
      ? currentRuleSet.name
      : "No Rules";

    // Cycle through rule sets: No Rules -> Rule Set 1 -> Rule Set 2 -> ... -> No Rules
    const currentIndex = currentRuleSet
      ? this.customRules.findIndex((rs) => rs.id === session.ruleSetId)
      : -1;
    const nextIndex = (currentIndex + 1) % (this.customRules.length + 1);

    if (nextIndex === this.customRules.length) {
      // Set to "No Rules"
      session.ruleSetId = null;
    } else {
      // Set to next rule set
      session.ruleSetId = this.customRules[nextIndex].id;
    }

    // If editing current session, update activeRuleSetId
    if (this.currentSessionId === sessionId) {
      this.activeRuleSetId = session.ruleSetId;
    }

    const newRuleSet = this.customRules.find(
      (rs) => rs.id === session.ruleSetId
    );
    const newRuleSetName = newRuleSet ? newRuleSet.name : "No Rules";

    this.saveState();
    this.updateUI();
    this.showNotification(`Rule set changed to: ${newRuleSetName}`);
  }
}

// Initialize popup
const popup = new ProducerPopup();

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "updateBlockCount") {
    popup.sessionBlocks = message.count;

    // Update home tab blocks count
    if (popup.blockedCount) {
      popup.blockedCount.textContent = popup.sessionBlocks;
    }

    // Update stats tab session blocks element
    if (popup.sessionBlocksEl) {
      popup.sessionBlocksEl.textContent = popup.sessionBlocks;
    }

    // Update current session's blocks count if there's an active session
    if (popup.currentSessionId) {
      const currentSession = popup.sessions.find(
        (s) => s.id === popup.currentSessionId
      );
      if (currentSession) {
        // Update session data
        currentSession.blocksCount = popup.sessionBlocks;

        // Update Current Session section blocks count
        if (popup.currentSessionBlocksCount) {
          popup.currentSessionBlocksCount.textContent = popup.sessionBlocks;
        }

        // Update session history item for this session
        popup.updateActiveSessionInHistory();

        // Save session data to storage
        chrome.storage.local.set({
          sessions: popup.sessions,
          sessionBlocks: popup.sessionBlocks,
        });
      }
    } else {
      // No active session, just save the blocks count
      chrome.storage.local.set({ sessionBlocks: popup.sessionBlocks });
    }
  }

  if (message.action === "timerUpdate") {
    popup.sessionTime = message.sessionTime;
    popup.focusedTime = message.focusedTime;
    popup.lastTimerUpdate = Date.now(); // Track when we received the update
    popup.updateTimerDisplay();
  }
});

// Listen for storage changes as a backup mechanism (catches missed runtime messages)
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "local") return;

  // sessionBlocks change: update home/stats/current-session/history
  if (changes.sessionBlocks) {
    const newCount = changes.sessionBlocks.newValue || 0;
    popup.sessionBlocks = newCount;

    // Update home tab blocked count
    if (popup.blockedCount) {
      popup.blockedCount.textContent = popup.sessionBlocks;
    }

    // Update stats tab session blocks element
    if (popup.sessionBlocksEl) {
      popup.sessionBlocksEl.textContent = popup.sessionBlocks;
    }

    // Update current session object & UI if active
    if (popup.currentSessionId) {
      const currentSession = popup.sessions.find(
        (s) => s.id === popup.currentSessionId
      );
      if (currentSession) {
        currentSession.blocksCount = popup.sessionBlocks;

        // Update Current Session section blocks count
        if (popup.currentSessionBlocksCount) {
          popup.currentSessionBlocksCount.textContent = popup.sessionBlocks;
        }

        // Update session history item for this session
        if (typeof popup.updateActiveSessionInHistory === "function") {
          popup.updateActiveSessionInHistory();
        }

        // Persist only the sessions array (don't write sessionBlocks back to avoid circular updates)
        chrome.storage.local.set({ sessions: popup.sessions }).catch(() => {});
      }
    }
  }

  // sessions array changed: sync and re-render history & stats
  if (changes.sessions) {
    popup.sessions = changes.sessions.newValue || [];
    // Re-render session history & update stats UI
    if (typeof popup.renderSessionHistory === "function")
      popup.renderSessionHistory();
    if (typeof popup.updateCurrentSessionStats === "function")
      popup.updateCurrentSessionStats();
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
