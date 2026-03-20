/**
 * Subagent Registry
 *
 * Registers all available subagents with the SubagentDispatcher.
 * New subagents should be imported and registered here.
 */

import { AccountCreatorSubagent } from "./account-creator.js";
import { DataUploaderSubagent } from "./data-uploader.js";
import { OTPFetcherSubagent } from "./otp-fetcher.js";
import { SubagentDispatcher } from "./subagent-dispatcher.js";

/**
 * Initialize and configure all subagents
 */
export function initializeSubagents(dispatcher: SubagentDispatcher): void {
  // Register OTP Fetcher subagent
  dispatcher.register(new OTPFetcherSubagent());

  // Register Account Creator subagent
  dispatcher.register(new AccountCreatorSubagent());

  // Register Data Uploader subagent
  dispatcher.register(new DataUploaderSubagent());
}

/**
 * Get list of all registered subagent IDs
 */
export function getSubagentIds(): string[] {
  return ["otp-fetcher", "account-creator", "data-uploader"];
}

/**
 * Get subagent capability mapping
 */
export function getSubagentCapabilities(): Map<string, string[]> {
  const capabilities = new Map<string, string[]>();
  capabilities.set("otp-fetcher", ["email", "sms", "otp"]);
  capabilities.set("account-creator", ["account-creation", "form-fill", "otp", "browser"]);
  capabilities.set("data-uploader", ["file-upload", "cloud-storage", "browser"]);
  return capabilities;
}

export { OTPFetcherSubagent, AccountCreatorSubagent, DataUploaderSubagent };
