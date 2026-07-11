// Shared ambient types for the Producer extension.
// All scripts are plain (non-module) Chrome extension scripts, so these
// declarations are global and available in every src/*.ts file.

/** Rule types stored inside a mode's rules[] or permanentRules[]. */
type RuleType = "domain" | "url" | "allow" | "allowParam";

interface RuleBase {
  id?: number;
  created?: string;
  /** When true the rule is mirrored into permanentRules[] (always active). */
  permanent?: boolean;
}

/** Blocks/allows by URL or domain. */
interface UrlRule extends RuleBase {
  type: "domain" | "url" | "allow";
  url: string;
  paramKey?: undefined;
  paramValue?: undefined;
}

/** Allows an otherwise-blocked URL when a query param matches. */
interface ParamRule extends RuleBase {
  type: "allowParam";
  paramKey: string;
  /** Empty string means "any value". */
  paramValue: string;
  url?: undefined;
}

type Rule = UrlRule | ParamRule;

interface ModeSettings {
  grayscaleEnabled?: boolean;
}

/** A rule set ("mode") shown in the popup's Rules tab. */
interface Mode {
  id: string;
  name: string;
  rules: Rule[];
  settings?: ModeSettings;
  lastActivated?: number;
}

/** A focus session tracked in the popup's Stats tab. */
interface Session {
  id: string;
  name: string;
  ruleSetId: string | null;
  startTime?: number;
  endTime?: number | null;
  blocksCount?: number;
  created?: number;
  lastActive?: number;
  isActive?: boolean;
  /** Cumulative committed focus seconds. */
  focusedTime?: number;
  /** Cumulative committed break seconds. */
  breakTime?: number;
  sessionStartTime?: number;
  /** Set while focus mode is running for this session. */
  sessionFocusStartTime?: number | null;
  /** Set while the session exists but focus mode is paused. */
  sessionPauseStartTime?: number | null;
}

/** Block-page personalization fields shared by popup, background and content. */
interface PersonalizationFields {
  theme?: string;
  blockPageTitle?: string;
  blockPageMessage?: string;
  blockPageShowQuotes?: boolean;
  blockPageBackgroundImage?: string;
  blockPageBackgroundImageName?: string;
  blockPagePrimaryColor?: string;
  blockPageAccentColor?: string;
  blockPageUseThemeColors?: boolean;
  blockPageShowActionButtons?: boolean;
}

/**
 * Runtime message envelope. `action` selects the handler; all other fields
 * are optional and only present for the actions that use them.
 */
interface RuntimeMessage extends PersonalizationFields {
  action: string;
  url?: string;
  rules?: Rule[];
  isActive?: boolean;
  focusedTime?: number;
  isReload?: boolean;
  enabled?: boolean;
  isPermanent?: boolean;
  count?: number;
  sessionTime?: number;
  totalSessionTime?: number;
  // reloadAffectedTabs payload
  rulesBefore?: Rule[];
  rulesAfter?: Rule[];
  isActiveBefore?: boolean;
  isActiveAfter?: boolean;
  permanentRulesBefore?: Rule[];
  permanentRulesAfter?: Rule[];
}

interface Window {
  popupManager?: unknown;
}
