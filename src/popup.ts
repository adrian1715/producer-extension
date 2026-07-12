interface BlockPageSettings {
  title: string;
  message: string;
  showQuotes: boolean;
  backgroundImage: string;
  backgroundImageName: string;
  primaryColor: string;
  accentColor: string;
  showActionButtons: boolean;
}

/** Dropdown element with a back-reference to the button that opened it. */
type ItemDropdown = HTMLDivElement & { _trigger?: HTMLElement };

class ProducerPopup {
  isActive = false;
  customModes: Mode[] = []; // Array of modes (previously customRules)
  activeRuleSetId: string | null = null; // ID of currently active mode
  currentEditingRuleSetId: string | null = null; // ID of mode being edited
  isCreatingNewRuleSet = false; // Flag to track if we're creating a new mode
  tempRuleSet: Mode | null = null; // Temporary mode for unsaved changes

  // New session management structure
  sessions: Session[] = []; // Array of all sessions (both active and paused)
  currentSessionId: string | null = null; // ID of currently selected session

  // Legacy fields for backward compatibility
  sessionHistory: unknown[] = []; // Array of completed sessions (deprecated)
  sessionBlocks = 0;
  sessionTime = 0; // in seconds
  focusedTime = 0; // in seconds
  timerInterval: ReturnType<typeof setInterval> | null = null;
  lastTimerUpdate = 0; // Track when we last received a timer update

  // Session time tracking for stats display
  sessionStatsInterval: ReturnType<typeof setInterval> | null = null; // Timer for updating session stats display
  sessionCommitInterval: ReturnType<typeof setInterval> | null = null; // Timer for periodic commits
  sessionFocusStartTime: number | null = null; // When focus mode started for current session segment
  sessionPauseStartTime: number | null = null; // When session was paused (focus mode stopped)
  sessionStartTime: number | null = null; // Timer anchor while focus mode is active
  isLoaded = false;
  loadStatePromise: Promise<void> | null = null;
  personalizationAutoSaveTimeout: ReturnType<typeof setTimeout> | undefined;

  // Personalization state (populated by loadState before first use)
  currentTheme!: string;
  currentBlockPageTitle!: string;
  currentBlockPageMessage!: string;
  currentBlockPageShowQuotes!: boolean;
  currentBlockPageBackgroundImage!: string;
  currentBlockPageBackgroundImageName!: string;
  currentBlockPagePrimaryColor!: string;
  currentBlockPageAccentColor!: string;
  currentBlockPageUseThemeColors!: boolean;
  currentBlockPageShowActionButtons!: boolean;

  // UI elements (assigned in initializeElements)
  statusIndicator!: HTMLElement;
  statusIcon!: HTMLElement;
  toggleBtn!: HTMLButtonElement;
  urlInput!: HTMLInputElement;
  ruleType!: HTMLSelectElement;
  addRuleBtn!: HTMLButtonElement;
  rulesList!: HTMLElement;
  ruleCount!: HTMLElement;
  blockedCount!: HTMLElement;
  totalBlockedCountEl!: HTMLElement;
  totalFocusedTimeEl!: HTMLElement;
  sessionBlocksEl!: HTMLElement;
  sessionStatusText!: HTMLElement;
  sessionTimerEl!: HTMLElement;
  focusedTimeEl!: HTMLElement;
  breakTimeEl!: HTMLElement;
  exportRulesBtn!: HTMLElement;
  importRulesBtn!: HTMLElement;
  importFileInput!: HTMLInputElement;
  clearRulesBtn!: HTMLElement;
  rulesSectionTitle!: HTMLElement;
  urlInputContainer!: HTMLElement;
  paramKeyInput!: HTMLInputElement;
  paramValueInput!: HTMLInputElement;
  paramInputsContainer!: HTMLElement;
  addParamRuleBtn!: HTMLButtonElement;
  createRuleSetBtn!: HTMLElement;
  ruleSetsList!: HTMLElement;
  rulesMainView!: HTMLElement;
  rulesEditView!: HTMLElement;
  allRulesView!: HTMLElement;
  allRulesViewScrollContainer!: HTMLElement;
  allRulesList!: HTMLElement;
  backFromAllRulesBtn!: HTMLElement;
  addRuleAllViewBtn!: HTMLElement;
  importRulesAllViewBtn!: HTMLElement;
  exportRulesAllViewBtn!: HTMLElement;
  clearRulesAllViewBtn!: HTMLElement;
  backToRuleSetListBtn!: HTMLElement;
  backToRuleSetListBtn2!: HTMLElement;
  ruleSetNameInput!: HTMLInputElement;
  ruleSetNameSection!: HTMLElement;
  saveRuleSetBtn!: HTMLElement;
  cancelRuleSetBtn!: HTMLElement;
  ruleSetActionButtons!: HTMLElement;
  ruleSetEditTitle!: HTMLElement;
  clearAllRuleSetsBtn!: HTMLElement;
  modeGrayscaleToggle!: HTMLInputElement;
  modeSettingsSection!: HTMLElement;
  configureModeSettingsBtn!: HTMLElement;
  modeSettingsView!: HTMLElement;
  backFromModeSettingsBtn!: HTMLElement;
  modeGrayscaleToggleView!: HTMLInputElement;
  rulesPreview!: HTMLElement;
  rulesPreviewCount!: HTMLElement;
  rulesPreviewSection!: HTMLElement;
  sessionsList!: HTMLElement;
  clearSessionsBtn!: HTMLElement;
  statsMainView!: HTMLElement;
  sessionHistoryView!: HTMLElement;
  viewSessionHistoryBtn!: HTMLElement;
  backToStatsBtn!: HTMLElement;
  statsTabTotalSessions!: HTMLElement;
  statsTabAvgSession!: HTMLElement;
  currentSessionName!: HTMLElement;
  currentSessionStats!: HTMLElement;
  noSessionMessage!: HTMLElement;
  deactivateSessionBtn!: HTMLElement;
  createNewSessionBtn!: HTMLElement;
  currentSessionInfo!: HTMLElement;
  currentSessionRules!: HTMLElement;
  currentSessionBlocksCount!: HTMLElement;
  currentSessionFocusTime!: HTMLElement;
  currentSessionBreakTime!: HTMLElement;
  currentSessionTotalTime!: HTMLElement;
  tabBtns!: NodeListOf<HTMLElement>;
  tabContents!: NodeListOf<HTMLElement>;
  contentArea!: HTMLElement;
  themeOptions!: NodeListOf<HTMLElement>;
  blockPageTitle!: HTMLInputElement;
  blockPageMessage!: HTMLInputElement;
  blockPageShowQuotes!: HTMLInputElement;
  blockPageImage!: HTMLInputElement;
  useBackgroundImageUrlBtn!: HTMLElement;
  importBackgroundImageBtn!: HTMLElement;
  removeBackgroundImageBtn!: HTMLElement;
  blockPageImageUrlRow!: HTMLElement;
  confirmBackgroundImageUrlBtn!: HTMLElement;
  blockPageImageFileInput!: HTMLInputElement;
  blockPageImageStatus!: HTMLElement;
  blockPagePrimaryColor!: HTMLInputElement;
  blockPagePrimaryColorDisplay!: HTMLElement;
  blockPagePrimaryColorText!: HTMLInputElement;
  blockPageAccentColor!: HTMLInputElement;
  blockPageAccentColorDisplay!: HTMLElement;
  blockPageAccentColorText!: HTMLInputElement;
  blockPageShowActionButtons!: HTMLInputElement;
  previewTitle!: HTMLElement;
  previewMessage!: HTMLElement;
  previewQuote!: HTMLElement;
  previewUtilityActions!: HTMLElement;
  blockPagePreview!: HTMLElement;
  blockPagePreviewCard!: HTMLElement;
  previewAccentBtn!: HTMLElement;
  blockPageImageInputMode: "hidden" | "url" = "hidden";
  savePersonalizationBtn!: HTMLElement;
  resetPersonalizationBtn!: HTMLElement;
  grayscaleToggle!: HTMLInputElement;
  openBlockPageSettingsBtn!: HTMLElement;
  backToThemeBtn!: HTMLElement;
  themeMainView!: HTMLElement;
  blockPageSettingsView!: HTMLElement;

  constructor() {
    this.initializeElements();
    this.bindEvents();
    this.loadStatePromise = this.loadState();
  }

  /**
   * Typed getElementById helper. The popup markup is bundled with the
   * extension, so elements referenced here are expected to exist; optional
   * elements are still truthiness-guarded at their usage sites.
   */
  private $<T extends HTMLElement = HTMLElement>(id: string): T {
    return document.getElementById(id) as T;
  }

  initializeElements() {
    this.statusIndicator = this.$("statusIndicator");
    this.statusIcon = this.$("statusIcon");
    this.toggleBtn = this.$<HTMLButtonElement>("toggleBtn");
    this.urlInput = this.$<HTMLInputElement>("urlInput");
    this.ruleType = this.$<HTMLSelectElement>("ruleType");
    this.addRuleBtn = this.$<HTMLButtonElement>("addRule");
    this.rulesList = this.$("rulesList");
    this.ruleCount = this.$("ruleCount");
    this.blockedCount = this.$("blockedCount");
    this.totalBlockedCountEl = this.$("totalBlockedCount");
    this.totalFocusedTimeEl = this.$("totalFocusedTime");
    this.sessionBlocksEl = this.$("sessionBlocks");
    this.sessionStatusText = this.$("sessionStatusText");
    this.sessionTimerEl = this.$("sessionTimer");
    this.focusedTimeEl = this.$("focusedTime");
    this.breakTimeEl = this.$("breakTime");
    this.exportRulesBtn = this.$("exportRulesBtn");
    this.importRulesBtn = this.$("importRulesBtn");
    this.importFileInput = this.$<HTMLInputElement>("importFileInput");
    this.clearRulesBtn = this.$("clearRulesBtn");
    this.rulesSectionTitle = this.$("rulesSectionTitle");
    this.urlInputContainer = this.$("urlInputContainer");
    this.paramKeyInput = this.$<HTMLInputElement>("paramKeyInput");
    this.paramValueInput = this.$<HTMLInputElement>("paramValueInput");
    this.paramInputsContainer = this.$("paramInputsContainer");
    this.addParamRuleBtn = this.$<HTMLButtonElement>("addParamRule");

    // Custom rule sets elements
    this.createRuleSetBtn = this.$("createRuleSetBtn");
    this.ruleSetsList = this.$("ruleSetsList");
    this.rulesMainView = this.$("rules-main-view");
    this.rulesEditView = this.$("rules-edit-view");
    this.allRulesView = this.$("all-rules-view");
    this.allRulesViewScrollContainer = this.$("allRulesViewScrollContainer");
    this.allRulesList = this.$("allRulesList");
    this.backFromAllRulesBtn = this.$("backFromAllRulesBtn");
    this.addRuleAllViewBtn = this.$("addRuleAllViewBtn");
    this.importRulesAllViewBtn = this.$("importRulesAllViewBtn");
    this.exportRulesAllViewBtn = this.$("exportRulesAllViewBtn");
    this.clearRulesAllViewBtn = this.$("clearRulesAllViewBtn");
    this.backToRuleSetListBtn = this.$("backToRuleSetListBtn");
    this.backToRuleSetListBtn2 = this.$("backToRuleSetListBtn2");
    this.ruleSetNameInput = this.$<HTMLInputElement>("ruleSetNameInput");
    this.ruleSetNameSection = this.$("ruleSetNameSection");
    this.saveRuleSetBtn = this.$("saveRuleSetBtn");
    this.cancelRuleSetBtn = this.$("cancelRuleSetBtn");
    this.ruleSetActionButtons = this.$("ruleSetActionButtons");
    this.ruleSetEditTitle = this.$("ruleSetEditTitle");
    this.clearAllRuleSetsBtn = this.$("clearAllRuleSetsBtn");

    // Mode settings elements
    this.modeGrayscaleToggle = this.$<HTMLInputElement>("modeGrayscaleToggle");
    this.modeSettingsSection = this.$("modeSettingsSection");
    this.configureModeSettingsBtn = this.$("configureModeSettingsBtn");

    // Mode features view elements
    this.modeSettingsView = this.$("mode-settings-view");
    this.backFromModeSettingsBtn = this.$("backFromModeSettingsBtn");
    this.modeGrayscaleToggleView = this.$<HTMLInputElement>(
      "modeGrayscaleToggleView",
    );

    // Rules preview and management elements
    this.rulesPreview = this.$("rulesPreview");
    this.rulesPreviewCount = this.$("rulesPreviewCount");
    this.rulesPreviewSection = this.$("rulesPreviewSection");

    // Sessions elements
    this.sessionsList = this.$("sessionsList");
    this.clearSessionsBtn = this.$("clearSessionsBtn");

    // Stats tab navigation elements
    this.statsMainView = this.$("stats-main-view");
    this.sessionHistoryView = this.$("session-history-view");
    this.viewSessionHistoryBtn = this.$("viewSessionHistoryBtn");
    this.backToStatsBtn = this.$("backToStatsBtn");
    this.statsTabTotalSessions = this.$("statsTabTotalSessions");
    this.statsTabAvgSession = this.$("statsTabAvgSession");

    // Current session stats elements
    this.currentSessionName = this.$("currentSessionName");
    this.currentSessionStats = this.$("currentSessionStats");
    this.noSessionMessage = this.$("noSessionMessage");
    this.deactivateSessionBtn = this.$("deactivateSessionBtn");
    this.createNewSessionBtn = this.$("createNewSessionBtn");
    this.currentSessionInfo = this.$("currentSessionInfo");
    this.currentSessionRules = this.$("currentSessionRules");
    this.currentSessionBlocksCount = this.$("currentSessionBlocksCount");
    this.currentSessionFocusTime = this.$("currentSessionFocusTime");
    this.currentSessionBreakTime = this.$("currentSessionBreakTime");
    this.currentSessionTotalTime = this.$("currentSessionTotalTime");

    // Tab elements
    this.tabBtns = document.querySelectorAll<HTMLElement>(".tab-btn");
    this.tabContents = document.querySelectorAll<HTMLElement>(".tab-content");
    this.contentArea = document.querySelector<HTMLElement>(
      ".content-area",
    ) as HTMLElement;

    // Personalization elements
    this.themeOptions = document.querySelectorAll<HTMLElement>(".theme-option");
    this.blockPageTitle = this.$<HTMLInputElement>("blockPageTitle");
    this.blockPageMessage = this.$<HTMLInputElement>("blockPageMessage");
    this.blockPageShowQuotes = this.$<HTMLInputElement>("blockPageShowQuotes");
    this.blockPageImage = this.$<HTMLInputElement>("blockPageImage");
    this.useBackgroundImageUrlBtn = this.$("useBackgroundImageUrlBtn");
    this.importBackgroundImageBtn = this.$("importBackgroundImageBtn");
    this.removeBackgroundImageBtn = this.$("removeBackgroundImageBtn");
    this.blockPageImageUrlRow = this.$("blockPageImageUrlRow");
    this.confirmBackgroundImageUrlBtn = this.$("confirmBackgroundImageUrlBtn");
    this.blockPageImageFileInput = this.$<HTMLInputElement>(
      "blockPageImageFileInput",
    );
    this.blockPageImageStatus = this.$("blockPageImageStatus");
    this.blockPagePrimaryColor = this.$<HTMLInputElement>(
      "blockPagePrimaryColor",
    );
    this.blockPagePrimaryColorDisplay = this.$("blockPagePrimaryColorDisplay");
    this.blockPagePrimaryColorText = this.$<HTMLInputElement>(
      "blockPagePrimaryColorText",
    );
    this.blockPageAccentColor = this.$<HTMLInputElement>(
      "blockPageAccentColor",
    );
    this.blockPageAccentColorDisplay = this.$("blockPageAccentColorDisplay");
    this.blockPageAccentColorText = this.$<HTMLInputElement>(
      "blockPageAccentColorText",
    );
    this.blockPageShowActionButtons = this.$<HTMLInputElement>(
      "blockPageShowActionButtons",
    );
    this.previewTitle = this.$("previewTitle");
    this.previewMessage = this.$("previewMessage");
    this.previewQuote = this.$("previewQuote");
    this.previewUtilityActions = this.$("previewUtilityActions");
    this.blockPagePreview = this.$("blockPagePreview");
    this.blockPagePreviewCard = this.$("blockPagePreviewCard");
    this.previewAccentBtn = this.$("previewAccentBtn");
    this.blockPageImageInputMode = "hidden";
    this.savePersonalizationBtn = this.$("savePersonalizationBtn");
    this.resetPersonalizationBtn = this.$("resetPersonalizationBtn");
    this.grayscaleToggle = this.$<HTMLInputElement>("grayscaleToggle");

    // Navigation elements for block page settings
    this.openBlockPageSettingsBtn = this.$("openBlockPageSettingsBtn");
    this.backToThemeBtn = this.$("backToThemeBtn");
    this.themeMainView = this.$("theme-main-view");
    this.blockPageSettingsView = this.$("block-page-settings-view");
  }

  bindEvents() {
    this.toggleBtn.addEventListener("click", () => this.toggleProducing());
    this.addRuleBtn.addEventListener("click", () => this.addRule());
    this.urlInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") this.addRule();
    });
    if (this.clearRulesBtn) {
      this.clearRulesBtn.addEventListener("click", () => this.clearRules());
    }
    if (this.importRulesBtn) {
      this.importRulesBtn.addEventListener("click", async () =>
        this.importFileInput.click(),
      );
    }
    if (this.importFileInput) {
      this.importFileInput.addEventListener("change", (e) => {
        const input = e.target as HTMLInputElement;
        const file = input.files && input.files[0];
        if (file) this.importRules(file);
        input.value = ""; // Reset file input
      });
    }
    if (this.exportRulesBtn) {
      this.exportRulesBtn.addEventListener("click", () => this.exportRules());
    }
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
        this.selectTheme(option.getAttribute("data-theme")!);
      });
    });

    if (this.blockPageTitle) {
      this.blockPageTitle.addEventListener("input", () => this.updatePreview());
    }
    if (this.blockPageMessage) {
      this.blockPageMessage.addEventListener("input", () =>
        this.updatePreview(),
      );
    }
    if (this.blockPageShowQuotes) {
      this.blockPageShowQuotes.addEventListener("change", () =>
        this.updatePreview(),
      );
    }
    if (this.useBackgroundImageUrlBtn) {
      this.useBackgroundImageUrlBtn.addEventListener("click", () =>
        this.toggleBackgroundImageUrlInput(),
      );
    }
    if (this.importBackgroundImageBtn) {
      this.importBackgroundImageBtn.addEventListener("click", () =>
        this.blockPageImageFileInput?.click(),
      );
    }
    if (this.removeBackgroundImageBtn) {
      this.removeBackgroundImageBtn.addEventListener("click", () =>
        this.clearBackgroundImage(),
      );
    }
    if (this.blockPageImageFileInput) {
      this.blockPageImageFileInput.addEventListener("change", (event) =>
        this.importBackgroundImageFile(event),
      );
    }
    if (this.confirmBackgroundImageUrlBtn) {
      this.confirmBackgroundImageUrlBtn.addEventListener("click", () =>
        this.applyBackgroundImageUrl(),
      );
    }
    if (this.blockPageImage) {
      this.blockPageImage.addEventListener("keypress", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          this.applyBackgroundImageUrl();
        }
      });
    }
    if (this.blockPagePrimaryColor) {
      this.blockPagePrimaryColor.addEventListener("input", () => {
        if (this.blockPagePrimaryColorText) {
          this.blockPagePrimaryColorText.value =
            this.blockPagePrimaryColor.value;
        }
        if (this.blockPagePrimaryColorDisplay) {
          this.blockPagePrimaryColorDisplay.textContent =
            this.blockPagePrimaryColor.value;
        }
        this.updatePreview();
      });
    }
    if (this.blockPagePrimaryColorDisplay) {
      this.blockPagePrimaryColorDisplay.addEventListener("dblclick", () =>
        this.showColorCodeInput("primary"),
      );
    }
    if (this.blockPagePrimaryColorText) {
      this.bindColorCodeInput(
        this.blockPagePrimaryColorText,
        this.blockPagePrimaryColor,
        this.blockPagePrimaryColorDisplay,
      );
    }
    if (this.blockPageAccentColor) {
      this.blockPageAccentColor.addEventListener("input", () => {
        if (this.blockPageAccentColorText) {
          this.blockPageAccentColorText.value = this.blockPageAccentColor.value;
        }
        if (this.blockPageAccentColorDisplay) {
          this.blockPageAccentColorDisplay.textContent =
            this.blockPageAccentColor.value;
        }
        this.updatePreview();
      });
    }
    if (this.blockPageAccentColorDisplay) {
      this.blockPageAccentColorDisplay.addEventListener("dblclick", () =>
        this.showColorCodeInput("accent"),
      );
    }
    if (this.blockPageAccentColorText) {
      this.bindColorCodeInput(
        this.blockPageAccentColorText,
        this.blockPageAccentColor,
        this.blockPageAccentColorDisplay,
      );
    }
    if (this.blockPageShowActionButtons) {
      this.blockPageShowActionButtons.addEventListener("change", () =>
        this.updatePreview(),
      );
    }
    if (this.savePersonalizationBtn) {
      this.savePersonalizationBtn.addEventListener("click", () =>
        this.savePersonalization(),
      );
    }
    if (this.resetPersonalizationBtn) {
      this.resetPersonalizationBtn.addEventListener("click", () =>
        this.resetPersonalization(),
      );
    }
    // Block page settings navigation
    if (this.openBlockPageSettingsBtn) {
      this.openBlockPageSettingsBtn.addEventListener("click", () =>
        this.showBlockPageSettings(),
      );
    }
    if (this.backToThemeBtn) {
      this.backToThemeBtn.addEventListener("click", () =>
        this.showThemeMainView(),
      );
    }

    // Custom rule sets events
    if (this.createRuleSetBtn) {
      this.createRuleSetBtn.addEventListener("click", () =>
        this.startCreatingRuleSet(),
      );
    }
    if (this.saveRuleSetBtn) {
      this.saveRuleSetBtn.addEventListener("click", () =>
        this.saveNewRuleSet(),
      );
    }
    if (this.cancelRuleSetBtn) {
      this.cancelRuleSetBtn.addEventListener("click", () =>
        this.cancelRuleSetCreation(),
      );
    }
    if (this.backToRuleSetListBtn) {
      this.backToRuleSetListBtn.addEventListener("click", () =>
        this.showRulesMainView(),
      );
    }
    if (this.backToRuleSetListBtn2) {
      this.backToRuleSetListBtn2.addEventListener("click", () =>
        this.showRulesMainView(),
      );
    }

    // Click on "Rules" section title to show All Rules view
    if (this.rulesSectionTitle) {
      this.rulesSectionTitle.addEventListener("click", () =>
        this.showAllRulesView(),
      );
    }

    // Back button from All Rules view
    if (this.backFromAllRulesBtn) {
      this.backFromAllRulesBtn.addEventListener("click", () => {
        // Always go back to the edit view of the current mode
        this.showRulesEditView();
      });
    }

    // All Rules view buttons
    if (this.addRuleAllViewBtn) {
      this.addRuleAllViewBtn.addEventListener("click", () => {
        // Go back to edit mode page so user can add rules
        this.showRulesEditView();
      });
    }
    if (this.importRulesAllViewBtn) {
      this.importRulesAllViewBtn.addEventListener("click", () => {
        this.importFileInput.click();
      });
    }
    if (this.exportRulesAllViewBtn) {
      this.exportRulesAllViewBtn.addEventListener("click", () => {
        this.exportRules();
      });
    }
    if (this.clearRulesAllViewBtn) {
      this.clearRulesAllViewBtn.addEventListener("click", () => {
        this.clearRules();
      });
    }

    // Mode settings events
    if (this.modeGrayscaleToggle) {
      this.modeGrayscaleToggle.addEventListener("change", () =>
        this.saveModeSettings(),
      );
    }
    if (this.configureModeSettingsBtn) {
      this.configureModeSettingsBtn.addEventListener("click", () =>
        this.showModeSettingsView(),
      );
    }

    // Mode features view events
    if (this.backFromModeSettingsBtn) {
      this.backFromModeSettingsBtn.addEventListener("click", () =>
        this.showModeEditFromSettings(),
      );
    }
    if (this.modeGrayscaleToggleView) {
      this.modeGrayscaleToggleView.addEventListener("change", () =>
        this.saveModeSettingsFromView(),
      );
    }

    // Sessions events
    if (this.clearSessionsBtn) {
      this.clearSessionsBtn.addEventListener("click", () =>
        this.clearSessions(),
      );
    }

    // Clear all rule sets event
    if (this.clearAllRuleSetsBtn) {
      this.clearAllRuleSetsBtn.addEventListener("click", () =>
        this.clearAllRuleSets(),
      );
    }

    // Stats tab navigation events
    if (this.viewSessionHistoryBtn) {
      this.viewSessionHistoryBtn.addEventListener("click", () =>
        this.showSessionHistoryView(),
      );
    }
    if (this.backToStatsBtn) {
      this.backToStatsBtn.addEventListener("click", () =>
        this.showStatsMainView(),
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

    // Create new session button
    if (this.createNewSessionBtn) {
      this.createNewSessionBtn.addEventListener("click", () => {
        this.createNewSession();
      });
    }

    // Close any open item dropdown when clicking outside the trigger or dropdown
    document.addEventListener("click", (e) => {
      const target = e.target instanceof Element ? e.target : null;
      if (
        !target?.closest(".item-menu-wrap") &&
        !target?.closest(".item-dropdown")
      ) {
        document.querySelectorAll(".item-dropdown").forEach((d) => d.remove());
      }
    });
  }

  switchTab(tabName: string | null) {
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

    this.resetScrollPosition(activeContent);
  }

  resetScrollPosition(activeContainer: HTMLElement | null = null) {
    if (this.contentArea) {
      this.contentArea.scrollTop = 0;
    }
    if (activeContainer) {
      activeContainer.scrollTop = 0;
      activeContainer.querySelectorAll(".scroll-container").forEach((el) => {
        el.scrollTop = 0;
      });
    }
  }

  async loadState() {
    try {
      const data = await chrome.storage.local.get([
        "isActive",
        "rules", // Old format for migration
        "customRules", // Old name for migration
        "customModes", // New name
        "activeRuleSetId",
        "sessions", // New session structure
        "currentSessionId",
        "sessionHistory", // Legacy
        "sessionBlocks",
        "focusedTime",
        "theme",
        "blockPageTitle",
        "blockPageMessage",
        "blockPageShowQuotes",
        "blockPageBackgroundImage",
        "blockPageBackgroundImageName",
        "blockPagePrimaryColor",
        "blockPageAccentColor",
        "blockPageUseThemeColors",
        "blockPageShowActionButtons",
        "grayscaleEnabled", // Global setting (will be removed)
      ]);

      // Data migration #1: Convert very old "rules" to customModes
      if (
        !data.customModes &&
        !data.customRules &&
        data.rules &&
        data.rules.length > 0
      ) {
        const defaultMode = {
          id: "default-" + Date.now(),
          name: "Default",
          rules: data.rules,
          settings: {
            grayscaleEnabled: data.grayscaleEnabled || false,
          },
        };
        this.customModes = [defaultMode];
        this.activeRuleSetId = defaultMode.id;

        await chrome.storage.local.set({
          customModes: this.customModes,
          activeRuleSetId: this.activeRuleSetId,
        });

        console.log("Migrated old rules to customModes structure");
      }
      // Data migration #2: Convert customRules to customModes with settings
      else if (
        !data.customModes &&
        data.customRules &&
        data.customRules.length > 0
      ) {
        this.customModes = (data.customRules as Mode[]).map((ruleSet) => ({
          ...ruleSet,
          settings: {
            grayscaleEnabled: data.grayscaleEnabled || false,
          },
        }));
        this.activeRuleSetId = data.activeRuleSetId || null;

        await chrome.storage.local.set({
          customModes: this.customModes,
          activeRuleSetId: this.activeRuleSetId,
        });

        // Remove old storage keys
        await chrome.storage.local.remove(["customRules", "grayscaleEnabled"]);

        console.log("Migrated customRules to customModes with settings");
      }
      // No migration needed
      else {
        this.customModes = data.customModes || [];
        this.activeRuleSetId = data.activeRuleSetId || null;
      }

      // Load session data
      this.sessions = data.sessions || [];
      this.currentSessionId = data.currentSessionId || null;

      // One-time migration: sort sessions by lastActive descending
      if (!data.sessionsSortMigrated && this.sessions.length > 1) {
        this.sessions.sort((a, b) => (b.lastActive || 0) - (a.lastActive || 0));
        chrome.storage.local.set({
          sessions: this.sessions,
          sessionsSortMigrated: true,
        });
      }

      // Load legacy session data for backward compatibility
      this.sessionHistory = data.sessionHistory || [];
      this.isActive = data.isActive || false;

      // Load current session data if available
      if (this.currentSessionId) {
        const currentSession = this.sessions.find(
          (s) => s.id === this.currentSessionId,
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
      this.currentBlockPageTitle =
        data.blockPageTitle || this.getDefaultBlockPageSettings().title;
      this.currentBlockPageMessage =
        data.blockPageMessage || this.getDefaultBlockPageSettings().message;
      this.currentBlockPageShowQuotes =
        data.blockPageShowQuotes !== undefined
          ? data.blockPageShowQuotes
          : this.getDefaultBlockPageSettings().showQuotes;
      this.currentBlockPageBackgroundImage =
        data.blockPageBackgroundImage ||
        this.getDefaultBlockPageSettings().backgroundImage;
      this.currentBlockPageBackgroundImageName =
        data.blockPageBackgroundImageName || "";
      const themeColorDefaults = this.getThemeBlockPageDefaults(
        this.currentTheme,
      );
      const hasSavedPrimaryColor = !!data.blockPagePrimaryColor;
      const hasSavedAccentColor = !!data.blockPageAccentColor;
      if (data.blockPageUseThemeColors !== undefined) {
        this.currentBlockPageUseThemeColors = data.blockPageUseThemeColors;
      } else if (!hasSavedPrimaryColor || !hasSavedAccentColor) {
        this.currentBlockPageUseThemeColors = true;
      } else {
        this.currentBlockPageUseThemeColors =
          data.blockPagePrimaryColor === themeColorDefaults.primaryColor &&
          data.blockPageAccentColor === themeColorDefaults.accentColor;
      }
      this.currentBlockPagePrimaryColor = hasSavedPrimaryColor
        ? data.blockPagePrimaryColor
        : themeColorDefaults.primaryColor;
      this.currentBlockPageAccentColor = hasSavedAccentColor
        ? data.blockPageAccentColor
        : themeColorDefaults.accentColor;
      this.currentBlockPageShowActionButtons =
        data.blockPageShowActionButtons !== undefined
          ? data.blockPageShowActionButtons
          : this.getDefaultBlockPageSettings().showActionButtons;

      // Apply loaded personalization
      this.applyTheme(this.currentTheme);
      this.loadPersonalizationUI();

      // Request current timer state from background script
      if (this.isActive) {
        await this.ensureBackgroundTimerRunning();
        this.requestTimerUpdate();
        this.startTimerUpdates();

        // Reapply grayscale state if focus mode is active
        const activeMode = this.customModes.find(
          (mode) => mode.id === this.activeRuleSetId,
        );
        if (activeMode?.settings?.grayscaleEnabled) {
          await this.broadcastGrayscaleState(true);
        }
      }

      // Initialize session tracking times if there's a current session
      if (this.currentSessionId) {
        const currentSession = this.sessions.find(
          (s) => s.id === this.currentSessionId,
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
      this.isLoaded = true;
    } catch (error) {
      console.error("Failed to load state:", error);
    }
  }

  async ensureLoaded() {
    if (this.isLoaded) return;
    if (this.loadStatePromise) {
      await this.loadStatePromise;
    }
    this.isLoaded = true;
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
          "Timer updates stopped, attempting to restart background timer",
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
      (s) => s.id === this.currentSessionId,
    );
    if (!currentSession) return;

    // Commit any accumulated focus or break time using session's stored times
    if (currentSession.sessionFocusStartTime) {
      const focusElapsed = Math.floor(
        (Date.now() - currentSession.sessionFocusStartTime) / 1000,
      );
      currentSession.focusedTime =
        (currentSession.focusedTime || 0) + focusElapsed;
      // Reset the start time to now
      currentSession.sessionFocusStartTime = Date.now();
    } else if (currentSession.sessionPauseStartTime) {
      const breakElapsed = Math.floor(
        (Date.now() - currentSession.sessionPauseStartTime) / 1000,
      );
      currentSession.breakTime = (currentSession.breakTime || 0) + breakElapsed;
      // Reset the start time to now
      currentSession.sessionPauseStartTime = Date.now();
    }
  }

  updateActiveSessionInHistory() {
    if (!this.currentSessionId) return;

    const currentSession = this.sessions.find(
      (s) => s.id === this.currentSessionId,
    );
    if (!currentSession) return;

    // Find the session details element in the session history
    const detailsElement = document.querySelector(
      `.session-details[data-session-id="${this.currentSessionId}"]`,
    );
    if (!detailsElement) return;

    // Calculate total time with current elapsed time
    let totalTime =
      (currentSession.focusedTime || 0) + (currentSession.breakTime || 0);
    const now = Date.now();

    if (this.isActive && currentSession.sessionFocusStartTime) {
      const currentFocusElapsed = Math.floor(
        (now - currentSession.sessionFocusStartTime) / 1000,
      );
      totalTime += currentFocusElapsed;
    } else if (!this.isActive && currentSession.sessionPauseStartTime) {
      const currentBreakElapsed = Math.floor(
        (now - currentSession.sessionPauseStartTime) / 1000,
      );
      totalTime += currentBreakElapsed;
    }

    const ruleSet = this.customModes.find(
      (rs) => rs.id === currentSession.ruleSetId,
    );
    const ruleSetName = ruleSet ? ruleSet.name : "No Mode";
    detailsElement.textContent = this.formatSessionDetailsText(
      ruleSetName,
      currentSession.blocksCount || 0,
      totalTime,
    );
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
        if (this.createNewSessionBtn) {
          this.createNewSessionBtn.style.display = "block";
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
      // Show deactivate button and hide create new session button
      if (this.deactivateSessionBtn) {
        this.deactivateSessionBtn.style.display = "block";
      }
      if (this.createNewSessionBtn) {
        this.createNewSessionBtn.style.display = "none";
      }

      const currentSession = this.sessions.find(
        (s) => s.id === this.currentSessionId,
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

        // Get original values
        let sessionName = currentSession.name;
        const ruleSet = this.customModes.find(
          (rs) => rs.id === currentSession.ruleSetId,
        );
        let rulesName = ruleSet ? ruleSet.name : "No Mode";
        const blocksCount = String(currentSession.blocksCount || 0);

        // Static text: "Session: " (9) + " • Rules: " (10) + " • Blocks: " (11) = 30 chars
        const staticLength = 30; // Length of static text parts
        const maxTotalLength = 69; // Max total length for the entire line
        const ellipsis = "...";
        const ellipsisLength = 3;

        // Calculate total length without truncation
        let totalLength =
          staticLength +
          sessionName.length +
          rulesName.length +
          blocksCount.length;

        // If total exceeds maxTotalLength characters, apply smart truncation
        if (totalLength > maxTotalLength) {
          // Step 1: Truncate session name to max characters (with ellipsis)
          const sessionMaxLength = 25; // Max chars for session name
          if (sessionName.length > sessionMaxLength) {
            sessionName = sessionName.substring(0, sessionMaxLength) + ellipsis;
          }

          // Recalculate total with possibly truncated session name
          totalLength =
            staticLength +
            sessionName.length +
            rulesName.length +
            blocksCount.length;

          // Step 2: If still over maxTotalLength, truncate rules name
          if (totalLength > maxTotalLength) {
            // Calculate available space for rules name (including "..." if truncated)
            const availableForRules =
              maxTotalLength -
              staticLength -
              sessionName.length -
              blocksCount.length;

            if (rulesName.length > availableForRules) {
              const maxRulesChars = availableForRules - ellipsisLength;
              if (maxRulesChars > 0) {
                rulesName = rulesName.substring(0, maxRulesChars) + ellipsis;
              } else {
                // Not even enough room for "...", just truncate to available space
                rulesName = rulesName.substring(
                  0,
                  Math.max(0, availableForRules),
                );
              }
            }
          }
        }

        // Apply the values
        this.currentSessionName.textContent = sessionName;
        this.currentSessionRules.textContent = rulesName;
        this.currentSessionBlocksCount.textContent = blocksCount;
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
          (now - currentSession.sessionFocusStartTime) / 1000,
        );
      } else if (!this.isActive && currentSession.sessionPauseStartTime) {
        // Currently paused - calculate elapsed break time
        currentBreakElapsed = Math.floor(
          (now - currentSession.sessionPauseStartTime) / 1000,
        );
      }

      // Calculate total times
      const totalFocusedTime = currentSession.focusedTime + currentFocusElapsed;
      const totalBreakTime = currentSession.breakTime + currentBreakElapsed;
      const totalSessionTime = totalFocusedTime + totalBreakTime;

      // Format time helper
      const formatTime = (seconds: number) => {
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
            (Date.now() - s.sessionFocusStartTime) / 1000,
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

  async saveState(action?: string, oldData?: Record<string, any>) {
    try {
      // Commit accumulated time before saving
      this.commitCurrentSessionTime();

      const before: Record<string, any> =
        oldData ||
        (await chrome.storage.local.get([
          "customModes",
          "activeRuleSetId",
          "isActive",
        ])) ||
        {};

      // Update current session data if a session is selected
      if (this.currentSessionId) {
        const currentSession = this.sessions.find(
          (s) => s.id === this.currentSessionId,
        );
        if (currentSession) {
          currentSession.blocksCount = this.sessionBlocks;
          currentSession.ruleSetId = this.activeRuleSetId;
          currentSession.lastActive = Date.now();
          currentSession.isActive = true; // Ensure active flag is set
        }
      }

      // Ensure all other sessions have isActive = false
      this.sessions.forEach((s) => {
        if (s.id !== this.currentSessionId) {
          s.isActive = false;
        }
      });

      // Get the active mode's grayscale setting for content script
      const activeMode = this.customModes.find(
        (mode) => mode.id === this.activeRuleSetId,
      );
      const grayscaleEnabled = activeMode?.settings?.grayscaleEnabled || false;

      await chrome.storage.local.set({
        isActive: this.isActive,
        customModes: this.customModes,
        activeRuleSetId: this.activeRuleSetId,
        sessions: this.sessions,
        currentSessionId: this.currentSessionId,
        sessionHistory: this.sessionHistory,
        sessionBlocks: this.sessionBlocks,
        focusedTime: this.focusedTime,
        grayscaleEnabled: grayscaleEnabled, // Save for content script initialization
        permanentRules: this.getAllPermanentRules(),
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
        action !== "clearInfo" &&
        action !== "modeSettings"
      ) {
        const beforeRules = this.getRulesFromData(
          before.customModes,
          before.activeRuleSetId,
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

  async createNewSession() {
    await this.ensureLoaded();
    // Create a new session without starting focus mode
    const now = Date.now();
    const sessionId = "session-" + now;
    const sessionDate = new Date(now);
    const defaultName = `Session ${sessionDate.toLocaleDateString()} ${sessionDate.toLocaleTimeString(
      [],
      { hour: "2-digit", minute: "2-digit" },
    )}`;

    // Reset session blocks counter for the new session
    this.sessionBlocks = 0;

    // Clear isActive flag from ALL sessions
    this.sessions.forEach((s) => {
      s.isActive = false;
    });

    const newSession = {
      id: sessionId,
      name: defaultName,
      ruleSetId: this.activeRuleSetId,
      startTime: now,
      blocksCount: 0,
      created: now,
      lastActive: now,
      isActive: false, // Session is created but not in focus mode
      focusedTime: 0,
      breakTime: 0,
      sessionStartTime: now,
      sessionFocusStartTime: null, // Not in focus mode yet
      sessionPauseStartTime: now, // Start in paused/break state
    };

    this.sessions.unshift(newSession);
    this.currentSessionId = sessionId;
    this.sessionTime = 0;

    // Update storage to reset the block counter for the new session
    await chrome.storage.local.set({ sessionBlocks: 0 });

    // Start session stats tracking (to track break time)
    this.startSessionStatsTracking();

    await this.saveState("createNewSession");
    this.updateUI();

    // Show feedback
    this.showNotification(
      "New session created! Click 'Start Producing' to begin.",
    );
  }

  async toggleProducing() {
    await this.ensureLoaded();
    const wasActive = this.isActive;
    this.isActive = !this.isActive;

    if (this.isActive) {
      // Check if there's an active mode selected
      const activeMode = this.activeRuleSetId
        ? this.customModes.find((m) => m.id === this.activeRuleSetId)
        : null;
      if (!activeMode) {
        this.isActive = false;
        this.showNotification(
          "No mode active. Create and activate a mode for Producer to work.",
          "error",
        );
        return;
      }

      // Starting focus mode - ensure there's an active session
      // Only create a new session if there's no active session selected
      if (!this.currentSessionId) {
        // Create a new session automatically
        this.sessionStartTime = Date.now();

        // Reset session blocks counter for the new session
        this.sessionBlocks = 0;

        // Clear isActive flag from ALL sessions
        this.sessions.forEach((s) => {
          s.isActive = false;
        });

        const sessionId = "session-" + Date.now();
        const sessionDate = new Date(this.sessionStartTime);
        const defaultName = `Session ${sessionDate.toLocaleDateString()} ${sessionDate.toLocaleTimeString(
          [],
          { hour: "2-digit", minute: "2-digit" },
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

        this.sessions.unshift(newSession);
        this.currentSessionId = sessionId;
        this.sessionTime = 0;

        // Update storage to reset the block counter for the new session
        await chrome.storage.local.set({ sessionBlocks: 0 });

        // Start session stats tracking
        this.startSessionStatsTracking();
      } else {
        // Continue with existing session
        this.sessionStartTime = Date.now();

        // Clear isActive flag from ALL sessions first
        this.sessions.forEach((s) => {
          s.isActive = false;
        });

        const currentSession = this.sessions.find(
          (s) => s.id === this.currentSessionId,
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

      // Block counter now tracks only fresh blocked accesses.
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
          (s) => s.id === this.currentSessionId,
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

    await this.saveState("toggleProducing");

    // Apply or remove grayscale filter based on focus mode state
    // This happens AFTER saveState so storage is updated first
    if (this.isActive) {
      const activeMode = this.customModes.find(
        (mode) => mode.id === this.activeRuleSetId,
      );
      if (activeMode?.settings?.grayscaleEnabled) {
        await this.broadcastGrayscaleState(true);
      }
    } else {
      // Remove grayscale filter when focus mode stops
      await this.broadcastGrayscaleState(false);
    }

    this.updateUI();

    // Show feedback
    this.showNotification(
      this.isActive ? "Focus activated!" : "Focus deactivated",
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
    this.blockedCount.textContent = String(this.sessionBlocks || 0);
    // Note: focusedTimeEl is updated in updateCurrentSessionStats() for real-time updates

    // Update stats tab session blocks element
    if (this.sessionBlocksEl) {
      this.sessionBlocksEl.textContent = String(this.sessionBlocks || 0);
    }

    // Update current session's blocksCount from sessionBlocks (source of truth)
    if (this.currentSessionId) {
      const currentSession = this.sessions.find(
        (s) => s.id === this.currentSessionId,
      );
      if (currentSession) {
        currentSession.blocksCount = this.sessionBlocks;
      }
    }

    // Update Current Session section blocks count
    if (this.currentSessionBlocksCount) {
      this.currentSessionBlocksCount.textContent = String(
        this.sessionBlocks || 0,
      );
    }

    // Update stats in stats tab - Total Blocks across all sessions
    if (this.totalBlockedCountEl) {
      const totalBlocks = this.sessions.reduce(
        (sum, s) => sum + (s.blocksCount || 0),
        0,
      );
      this.totalBlockedCountEl.textContent = String(totalBlocks);
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
      this.showNotification("No mode selected", "error");
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
      this.urlInput.value = ""; // Clear invalid input
      return;
    }

    // Clean and validate URL
    const cleanUrl = this.cleanUrl(url);

    // Check if trying to add wildcard "*" rule when one already exists
    if (cleanUrl === "*" && (type === "domain" || type === "url")) {
      // Find the rule set
      let ruleSet;
      if (this.isCreatingNewRuleSet && this.tempRuleSet) {
        ruleSet = this.tempRuleSet;
      } else {
        ruleSet = this.customModes.find(
          (rs) => rs.id === this.currentEditingRuleSetId,
        );
      }

      if (ruleSet) {
        // Check if a wildcard rule already exists (in either domain or url type)
        const wildcardExists = ruleSet.rules.some(
          (rule) =>
            rule.url === "*" && (rule.type === "domain" || rule.type === "url"),
        );

        if (wildcardExists) {
          this.showNotification(
            "'Block All Websites' rule already exists",
            "error",
          );
          this.urlInput.value = ""; // Clear input
          return;
        }
      }
    }

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
        if (this.paramKeyInput) this.paramKeyInput.value = ""; // Clear input
        if (this.paramValueInput) this.paramValueInput.value = ""; // Clear input
        return;
      }
    }

    // Find the rule set (from temp if creating, otherwise from custom modes)
    let ruleSet;
    if (this.isCreatingNewRuleSet && this.tempRuleSet) {
      ruleSet = this.tempRuleSet;
    } else {
      ruleSet = this.customModes.find(
        (rs) => rs.id === this.currentEditingRuleSetId,
      );
    }

    if (!ruleSet) {
      this.showNotification("Mode not found", "error");
      return;
    }

    // Check for duplicates - prevent same URL across all rule types
    if (type !== "allowParam") {
      // For domain/url/allow rules, check if URL already exists in any rule type
      const existingRule = ruleSet.rules.find(
        (rule) => rule.type !== "allowParam" && rule.url === cleanUrl,
      );

      if (existingRule) {
        const existingTypeLabel = this.formatRuleType(existingRule);
        this.showNotification(
          `URL already added as "${existingTypeLabel}"`,
          "error",
        );
        this.urlInput.value = ""; // Clear input
        return;
      }
    } else {
      // For allowParam rules, check for exact param match
      const exists = ruleSet.rules.some(
        (rule) =>
          rule.type === "allowParam" &&
          rule.paramKey === paramKey &&
          rule.paramValue === paramValue,
      );

      if (exists) {
        this.showNotification("Parameter rule already exists", "error");
        if (this.paramKeyInput) this.paramKeyInput.value = ""; // Clear input
        if (this.paramValueInput) this.paramValueInput.value = ""; // Clear input
        return;
      }
    }

    // Add rule — set URL or parameters based on rule type
    const rule: Rule =
      type === "allowParam"
        ? {
            id: Date.now(),
            type: "allowParam",
            created: new Date().toISOString(),
            paramKey,
            paramValue,
          }
        : {
            id: Date.now(),
            type: type as UrlRule["type"],
            created: new Date().toISOString(),
            url: cleanUrl,
          };

    ruleSet.rules.push(rule);
    this.urlInput.value = "";

    // Only save state if not creating (temp changes don't get saved until confirmation)
    if (!this.isCreatingNewRuleSet) {
      this.saveState();
    }
    this.updateUI();

    this.showNotification("Rule added successfully!");
  }

  removeRule(ruleId: number | undefined) {
    if (!this.currentEditingRuleSetId) return;

    // Find the rule set (from temp if creating, otherwise from custom modes)
    let ruleSet;
    if (this.isCreatingNewRuleSet && this.tempRuleSet) {
      ruleSet = this.tempRuleSet;
    } else {
      ruleSet = this.customModes.find(
        (rs) => rs.id === this.currentEditingRuleSetId,
      );
    }

    if (!ruleSet) return;

    ruleSet.rules = ruleSet.rules.filter((rule) => rule.id !== ruleId);

    // Only save state if not creating (temp changes don't get saved until confirmation)
    if (!this.isCreatingNewRuleSet) {
      this.saveState();
    }
    this.updateUI();
    this.renderRulesPreview(); // Ensure preview updates immediately
    this.showNotification("Rule removed");
  }

  editRuleUrlInline(rule: UrlRule, urlElement: HTMLElement) {
    if (!this.currentEditingRuleSetId) return;

    // Don't allow editing allowParam rules (they have paramKey/paramValue)
    if ((rule.type as string) === "allowParam") {
      this.showNotification(
        "Parameter rules cannot be edited. Please delete and re-add.",
        "error",
      );
      return;
    }

    // Create input element
    const input = document.createElement("input");
    input.type = "text";
    input.value = rule.url;
    input.style.width = "100%";
    input.style.fontSize = "inherit";
    input.style.fontWeight = "inherit";
    input.style.padding = "4px 8px";
    input.style.background = "rgba(255, 255, 255, 0.1)";
    input.style.border = "1px solid rgba(255, 255, 255, 0.3)";
    input.style.borderRadius = "6px";
    input.style.color = "white";

    const saveEdit = () => {
      const newUrl = input.value.trim();
      if (!newUrl) {
        this.showNotification("URL cannot be empty", "error");
        cancelEdit();
        return;
      }

      const cleanedUrl = this.cleanUrl(newUrl);

      // Validate URL
      if (!this.isValidUrl(cleanedUrl)) {
        this.showNotification("Invalid URL format", "error");
        cancelEdit();
        return;
      }

      // Check if URL is different
      if (cleanedUrl !== rule.url) {
        // Find the rule set
        let ruleSet;
        if (this.isCreatingNewRuleSet && this.tempRuleSet) {
          ruleSet = this.tempRuleSet;
        } else {
          ruleSet = this.customModes.find(
            (rs) => rs.id === this.currentEditingRuleSetId,
          );
        }

        if (ruleSet) {
          // Find and update the rule
          const ruleToEdit = ruleSet.rules.find((r) => r.id === rule.id);
          if (ruleToEdit && ruleToEdit.type !== "allowParam") {
            ruleToEdit.url = cleanedUrl;
            rule.url = cleanedUrl; // Update the rule reference too

            // Only save state if not creating (temp changes don't get saved until confirmation)
            if (!this.isCreatingNewRuleSet) {
              this.saveState();
            }
            this.updateUI();
            this.renderRulesPreview();
            this.showNotification("Rule updated!");
          }
        }
      }

      // Restore original element with updated URL
      urlElement.textContent = this.formatUrl(rule.url);
      urlElement.title = rule.url;
      urlElement.style.display = "";
      input.remove();
    };

    const cancelEdit = () => {
      urlElement.textContent = this.formatUrl(rule.url);
      urlElement.style.display = "";
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

    urlElement.style.display = "none";
    urlElement.parentNode!.insertBefore(input, urlElement);
    input.focus();
    input.select();
  }

  editParamRuleInline(rule: ParamRule, urlElement: HTMLElement) {
    if (!this.currentEditingRuleSetId) return;

    // Create container for both inputs
    const container = document.createElement("div");
    container.style.display = "flex";
    container.style.gap = "4px";
    container.style.alignItems = "center";
    container.style.width = "100%";

    // Create question mark span
    const questionMark = document.createElement("span");
    questionMark.textContent = "?";
    questionMark.style.color = "white";
    questionMark.style.fontSize = "inherit";
    questionMark.style.fontWeight = "inherit";

    // Create key input
    const keyInput = document.createElement("input");
    keyInput.type = "text";
    keyInput.value = rule.paramKey || "";
    keyInput.placeholder = "key";
    keyInput.style.flex = "1";
    keyInput.style.fontSize = "inherit";
    keyInput.style.fontWeight = "inherit";
    keyInput.style.padding = "4px 8px";
    keyInput.style.background = "rgba(255, 255, 255, 0.1)";
    keyInput.style.border = "1px solid rgba(255, 255, 255, 0.3)";
    keyInput.style.borderRadius = "6px";
    keyInput.style.color = "white";
    keyInput.style.minWidth = "50px";

    // Create equals sign span
    const equalsSign = document.createElement("span");
    equalsSign.textContent = "=";
    equalsSign.style.color = "white";
    equalsSign.style.fontSize = "inherit";
    equalsSign.style.fontWeight = "inherit";

    // Create value input
    const valueInput = document.createElement("input");
    valueInput.type = "text";
    valueInput.value = rule.paramValue || "";
    valueInput.placeholder = "value";
    valueInput.style.flex = "1";
    valueInput.style.fontSize = "inherit";
    valueInput.style.fontWeight = "inherit";
    valueInput.style.padding = "4px 8px";
    valueInput.style.background = "rgba(255, 255, 255, 0.1)";
    valueInput.style.border = "1px solid rgba(255, 255, 255, 0.3)";
    valueInput.style.borderRadius = "6px";
    valueInput.style.color = "white";
    valueInput.style.minWidth = "50px";

    const saveEdit = () => {
      const newKey = keyInput.value.trim();
      const newValue = valueInput.value.trim();

      if (!newKey) {
        this.showNotification("Parameter key cannot be empty", "error");
        cancelEdit();
        return;
      }

      // Check if values changed
      if (newKey !== rule.paramKey || newValue !== rule.paramValue) {
        // Find the rule set
        let ruleSet;
        if (this.isCreatingNewRuleSet && this.tempRuleSet) {
          ruleSet = this.tempRuleSet;
        } else {
          ruleSet = this.customModes.find(
            (rs) => rs.id === this.currentEditingRuleSetId,
          );
        }

        if (ruleSet) {
          // Find and update the rule
          const ruleToEdit = ruleSet.rules.find((r) => r.id === rule.id);
          if (ruleToEdit && ruleToEdit.type === "allowParam") {
            ruleToEdit.paramKey = newKey;
            ruleToEdit.paramValue = newValue;
            rule.paramKey = newKey; // Update the rule reference too
            rule.paramValue = newValue;

            // Only save state if not creating (temp changes don't get saved until confirmation)
            if (!this.isCreatingNewRuleSet) {
              this.saveState();
            }
            this.updateUI();
            this.renderRulesPreview();
            this.showNotification("Parameter rule updated!");
          }
        }
      }

      // Restore original element with updated values
      const paramText = `?${rule.paramKey}=${rule.paramValue || "any"}`;
      urlElement.textContent = paramText;
      urlElement.title = paramText;
      urlElement.style.display = "";
      container.remove();
    };

    const cancelEdit = () => {
      const paramText = `?${rule.paramKey}=${rule.paramValue || "any"}`;
      urlElement.textContent = paramText;
      urlElement.style.display = "";
      container.remove();
    };

    // Add event listeners to both inputs
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        saveEdit();
      } else if (e.key === "Escape") {
        cancelEdit();
      } else if (e.key === "Tab") {
        // Allow tab to switch between inputs
        e.preventDefault();
        if (e.target === keyInput) {
          valueInput.focus();
          valueInput.select();
        } else {
          keyInput.focus();
          keyInput.select();
        }
      }
    };

    keyInput.addEventListener("blur", (e) => {
      // Only save if blur is not moving to the other input
      setTimeout(() => {
        if (
          document.activeElement !== keyInput &&
          document.activeElement !== valueInput
        ) {
          saveEdit();
        }
      }, 100);
    });

    valueInput.addEventListener("blur", (e) => {
      // Only save if blur is not moving to the other input
      setTimeout(() => {
        if (
          document.activeElement !== keyInput &&
          document.activeElement !== valueInput
        ) {
          saveEdit();
        }
      }, 100);
    });

    keyInput.addEventListener("keydown", handleKeydown);
    valueInput.addEventListener("keydown", handleKeydown);

    // Assemble container
    container.appendChild(questionMark);
    container.appendChild(keyInput);
    container.appendChild(equalsSign);
    container.appendChild(valueInput);

    urlElement.style.display = "none";
    urlElement.parentNode!.insertBefore(container, urlElement);
    keyInput.focus();
    keyInput.select();
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

    // Get rule set from temp if creating, otherwise from custom modes
    let ruleSet;
    if (this.isCreatingNewRuleSet && this.tempRuleSet) {
      ruleSet = this.tempRuleSet;
    } else {
      ruleSet = this.customModes.find(
        (rs) => rs.id === this.currentEditingRuleSetId,
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
      this.ruleCount.textContent = String(ruleSet.rules.length);
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
        <div class="empty-state" style="padding: 0 10px 10px; font-size: 11px;">
          No rules configured yet.<br>
          Add or import rules to get started!
        </div>
      `;
      return;
    }

    [...ruleSet.rules].reverse().forEach((rule) => {
      const item = document.createElement("div");
      item.className = "rule-item";
      if (rule.permanent) item.classList.add("rule-permanent");

      const info = document.createElement("div");
      info.className = "rule-info";

      const url = document.createElement("div");
      url.className = "rule-url";

      if (rule.type !== "allowParam") {
        const label = rule.url === "*" ? "(*) All Websites" : rule.url;
        url.title = label;
        item.title = label;
        url.textContent = this.formatUrl(rule.url);
        url.style.cursor = "pointer";
        url.addEventListener("dblclick", (e) => {
          e.stopPropagation();
          this.editRuleUrlInline(rule, url);
        });
      } else {
        const paramText = `?${rule.paramKey}=${rule.paramValue || "any"}`;
        url.textContent = paramText;
        url.title = paramText;
        item.title = paramText;
        url.style.cursor = "pointer";
        url.addEventListener("dblclick", (e) => {
          e.stopPropagation();
          this.editParamRuleInline(rule, url);
        });
      }

      const type = document.createElement("div");
      type.className = "rule-type";
      type.textContent = this.formatRuleType(rule);

      info.appendChild(url);
      info.appendChild(type);

      // Inline action buttons (permanent toggle + delete)
      const actionsWrap = document.createElement("div");
      actionsWrap.style.display = "flex";
      actionsWrap.style.alignItems = "center";
      actionsWrap.style.flexShrink = "0";

      if (rule.type === "domain" || rule.type === "url") {
        const permBtn = document.createElement("button");
        permBtn.className = "item-menu-btn";
        permBtn.innerHTML = rule.permanent
          ? '<i class="bi bi-lock-fill"></i>'
          : '<i class="bi bi-unlock"></i>';
        permBtn.title = rule.permanent ? "Remove permanent" : "Make permanent";
        if (rule.permanent) {
          permBtn.style.color = "rgba(241, 196, 15, 0.9)";
          permBtn.style.opacity = "1";
        }
        permBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          this.toggleRulePermanent(rule.id, this.currentEditingRuleSetId);
        });
        actionsWrap.appendChild(permBtn);
      }

      const deleteBtn = document.createElement("button");
      deleteBtn.className = "item-menu-btn";
      deleteBtn.innerHTML = '<i class="bi bi-trash"></i>';
      deleteBtn.title = "Delete rule";
      deleteBtn.style.color = "rgba(214, 69, 56, 1)";
      deleteBtn.style.opacity = "0.85";
      deleteBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.removeRule(rule.id);
      });
      actionsWrap.appendChild(deleteBtn);

      item.appendChild(info);
      item.appendChild(actionsWrap);
      this.rulesList.appendChild(item);
    });

    // Update rules preview when rules list changes
    this.renderRulesPreview();
  }

  cleanUrl(url: string): string {
    // Remove protocol if present, remove www prefix, and remove trailing slash
    return url
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .replace(/\/+$/, "");
  }

  isValidUrl(url: string): boolean {
    // Allow wildcard "*" to block all websites
    if (url === "*") return true;

    // Must have at least one character
    if (!url || url.length === 0) return false;

    // Reject URLs with spaces
    if (/\s/.test(url)) return false;

    // Reject consecutive dots
    if (url.includes("..")) return false;

    // Reject if starts or ends with invalid characters
    if (url.startsWith(".") || url.startsWith("-")) return false;
    if (url.endsWith(".")) return false;

    // Basic validation - allow alphanumeric, dots, hyphens, slashes, and common URL characters
    // More permissive to allow domains like "localhost", "example.com/path", etc.
    const urlPattern =
      /^[a-zA-Z0-9]([a-zA-Z0-9\-._\/\w~:?#[\]@!$&'()*+,;=%]*)?$/;
    return urlPattern.test(url);
  }

  formatUrl(url: string): string {
    // Show descriptive text for wildcard rule
    if (url === "*") return "* (All Websites)";

    return url.length > 35 ? url.substring(0, 35) + "..." : url;
  }

  formatRuleType(rule: Rule): string {
    // Show special indicator for wildcard block-all rule (both domain and url types)
    if (rule.url === "*" && (rule.type === "domain" || rule.type === "url")) {
      return "🌐 Block All Websites";
    }

    const typeMap: Record<string, string> = {
      domain: "🚫 Block Domain",
      url: "🎯 Block URL",
      allow: "✅ Allow URL",
      allowParam: "🔗 Allow with Parameter",
    };
    return typeMap[rule.type] || rule.type;
  }

  truncateText(text: string, maxLength: number): string {
    if (!text || text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength) + "...";
  }

  formatSessionDetailsText(
    ruleSetName: string,
    blocksCount: number,
    totalTime: number,
  ) {
    const hours = Math.floor(totalTime / 3600);
    const minutes = Math.floor((totalTime % 3600) / 60);
    const shortRuleSetName = this.truncateText(ruleSetName || "No Mode", 18);
    const detailsText = `${shortRuleSetName} \u2022 ${blocksCount} block${
      blocksCount !== 1 ? "s" : ""
    } \u2022 ${hours}h${minutes}m`;

    return this.truncateText(detailsText, 48);
  }

  showNotification(message: string, type: "success" | "error" = "success") {
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

  async importRules(file: File) {
    if (!this.currentEditingRuleSetId) {
      this.showNotification("No mode selected", "error");
      return;
    }

    try {
      // Read file contents
      const text = await file.text();
      const lines = text.split("\n");

      // Parse rules from file
      const validTypes = ["domain", "url", "allow", "allowParam"];
      const importedRules: Rule[] = [];
      let skippedCount = 0;
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;

        const [type, ...valueParts] = trimmed.split(" ");
        const value = valueParts.join(" ").trim();

        if (!type || !value) continue;

        // Reject unknown rule types so imports can't inject malformed entries.
        if (!validTypes.includes(type)) {
          skippedCount++;
          continue;
        }

        const id = Math.floor(Date.now() * Math.random());
        const created = new Date().toISOString();

        // Properly split query parameter rules
        if (type === "allowParam") {
          const [param, paramValue = ""] = value.split("=");
          const paramKey = param.trim();
          // Param keys/values must be plain query-token characters.
          const paramPattern = /^[a-zA-Z0-9\-._~]+$/;
          if (!paramKey || !paramPattern.test(paramKey)) {
            skippedCount++;
            continue;
          }
          const paramValueTrimmed = paramValue.trim();
          if (paramValueTrimmed && !paramPattern.test(paramValueTrimmed)) {
            skippedCount++;
            continue;
          }
          importedRules.push({
            id,
            created,
            type: "allowParam",
            paramKey,
            paramValue: paramValueTrimmed,
          });
        } else {
          const cleanedUrl = this.cleanUrl(value);
          // Validate against the same rules the manual Add flow enforces.
          if (!this.isValidUrl(cleanedUrl)) {
            skippedCount++;
            continue;
          }
          importedRules.push({
            id,
            created,
            type: type as UrlRule["type"],
            url: cleanedUrl,
          });
        }
      }

      // Find the rule set and update its rules (from temp if creating)
      let ruleSet;
      if (this.isCreatingNewRuleSet && this.tempRuleSet) {
        ruleSet = this.tempRuleSet;
      } else {
        ruleSet = this.customModes.find(
          (rs) => rs.id === this.currentEditingRuleSetId,
        );
      }

      if (!ruleSet) {
        this.showNotification("Mode not found", "error");
        return;
      }

      // Don't wipe existing rules if the file had nothing importable.
      if (importedRules.length === 0) {
        this.showNotification(
          skippedCount > 0
            ? "No valid rules found in file"
            : "No rules found in file",
          "error",
        );
        return;
      }

      ruleSet.rules = importedRules;

      // Only save state if not creating (temp changes don't get saved until confirmation)
      if (!this.isCreatingNewRuleSet) {
        await this.saveState("import");
      }
      this.updateUI();

      // If All Rules view is visible, re-render it
      if (this.allRulesView && this.allRulesView.style.display !== "none") {
        this.renderAllRulesList();
      }

      if (skippedCount > 0) {
        this.showNotification(
          `Imported ${importedRules.length} rule(s); skipped ${skippedCount} invalid`,
          "success",
        );
      } else {
        this.showNotification("Rules imported successfully", "success");
      }
    } catch (err) {
      console.error("Failed to import rules:", err);
      this.showNotification("Failed to import rules", "error");
    }
  }

  exportRules() {
    if (!this.currentEditingRuleSetId) {
      this.showNotification("No mode selected", "error");
      return;
    }

    // Find the rule set (from temp if creating)
    let ruleSet;
    if (this.isCreatingNewRuleSet && this.tempRuleSet) {
      ruleSet = this.tempRuleSet;
    } else {
      ruleSet = this.customModes.find(
        (rs) => rs.id === this.currentEditingRuleSetId,
      );
    }

    if (!ruleSet || ruleSet.rules.length === 0) {
      this.showNotification("No rules to export", "error");
      return;
    }

    const lines = ruleSet.rules.map((rule) =>
      rule.type === "allowParam"
        ? `${rule.type} ${rule.paramKey}=${rule.paramValue}`
        : `${rule.type} ${rule.url}`,
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
      this.showNotification("No mode selected", "error");
      return;
    }

    // Find the rule set (from temp if creating)
    let ruleSet;
    if (this.isCreatingNewRuleSet && this.tempRuleSet) {
      ruleSet = this.tempRuleSet;
    } else {
      ruleSet = this.customModes.find(
        (rs) => rs.id === this.currentEditingRuleSetId,
      );
    }

    if (!ruleSet || ruleSet.rules.length === 0) {
      this.showNotification("No rules to clear", "error");
      return;
    }

    const rulesLabel = `${ruleSet.rules.length} rule${ruleSet.rules.length !== 1 ? "s" : ""}`;
    this._showConfirmModal({
      title: "Clear All Rules",
      message: `All ${rulesLabel} in this mode will be permanently deleted. This cannot be undone.`,
      confirmText: "Clear All",
      onConfirm: () => {
        ruleSet.rules = [];

        // Only save state if not creating (temp changes don't get saved until confirmation)
        if (!this.isCreatingNewRuleSet) {
          this.saveState();
        }
        this.updateUI();

        // If All Rules view is visible, re-render it
        if (this.allRulesView && this.allRulesView.style.display !== "none") {
          this.renderAllRulesList();
        }

        this.showNotification("All rules cleared");
      },
    });
  }

  async clearInfo(sessionId: string) {
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

    this._showConfirmModal({
      title: "Clear Session Stats",
      message: `Reset all time and block count for "${session.name}" to zero? This cannot be undone.`,
      confirmText: "Clear Stats",
      onConfirm: () => {
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
      },
    });
  }

  // Helper methods
  getActiveRules(): Rule[] {
    if (!this.activeRuleSetId) return [];
    const ruleSet = this.customModes.find(
      (rs) => rs.id === this.activeRuleSetId,
    );
    return ruleSet ? ruleSet.rules : [];
  }

  getRulesFromData(
    customModes: Mode[] | undefined,
    activeRuleSetId: string | null | undefined,
  ): Rule[] {
    if (!activeRuleSetId || !customModes) return [];
    const ruleSet = customModes.find((rs) => rs.id === activeRuleSetId);
    return ruleSet ? ruleSet.rules : [];
  }

  getAllPermanentRules(): Rule[] {
    const permanentRules: Rule[] = [];
    this.customModes.forEach((mode) => {
      mode.rules.forEach((rule) => {
        if (rule.permanent && (rule.type === "domain" || rule.type === "url")) {
          permanentRules.push({ ...rule });
        }
      });
    });
    return permanentRules;
  }

  toggleRulePermanent(
    ruleId: number | undefined,
    ruleSetId: string | null,
  ) {
    const ruleSet = this.customModes.find((rs) => rs.id === ruleSetId);
    if (!ruleSet) return;
    const rule = ruleSet.rules.find((r) => r.id === ruleId);
    if (!rule || (rule.type !== "domain" && rule.type !== "url")) return;

    const permanentRulesBefore = this.getAllPermanentRules();
    const newPermanent = !rule.permanent;

    // Apply the same permanent flag to every rule across all modes that
    // shares the same type and URL (so modes stay in sync)
    this.customModes.forEach((mode) => {
      mode.rules.forEach((r) => {
        if (r.type === rule.type && r.url === rule.url) {
          r.permanent = newPermanent;
        }
      });
    });

    const permanentRulesAfter = this.getAllPermanentRules();

    chrome.storage.local.set({
      customModes: this.customModes,
      permanentRules: permanentRulesAfter,
    });

    const activeRules = this.getActiveRules();
    chrome.runtime.sendMessage({
      action: "reloadAffectedTabs",
      rulesBefore: activeRules,
      rulesAfter: activeRules,
      isActiveBefore: this.isActive,
      isActiveAfter: this.isActive,
      permanentRulesBefore,
      permanentRulesAfter,
    });

    this.renderRulesList();
    this.renderAllRulesList();
    this.showNotification(
      newPermanent ? "Rule is now permanent" : "Rule is no longer permanent",
    );
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
    // Create a temporary rule set with default settings
    this.tempRuleSet = {
      id: "temp-" + Date.now(),
      name: "",
      rules: [],
      settings: {
        grayscaleEnabled: false,
      },
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
      this.showNotification("Configure a mode to save", "error");
      return;
    }

    const name = this.ruleSetNameInput.value.trim();
    if (!name) {
      this.showNotification("Please enter a name for the mode", "error");
      return;
    }

    // Check if a mode with this name already exists
    const nameExists = this.customModes.some((rs) => rs.name === name);
    if (nameExists) {
      this.showNotification("A mode with this name already exists", "error");
      return;
    }

    // Update temp rule set name
    this.tempRuleSet.name = name;

    // Generate proper ID
    this.tempRuleSet.id = "ruleset-" + Date.now();

    // Add to custom modes
    this.customModes.push(this.tempRuleSet);

    // Auto-activate if no active rule set exists
    if (!this.activeRuleSetId) {
      this.activeRuleSetId = this.tempRuleSet.id;

      // Update current session's rule set if there's an active session
      if (this.currentSessionId) {
        const currentSession = this.sessions.find(
          (s) => s.id === this.currentSessionId,
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
      this.activeRuleSetId === this.customModes[this.customModes.length - 1].id
        ? " and selected"
        : "";
    this.showNotification(
      `Custom mode successfully saved${activationMessage}!`,
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

  deleteRuleSet(id: string) {
    const ruleSet = this.customModes.find((rs) => rs.id === id);
    if (!ruleSet) return;

    const rulesLabel = `${ruleSet.rules.length} rule${ruleSet.rules.length !== 1 ? "s" : ""}`;
    this._showConfirmModal({
      title: "Delete Mode",
      message: `"${ruleSet.name}" and its ${rulesLabel} will be permanently deleted.`,
      confirmText: "Delete",
      onConfirm: () => {
        if (this.activeRuleSetId === id) this.activeRuleSetId = null;
        this.customModes = this.customModes.filter((rs) => rs.id !== id);
        this.saveState();
        this.updateUI();
        this.showNotification("Mode deleted");
      },
    });
  }

  duplicateRuleSet(id: string) {
    const ruleSet = this.customModes.find((rs) => rs.id === id);
    if (!ruleSet) return;

    const clone = {
      ...ruleSet,
      id: "ruleset-" + Date.now(),
      name: ruleSet.name + " (Copy)",
      rules: ruleSet.rules.map((r) => ({
        ...r,
        id: Date.now() + Math.random(),
      })),
      settings: ruleSet.settings ? { ...ruleSet.settings } : undefined,
    };

    const originalIndex = this.customModes.findIndex((rs) => rs.id === id);
    this.customModes.splice(originalIndex + 1, 0, clone);
    this.activeRuleSetId = clone.id;
    this.saveState();
    this.updateUI();
    this.showNotification(`"${clone.name}" duplicated and activated`);
  }

  editRuleSet(id: string) {
    this.currentEditingRuleSetId = id;
    this.showRulesEditView();

    // Populate name after inputs are cleared
    const ruleSet = this.customModes.find((rs) => rs.id === id);
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

    const ruleSet = this.customModes.find(
      (rs) => rs.id === this.currentEditingRuleSetId,
    );
    if (!ruleSet) return;

    ruleSet.name = newName;
    this.saveState();
    this.updateUI();
    this.showNotification("Name saved!");
  }

  activateRuleSet(ruleSetId: string) {
    if (!ruleSetId) return;

    const ruleSet = this.customModes.find((rs) => rs.id === ruleSetId);
    if (!ruleSet) return;

    this.activeRuleSetId = ruleSetId;

    // Update lastActivated timestamp for sorting
    ruleSet.lastActivated = Date.now();

    // Update current session's rule set if there's an active session
    if (this.currentSessionId) {
      const currentSession = this.sessions.find(
        (s) => s.id === this.currentSessionId,
      );
      if (currentSession) {
        currentSession.ruleSetId = this.activeRuleSetId;
      }
    }

    this.saveState();
    this.updateUI();
    this.showNotification(`Mode "${ruleSet.name}" selected!`);

    // Reload affected tabs with the new rules
    chrome.runtime.sendMessage({ action: "reloadAffectedTabs" });
  }

  deactivateRuleSet() {
    this.activeRuleSetId = null;

    // Update current session's rule set if there's an active session
    if (this.currentSessionId) {
      const currentSession = this.sessions.find(
        (s) => s.id === this.currentSessionId,
      );
      if (currentSession) {
        currentSession.ruleSetId = null;
      }
    }

    this.saveState();
    this.updateUI();
    this.showNotification("Mode unselected!");

    // Reload affected tabs to remove blocking
    chrome.runtime.sendMessage({ action: "reloadAffectedTabs" });
  }

  showRulesMainView() {
    if (this.rulesMainView) this.rulesMainView.style.display = "block";
    if (this.rulesEditView) this.rulesEditView.style.display = "none";
    if (this.allRulesView) this.allRulesView.style.display = "none";
    if (this.modeSettingsView) this.modeSettingsView.style.display = "none";
    this.currentEditingRuleSetId = null;
    this.isCreatingNewRuleSet = false;
    this.tempRuleSet = null;
    this.resetScrollPosition(document.getElementById("tab-rules"));
  }

  showAllRulesView() {
    if (!this.currentEditingRuleSetId) {
      this.showNotification("No mode selected", "error");
      return;
    }

    if (this.rulesMainView) this.rulesMainView.style.display = "none";
    if (this.rulesEditView) this.rulesEditView.style.display = "none";
    if (this.allRulesView) this.allRulesView.style.display = "block";
    if (this.modeSettingsView) this.modeSettingsView.style.display = "none";

    this.renderAllRulesList();
    this.resetScrollPosition(document.getElementById("tab-rules"));
  }

  renderAllRulesList() {
    if (!this.allRulesList) return;

    this.allRulesList.innerHTML = "";

    if (!this.currentEditingRuleSetId) {
      this.allRulesList.innerHTML = `
        <div class="empty-state">
          No mode selected.<br>
          Select a mode to view its rules.
        </div>
      `;
      // Center the empty state
      if (this.allRulesViewScrollContainer) {
        this.allRulesViewScrollContainer.style.display = "flex";
        this.allRulesViewScrollContainer.style.justifyContent = "center";
        this.allRulesViewScrollContainer.style.alignItems = "center";
      }
      // Hide all buttons except import when no mode selected
      if (this.addRuleAllViewBtn) this.addRuleAllViewBtn.style.display = "none";
      if (this.exportRulesAllViewBtn)
        this.exportRulesAllViewBtn.style.display = "none";
      if (this.clearRulesAllViewBtn)
        this.clearRulesAllViewBtn.style.display = "none";
      if (this.importRulesAllViewBtn)
        this.importRulesAllViewBtn.style.flex = "";
      return;
    }

    // Get rule set from temp if creating, otherwise from custom modes
    let ruleSet;
    if (this.isCreatingNewRuleSet && this.tempRuleSet) {
      ruleSet = this.tempRuleSet;
    } else {
      ruleSet = this.customModes.find(
        (rs) => rs.id === this.currentEditingRuleSetId,
      );
    }

    if (!ruleSet) {
      this.allRulesList.innerHTML = `
        <div class="empty-state">
          Mode not found.
        </div>
      `;
      // Center the empty state
      if (this.allRulesViewScrollContainer) {
        this.allRulesViewScrollContainer.style.display = "flex";
        this.allRulesViewScrollContainer.style.justifyContent = "center";
        this.allRulesViewScrollContainer.style.alignItems = "center";
      }
      // Hide all buttons except import when mode not found
      if (this.addRuleAllViewBtn) this.addRuleAllViewBtn.style.display = "none";
      if (this.exportRulesAllViewBtn)
        this.exportRulesAllViewBtn.style.display = "none";
      if (this.clearRulesAllViewBtn)
        this.clearRulesAllViewBtn.style.display = "none";
      if (this.importRulesAllViewBtn)
        this.importRulesAllViewBtn.style.flex = "";
      return;
    }

    if (ruleSet.rules.length === 0) {
      this.allRulesList.innerHTML = `
        <div class="empty-state">
          No rules configured yet.<br>
          Add or import rules to get started!
        </div>
      `;
      // Center the empty state
      if (this.allRulesViewScrollContainer) {
        this.allRulesViewScrollContainer.style.display = "flex";
        this.allRulesViewScrollContainer.style.justifyContent = "center";
        this.allRulesViewScrollContainer.style.alignItems = "center";
      }
      // Show Add Rule + Import buttons (50% each) when no rules
      if (this.addRuleAllViewBtn) {
        this.addRuleAllViewBtn.style.display = "inline-flex";
        this.addRuleAllViewBtn.style.flex = "1";
      }
      if (this.importRulesAllViewBtn) {
        this.importRulesAllViewBtn.style.flex = "1";
      }
      if (this.exportRulesAllViewBtn)
        this.exportRulesAllViewBtn.style.display = "none";
      if (this.clearRulesAllViewBtn)
        this.clearRulesAllViewBtn.style.display = "none";
      return;
    }

    // Remove centering for rules list (normal vertical scrolling)
    if (this.allRulesViewScrollContainer) {
      this.allRulesViewScrollContainer.style.display = "block";
      this.allRulesViewScrollContainer.style.justifyContent = "";
      this.allRulesViewScrollContainer.style.alignItems = "";
    }

    // Show Import + Export + Delete All buttons (33.3% each) when rules exist
    if (this.addRuleAllViewBtn) this.addRuleAllViewBtn.style.display = "none";
    if (this.importRulesAllViewBtn) this.importRulesAllViewBtn.style.flex = "";
    if (this.exportRulesAllViewBtn)
      this.exportRulesAllViewBtn.style.display = "inline-flex";
    if (this.clearRulesAllViewBtn)
      this.clearRulesAllViewBtn.style.display = "inline-flex";

    [...ruleSet.rules]
      .slice()
      .reverse()
      .forEach((rule, displayIndex) => {
        const index = ruleSet.rules.length - 1 - displayIndex;
        const item = document.createElement("div");
        item.className = "rule-item";
        if (rule.permanent) item.classList.add("rule-permanent");
        item.draggable = true;
        item.dataset.index = String(index);

        const dragHandle = document.createElement("span");
        dragHandle.className = "drag-handle";
        dragHandle.innerHTML = '<i class="bi bi-grip-vertical"></i>';
        dragHandle.title = "Drag to reorder";

        const info = document.createElement("div");
        info.className = "rule-info";

        const url = document.createElement("div");
        url.className = "rule-url";

        if (rule.type !== "allowParam") {
          const label = rule.url === "*" ? "(*) All Websites" : rule.url;
          url.title = label;
          item.title = label;
          url.textContent = this.formatUrl(rule.url);
          url.style.cursor = "pointer";
          url.addEventListener("dblclick", (e) => {
            e.stopPropagation();
            this.editRuleUrlInline(rule, url);
          });
        } else {
          const paramText = `?${rule.paramKey}=${rule.paramValue || "any"}`;
          url.textContent = paramText;
          url.title = paramText;
          item.title = paramText;
          url.style.cursor = "pointer";
          url.addEventListener("dblclick", (e) => {
            e.stopPropagation();
            this.editParamRuleInline(rule, url);
          });
        }

        const type = document.createElement("div");
        type.className = "rule-type";
        type.textContent = this.formatRuleType(rule);

        info.appendChild(url);
        info.appendChild(type);

        // Inline action buttons (permanent toggle + delete)
        const actionsWrap = document.createElement("div");
        actionsWrap.style.display = "flex";
        actionsWrap.style.alignItems = "center";
        actionsWrap.style.flexShrink = "0";

        if (rule.type === "domain" || rule.type === "url") {
          const permBtn = document.createElement("button");
          permBtn.className = "item-menu-btn";
          permBtn.innerHTML = rule.permanent
            ? '<i class="bi bi-lock-fill"></i>'
            : '<i class="bi bi-unlock"></i>';
          permBtn.title = rule.permanent
            ? "Remove permanent"
            : "Make permanent";
          if (rule.permanent) {
            permBtn.style.color = "rgba(241, 196, 15, 0.9)";
            permBtn.style.opacity = "1";
          }
          permBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            this.toggleRulePermanent(rule.id, this.currentEditingRuleSetId);
          });
          actionsWrap.appendChild(permBtn);
        }

        const deleteBtn = document.createElement("button");
        deleteBtn.className = "item-menu-btn";
        deleteBtn.innerHTML = '<i class="bi bi-trash"></i>';
        deleteBtn.title = "Delete rule";
        deleteBtn.style.color = "rgba(214, 69, 56, 1)";
        deleteBtn.style.opacity = "0.85";
        deleteBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          this.removeRule(rule.id);
          this.renderAllRulesList();
        });
        actionsWrap.appendChild(deleteBtn);

        // Drag-and-drop
        item.addEventListener("dragstart", (e) => {
          e.dataTransfer!.effectAllowed = "move";
          e.dataTransfer!.setData("text/plain", String(index));
          setTimeout(() => item.classList.add("is-dragging"), 0);
        });
        item.addEventListener("dragend", () => {
          item.classList.remove("is-dragging");
          this.allRulesList
            .querySelectorAll(".drag-over")
            .forEach((el) => el.classList.remove("drag-over"));
        });
        item.addEventListener("dragenter", (e) => {
          e.preventDefault();
          e.stopPropagation();
        });
        item.addEventListener("dragover", (e) => {
          e.preventDefault();
          e.stopPropagation();
          e.dataTransfer!.dropEffect = "move";
          this.allRulesList
            .querySelectorAll(".drag-over")
            .forEach((el) => el.classList.remove("drag-over"));
          item.classList.add("drag-over");
        });
        item.addEventListener("dragleave", (e) => {
          if (!item.contains(e.relatedTarget as Node | null))
            item.classList.remove("drag-over");
        });
        item.addEventListener("drop", (e) => {
          e.preventDefault();
          e.stopPropagation();
          item.classList.remove("drag-over");
          const fromIndex = parseInt(e.dataTransfer!.getData("text/plain"), 10);
          const toIndex = index;
          if (fromIndex === toIndex) return;
          const moved = ruleSet.rules.splice(fromIndex, 1)[0];
          ruleSet.rules.splice(toIndex, 0, moved);
          this.saveState();
          this.renderAllRulesList();
        });

        item.appendChild(dragHandle);
        item.appendChild(info);
        item.appendChild(actionsWrap);
        this.allRulesList.appendChild(item);
      });

    this._attachListReorderDrop(this.allRulesList, ".rule-item", (fromIndex, toIndex) => {
      const moved = ruleSet.rules.splice(fromIndex, 1)[0];
      ruleSet.rules.splice(toIndex, 0, moved);
      this.saveState();
      this.renderAllRulesList();
    });
  }

  showRulesEditView() {
    // Clear all inputs first to ensure clean state
    this.clearAllInputs();

    if (this.rulesMainView) this.rulesMainView.style.display = "none";
    if (this.rulesEditView) this.rulesEditView.style.display = "block";
    if (this.allRulesView) this.allRulesView.style.display = "none";
    if (this.modeSettingsView) this.modeSettingsView.style.display = "none";

    // Show/hide name section and appropriate buttons based on whether we're creating or editing
    if (this.isCreatingNewRuleSet) {
      // Show name section when creating
      if (this.ruleSetNameSection) {
        this.ruleSetNameSection.style.display = "block";
      }
      // Show save/cancel buttons, show first back button, hide second back button
      if (this.ruleSetActionButtons) {
        this.ruleSetActionButtons.style.display = "flex";
      }
      if (this.backToRuleSetListBtn) {
        this.backToRuleSetListBtn.style.display = "block";
      }
      if (this.backToRuleSetListBtn2) {
        this.backToRuleSetListBtn2.style.display = "none";
      }
    } else {
      // Hide name section when editing
      if (this.ruleSetNameSection) {
        this.ruleSetNameSection.style.display = "none";
      }
      // Hide save/cancel buttons, hide first back button, show second back button
      if (this.ruleSetActionButtons) {
        this.ruleSetActionButtons.style.display = "none";
      }
      if (this.backToRuleSetListBtn) {
        this.backToRuleSetListBtn.style.display = "none";
      }
      if (this.backToRuleSetListBtn2) {
        this.backToRuleSetListBtn2.style.display = "block";
      }
    }

    this.updateUI();
    this.loadModeSettings(); // Load mode settings when showing edit view
    this.renderRulesPreview(); // Render rules preview
    this.resetScrollPosition(document.getElementById("tab-rules"));
  }

  showModeSettingsView() {
    // Show the mode settings configuration view
    if (this.rulesEditView) this.rulesEditView.style.display = "none";
    if (this.allRulesView) this.allRulesView.style.display = "none";
    if (this.modeSettingsView) this.modeSettingsView.style.display = "block";
    this.loadModeSettingsToView();
    this.resetScrollPosition(document.getElementById("tab-rules"));
  }

  showModeEditFromSettings() {
    // Go back to mode edit view from settings
    if (this.modeSettingsView) this.modeSettingsView.style.display = "none";
    if (this.allRulesView) this.allRulesView.style.display = "none";
    if (this.rulesEditView) this.rulesEditView.style.display = "block";
    this.resetScrollPosition(document.getElementById("tab-rules"));
  }

  loadModeSettingsToView() {
    // Load settings from the current rule set into the view elements
    let ruleSet;
    if (this.isCreatingNewRuleSet && this.tempRuleSet) {
      ruleSet = this.tempRuleSet;
    } else {
      ruleSet = this.customModes.find(
        (rs) => rs.id === this.currentEditingRuleSetId,
      );
    }

    if (ruleSet && ruleSet.settings) {
      if (this.modeGrayscaleToggleView) {
        this.modeGrayscaleToggleView.checked =
          ruleSet.settings.grayscaleEnabled || false;
      }
    }
  }

  async saveModeSettingsFromView() {
    // Save mode settings from the view to the mode object
    let ruleSet;
    if (this.isCreatingNewRuleSet && this.tempRuleSet) {
      ruleSet = this.tempRuleSet;
    } else {
      ruleSet = this.customModes.find(
        (rs) => rs.id === this.currentEditingRuleSetId,
      );
    }

    if (!ruleSet) return;

    // Initialize settings if they don't exist
    if (!ruleSet.settings) {
      ruleSet.settings = {};
    }

    // Update settings from view UI
    ruleSet.settings.grayscaleEnabled =
      this.modeGrayscaleToggleView?.checked || false;

    // Sync to hidden element for backward compatibility
    if (this.modeGrayscaleToggle) {
      this.modeGrayscaleToggle.checked = ruleSet.settings.grayscaleEnabled;
    }

    // Save to storage (with special action to prevent tab reloading)
    this.saveState("modeSettings");

    // If this is the active mode and focus is active, broadcast the grayscale update immediately
    if (
      !this.isCreatingNewRuleSet &&
      this.activeRuleSetId === this.currentEditingRuleSetId &&
      this.isActive
    ) {
      await this.broadcastGrayscaleState();
    }
  }

  loadModeSettings() {
    // Load mode settings into the UI when editing a mode
    let ruleSet;
    if (this.isCreatingNewRuleSet && this.tempRuleSet) {
      ruleSet = this.tempRuleSet;
    } else {
      ruleSet = this.customModes.find(
        (rs) => rs.id === this.currentEditingRuleSetId,
      );
    }

    if (!ruleSet || !ruleSet.settings) {
      if (ruleSet) {
        ruleSet.settings = { grayscaleEnabled: false };
      }
    }

    if (ruleSet && ruleSet.settings) {
      if (this.modeGrayscaleToggle) {
        this.modeGrayscaleToggle.checked =
          ruleSet.settings.grayscaleEnabled || false;
      }
    }
  }

  async saveModeSettings() {
    // Save mode settings from UI to the mode object
    let ruleSet;
    if (this.isCreatingNewRuleSet && this.tempRuleSet) {
      ruleSet = this.tempRuleSet;
    } else {
      ruleSet = this.customModes.find(
        (rs) => rs.id === this.currentEditingRuleSetId,
      );
    }

    if (!ruleSet) return;

    // Initialize settings if they don't exist
    if (!ruleSet.settings) {
      ruleSet.settings = {};
    }

    // Update settings from UI
    ruleSet.settings.grayscaleEnabled =
      this.modeGrayscaleToggle?.checked || false;

    // Save to storage (with special action to prevent tab reloading)
    this.saveState("modeSettings");

    // If this is the active mode and focus is active, broadcast the grayscale update immediately
    if (
      !this.isCreatingNewRuleSet &&
      this.activeRuleSetId === this.currentEditingRuleSetId &&
      this.isActive
    ) {
      await this.broadcastGrayscaleState();
    }
  }

  renderRulesPreview() {
    if (!this.rulesPreview || !this.rulesPreviewCount) return;

    let ruleSet;
    if (this.isCreatingNewRuleSet && this.tempRuleSet) {
      ruleSet = this.tempRuleSet;
    } else {
      ruleSet = this.customModes.find(
        (rs) => rs.id === this.currentEditingRuleSetId,
      );
    }

    if (!ruleSet || !ruleSet.rules || ruleSet.rules.length === 0) {
      this.rulesPreviewCount.textContent = "0";
      this.rulesPreview.innerHTML = `
        <div class="empty-state" style="font-size: 11px; padding: 8px;">
          No rules configured yet
        </div>
      `;
      return;
    }

    this.rulesPreviewCount.textContent = String(ruleSet.rules.length);

    // Show only the last added rule
    const lastRule = ruleSet.rules[ruleSet.rules.length - 1];

    const ruleText =
      lastRule.type === "allowParam"
        ? `?${lastRule.paramKey}=${lastRule.paramValue || "any"}`
        : lastRule.url;

    // Build via DOM + textContent so rule values (which can come from user input
    // or imported files) are never interpreted as HTML.
    this.rulesPreview.innerHTML = "";

    const item = document.createElement("div");
    item.className = "rule-item";

    const info = document.createElement("div");
    info.className = "rule-info";

    const urlEl = document.createElement("div");
    urlEl.className = "rule-url";
    urlEl.textContent = ruleText;

    const typeEl = document.createElement("div");
    typeEl.className = "rule-type";
    typeEl.textContent = this.formatRuleType(lastRule);

    info.appendChild(urlEl);
    info.appendChild(typeEl);

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "btn btn-xsmall btn-squared btn-danger";
    deleteBtn.id = "deleteLastRuleBtn";
    deleteBtn.innerHTML = '<i class="bi bi-trash"></i>';
    deleteBtn.addEventListener("click", () => {
      this.removeRule(lastRule.id);
    });

    item.appendChild(info);
    item.appendChild(deleteBtn);
    this.rulesPreview.appendChild(item);
  }

  clearRulesFromCurrentMode() {
    let ruleSet;
    if (this.isCreatingNewRuleSet && this.tempRuleSet) {
      ruleSet = this.tempRuleSet;
    } else {
      ruleSet = this.customModes.find(
        (rs) => rs.id === this.currentEditingRuleSetId,
      );
    }

    if (!ruleSet || !ruleSet.rules || ruleSet.rules.length === 0) {
      this.showNotification("No rules to clear", "error");
      return;
    }

    const rulesLabel = `${ruleSet.rules.length} rule${ruleSet.rules.length !== 1 ? "s" : ""}`;
    this._showConfirmModal({
      title: "Clear All Rules",
      message: `Remove all ${rulesLabel} from this mode? This cannot be undone.`,
      confirmText: "Clear All",
      onConfirm: () => {
        ruleSet.rules = [];
        this.saveState();
        this.renderRulesList();
        this.renderRulesPreview();
        this.showNotification("All rules cleared");
        chrome.runtime.sendMessage({ action: "reloadAffectedTabs" });
      },
    });
  }

  _showDropdown(triggerBtn: HTMLElement, dropdown: HTMLElement) {
    document.querySelectorAll(".item-dropdown").forEach((d) => d.remove());

    // Append off-screen first so offsetHeight is measurable
    dropdown.style.position = "fixed";
    dropdown.style.top = "-9999px";
    dropdown.style.left = "-9999px";
    document.body.appendChild(dropdown);

    const dropHeight = dropdown.offsetHeight;
    const btnRect = triggerBtn.getBoundingClientRect();

    // Use the scroll container's bottom as the threshold, not the full viewport
    const scrollContainer = triggerBtn.closest(".scroll-container");
    const containerBottom = scrollContainer
      ? scrollContainer.getBoundingClientRect().bottom
      : window.innerHeight;

    const spaceBelow = containerBottom - btnRect.bottom;

    dropdown.style.right = window.innerWidth - btnRect.right + "px";
    dropdown.style.left = "auto";

    if (spaceBelow >= dropHeight) {
      // Enough room — open downward
      dropdown.style.top = btnRect.bottom + 2 + "px";
      dropdown.style.bottom = "auto";
    } else {
      // Not enough room — open upward, bottom edge flush with button top
      dropdown.style.top = "auto";
      dropdown.style.bottom = window.innerHeight - btnRect.top + 2 + "px";
    }
  }

  // Lets a dragged item be dropped in the gap between two items, not just
  // directly on top of one. Attached to the list container itself (not each
  // item) so the browser doesn't show a "not-allowed" cursor over the margins
  // between items, where no item element exists to catch the drag events.
  // Item-level dragover/drop handlers stopPropagation() so this only runs for
  // drops that land in those gaps.
  _attachListReorderDrop(
    container: HTMLElement,
    itemSelector: string,
    onDrop: (fromIndex: number, toIndex: number) => void,
  ) {
    // Some lists (e.g. All Rules) render newest-first, so a later DOM
    // position can mean a *lower* array index. Walk DOM order to find where
    // the pointer falls, but derive the "past the last item" case from
    // whichever direction this particular list's indices actually run.
    const findDropIndex = (clientY: number): number => {
      const itemEls = Array.from(
        container.querySelectorAll<HTMLElement>(itemSelector),
      );
      if (itemEls.length === 0) return 0;
      for (const el of itemEls) {
        const rect = el.getBoundingClientRect();
        if (clientY < rect.top + rect.height / 2) {
          return parseInt(el.dataset.index!, 10);
        }
      }
      const first = parseInt(itemEls[0].dataset.index!, 10);
      const last = parseInt(itemEls[itemEls.length - 1].dataset.index!, 10);
      return last >= first ? last + 1 : last;
    };

    container.ondragenter = (e) => {
      e.preventDefault();
    };
    container.ondragover = (e) => {
      e.preventDefault();
      e.dataTransfer!.dropEffect = "move";
      const toIndex = findDropIndex(e.clientY);
      container.querySelectorAll<HTMLElement>(itemSelector).forEach((el) => {
        el.classList.toggle(
          "drag-over",
          parseInt(el.dataset.index!, 10) === toIndex,
        );
      });
    };
    container.ondragleave = (e) => {
      if (!container.contains(e.relatedTarget as Node | null)) {
        container
          .querySelectorAll(".drag-over")
          .forEach((el) => el.classList.remove("drag-over"));
      }
    };
    container.ondrop = (e) => {
      e.preventDefault();
      container
        .querySelectorAll(".drag-over")
        .forEach((el) => el.classList.remove("drag-over"));
      const fromIndex = parseInt(e.dataTransfer!.getData("text/plain"), 10);
      const toIndex = findDropIndex(e.clientY);
      if (Number.isNaN(fromIndex) || fromIndex === toIndex) return;
      onDrop(fromIndex, toIndex);
    };
  }

  _showConfirmModal({
    title,
    message,
    confirmText = "Confirm",
    onConfirm,
  }: {
    title: string;
    message: string;
    confirmText?: string;
    onConfirm: () => void;
  }) {
    const modal = this.$("confirmModal");
    this.$("confirmModalTitle").textContent = title;
    this.$("confirmModalMessage").textContent = message;
    const confirmBtn = this.$("confirmModalConfirm");
    const cancelBtn = this.$("confirmModalCancel");
    confirmBtn.textContent = confirmText;

    const close = () => {
      modal.style.display = "none";
    };
    confirmBtn.onclick = () => {
      close();
      onConfirm();
    };
    cancelBtn.onclick = close;
    modal.onclick = (e) => {
      if (e.target === modal) close();
    };

    modal.style.display = "flex";
  }

  renderRuleSetsList() {
    if (!this.ruleSetsList) return;

    const scrollTop = this.ruleSetsList.scrollTop;
    this.ruleSetsList.innerHTML = "";

    // Show/hide clear all button
    if (this.clearAllRuleSetsBtn) {
      this.clearAllRuleSetsBtn.style.display =
        this.customModes.length > 0 ? "inline-block" : "none";
    }

    if (this.customModes.length === 0) {
      this.ruleSetsList.innerHTML = `
        <div class="empty-state">
          No custom modes yet.<br />
          Create one to get started!
        </div>
      `;
      return;
    }

    this.customModes.forEach((ruleSet, index) => {
      const item = document.createElement("div");
      item.className = "rule-set-item";
      item.draggable = true;
      item.dataset.index = String(index);

      // Check if this rule set is active
      const isActive = this.activeRuleSetId === ruleSet.id;
      if (isActive) {
        item.style.border = "2px solid rgba(46, 204, 113, 0.6)";
        item.style.background = "rgba(46, 204, 113, 0.1)";
      }

      const info = document.createElement("div");
      info.className = "rule-set-info";

      const name = document.createElement("div");
      name.className = "rule-set-name";
      name.textContent = this.truncateText(ruleSet.name, 30);
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

        // Disable dragging on the item while its input is focused, so
        // selecting text with the mouse doesn't get hijacked as a drag.
        item.draggable = false;

        const saveEdit = () => {
          const newName = input.value.trim();
          if (!newName) {
            this.showNotification("Name cannot be empty", "error");
          } else if (newName !== ruleSet.name) {
            // Check if another mode already has this name
            const nameExists = this.customModes.some(
              (rs) => rs.id !== ruleSet.id && rs.name === newName,
            );
            if (nameExists) {
              this.showNotification(
                "A mode with this name already exists",
                "error",
              );
            } else {
              ruleSet.name = newName;
              this.saveState();
              this.updateUI();
              this.showNotification("Name updated!");
            }
          }
          name.textContent = this.truncateText(ruleSet.name, 30);
          name.style.display = "";
          input.remove();
          item.draggable = true;
        };

        const cancelEdit = () => {
          name.textContent = this.truncateText(ruleSet.name, 30);
          name.style.display = "";
          input.remove();
          item.draggable = true;
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
        name.parentNode!.insertBefore(input, name);
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

      // Drag handle (left)
      const dragHandle = document.createElement("span");
      dragHandle.className = "drag-handle";
      dragHandle.innerHTML = '<i class="bi bi-grip-vertical"></i>';
      dragHandle.title = "Drag to reorder";

      // Inline action buttons (select + edit)
      const actionsWrap = document.createElement("div");
      actionsWrap.style.display = "flex";
      actionsWrap.style.alignItems = "center";
      actionsWrap.style.flexShrink = "0";
      // actionsWrap.style.gap = "2px";

      const selectBtn = document.createElement("button");
      selectBtn.className = isActive
        ? "item-menu-btn mode-select-btn mode-select-btn-selected"
        : "item-menu-btn mode-select-btn";
      selectBtn.innerHTML = isActive
        ? '<i class="bi bi-check-circle-fill"></i>'
        : '<i class="bi bi-circle"></i>';
      selectBtn.title = isActive ? "Unselect mode" : "Select mode";
      selectBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (isActive) this.deactivateRuleSet();
        else this.activateRuleSet(ruleSet.id);
      });

      const editBtn = document.createElement("button");
      editBtn.className = "item-menu-btn";
      editBtn.innerHTML = '<i class="bi bi-pencil"></i>';
      editBtn.title = "Edit mode";
      editBtn.style.marginLeft = "4px";
      editBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.editRuleSet(ruleSet.id);
      });

      actionsWrap.appendChild(selectBtn);
      actionsWrap.appendChild(editBtn);

      // Three-dots menu — placed in the same wrap as select/edit so all
      // three buttons share identical spacing
      const menuBtn = document.createElement("button");
      menuBtn.className = "item-menu-btn";
      menuBtn.innerHTML = '<i class="bi bi-three-dots-vertical"></i>';
      menuBtn.title = "More options";
      menuBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const existing = document.querySelector<ItemDropdown>(".item-dropdown");
        if (existing && existing._trigger === menuBtn) {
          existing.remove();
          return;
        }

        const dropdown = document.createElement("div") as ItemDropdown;
        dropdown.className = "item-dropdown";
        dropdown._trigger = menuBtn;

        const duplicateOpt = document.createElement("button");
        duplicateOpt.className = "item-dropdown-option";
        duplicateOpt.innerHTML = '<i class="bi bi-copy"></i> Duplicate';
        duplicateOpt.addEventListener("click", () => {
          dropdown.remove();
          this.duplicateRuleSet(ruleSet.id);
        });

        const deleteOpt = document.createElement("button");
        deleteOpt.className = "item-dropdown-option danger";
        deleteOpt.innerHTML = '<i class="bi bi-trash"></i> Delete';
        deleteOpt.addEventListener("click", () => {
          dropdown.remove();
          this.deleteRuleSet(ruleSet.id);
        });

        dropdown.appendChild(duplicateOpt);
        dropdown.appendChild(deleteOpt);
        this._showDropdown(menuBtn, dropdown);
      });

      actionsWrap.appendChild(menuBtn);

      // Drag-and-drop events
      item.addEventListener("dragstart", (e) => {
        e.dataTransfer!.effectAllowed = "move";
        e.dataTransfer!.setData("text/plain", String(index));
        setTimeout(() => item.classList.add("is-dragging"), 0);
      });
      item.addEventListener("dragend", () => {
        item.classList.remove("is-dragging");
        this.ruleSetsList
          .querySelectorAll(".drag-over")
          .forEach((el) => el.classList.remove("drag-over"));
      });
      item.addEventListener("dragenter", (e) => {
        e.preventDefault();
        e.stopPropagation();
      });
      item.addEventListener("dragover", (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer!.dropEffect = "move";
        this.ruleSetsList
          .querySelectorAll(".drag-over")
          .forEach((el) => el.classList.remove("drag-over"));
        item.classList.add("drag-over");
      });
      item.addEventListener("dragleave", (e) => {
        if (!item.contains(e.relatedTarget as Node | null)) item.classList.remove("drag-over");
      });
      item.addEventListener("drop", (e) => {
        e.preventDefault();
        e.stopPropagation();
        item.classList.remove("drag-over");
        const fromIndex = parseInt(e.dataTransfer!.getData("text/plain"), 10);
        const toIndex = index;
        if (fromIndex === toIndex) return;
        const moved = this.customModes.splice(fromIndex, 1)[0];
        this.customModes.splice(toIndex, 0, moved);
        this.saveState();
        this.renderRuleSetsList();
      });

      item.appendChild(dragHandle);
      item.appendChild(info);
      item.appendChild(actionsWrap);
      this.ruleSetsList.appendChild(item);
    });

    this._attachListReorderDrop(this.ruleSetsList, ".rule-set-item", (fromIndex, toIndex) => {
      const moved = this.customModes.splice(fromIndex, 1)[0];
      this.customModes.splice(toIndex, 0, moved);
      this.saveState();
      this.renderRuleSetsList();
    });

    this.ruleSetsList.scrollTop = scrollTop;
  }

  // Session history methods
  renderSessionHistory() {
    if (!this.sessionsList) return;

    const scrollContainer = this.sessionsList.parentElement;
    const scrollTop = scrollContainer ? scrollContainer.scrollTop : 0;
    this.sessionsList.innerHTML = "";

    // Update statistics in main stats view
    const totalSessions = this.sessions.length;
    if (this.statsTabTotalSessions) {
      this.statsTabTotalSessions.textContent = String(totalSessions);
    }

    if (totalSessions > 0) {
      const totalFocusedTime = this.sessions.reduce(
        (sum, s) => sum + (s.focusedTime || 0),
        0,
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
          Start focus to create a new session!
        </div>
      `;
      return;
    }

    this.sessions.forEach((session, index) => {
      const item = document.createElement("div");
      item.className = "session-item";
      item.style.display = "flex";
      item.style.justifyContent = "space-between";
      item.style.alignItems = "center";
      item.style.textAlign = "left";
      item.style.gap = "4px";
      item.draggable = true;
      item.dataset.index = String(index);

      // Highlight if this is the current active session
      const isActive = session.id === this.currentSessionId;
      if (isActive) {
        item.style.border = "2px solid rgba(46, 204, 113, 0.6)";
        item.style.background = "rgba(46, 204, 113, 0.1)";
      }

      const info = document.createElement("div");
      info.style.flex = "1";
      info.style.minWidth = "0";

      const name = document.createElement("div");
      name.className = "session-date";
      name.textContent = this.truncateText(session.name, 40);
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

        // Disable dragging on the item while its input is focused, so
        // selecting text with the mouse doesn't get hijacked as a drag.
        item.draggable = false;

        const saveEdit = () => {
          const newName = input.value.trim();
          if (!newName) {
            this.showNotification("Name cannot be empty", "error");
          } else if (newName !== session.name) {
            // Check if another session already has this name
            const nameExists = this.sessions.some(
              (s) => s.id !== session.id && s.name === newName,
            );
            if (nameExists) {
              this.showNotification(
                "A session with this name already exists",
                "error",
              );
            } else {
              session.name = newName;
              this.saveState();
              this.updateUI();
              this.showNotification("Session name updated!");
            }
          }
          name.textContent = this.truncateText(session.name, 40);
          name.style.display = "";
          input.remove();
          item.draggable = true;
        };

        const cancelEdit = () => {
          name.textContent = this.truncateText(session.name, 40);
          name.style.display = "";
          input.remove();
          item.draggable = true;
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
        name.parentNode!.insertBefore(input, name);
        input.focus();
        input.select();
      });

      const details = document.createElement("div");
      details.className = "session-details";
      details.setAttribute("data-session-id", session.id); // For real-time updates
      const ruleSet = this.customModes.find(
        (rs) => rs.id === session.ruleSetId,
      );
      const ruleSetName = ruleSet ? ruleSet.name : "No Mode";

      // Calculate total time (focused + break)
      let totalTime = (session.focusedTime || 0) + (session.breakTime || 0);

      // Add current elapsed time if this is the active session
      if (session.id === this.currentSessionId) {
        const now = Date.now();
        if (this.isActive && session.sessionFocusStartTime) {
          const currentFocusElapsed = Math.floor(
            (now - session.sessionFocusStartTime) / 1000,
          );
          totalTime += currentFocusElapsed;
        } else if (!this.isActive && session.sessionPauseStartTime) {
          const currentBreakElapsed = Math.floor(
            (now - session.sessionPauseStartTime) / 1000,
          );
          totalTime += currentBreakElapsed;
        }
      }

      details.textContent = this.formatSessionDetailsText(
        ruleSetName,
        session.blocksCount || 0,
        totalTime,
      );

      info.appendChild(name);
      info.appendChild(details);

      // Drag handle (left)
      const dragHandle = document.createElement("span");
      dragHandle.className = "drag-handle";
      dragHandle.innerHTML = '<i class="bi bi-grip-vertical"></i>';
      dragHandle.title = "Drag to reorder";

      // Inline action buttons (resume + more options)
      const actionsWrap = document.createElement("div");
      actionsWrap.style.display = "flex";
      actionsWrap.style.alignItems = "center";
      actionsWrap.style.flexShrink = "0";

      const hasStats =
        (session.focusedTime || 0) > 0 ||
        (session.breakTime || 0) > 0 ||
        (session.blocksCount || 0) > 0;

      const resumeBtn = document.createElement("button");
      resumeBtn.className = isActive
        ? "item-menu-btn mode-select-btn mode-select-btn-selected"
        : "item-menu-btn mode-select-btn";
      resumeBtn.innerHTML = isActive
        ? '<i class="bi bi-stop-circle-fill"></i>'
        : '<i class="bi bi-play-circle"></i>';
      resumeBtn.title = isActive ? "End Session" : "Resume Session";
      resumeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (isActive) this.deactivateSession(session.id);
        else this.activateSession(session.id);
      });

      actionsWrap.appendChild(resumeBtn);

      // Three-dots menu — placed in the same wrap as resume so both
      // buttons share identical spacing
      const menuBtn = document.createElement("button");
      menuBtn.className = "item-menu-btn";
      menuBtn.innerHTML = '<i class="bi bi-three-dots-vertical"></i>';
      menuBtn.title = "More options";
      menuBtn.style.marginLeft = "4px";

      menuBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const existing = document.querySelector<ItemDropdown>(".item-dropdown");
        if (existing && existing._trigger === menuBtn) {
          existing.remove();
          return;
        }

        const dropdown = document.createElement("div") as ItemDropdown;
        dropdown.className = "item-dropdown";
        dropdown._trigger = menuBtn;

        if (hasStats) {
          const clearOpt = document.createElement("button");
          clearOpt.className = "item-dropdown-option warning";
          clearOpt.innerHTML = '<i class="bi bi-stars"></i> Clear Stats';
          clearOpt.addEventListener("click", () => {
            dropdown.remove();
            this.clearInfo(session.id);
          });
          dropdown.appendChild(clearOpt);
        }

        const deleteOpt = document.createElement("button");
        deleteOpt.className = "item-dropdown-option danger";
        deleteOpt.innerHTML = '<i class="bi bi-trash"></i> Delete';
        deleteOpt.addEventListener("click", () => {
          dropdown.remove();
          this.deleteSession(session.id);
        });

        dropdown.appendChild(deleteOpt);
        this._showDropdown(menuBtn, dropdown);
      });

      actionsWrap.appendChild(menuBtn);

      // Drag-and-drop events
      item.addEventListener("dragstart", (e) => {
        e.dataTransfer!.effectAllowed = "move";
        e.dataTransfer!.setData("text/plain", String(index));
        setTimeout(() => item.classList.add("is-dragging"), 0);
      });
      item.addEventListener("dragend", () => {
        item.classList.remove("is-dragging");
        this.sessionsList
          .querySelectorAll(".drag-over")
          .forEach((el) => el.classList.remove("drag-over"));
      });
      item.addEventListener("dragenter", (e) => {
        e.preventDefault();
        e.stopPropagation();
      });
      item.addEventListener("dragover", (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer!.dropEffect = "move";
        this.sessionsList
          .querySelectorAll(".drag-over")
          .forEach((el) => el.classList.remove("drag-over"));
        item.classList.add("drag-over");
      });
      item.addEventListener("dragleave", (e) => {
        if (!item.contains(e.relatedTarget as Node | null)) item.classList.remove("drag-over");
      });
      item.addEventListener("drop", (e) => {
        e.preventDefault();
        e.stopPropagation();
        item.classList.remove("drag-over");
        const fromIndex = parseInt(e.dataTransfer!.getData("text/plain"), 10);
        const toIndex = index;
        if (fromIndex === toIndex) return;
        const moved = this.sessions.splice(fromIndex, 1)[0];
        this.sessions.splice(toIndex, 0, moved);
        this.saveState();
        this.renderSessionHistory();
      });

      item.appendChild(dragHandle);
      item.appendChild(info);
      item.appendChild(actionsWrap);
      this.sessionsList.appendChild(item);
    });

    this._attachListReorderDrop(this.sessionsList, ".session-item", (fromIndex, toIndex) => {
      const moved = this.sessions.splice(fromIndex, 1)[0];
      this.sessions.splice(toIndex, 0, moved);
      this.saveState();
      this.renderSessionHistory();
    });

    if (scrollContainer) scrollContainer.scrollTop = scrollTop;
  }

  clearSessions() {
    if (this.sessions.length === 0) {
      this.showNotification("No sessions to clear", "error");
      return;
    }

    this._showConfirmModal({
      title: "Clear All Sessions",
      message:
        "All sessions and their data will be permanently deleted. This cannot be undone.",
      confirmText: "Clear All",
      onConfirm: () => {
        this.stopSessionStatsTracking();
        this.sessions = [];
        this.currentSessionId = null;
        this.sessionBlocks = 0;
        this.sessionTime = 0;
        this.saveState();
        this.updateUI();
        this.showNotification("All sessions cleared");
      },
    });
  }

  clearAllRuleSets() {
    if (this.customModes.length === 0) {
      this.showNotification("No custom modes to clear", "error");
      return;
    }

    const modesLabel = `${this.customModes.length} mode${this.customModes.length !== 1 ? "s" : ""}`;
    this._showConfirmModal({
      title: "Clear All Modes",
      message: `All ${modesLabel} will be permanently deleted. This cannot be undone.`,
      confirmText: "Clear All",
      onConfirm: () => {
        this.customModes = [];
        this.activeRuleSetId = null;
        this.saveState();
        this.updateUI();
        this.showNotification("All modes cleared");
      },
    });
  }

  // Personalization methods
  getThemeBlockPageDefaults(theme: string = this.currentTheme || "blue") {
    const themeDefaults: Record<
      string,
      { primaryColor: string; accentColor: string }
    > = {
      blackwhite: { primaryColor: "#1a1a1a", accentColor: "#ffffff" },
      blue: { primaryColor: "#667eea", accentColor: "#2ecc71" },
      red: { primaryColor: "#e74c3c", accentColor: "#2ecc71" },
      orange: { primaryColor: "#f39c12", accentColor: "#2ecc71" },
      purple: { primaryColor: "#9b59b6", accentColor: "#2ecc71" },
      teal: { primaryColor: "#1abc9c", accentColor: "#3498db" },
    };

    return themeDefaults[theme] || themeDefaults.blue;
  }

  getDefaultBlockPageSettings(): BlockPageSettings {
    const themeDefaults = this.getThemeBlockPageDefaults();
    return {
      title: "Stay Focused",
      message: "This site is blocked during your focus session",
      showQuotes: true,
      backgroundImage: "",
      backgroundImageName: "",
      primaryColor: themeDefaults.primaryColor,
      accentColor: themeDefaults.accentColor,
      showActionButtons: true,
    };
  }

  syncColorInput(
    textInput: HTMLInputElement | null,
    colorInput: HTMLInputElement | null,
  ) {
    const value = (textInput?.value || "").trim();
    if (/^#[0-9a-fA-F]{6}$/.test(value) && colorInput) {
      colorInput.value = value;
    }
  }

  showColorCodeInput(type: "primary" | "accent") {
    const isPrimary = type === "primary";
    const input = isPrimary
      ? this.blockPagePrimaryColorText
      : this.blockPageAccentColorText;
    const display = isPrimary
      ? this.blockPagePrimaryColorDisplay
      : this.blockPageAccentColorDisplay;

    if (!input || !display) return;

    display.style.display = "none";
    input.style.display = "block";
    input.focus();
    input.select();
  }

  hideColorCodeInput(input: HTMLInputElement, display: HTMLElement) {
    if (!input || !display) return;
    input.style.display = "none";
    display.style.display = "block";
  }

  commitColorCodeInput(
    input: HTMLInputElement,
    colorInput: HTMLInputElement,
    display: HTMLElement,
  ) {
    if (!input || !colorInput || !display) return;

    const typedValue = input.value.trim();
    const isValidColor = /^#[0-9a-fA-F]{6}$/.test(typedValue);
    const committedValue = isValidColor ? typedValue : colorInput.value;

    input.value = committedValue;
    colorInput.value = committedValue;
    display.textContent = committedValue;

    this.hideColorCodeInput(input, display);
    this.updatePreview();

    if (!isValidColor) {
      this.showNotification(
        "Invalid color code. Use a valid hex value.",
        "error",
      );
    }
  }

  bindColorCodeInput(
    input: HTMLInputElement,
    colorInput: HTMLInputElement,
    display: HTMLElement,
  ) {
    if (!input || !colorInput || !display) return;

    input.addEventListener("input", () => {
      this.syncColorInput(input, colorInput);
      if (/^#[0-9a-fA-F]{6}$/.test(input.value.trim())) {
        display.textContent = input.value.trim();
        this.updatePreview();
      }
    });

    input.addEventListener("blur", () => {
      this.commitColorCodeInput(input, colorInput, display);
    });

    input.addEventListener("keypress", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        this.commitColorCodeInput(input, colorInput, display);
      }
    });
  }

  sanitizeHexColor(color: string | undefined, fallback: string): string {
    return color && /^#[0-9a-fA-F]{6}$/.test(color) ? color : fallback;
  }

  setBackgroundImageStatus(message: string) {
    if (this.blockPageImageStatus) {
      this.blockPageImageStatus.textContent = message;
      this.blockPageImageStatus.title = message;
    }
  }

  estimateImageStorageBytes(imageDataUrl: string, imageName: string) {
    const payload = JSON.stringify({
      blockPageBackgroundImage: imageDataUrl || "",
      blockPageBackgroundImageName: imageName || "",
    });
    return new TextEncoder().encode(payload).length;
  }

  setBackgroundImageInputVisibility(show: boolean) {
    this.blockPageImageInputMode = show ? "url" : "hidden";
    if (this.blockPageImageUrlRow) {
      this.blockPageImageUrlRow.style.display = show ? "flex" : "none";
    }
    if (show && this.blockPageImage) {
      this.blockPageImage.focus();
    }
  }

  toggleBackgroundImageUrlInput() {
    const shouldShow = this.blockPageImageInputMode !== "url";
    this.setBackgroundImageInputVisibility(shouldShow);
  }

  getBackgroundImageLabel(imageValue: string, imageName = "") {
    if (!imageValue) {
      return "No background image applied.";
    }

    if (imageValue.startsWith("data:image/")) {
      return imageName
        ? `Imported image: ${imageName}`
        : "Imported image applied.";
    }

    try {
      const parsedUrl = new URL(imageValue);
      const pathname = parsedUrl.pathname.split("/").filter(Boolean);
      return pathname[pathname.length - 1]
        ? `Image from URL: ${pathname[pathname.length - 1]}`
        : `Image from URL: ${parsedUrl.hostname}`;
    } catch (error) {
      return "Image from URL applied.";
    }
  }

  refreshBackgroundImageControls() {
    const imageValue = this.blockPageImage?.value?.trim() || "";
    const hasImage = !!imageValue;

    this.setBackgroundImageStatus(
      this.getBackgroundImageLabel(
        imageValue,
        this.currentBlockPageBackgroundImageName,
      ),
    );

    if (this.removeBackgroundImageBtn) {
      this.removeBackgroundImageBtn.style.display = hasImage
        ? "inline-flex"
        : "none";
    }

    if (!hasImage && this.blockPageImageInputMode !== "url") {
      this.setBackgroundImageInputVisibility(false);
    }
  }

  applyBackgroundImageUrl() {
    const imageUrl = this.blockPageImage?.value?.trim();
    if (!imageUrl) {
      this.setBackgroundImageInputVisibility(true);
      this.setBackgroundImageStatus("Paste an image URL to apply it.");
      return;
    }

    this.currentBlockPageBackgroundImageName = "";
    this.setBackgroundImageStatus(this.getBackgroundImageLabel(imageUrl));
    this.setBackgroundImageInputVisibility(false);
    this.refreshBackgroundImageControls();
    this.updatePreview();
  }

  clearBackgroundImage() {
    if (this.blockPageImage) {
      this.blockPageImage.value = "";
    }
    if (this.blockPageImageFileInput) {
      this.blockPageImageFileInput.value = "";
    }
    this.currentBlockPageBackgroundImageName = "";
    this.setBackgroundImageInputVisibility(false);
    this.refreshBackgroundImageControls();
    this.updatePreview();
  }

  async importBackgroundImageFile(event: Event) {
    const fileInput = event?.target as HTMLInputElement | null;
    const file = fileInput?.files?.[0];
    if (!file) return;

    const maxImportBytes = 2 * 1024 * 1024;
    if (file.size > maxImportBytes) {
      this.setBackgroundImageStatus(
        "Image too large. Choose an image under 2 MB.",
      );
      this.showNotification("Image too large. Use a file under 2 MB.", "error");
      if (this.blockPageImageFileInput) {
        this.blockPageImageFileInput.value = "";
      }
      return;
    }

    try {
      const dataUrl = await new Promise<string | ArrayBuffer | null>(
        (resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(file);
        },
      );

      if (typeof dataUrl === "string" && this.blockPageImage) {
        const quotaBytes =
          chrome.storage?.local?.QUOTA_BYTES || 5 * 1024 * 1024;
        const bytesInUse = await chrome.storage.local.getBytesInUse(null);
        const previousImageBytes = this.estimateImageStorageBytes(
          this.blockPageImage.value || "",
          this.currentBlockPageBackgroundImageName || "",
        );
        const newImageBytes = this.estimateImageStorageBytes(
          dataUrl,
          file.name,
        );
        const projectedBytes = bytesInUse - previousImageBytes + newImageBytes;

        if (projectedBytes > quotaBytes) {
          this.setBackgroundImageStatus(
            "Image too large for extension storage. Use a smaller file.",
          );
          this.showNotification(
            "Image exceeds storage limit. Pick a smaller image.",
            "error",
          );
          return;
        }

        this.blockPageImage.value = dataUrl;
        this.currentBlockPageBackgroundImageName = file.name;
        this.setBackgroundImageInputVisibility(false);
        this.refreshBackgroundImageControls();
        this.updatePreview();
      }
    } catch (error) {
      console.error("Failed to import background image:", error);
      this.setBackgroundImageStatus("Failed to import image.");
    } finally {
      if (this.blockPageImageFileInput) {
        this.blockPageImageFileInput.value = "";
      }
    }
  }

  getBlockPageSettingsFromInputs(): BlockPageSettings {
    const defaults = this.getDefaultBlockPageSettings();
    return {
      title: this.blockPageTitle?.value?.trim() || defaults.title,
      message: this.blockPageMessage?.value?.trim() || defaults.message,
      showQuotes: this.blockPageShowQuotes?.checked ?? defaults.showQuotes,
      backgroundImage: this.blockPageImage?.value?.trim() || "",
      backgroundImageName: this.currentBlockPageBackgroundImageName || "",
      primaryColor: this.sanitizeHexColor(
        this.blockPagePrimaryColorText?.value?.trim(),
        defaults.primaryColor,
      ),
      accentColor: this.sanitizeHexColor(
        this.blockPageAccentColorText?.value?.trim(),
        defaults.accentColor,
      ),
      showActionButtons:
        this.blockPageShowActionButtons?.checked ?? defaults.showActionButtons,
    };
  }

  getPersonalizationPayload(overrides: Record<string, unknown> = {}) {
    return {
      theme: this.currentTheme,
      blockPageTitle: this.currentBlockPageTitle,
      blockPageMessage: this.currentBlockPageMessage,
      blockPageShowQuotes: this.currentBlockPageShowQuotes,
      blockPageBackgroundImage: this.currentBlockPageBackgroundImage,
      blockPageBackgroundImageName: this.currentBlockPageBackgroundImageName,
      blockPagePrimaryColor: this.currentBlockPagePrimaryColor,
      blockPageAccentColor: this.currentBlockPageAccentColor,
      blockPageUseThemeColors: this.currentBlockPageUseThemeColors,
      blockPageShowActionButtons: this.currentBlockPageShowActionButtons,
      ...overrides,
    };
  }

  async selectTheme(theme: string) {
    if (this.currentTheme === theme) {
      return;
    }

    const nextThemeDefaults = this.getThemeBlockPageDefaults(theme);
    this.currentTheme = theme;
    if (this.currentBlockPageUseThemeColors !== false) {
      this.currentBlockPagePrimaryColor = nextThemeDefaults.primaryColor;
      this.currentBlockPageAccentColor = nextThemeDefaults.accentColor;
    }

    // Update active state on theme options
    this.themeOptions.forEach((option) => {
      if (option.getAttribute("data-theme") === theme) {
        option.classList.add("active");
      } else {
        option.classList.remove("active");
      }
    });

    // Apply theme immediately
    this.applyTheme(theme);

    // Auto-save theme to storage
    try {
      const themePayload: Record<string, unknown> = { theme };
      if (this.currentBlockPageUseThemeColors !== false) {
        themePayload.blockPagePrimaryColor = this.currentBlockPagePrimaryColor;
        themePayload.blockPageAccentColor = this.currentBlockPageAccentColor;
      }
      themePayload.blockPageUseThemeColors =
        this.currentBlockPageUseThemeColors;
      await chrome.storage.local.set(themePayload);
      this.loadPersonalizationUI();

      // Send message to background script to update block page theme
      chrome.runtime.sendMessage(
        this.getPersonalizationPayload({
          action: "updatePersonalization",
          theme,
        }),
      );

      this.showNotification(`Theme changed to ${theme}!`);
    } catch (error) {
      console.error("Failed to save theme:", error);
      this.showNotification("Failed to save theme", "error");
    }
  }

  applyTheme(theme: string) {
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
    if (this.blockPageShowQuotes) {
      this.blockPageShowQuotes.checked = this.currentBlockPageShowQuotes;
    }
    if (this.blockPageImage) {
      this.blockPageImage.value = this.currentBlockPageBackgroundImage;
      this.currentBlockPageBackgroundImageName =
        this.currentBlockPageBackgroundImageName || "";
      this.setBackgroundImageInputVisibility(false);
      this.refreshBackgroundImageControls();
    }
    if (this.blockPagePrimaryColor) {
      this.blockPagePrimaryColor.value = this.currentBlockPagePrimaryColor;
    }
    if (this.blockPagePrimaryColorText) {
      this.blockPagePrimaryColorText.value = this.currentBlockPagePrimaryColor;
    }
    if (this.blockPagePrimaryColorDisplay) {
      this.blockPagePrimaryColorDisplay.textContent =
        this.currentBlockPagePrimaryColor;
      this.blockPagePrimaryColorDisplay.style.display = "block";
    }
    if (this.blockPagePrimaryColorText) {
      this.blockPagePrimaryColorText.style.display = "none";
    }
    if (this.blockPageAccentColor) {
      this.blockPageAccentColor.value = this.currentBlockPageAccentColor;
    }
    if (this.blockPageAccentColorText) {
      this.blockPageAccentColorText.value = this.currentBlockPageAccentColor;
    }
    if (this.blockPageAccentColorDisplay) {
      this.blockPageAccentColorDisplay.textContent =
        this.currentBlockPageAccentColor;
      this.blockPageAccentColorDisplay.style.display = "block";
    }
    if (this.blockPageAccentColorText) {
      this.blockPageAccentColorText.style.display = "none";
    }
    if (this.blockPageShowActionButtons) {
      this.blockPageShowActionButtons.checked =
        this.currentBlockPageShowActionButtons;
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

  getPreviewBackground(primaryColor: string, imageUrl: string) {
    const fallback = `linear-gradient(135deg, ${primaryColor} 0%, #764ba2 100%)`;
    if (!imageUrl) return fallback;
    return `linear-gradient(140deg, rgba(10, 15, 31, 0.4), rgba(10, 15, 31, 0.6)), url("${imageUrl}"), ${fallback}`;
  }

  updatePreview() {
    const defaults = this.getDefaultBlockPageSettings();
    const settings = this.getBlockPageSettingsFromInputs();
    if (this.previewTitle) {
      this.previewTitle.textContent = settings.title || defaults.title;
    }
    if (this.previewMessage) {
      this.previewMessage.textContent = settings.message || defaults.message;
    }
    if (this.previewQuote) {
      this.previewQuote.textContent = "Stay focused and keep pushing forward!";
      this.previewQuote.style.display = settings.showQuotes ? "block" : "none";
    }
    if (this.previewUtilityActions) {
      this.previewUtilityActions.style.display = settings.showActionButtons
        ? "flex"
        : "none";
    }
    if (this.blockPagePreview) {
      this.blockPagePreview.style.setProperty(
        "--preview-background",
        this.getPreviewBackground(
          settings.primaryColor || defaults.primaryColor,
          settings.backgroundImage,
        ),
      );
    }
    if (this.blockPagePreviewCard) {
      this.blockPagePreviewCard.style.borderColor = `${settings.accentColor}66`;
      this.blockPagePreviewCard.style.boxShadow = `0 14px 34px ${settings.primaryColor}33`;
    }
    if (this.previewAccentBtn) {
      this.previewAccentBtn.style.background = `${settings.accentColor}40`;
      this.previewAccentBtn.style.borderColor = `${settings.accentColor}99`;
    }
    if (this.previewQuote) {
      this.previewQuote.style.borderLeftColor = `${settings.accentColor}aa`;
    }
    const previewSessionTime = document.getElementById("previewSessionTime");
    if (previewSessionTime) {
      previewSessionTime.style.color = settings.accentColor;
    }

    // If explicit save button was removed, persist personalization automatically.
    if (!this.savePersonalizationBtn && this.isLoaded) {
      this.schedulePersonalizationAutoSave();
    }
  }

  schedulePersonalizationAutoSave() {
    clearTimeout(this.personalizationAutoSaveTimeout);

    this.personalizationAutoSaveTimeout = setTimeout(async () => {
      const saved = await this.savePersonalization(true);
      if (saved) {
        this.showNotification("Block page changes applied");
      }
    }, 250);
  }

  async savePersonalization(silent = false) {
    try {
      const settings = this.getBlockPageSettingsFromInputs();

      // Save to storage
      await chrome.storage.local.set({
        blockPageTitle: settings.title,
        blockPageMessage: settings.message,
        blockPageShowQuotes: settings.showQuotes,
        blockPageBackgroundImage: settings.backgroundImage,
        blockPageBackgroundImageName: settings.backgroundImageName,
        blockPagePrimaryColor: settings.primaryColor,
        blockPageAccentColor: settings.accentColor,
        blockPageUseThemeColors:
          settings.primaryColor ===
            this.getThemeBlockPageDefaults(this.currentTheme).primaryColor &&
          settings.accentColor ===
            this.getThemeBlockPageDefaults(this.currentTheme).accentColor,
        blockPageShowActionButtons: settings.showActionButtons,
      });

      // Update current values
      this.currentBlockPageTitle = settings.title;
      this.currentBlockPageMessage = settings.message;
      this.currentBlockPageShowQuotes = settings.showQuotes;
      this.currentBlockPageBackgroundImage = settings.backgroundImage;
      this.currentBlockPageBackgroundImageName = settings.backgroundImageName;
      this.currentBlockPagePrimaryColor = settings.primaryColor;
      this.currentBlockPageAccentColor = settings.accentColor;
      this.currentBlockPageUseThemeColors =
        settings.primaryColor ===
          this.getThemeBlockPageDefaults(this.currentTheme).primaryColor &&
        settings.accentColor ===
          this.getThemeBlockPageDefaults(this.currentTheme).accentColor;
      this.currentBlockPageShowActionButtons = settings.showActionButtons;

      // Send message to background script to update block page
      chrome.runtime.sendMessage(
        this.getPersonalizationPayload({
          action: "updatePersonalization",
        }),
      );

      if (!silent) {
        this.showNotification("Block page settings saved!");
      }
      return true;
    } catch (error) {
      console.error("Failed to save block page settings:", error);
      this.showNotification("Failed to save settings", "error");
      return false;
    }
  }

  resetPersonalization() {
    const defaults = this.getDefaultBlockPageSettings();
    const alreadyDefault =
      this.currentBlockPageTitle === defaults.title &&
      this.currentBlockPageMessage === defaults.message &&
      this.currentBlockPageShowQuotes === defaults.showQuotes &&
      this.currentBlockPageBackgroundImage === defaults.backgroundImage &&
      this.currentBlockPageBackgroundImageName ===
        defaults.backgroundImageName &&
      this.currentBlockPagePrimaryColor === defaults.primaryColor &&
      this.currentBlockPageAccentColor === defaults.accentColor &&
      this.currentBlockPageShowActionButtons === defaults.showActionButtons;

    if (alreadyDefault) {
      this.showNotification("Block page settings already reset", "error");
      return;
    }

    this.currentBlockPageTitle = defaults.title;
    this.currentBlockPageMessage = defaults.message;
    this.currentBlockPageShowQuotes = defaults.showQuotes;
    this.currentBlockPageBackgroundImage = defaults.backgroundImage;
    this.currentBlockPageBackgroundImageName = defaults.backgroundImageName;
    this.currentBlockPagePrimaryColor = defaults.primaryColor;
    this.currentBlockPageAccentColor = defaults.accentColor;
    this.currentBlockPageUseThemeColors = true;
    this.currentBlockPageShowActionButtons = defaults.showActionButtons;
    this.loadPersonalizationUI();
    this.showNotification("Block page settings reset");
  }

  async broadcastGrayscaleState(enabled: boolean | null = null) {
    // Get active mode for determining grayscale state and logging
    const activeMode = this.customModes.find(
      (mode) => mode.id === this.activeRuleSetId,
    );

    // If enabled is not provided, get it from the active mode's settings
    if (enabled === null) {
      // Grayscale should only be enabled if BOTH focus mode is active AND the mode has grayscale enabled
      if (this.isActive) {
        enabled = activeMode?.settings?.grayscaleEnabled || false;
      } else {
        // Focus mode is off, so grayscale should always be off
        enabled = false;
      }
    }

    // FIRST: Update storage to trigger storage change listeners in ALL tabs
    // This is the PRIMARY method for instant updates
    await chrome.storage.local.set({
      grayscaleEnabled: enabled,
      isActive: this.isActive,
    });

    // SECOND: Send direct messages to all tabs as backup (in case storage listener hasn't fired yet)
    try {
      const tabs = await chrome.tabs.query({});

      // Send messages to all tabs in parallel
      const messagePromises = tabs.map(async (tab) => {
        if (
          tab.id &&
          tab.url &&
          !tab.url.startsWith("chrome://") &&
          !tab.url.startsWith("chrome-extension://") &&
          !tab.url.startsWith("about:")
        ) {
          // Try multiple times to ensure delivery
          for (let attempt = 0; attempt < 2; attempt++) {
            try {
              await chrome.tabs.sendMessage(tab.id, {
                action: "toggleGrayscale",
                enabled: enabled,
              });
              break; // Success, exit retry loop
            } catch (error) {
              if (attempt === 0) {
                // Wait a bit and retry once
                await new Promise((resolve) => setTimeout(resolve, 50));
              }
            }
          }
        }
      });

      // Wait for all messages to be sent
      await Promise.all(messagePromises);
    } catch (error) {
      console.error(
        "[Producer Popup] Error broadcasting grayscale state:",
        error,
      );
    }
  }

  // Navigation methods for block page settings
  showBlockPageSettings() {
    if (this.themeMainView && this.blockPageSettingsView) {
      this.themeMainView.style.display = "none";
      this.blockPageSettingsView.style.display = "block";
    }
    this.resetScrollPosition(document.getElementById("tab-personalize"));
  }

  showThemeMainView() {
    if (this.themeMainView && this.blockPageSettingsView) {
      this.themeMainView.style.display = "block";
      this.blockPageSettingsView.style.display = "none";
    }
    this.resetScrollPosition(document.getElementById("tab-personalize"));
  }

  // Navigation methods for stats tab
  showSessionHistoryView() {
    if (this.statsMainView && this.sessionHistoryView) {
      this.statsMainView.style.display = "none";
      this.sessionHistoryView.style.display = "block";
    }
    this.resetScrollPosition(document.getElementById("tab-stats"));
  }

  showStatsMainView() {
    if (this.statsMainView && this.sessionHistoryView) {
      this.statsMainView.style.display = "block";
      this.sessionHistoryView.style.display = "none";
    }
    this.resetScrollPosition(document.getElementById("tab-stats"));
  }

  // Session management methods
  async activateSession(sessionId: string) {
    const session = this.sessions.find((s) => s.id === sessionId);
    if (!session) return;

    // If already the current session, just notify
    if (this.currentSessionId === sessionId) {
      this.showNotification(`"${session.name}" is already active`, "error");
      return;
    }

    // Remember if focus mode was active before switching
    const wasFocusModeActive = this.isActive;

    // Save current session state before switching (if there is one)
    if (this.currentSessionId) {
      const currentSession = this.sessions.find(
        (s) => s.id === this.currentSessionId,
      );
      if (currentSession) {
        // Commit any accumulated focus or break time
        this.commitCurrentSessionTime();

        currentSession.blocksCount = this.sessionBlocks;
        currentSession.lastActive = Date.now();
        currentSession.isActive = false; // Clear active flag from previous session
      }
    }

    // Clear isActive flag from ALL sessions to ensure only one is active
    this.sessions.forEach((s) => {
      s.isActive = false;
    });

    // Restore the selected session data
    this.currentSessionId = sessionId;
    this.sessionBlocks = session.blocksCount || 0;
    this.sessionTime = 0; // Reset current timer (not cumulative)
    this.activeRuleSetId = session.ruleSetId || null;

    // BUG FIX: Ensure this session has the most recent lastActive timestamp
    // to guarantee it moves to the top of the session list
    const maxLastActive = Math.max(
      ...this.sessions.map((s) => s.lastActive || 0),
      Date.now() - 1,
    );
    session.lastActive = maxLastActive + 1;
    session.isActive = true; // Mark session as active

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
    await chrome.storage.local.set({
      sessionBlocks: this.sessionBlocks,
      currentSessionId: this.currentSessionId,
      activeRuleSetId: this.activeRuleSetId,
    });

    // Start session stats tracking
    this.startSessionStatsTracking();

    // Get rules before and after the mode change to determine which tabs need reloading
    const beforeRules = this.getRulesFromData(
      this.customModes,
      wasFocusModeActive ? session.ruleSetId : null,
    );

    // Save state with "modeSettings" action to prevent automatic tab reload
    // We'll handle tab reloading manually after grayscale updates
    await this.saveState("modeSettings");

    // Update UI to reflect changes
    this.updateUI();

    // Ensure session list is re-rendered to show updated order
    this.renderSessionHistory();

    // Get the new mode's rules
    const activeRules = this.getActiveRules();

    // Update rules with background script for the new mode
    chrome.runtime.sendMessage({
      action: "updateRules",
      isActive: this.isActive,
      rules: activeRules,
    });

    // ALWAYS broadcast grayscale when switching modes, regardless of focus state
    // This ensures tabs reflect the new mode's grayscale setting immediately
    // The broadcastGrayscaleState() method will determine the correct state based on this.isActive
    await this.broadcastGrayscaleState();

    // Now reload only the tabs that changed from blocked to unblocked or vice versa
    // This happens AFTER grayscale update so unaffected tabs don't reload
    if (this.isActive) {
      chrome.runtime.sendMessage({
        action: "reloadAffectedTabs",
        rulesBefore: beforeRules,
        rulesAfter: activeRules,
        isActiveBefore: wasFocusModeActive,
        isActiveAfter: this.isActive,
      });
    }

    // Show notification
    this.showNotification(`Session "${session.name}" resumed!`);
  }

  async deactivateSession(sessionId: string) {
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
      session.isActive = false; // Clear active flag

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

      this.showNotification(`Session "${session.name}" ended!`);
    }
  }

  async deleteSession(sessionId: string) {
    const session = this.sessions.find((s) => s.id === sessionId);
    if (!session) return;

    const totalTime = (session.focusedTime || 0) + (session.breakTime || 0);
    const timeLabel = `${Math.floor(totalTime / 3600)}h ${Math.floor((totalTime % 3600) / 60)}m`;
    const blocksLabel = `${session.blocksCount || 0} block${(session.blocksCount || 0) !== 1 ? "s" : ""}`;
    this._showConfirmModal({
      title: "Delete Session",
      message: `"${session.name}" will be permanently deleted, including ${timeLabel} of focus time and ${blocksLabel}.`,
      confirmText: "Delete",
      onConfirm: async () => {
        if (this.currentSessionId === sessionId) {
          if (this.isActive) await this.toggleProducing();
          this.commitCurrentSessionTime();
          this.stopSessionStatsTracking();
          this.currentSessionId = null;
          this.sessionBlocks = 0;
          this.sessionTime = 0;
          this.isActive = false;
          this.stopTimerUpdates();
        }
        this.sessions = this.sessions.filter((s) => s.id !== sessionId);
        await this.saveState();
        this.updateUI();
        this.showNotification("Session deleted");
      },
    });
  }

  editSessionRuleSet(sessionId: string) {
    const session = this.sessions.find((s) => s.id === sessionId);
    if (!session) return;

    // Create a simple UI to select mode
    const currentRuleSet = this.customModes.find(
      (rs) => rs.id === session.ruleSetId,
    );
    const currentRuleSetName = currentRuleSet ? currentRuleSet.name : "No Mode";

    // Cycle through modes: No Mode -> Mode 1 -> Mode 2 -> ... -> No Mode
    const currentIndex = currentRuleSet
      ? this.customModes.findIndex((rs) => rs.id === session.ruleSetId)
      : -1;
    const nextIndex = (currentIndex + 1) % (this.customModes.length + 1);

    if (nextIndex === this.customModes.length) {
      // Set to "No Mode"
      session.ruleSetId = null;
    } else {
      // Set to next mode
      session.ruleSetId = this.customModes[nextIndex].id;
    }

    // If editing current session, update activeRuleSetId
    if (this.currentSessionId === sessionId) {
      this.activeRuleSetId = session.ruleSetId;
    }

    const newRuleSet = this.customModes.find(
      (rs) => rs.id === session.ruleSetId,
    );
    const newRuleSetName = newRuleSet ? newRuleSet.name : "No Mode";

    this.saveState();
    this.updateUI();
    this.showNotification(`Mode changed to: ${newRuleSetName}`);
  }
}

// Initialize popup
const popup = new ProducerPopup();
window.popupManager = popup; // Make accessible to onclick handlers

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "updateBlockCount") {
    popup.sessionBlocks = message.count;

    // Update home tab blocks count
    if (popup.blockedCount) {
      popup.blockedCount.textContent = String(popup.sessionBlocks);
    }

    // Update stats tab session blocks element
    if (popup.sessionBlocksEl) {
      popup.sessionBlocksEl.textContent = String(popup.sessionBlocks);
    }

    // Update current session's blocks count if there's an active session
    if (popup.currentSessionId) {
      const currentSession = popup.sessions.find(
        (s) => s.id === popup.currentSessionId,
      );
      if (currentSession) {
        // Update session data
        currentSession.blocksCount = popup.sessionBlocks;

        // Update Current Session section blocks count
        if (popup.currentSessionBlocksCount) {
          popup.currentSessionBlocksCount.textContent = String(
            popup.sessionBlocks,
          );
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
      popup.blockedCount.textContent = String(popup.sessionBlocks);
    }

    // Update stats tab session blocks element
    if (popup.sessionBlocksEl) {
      popup.sessionBlocksEl.textContent = String(popup.sessionBlocks);
    }

    // Update current session object & UI if active
    if (popup.currentSessionId) {
      const currentSession = popup.sessions.find(
        (s) => s.id === popup.currentSessionId,
      );
      if (currentSession) {
        currentSession.blocksCount = popup.sessionBlocks;

        // Update Current Session section blocks count
        if (popup.currentSessionBlocksCount) {
          popup.currentSessionBlocksCount.textContent = String(
            popup.sessionBlocks,
          );
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
