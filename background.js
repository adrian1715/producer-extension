class ProducerBackground {
  constructor() {
    this.rules = [];
    this.isActive = false;
    this.sessionBlocks = 0;
    this.sessionStartTime = null;
    this.focusedTime = 0; // persisted cumulative total
    this.focusedTimeBase = 0; // snapshot of cumulative total at session start
    this.timerInterval = null;
    this.heartbeatInterval = null; // Heartbeat for detecting browser closure
    this.temporaryAllowedUrls = new Set(); // For Allow Once button - temporary bypass
    this.listenersSetup = false;

    this.init();
  }

  // Helper: single source of truth for both timers
  getTimes() {
    const sessionElapsed = this.sessionStartTime
      ? Math.floor((Date.now() - this.sessionStartTime) / 1000)
      : 0;

    // If session is running, total focused is base + elapsed; else it's the stored total
    const totalFocused = this.sessionStartTime
      ? this.focusedTimeBase + sessionElapsed
      : this.focusedTime;

    return { sessionElapsed, totalFocused };
  }

  async init() {
    // Register listeners immediately so first popup messages aren't missed
    this.setupListeners();

    // Load saved state
    await this.loadState();
    await this.sanityCheckActiveRules();

    // Check for browser closure before starting any timers/heartbeat
    await this.checkForBrowserClosure();

    // Restore timer if was active - improved logic
    if (this.isActive) {
      this.ensureTimerRunning();
    } else {
      // If there's an active session but focus mode is paused, start heartbeat
      const data = await chrome.storage.local.get(["currentSessionId"]);
      if (data.currentSessionId) {
        this.startHeartbeat();
      }
    }
  }

  async sanityCheckActiveRules() {
    if (!this.isActive || this.rules.length > 0) return;

    try {
      const data = await chrome.storage.local.get([
        "customModes",
        "customRules",
        "activeRuleSetId",
      ]);

      const activeRuleSetId = data.activeRuleSetId;
      if (!activeRuleSetId) return;

      const ruleSets = data.customModes || data.customRules || [];
      const activeRuleSet = ruleSets.find((rs) => rs.id === activeRuleSetId);
      if (activeRuleSet && Array.isArray(activeRuleSet.rules)) {
        this.rules = activeRuleSet.rules;
      } else {
        console.warn(
          "Active ruleset missing or empty while focus mode is active.",
        );
      }
    } catch (error) {
      console.error("Failed sanity check for active rules:", error);
    }
  }

  async loadState() {
    try {
      const data = await chrome.storage.local.get([
        "rules", // Old format for backward compatibility
        "customRules",
        "customModes",
        "activeRuleSetId",
        "isActive",
        "sessionBlocks",
        "sessionStartTime",
        "focusedTime",
      ]);

      // Load rules from active rule set if using new structure
      if (data.customModes && data.activeRuleSetId) {
        const activeRuleSet = data.customModes.find(
          (rs) => rs.id === data.activeRuleSetId,
        );
        this.rules = activeRuleSet ? activeRuleSet.rules : [];
      } else if (data.customRules && data.activeRuleSetId) {
        const activeRuleSet = data.customRules.find(
          (rs) => rs.id === data.activeRuleSetId,
        );
        this.rules = activeRuleSet ? activeRuleSet.rules : [];
      } else if (data.rules) {
        // Fallback to old format
        this.rules = data.rules;
      } else {
        this.rules = [];
      }

      this.isActive = data.isActive || false;
      this.sessionBlocks = data.sessionBlocks || 0;
      this.sessionStartTime = data.sessionStartTime || null;
      this.focusedTime = data.focusedTime || 0;

      // Make the session base reflect the persisted focused total
      this.focusedTimeBase = this.focusedTime;
    } catch (error) {
      console.error("Failed to load state:", error);
    }
  }

  async saveTimerState() {
    try {
      await chrome.storage.local.set({
        sessionStartTime: this.sessionStartTime,
        focusedTime: this.focusedTime,
      });
    } catch (error) {
      console.error("Failed to save timer state:", error);
    }
  }

  ensureTimerRunning() {
    if (!this.isActive) {
      this.stopTimer();
      return;
    }

    // If we think we should be active but don't have a session start time,
    // or if we don't have a timer interval running, start it
    if (!this.sessionStartTime || !this.timerInterval) this.startTimer();
  }

  setupListeners() {
    if (this.listenersSetup) return;
    this.listenersSetup = true;

    // Listen for messages from popup
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === "reloadAffectedTabs") {
        const { rulesBefore, rulesAfter, isActiveBefore, isActiveAfter } =
          message;

        chrome.tabs.query({}, (tabs) => {
          tabs.forEach((tab) => {
            if (
              !tab.id ||
              !tab.url ||
              tab.url.startsWith("chrome://") ||
              tab.url.startsWith("chrome-extension://")
            )
              return;

            // Check block status before and after
            const wasBlocked = this.shouldBlockUrlWith(
              rulesBefore,
              isActiveBefore,
              tab.url,
            );
            const isBlocked = this.shouldBlockUrlWith(
              rulesAfter,
              isActiveAfter,
              tab.url,
            );

            // Reload only if the status changes
            if (wasBlocked !== isBlocked) {
              chrome.tabs.reload(tab.id);
            }
          });
        });
      }

      this.handleMessage(message, sender, sendResponse);
      return true; // Keep message channel open for async responses
    });

    // Detect when all browser windows are closed
    chrome.windows.onRemoved.addListener(async (windowId) => {
      await this.recordWindowClosedTimestampIfNeeded();
    });

    // Handle service worker lifecycle in manifest v3
    chrome.runtime.onSuspend?.addListener(() => {
      // Stop heartbeat
      this.stopHeartbeat();

      if (this.isActive && this.sessionStartTime) {
        // Save current focused time before suspension
        const { totalFocused } = this.getTimes();
        this.focusedTime = totalFocused;
        this.saveTimerState();
      }

      // If the browser is closing, record the close timestamp
      this.recordWindowClosedTimestampIfNeeded().catch(() => {});
    });
  }

  async recordWindowClosedTimestampIfNeeded() {
    try {
      const windows = await chrome.windows.getAll();
      if (windows.length === 0) {
        // All windows closed - save timestamp and STOP heartbeat to freeze the timestamp
        await chrome.storage.local.set({
          lastActiveTimestamp: Date.now(),
          lastWindowClosedAt: Date.now(),
        });

        // Stop heartbeat so timestamp doesn't get updated anymore
        this.stopHeartbeat();
      }
    } catch (error) {
      console.error("Failed to record window close timestamp:", error);
    }
  }

  // Start heartbeat to track browser activity
  startHeartbeat() {
    // Clear any existing heartbeat
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    // Update timestamp every second when active
    this.heartbeatInterval = setInterval(() => {
      chrome.storage.local.set({ lastActiveTimestamp: Date.now() });
    }, 1000);

    // Set initial timestamp
    chrome.storage.local.set({ lastActiveTimestamp: Date.now() });
  }

  // Stop heartbeat
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // Check if browser was closed and deactivate session if needed
  async checkForBrowserClosure() {
    try {
      const data = await chrome.storage.local.get([
        "lastActiveTimestamp",
        "lastWindowClosedAt",
        "sessions",
        "currentSessionId",
        "isActive",
      ]);

      const lastActiveTimestamp = data.lastActiveTimestamp;
      const lastWindowClosedAt = data.lastWindowClosedAt;
      const currentTime = Date.now();
      const windows = await chrome.windows.getAll();
      const hasOpenWindows = windows.length > 0;

      // If there's a timestamp and the difference is > 35 seconds, browser was likely closed
      if (lastWindowClosedAt && hasOpenWindows) {
        const elapsedSinceClose = currentTime - lastWindowClosedAt;
        if (elapsedSinceClose > 35000) {
          // Re-read live state to avoid wiping a brand new session created during startup.
          // Only skip deactivation when a truly new session (created after close marker) exists.
          const liveData = await chrome.storage.local.get([
            "sessions",
            "currentSessionId",
          ]);
          const liveSessions = liveData.sessions || [];
          const liveCurrentSession = liveData.currentSessionId
            ? liveSessions.find((s) => s.id === liveData.currentSessionId)
            : null;
          const liveSessionCreatedAt = Math.max(
            liveCurrentSession?.created || 0,
            liveCurrentSession?.startTime || 0,
            liveCurrentSession?.sessionStartTime || 0,
          );

          if (liveSessionCreatedAt > lastWindowClosedAt) {
            // A new session started after the close marker; don't deactivate it.
            await chrome.storage.local.set({ lastWindowClosedAt: null });
            return;
          }

          console.log(
            "Browser was closed, deactivating session...",
            Math.floor(elapsedSinceClose / 1000),
            "seconds elapsed",
          );

          // Load current state from the latest snapshot before mutating storage
          const sessions = liveSessions;
          const currentSessionId = liveData.currentSessionId;

          // Deactivate the active session if one exists
          if (currentSessionId) {
            const session = sessions.find((s) => s.id === currentSessionId);
            if (session) {
              // Mark session as inactive
              session.isActive = false;

              // Set end time if not already set
              if (!session.endTime) {
                session.endTime = lastWindowClosedAt; // Use last known active time
              }

              // Clear session tracking times
              session.sessionFocusStartTime = null;
              session.sessionPauseStartTime = null;

              // Update last active timestamp
              session.lastActive = lastWindowClosedAt;

              console.log(
                `Session "${session.name}" deactivated due to browser closure`,
              );
            }

            // Save updated sessions and clear current session
            await chrome.storage.local.set({
              sessions: sessions,
              currentSessionId: null,
              isActive: false,
              sessionBlocks: 0,
            });

            // Update internal state
            this.isActive = false;
            this.sessionBlocks = 0;
            this.sessionStartTime = null;

            // Stop any running timers
          }

          // Always clear global active/timer state, even if session id is missing
          await chrome.storage.local.set({
            sessionStartTime: null,
            isActive: false,
            currentSessionId: null,
            sessionBlocks: 0,
          });
          this.isActive = false;
          this.sessionBlocks = 0;
          this.sessionStartTime = null;
          await this.stopTimer();
          this.stopHeartbeat();
        }
        // Consume close marker so worker restarts in same browser run don't re-apply it
        await chrome.storage.local.set({ lastWindowClosedAt: null });
      } else if (
        !lastWindowClosedAt &&
        lastActiveTimestamp &&
        currentTime - lastActiveTimestamp > 35000
      ) {
        // Re-read live state to avoid wiping a brand new session created during startup.
        // Only skip deactivation when a truly new session (created after stale timestamp) exists.
        const liveData = await chrome.storage.local.get([
          "sessions",
          "currentSessionId",
        ]);
        const liveSessions = liveData.sessions || [];
        const liveCurrentSession = liveData.currentSessionId
          ? liveSessions.find((s) => s.id === liveData.currentSessionId)
          : null;
        const liveSessionCreatedAt = Math.max(
          liveCurrentSession?.created || 0,
          liveCurrentSession?.startTime || 0,
          liveCurrentSession?.sessionStartTime || 0,
        );

        if (liveSessionCreatedAt > lastActiveTimestamp) {
          return;
        }

        // Fallback for older data that doesn't track lastWindowClosedAt
        console.log(
          "Browser likely closed (fallback), deactivating session...",
          Math.floor((currentTime - lastActiveTimestamp) / 1000),
          "seconds elapsed",
        );

        const sessions = liveSessions;
        const currentSessionId = liveData.currentSessionId;
        if (currentSessionId) {
          const session = sessions.find((s) => s.id === currentSessionId);
          if (session) {
            session.isActive = false;
            if (!session.endTime) {
              session.endTime = lastActiveTimestamp;
            }
            session.sessionFocusStartTime = null;
            session.sessionPauseStartTime = null;
            session.lastActive = lastActiveTimestamp;
            console.log(
              `Session "${session.name}" deactivated due to browser closure`,
            );
          }

          await chrome.storage.local.set({
            sessions: sessions,
            currentSessionId: null,
            isActive: false,
            sessionBlocks: 0,
          });

        }

        // Always clear global active/timer state, even if session id is missing
        await chrome.storage.local.set({
          sessionStartTime: null,
          isActive: false,
          currentSessionId: null,
          sessionBlocks: 0,
        });
        this.isActive = false;
        this.sessionBlocks = 0;
        this.sessionStartTime = null;
        await this.stopTimer();
        this.stopHeartbeat();
      }
    } catch (error) {
      console.error("Error checking for browser closure:", error);
    }
  }

  async handleMessage(message, sender, sendResponse) {
    switch (message.action) {
      case "updateRules":
        this.rules = message.rules;
        this.isActive = message.isActive;
        break;

      case "updatePersonalization":
        // Store theme and broadcast to all content scripts
        this.currentTheme = message.theme;
        this.blockPageTitle = message.blockPageTitle;
        this.blockPageMessage = message.blockPageMessage;

        // Notify all tabs about the theme change
        chrome.tabs.query({}, (tabs) => {
          tabs.forEach((tab) => {
            if (
              tab.id &&
              tab.url &&
              !tab.url.startsWith("chrome://") &&
              !tab.url.startsWith("chrome-extension://")
            ) {
              chrome.tabs
                .sendMessage(tab.id, {
                  action: "applyBlockPageTheme",
                  theme: message.theme,
                  blockPageTitle: message.blockPageTitle,
                  blockPageMessage: message.blockPageMessage,
                })
                .catch(() => {
                  // Tab may not have content script loaded, ignore error
                });
            }
          });
        });
        sendResponse({ success: true });
        break;

      case "startTimer":
        // If a focused time value is provided, use it as the base
        if (message.focusedTime !== undefined) {
          this.focusedTime = message.focusedTime;
          this.focusedTimeBase = message.focusedTime;
        }
        this.startTimer();
        break;

      case "stopTimer":
        this.stopTimer();
        break;

      case "ensureTimerRunning":
        this.ensureTimerRunning();
        sendResponse({ success: true });
        break;

      case "getTimerState": {
        const { sessionElapsed, totalFocused } = this.getTimes();

        // Calculate current session's focused time and total session time
        let currentSessionFocusedTime = 0;
        let totalSessionTime = 0;
        const data = await chrome.storage.local.get([
          "currentSessionId",
          "sessions",
        ]);
        if (data.currentSessionId && data.sessions) {
          const currentSession = data.sessions.find(
            (s) => s.id === data.currentSessionId,
          );
          if (currentSession) {
            const sessionFocusedTime = currentSession.focusedTime || 0;
            const sessionBreakTime = currentSession.breakTime || 0;
            const now = Date.now();

            let currentFocusElapsed = 0;
            let currentBreakElapsed = 0;
            if (this.isActive && currentSession.sessionFocusStartTime) {
              // Currently in focus mode - add elapsed focus time
              currentFocusElapsed = Math.floor(
                (now - currentSession.sessionFocusStartTime) / 1000,
              );
            } else if (!this.isActive && currentSession.sessionPauseStartTime) {
              // Currently paused - add elapsed break time
              currentBreakElapsed = Math.floor(
                (now - currentSession.sessionPauseStartTime) / 1000,
              );
            }

            currentSessionFocusedTime =
              sessionFocusedTime + currentFocusElapsed;
            totalSessionTime =
              sessionFocusedTime +
              sessionBreakTime +
              currentFocusElapsed +
              currentBreakElapsed;
          }
        }

        const response = {
          sessionTime: sessionElapsed,
          focusedTime: currentSessionFocusedTime, // Use current session's focused time instead of global
          totalSessionTime: totalSessionTime,
        };
        sendResponse(response);
        break;
      }

      case "setFocusedTime":
        // Set the focused time to a specific value (used when activating sessions)
        this.focusedTime = message.focusedTime || 0;
        this.focusedTimeBase = this.focusedTime;
        await this.saveTimerState();
        sendResponse({ success: true });
        break;

      case "clearTimers":
        this.focusedTime = 0;

        if (this.sessionStartTime) {
          this.sessionStartTime = Date.now();
          this.focusedTimeBase = 0;
        } else {
          this.focusedTimeBase = 0;
        }

        await this.saveTimerState();

        // Immediately push zeroed values to popup
        this.notifyPopup("timerUpdate", {
          sessionTime: 0,
          focusedTime: 0,
        });
        break;

      case "resetSessionBlocks":
        this.sessionBlocks = 0;
        chrome.storage.local.set({ sessionBlocks: 0 });
        // Notify popup of the reset
        this.notifyPopup("updateBlockCount", { count: 0 });
        break;

      case "checkBlock": {
        // Check if URL is temporarily allowed (Allow Once)
        if (this.temporaryAllowedUrls.has(message.url)) {
          this.temporaryAllowedUrls.delete(message.url);
          sendResponse({ shouldBlock: false });
          break;
        }

        const shouldBlock = this.shouldBlockUrl(message.url);
        sendResponse({ shouldBlock });
        break;
      }

      case "reportBlock":
        // Only increment counter if focus mode is active
        if (this.isActive) {
          this.sessionBlocks++;
          chrome.storage.local.set({ sessionBlocks: this.sessionBlocks });
          // Notify popup if it's open
          this.notifyPopup("updateBlockCount", { count: this.sessionBlocks });
        }
        // Return the current block number
        sendResponse({ blockNumber: this.sessionBlocks });
        break;

      case "allowOnce":
        // Temporarily allow this URL (one-time bypass)
        if (message.url) {
          this.temporaryAllowedUrls.add(message.url);
          sendResponse({ success: true });
        } else {
          sendResponse({ success: false });
        }
        break;

      case "closeTab": {
        // Close the tab that sent this message
        if (sender.tab && sender.tab.id) {
          chrome.tabs.remove(sender.tab.id);
          sendResponse({ success: true });
        } else {
          sendResponse({ success: false });
        }
        break;
      }

      case "addException": {
        // Add URL as permanent allow rule to the active mode
        if (!message.url) {
          sendResponse({ success: false, error: "No URL provided" });
          break;
        }

        try {
          const data = await chrome.storage.local.get([
            "customModes",
            "activeRuleSetId",
          ]);
          const customModes = data.customModes || [];
          const activeRuleSetId = data.activeRuleSetId;

          if (!activeRuleSetId) {
            sendResponse({ success: false, error: "No active mode" });
            break;
          }

          const activeMode = customModes.find((m) => m.id === activeRuleSetId);
          if (!activeMode) {
            sendResponse({ success: false, error: "Active mode not found" });
            break;
          }

          // Extract URL for the allow rule
          let urlToAllow = message.url;
          try {
            const urlObj = new URL(message.url);
            // For file URLs, use the full pathname; for http/https, use hostname + pathname
            if (urlObj.protocol === "file:") {
              urlToAllow = urlObj.pathname;
            } else {
              // Remove www. from hostname to ensure proper matching
              const hostname = urlObj.hostname.replace(/^www\./, "");
              urlToAllow = hostname + urlObj.pathname;
            }
          } catch (e) {
            // Use the URL as-is if parsing fails
          }

          // Check if rule already exists
          const ruleExists = activeMode.rules.some(
            (rule) => rule.type === "allow" && rule.url === urlToAllow,
          );

          if (ruleExists) {
            sendResponse({ success: false, error: "Rule already exists" });
            break;
          }

          // Add the allow rule
          activeMode.rules.push({
            type: "allow",
            url: urlToAllow,
          });

          // Save to storage with correct key
          await chrome.storage.local.set({ customModes });

          // Update internal rules
          this.rules = activeMode.rules;

          sendResponse({ success: true });
        } catch (error) {
          console.error("Error adding exception:", error);
          sendResponse({ success: false, error: error.message });
        }
        break;
      }

      case "countCurrentlyBlockedTabs":
        // Count all currently open tabs that would be blocked
        chrome.tabs.query({}, async (tabs) => {
          let blockedCount = 0;

          tabs.forEach((tab) => {
            // Skip chrome:// and extension:// URLs
            if (
              !tab.url ||
              tab.url.startsWith("chrome://") ||
              tab.url.startsWith("chrome-extension://")
            ) {
              return;
            }

            // Check if this tab would be blocked
            if (this.shouldBlockUrl(tab.url)) {
              blockedCount++;
            }
          });

          // Get current session blocks from storage (source of truth)
          const data = await chrome.storage.local.get(["sessionBlocks"]);
          const currentSessionBlocks = data.sessionBlocks || 0;

          // Add to session blocks counter
          const newTotal = currentSessionBlocks + blockedCount;
          this.sessionBlocks = newTotal;
          chrome.storage.local.set({ sessionBlocks: newTotal });

          // Notify popup with updated count
          this.notifyPopup("updateBlockCount", { count: newTotal });

          // Send response back
          sendResponse({ blockedCount, totalCount: newTotal });
        });
        return true; // Keep message channel open for async response

      case "getMotivationalQuote":
        this.fetchMotivationalQuote()
          .then((quote) => {
            sendResponse({ success: true, quote });
          })
          .catch((error) => {
            console.error("Fetching error: ", error);
            sendResponse({
              success: true,
              quote: "Stay positive and keep pushing forward!",
            });
          });
        return true; // Keep message channel open for async response
    }
  }

  startTimer() {
    // Clear any existing interval first
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    // If we don't have a session start time, create one
    if (!this.sessionStartTime) {
      this.sessionStartTime = Date.now();
      this.focusedTimeBase = this.focusedTime; // cumulative prior to this session
    } else {
      // We already have a session start time, just ensure the base is correct
      this.focusedTimeBase = this.focusedTime;
    }

    this.saveTimerState();

    // Start heartbeat to track browser activity
    this.startHeartbeat();

    this.timerInterval = setInterval(() => {
      const { sessionElapsed, totalFocused } = this.getTimes();

      // Push a consistent view to the popup
      this.notifyPopup("timerUpdate", {
        sessionTime: sessionElapsed,
        focusedTime: totalFocused,
      });

      // Persist cumulative total once per minute
      if (sessionElapsed > 0 && sessionElapsed % 60 === 0) {
        this.focusedTime = totalFocused; // roll forward the stored total
        this.saveTimerState();
      }
    }, 1000);
  }

  async stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    // Finalize the cumulative total for this session
    const { sessionElapsed, totalFocused } = this.getTimes();
    this.focusedTime = totalFocused;

    this.sessionStartTime = null;
    this.saveTimerState();

    // Check if there's still an active session (focus mode paused but session active)
    const data = await chrome.storage.local.get(["currentSessionId"]);
    if (data.currentSessionId) {
      // Keep heartbeat running for active session even when timer is stopped
      if (!this.heartbeatInterval) {
        this.startHeartbeat();
      }
    } else {
      // No active session, stop heartbeat
      this.stopHeartbeat();
    }
  }

  getCurrentSessionTime() {
    if (!this.sessionStartTime) return 0;
    return Math.floor((Date.now() - this.sessionStartTime) / 1000);
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
      (rule) => rule.type === "domain" || rule.type === "url",
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
        (rule) => rule.type === "allowParam",
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

  // To check if the URL should be refreshed or not
  shouldBlockUrlWith(rules, isActive, url) {
    const oldRules = this.rules;
    const oldIsActive = this.isActive;

    this.rules = rules;
    this.isActive = isActive;
    const result = this.shouldBlockUrl(url);

    this.rules = oldRules;
    this.isActive = oldIsActive;
    return result;
  }

  matchesRule(url, rule) {
    const ruleUrl = rule.url.toLowerCase();
    const checkUrl = url.toLowerCase();

    switch (rule.type) {
      case "domain":
        // Wildcard "*" matches all URLs
        if (ruleUrl === "*") return true;

        // Block entire domain and all subdomains
        const hostname = new URL("https://" + url).hostname.replace(
          /^www\./,
          "",
        );
        return hostname === ruleUrl || hostname.endsWith("." + ruleUrl);

      case "url":
        // Wildcard "*" matches all URLs
        if (ruleUrl === "*") return true;

        // Block only the specific URL - exact match for base domain or exact path match
        try {
          const urlObj = new URL("https://" + checkUrl);
          const ruleObj = new URL("https://" + ruleUrl);

          // If rule is just a domain (no path or just "/"), only block the exact base domain
          if (ruleObj.pathname === "/" || ruleObj.pathname === "") {
            return (
              urlObj.hostname === ruleObj.hostname &&
              (urlObj.pathname === "/" || urlObj.pathname === "")
            );
          }

          // Otherwise, exact URL match including path
          return checkUrl === ruleUrl;
        } catch (error) {
          // Fallback to simple string comparison if URL parsing fails
          return checkUrl === ruleUrl;
        }

      case "allow":
        // Allow rules should match the URL and its subpaths
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
      return (urlObj.hostname + urlObj.pathname + urlObj.search)
        .replace(/^www\./, "")
        .replace(/\/+$/, "");
    } catch {
      return url
        .replace(/^https?:\/\//, "")
        .replace(/^www\./, "")
        .replace(/\/+$/, "");
    }
  }

  async fetchMotivationalQuote() {
    try {
      const response = await fetch(
        "https://api.forismatic.com/api/1.0/?method=getQuote&format=json&lang=en",
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.quoteText;
    } catch (error) {
      console.error("ERROR: ", error.message);
    }

    return "Stay positive and keep pushing forward!";
  }

  notifyPopup(action, data) {
    // Try to send message to popup if it's open
    chrome.runtime.sendMessage({ action, ...data }).catch(() => {
      // Popup is closed, ignore error
    });
  }
}

// Initialize background script
new ProducerBackground();
