"use strict";
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
        this.blockPageTitle = "Stay Focused";
        this.blockPageMessage = "This site is blocked during your focus session";
        this.blockPageShowQuotes = true;
        this.blockPageBackgroundImage = "";
        this.blockPagePrimaryColor = "#667eea";
        this.blockPageAccentColor = "#2ecc71";
        this.blockPageShowActionButtons = true;
        this.init();
        this.interceptNavigationAttempts();
        this.observeUrlChanges();
        this.setupThemeListener();
    }
    setupThemeListener() {
        // Listen for theme updates from background script
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message.action === "applyBlockPageTheme") {
                this.blockPageTheme = message.theme || "blue";
                this.blockPageTitle = message.blockPageTitle || "🎯 Stay Focused";
                this.blockPageMessage =
                    message.blockPageMessage ||
                        "This site is blocked during your focus session";
                this.blockPageShowQuotes =
                    message.blockPageShowQuotes !== undefined
                        ? message.blockPageShowQuotes
                        : true;
                this.blockPageBackgroundImage = message.blockPageBackgroundImage || "";
                this.blockPagePrimaryColor =
                    message.blockPagePrimaryColor || "#667eea";
                this.blockPageAccentColor = message.blockPageAccentColor || "#2ecc71";
                this.blockPageShowActionButtons =
                    message.blockPageShowActionButtons !== undefined
                        ? message.blockPageShowActionButtons
                        : true;
                sendResponse({ success: true });
            }
            else if (message.action === "applyModeFeatures") {
                this.toggleGrayscaleFilter(!!message.grayscaleEnabled);
                this.toggleYoutubeRecommendations(!!message.hideYoutubeRecommendationsEnabled);
                sendResponse({ success: true });
            }
            return true; // Keep the message channel open for async response
        });
        // Load current theme and mode-feature settings from storage on initialization
        chrome.storage.local.get([
            "theme",
            "blockPageTitle",
            "blockPageMessage",
            "blockPageShowQuotes",
            "blockPageBackgroundImage",
            "blockPagePrimaryColor",
            "blockPageAccentColor",
            "blockPageShowActionButtons",
            "grayscaleEnabled",
            "hideYoutubeRecommendationsEnabled",
            "isActive",
        ], (data) => {
            if (data.theme) {
                this.blockPageTheme = data.theme;
            }
            if (data.blockPageTitle) {
                this.blockPageTitle = data.blockPageTitle;
            }
            if (data.blockPageMessage) {
                this.blockPageMessage = data.blockPageMessage;
            }
            if (data.blockPageShowQuotes !== undefined) {
                this.blockPageShowQuotes = data.blockPageShowQuotes;
            }
            if (data.blockPageBackgroundImage) {
                this.blockPageBackgroundImage = data.blockPageBackgroundImage;
            }
            if (data.blockPagePrimaryColor) {
                this.blockPagePrimaryColor = data.blockPagePrimaryColor;
            }
            if (data.blockPageAccentColor) {
                this.blockPageAccentColor = data.blockPageAccentColor;
            }
            if (data.blockPageShowActionButtons !== undefined) {
                this.blockPageShowActionButtons = data.blockPageShowActionButtons;
            }
            // Apply mode features only while focus mode is active
            if (data.isActive) {
                if (data.grayscaleEnabled) {
                    this.toggleGrayscaleFilter(true);
                }
                if (data.hideYoutubeRecommendationsEnabled) {
                    this.toggleYoutubeRecommendations(true);
                }
            }
        });
        // Listen for storage changes to react to mode-feature setting changes
        // This is the PRIMARY method for instant updates across all tabs
        chrome.storage.onChanged.addListener((changes, areaName) => {
            if (areaName === "local") {
                // Check if any mode feature or isActive changed
                if (changes.grayscaleEnabled ||
                    changes.hideYoutubeRecommendationsEnabled ||
                    changes.isActive ||
                    changes.activeRuleSetId) {
                    // Always re-read fresh values from storage when any relevant key changes
                    chrome.storage.local.get([
                        "grayscaleEnabled",
                        "hideYoutubeRecommendationsEnabled",
                        "isActive",
                    ], (data) => {
                        // Force update every feature to the fresh state
                        this.toggleGrayscaleFilter(!!(data.grayscaleEnabled && data.isActive));
                        this.toggleYoutubeRecommendations(!!(data.hideYoutubeRecommendationsEnabled && data.isActive));
                        // Force a reflow to ensure the change is applied immediately
                        if (document.documentElement) {
                            void document.documentElement.offsetHeight;
                        }
                    });
                }
            }
        });
    }
    /**
     * Injects (or replaces) a <style> tag by id. The content script runs at
     * document_start, so the document may not have a node to append to yet.
     */
    injectStyle(id, css) {
        // Remove existing style first to ensure clean state
        const existing = document.getElementById(id);
        if (existing) {
            existing.remove();
        }
        const apply = () => {
            if (!document.head && !document.documentElement) {
                setTimeout(apply, 10);
                return;
            }
            const style = document.createElement("style");
            style.id = id;
            style.textContent = css;
            // Append to head if available, otherwise to documentElement
            const target = document.head || document.documentElement;
            target.appendChild(style);
            // Force reflow to ensure the style is applied
            if (document.documentElement) {
                document.documentElement.offsetHeight;
            }
        };
        apply();
    }
    removeStyle(id) {
        const style = document.getElementById(id);
        if (style) {
            style.remove();
        }
    }
    toggleGrayscaleFilter(enabled) {
        // Check if we're on a blocked page - don't apply grayscale to block pages
        if (document.getElementById("producer-block-overlay")) {
            return;
        }
        const styleId = "producer-grayscale-filter";
        if (enabled) {
            this.injectStyle(styleId, `
          html {
            filter: grayscale(100%) !important;
            -webkit-filter: grayscale(100%) !important;
          }
        `);
        }
        else {
            this.removeStyle(styleId);
        }
    }
    isYoutube() {
        return /(^|\.)youtube\.com$/.test(window.location.hostname);
    }
    /**
     * Hides YouTube's algorithmic video suggestions while focus mode is active:
     * the related-videos column beside the player (and its stacked position on
     * narrow layouts), plus the suggestions layered over the player itself when
     * it is paused or a video ends. The playlist queue and live chat, which also
     * live in the sidebar, are intentionally left alone.
     */
    toggleYoutubeRecommendations(enabled) {
        const styleId = "producer-hide-youtube-recommendations";
        if (!enabled || !this.isYoutube()) {
            this.removeStyle(styleId);
            return;
        }
        this.injectStyle(styleId, `
        #related,
        ytd-watch-next-secondary-results-renderer,
        .ytp-endscreen-content,
        .ytp-ce-element,
        .ytp-pause-overlay,
        .ytp-suggestion-set {
          display: none !important;
        }
      `);
    }
    async init() {
        await this.checkAndBlock(window.location.href);
    }
    async checkAndBlock(url, attempt = 0) {
        // Skip if already blocked or same URL
        if (this.isBlocked ||
            (url === this.lastUrl &&
                document.getElementById("producer-block-overlay"))) {
            return false;
        }
        this.lastUrl = url;
        try {
            const response = await chrome.runtime.sendMessage({
                action: "checkBlock",
                url: url,
            });
            // The tab may have already moved on to a different URL while we were
            // waiting on the background response. Many sites (YouTube included)
            // briefly rewrite the address bar via the History API to an internal
            // "redirect"/tracking URL when a link is clicked, then immediately
            // replace it again with the real destination — without ever loading a
            // new page. If we acted on the stale URL here, an already-allowed page
            // could get blocked over a URL the tab never actually settled on.
            // Re-check wherever the tab actually is now instead of trusting `url`.
            const currentUrl = window.location.href;
            if (currentUrl !== url) {
                // Bound the re-check chain in case a page keeps rewriting its URL;
                // whatever it settles on will still get checked on the next event.
                if (attempt >= 5)
                    return false;
                return this.checkAndBlock(currentUrl, attempt + 1);
            }
            if (response && response.shouldBlock) {
                this.blockPage();
                return true;
            }
            return false;
        }
        catch (err) {
            console.error("Could not contact background script:", err);
            return false;
        }
    }
    // Debounced URL check to prevent race conditions. Always reads the URL at
    // fire time (not when scheduled) so a burst of rapid URL changes — like a
    // History-API redirect bouncing through an intermediate URL — resolves to
    // wherever the tab actually settles, not a stale intermediate value.
    debouncedCheck() {
        if (this.checkTimeout) {
            clearTimeout(this.checkTimeout);
        }
        this.checkTimeout = setTimeout(() => {
            this.checkAndBlock(window.location.href);
        }, 100); // 100ms debounce
    }
    // Intercept all navigation attempts before they happen
    interceptNavigationAttempts() {
        // Store reference to this instance for use in event listeners
        const self = this;
        // Intercept all clicks on links
        document.addEventListener("click", async (e) => {
            const eventTarget = e.target;
            const target = eventTarget instanceof Element
                ? eventTarget
                : eventTarget instanceof Node
                    ? eventTarget.parentElement
                    : null;
            if (!target)
                return;
            const link = target.closest("a[href]");
            if (link) {
                const href = link.getAttribute("href");
                if (!href)
                    return;
                let targetUrl;
                // Handle different types of links
                if (href.startsWith("http")) {
                    targetUrl = href;
                }
                else if (href.startsWith("/")) {
                    targetUrl = window.location.origin + href;
                }
                else if (href.startsWith("#")) {
                    targetUrl =
                        window.location.origin + window.location.pathname + href;
                }
                else {
                    // Use URL constructor for better reliability
                    try {
                        targetUrl = new URL(href, window.location.href).href;
                    }
                    catch (e) {
                        return; // Invalid URL, let it proceed
                    }
                }
                // Links opened in a new tab/window (target="_blank" or a
                // ctrl/cmd/shift-click) must never affect the current page — only
                // the new tab's own navigation should be checked and blocked.
                // Otherwise a blocked link on an allowed page (e.g. a redirect
                // link under a domain that's blocked at the root) would replace
                // the current, already-allowed page with the blocked page.
                const opensInNewTab = link.getAttribute("target") === "_blank" ||
                    e.ctrlKey ||
                    e.metaKey ||
                    e.shiftKey;
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
                        if (opensInNewTab) {
                            // Just stop the new tab from opening; leave the current
                            // page alone, but still count it as a block.
                            chrome.runtime
                                .sendMessage({ action: "reportBlock", url: targetUrl })
                                .catch(() => { });
                        }
                        else {
                            // Show block page immediately with correct URL (this will report the block)
                            self.blockPage(targetUrl);
                        }
                        return false;
                    }
                }
                catch (err) {
                    console.error("Could not check URL:", err);
                }
            }
        }, true);
        // Intercept form submissions
        document.addEventListener("submit", async (e) => {
            const form = e.target;
            if (form && form.action) {
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
                }
                catch (err) {
                    console.error("Could not check form action:", err);
                }
            }
        }, true);
        // Override history methods with better error handling
        const originalPushState = history.pushState;
        const originalReplaceState = history.replaceState;
        history.pushState = function (state, title, url) {
            try {
                originalPushState.apply(this, arguments);
                // Dispatched after apply() so the debounced check (which reads
                // window.location.href when it fires) sees the URL that's actually
                // live, not a value computed ahead of the real navigation.
                window.dispatchEvent(new Event("producer-urlchange"));
            }
            catch (err) {
                // Fallback to original behavior if our override fails
                originalPushState.apply(this, arguments);
            }
        };
        history.replaceState = function (state, title, url) {
            try {
                originalReplaceState.apply(this, arguments);
                window.dispatchEvent(new Event("producer-urlchange"));
            }
            catch (err) {
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
                }
                catch (err) {
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
        }
        catch (error) {
            console.error("Error getting motivational quote:", error);
            return defaultQuote;
        }
    }
    async blockPage(blockedUrl = null) {
        this.isBlocked = true;
        // Use provided URL or fall back to current location
        const urlToReport = blockedUrl || window.location.href;
        // Report the block to background script and get block number + redirect URL.
        let blockNumber = 1;
        let blockedPageUrl = null;
        const navigationEntry = performance.getEntriesByType("navigation")[0];
        const isReload = navigationEntry && navigationEntry.type
            ? navigationEntry.type === "reload"
            : false;
        try {
            const response = await chrome.runtime.sendMessage({
                action: "reportBlock",
                url: urlToReport,
                isReload,
            });
            if (response &&
                Number.isFinite(response.blockNumber) &&
                response.blockNumber >= 1) {
                blockNumber = response.blockNumber;
            }
            if (response && response.blockedPageUrl) {
                blockedPageUrl = response.blockedPageUrl;
            }
        }
        catch (err) {
            console.error("Could not report block:", err);
        }
        this.cleanup();
        if (!blockedPageUrl) {
            try {
                const url = new URL(chrome.runtime.getURL("blocked.html"));
                url.searchParams.set("blockedUrl", urlToReport);
                url.searchParams.set("blockNumber", String(blockNumber));
                blockedPageUrl = url.toString();
            }
            catch (error) {
                console.error("Could not build blocked page URL:", error);
                return;
            }
        }
        try {
            window.location.replace(blockedPageUrl);
        }
        catch (error) {
            console.error("Could not navigate to blocked page:", error);
        }
    }
    observeUrlChanges() {
        // Listen for popstate, hashchange, and custom urlchange events
        window.addEventListener("popstate", () => {
            this.debouncedCheck();
        });
        window.addEventListener("hashchange", () => {
            this.debouncedCheck();
        });
        window.addEventListener("producer-urlchange", () => {
            this.debouncedCheck();
        });
        // More efficient MutationObserver - only observe significant changes
        const startObserver = () => {
            if (document.body) {
                this.observer = new MutationObserver((mutations) => {
                    if (window.location.href !== this.lastUrl) {
                        this.debouncedCheck();
                    }
                });
                this.observer.observe(document.body, {
                    childList: true,
                    subtree: false, // Less aggressive - only direct children
                });
            }
            else {
                setTimeout(startObserver, 100);
            }
        };
        startObserver();
        // Less aggressive polling - 2 seconds instead of 500ms
        this.pollInterval = setInterval(() => {
            if (window.location.href !== this.lastUrl && !this.isBlocked) {
                this.debouncedCheck();
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
            document.removeEventListener("visibilitychange", this.blockVisibilityHandler);
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
