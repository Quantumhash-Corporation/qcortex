/**
 * Google Account Login Step for Onboarding
 *
 * This step opens a browser for the user to login to their Google account.
 * The session is saved for future headless browser automation tasks.
 */

import { exec } from "node:child_process";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { promisify } from "node:util";
import type { QCortexConfig } from "../config/config.js";
import { readConfigFileSnapshot, writeConfigFile } from "../config/config.js";
import type { WizardPrompter } from "./prompts.js";

const execAsync = promisify(exec);

const GOOGLE_LOGIN_URL = "https://myaccount.google.com/";
const PROFILE_DIR = path.join(os.homedir(), ".qcortex", "browser", "qcortex", "user-data");

/**
 * Check if we're running in non-interactive mode by checking if stdin is a TTY
 */
function isInteractive(): boolean {
  return process.stdin.isTTY ?? false;
}

/**
 * Run Google login step without a prompter (for programmatic use)
 */
export async function runGoogleLoginStepNoPrompt(): Promise<void> {
  // Copy existing Google profile if available
  await copyGoogleProfile();

  // Enable headless mode
  const snapshot = await readConfigFileSnapshot();
  const currentConfig: QCortexConfig = snapshot.valid ? snapshot.config : {};

  await writeConfigFile({
    ...currentConfig,
    browser: {
      ...currentConfig.browser,
      headless: true,
    },
  });
}

/**
 * Detect if user is logged into Google by checking for Google cookies
 */
async function detectGoogleLogin(): Promise<boolean> {
  try {
    const cookiesFile = path.join(PROFILE_DIR, "Default", "Cookies");
    await fs.access(cookiesFile);

    // Use sqlite3 to check for Google cookies
    const { stdout } = await execAsync(
      `sqlite3 "${cookiesFile}" "SELECT COUNT(*) FROM cookies WHERE host_key LIKE '%google.com%' OR host_key LIKE '%youtube.com%'"`,
    );

    const count = parseInt(stdout.trim(), 10);
    return count > 0;
  } catch {
    return false;
  }
}

/**
 * Open browser and wait for user to login to Google
 * Returns true if login was successful
 */
async function waitForGoogleLogin(timeoutMs: number = 120000): Promise<boolean> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    const isLoggedIn = await detectGoogleLogin();
    if (isLoggedIn) {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  return false;
}

/**
 * Copy user's existing Google Chrome profile to QCortex profile
 */
async function copyGoogleProfile(): Promise<void> {
  const googleProfileDir = path.join(
    os.homedir(),
    "Library",
    "Application Support",
    "Google",
    "Chrome",
    "Default",
  );

  const qcortexProfileDir = path.join(PROFILE_DIR, "Default");

  try {
    // Check if Google profile exists
    await fs.access(googleProfileDir);

    // Create QCortex profile directory
    await fs.mkdir(qcortexProfileDir, { recursive: true });

    // Copy Google profile files
    const files = await fs.readdir(googleProfileDir);
    for (const file of files) {
      const src = path.join(googleProfileDir, file);
      const dest = path.join(qcortexProfileDir, file);

      // Skip some files that might be locked
      try {
        const stat = await fs.stat(src);
        if (stat.isDirectory()) {
          await fs.cp(src, dest, { recursive: true, force: true });
        } else if (file !== "Cookies" && file !== "Cookies-journal") {
          await fs.copyFile(src, dest);
        }
      } catch {
        // Skip files that can't be copied
      }
    }
  } catch {
    // Google profile doesn't exist, will use fresh profile
    console.log("No existing Google Chrome profile found, will create new one");
  }
}

/**
 * Start browser in headed mode for login
 */
async function startBrowserHeaded(): Promise<boolean> {
  try {
    // Ensure profile directory exists
    await fs.mkdir(PROFILE_DIR, { recursive: true });

    // First try to stop any existing browser
    try {
      await execAsync("qcortex browser --browser-profile qcortex stop", { timeout: 5000 });
    } catch {
      // Ignore if not running
    }

    // Update config to use headed mode temporarily
    const snapshot = await readConfigFileSnapshot();
    const currentConfig: QCortexConfig = snapshot.valid ? snapshot.config : {};

    // Save current browser config
    const browserConfig = currentConfig.browser;
    const wasHeadless = browserConfig?.headless;

    // Set to headed mode
    const newConfig: QCortexConfig = {
      ...currentConfig,
      browser: {
        ...browserConfig,
        headless: false,
      },
    };

    await writeConfigFile(newConfig);

    // Start browser in headed mode
    await execAsync("qcortex browser --browser-profile qcortex start", { timeout: 30000 });

    // Restore original headless setting
    if (wasHeadless !== undefined) {
      await writeConfigFile({
        ...newConfig,
        browser: {
          ...newConfig.browser,
          headless: wasHeadless,
        },
      });
    }

    return true;
  } catch (error) {
    console.error("Failed to start browser:", error);
    return false;
  }
}

/**
 * Stop the browser
 */
async function stopBrowser(): Promise<void> {
  try {
    await execAsync("qcortex browser --browser-profile qcortex stop", { timeout: 10000 });
  } catch {
    // Ignore errors
  }
}

/**
 * Run the Google login step during onboarding
 *
 * This step:
 * 1. Copies user's existing Google Chrome profile (if available)
 * 2. Opens browser in headed mode
 * 3. Navigates to Google account page
 * 4. Waits for user to login
 * 5. Saves session and closes browser
 * 6. Sets up headless mode for future use
 *
 * In non-interactive mode, this step will:
 * - Copy existing Google profile if available
 * - Enable headless mode in config
 * - Skip the browser login prompt
 */
export async function runGoogleLoginStep(prompter: WizardPrompter): Promise<boolean> {
  // Check if we're in interactive mode
  const isInteractiveMode = isInteractive();

  // In non-interactive mode, just set up headless and copy profile
  if (!isInteractiveMode) {
    await prompter.note(
      [
        "Google Login (Skipped in non-interactive mode)",
        "",
        "The digital human agent requires Google login for browser automation.",
        "After onboarding completes, run:",
        "",
        "  qcortex browser login",
        "",
        "This will open a browser for you to login to Google.",
        "Setting up headless mode for future use...",
      ].join("\n"),
      "Google Login",
    );

    // Copy existing Google profile if available
    await copyGoogleProfile();

    // Enable headless mode
    const snapshot = await readConfigFileSnapshot();
    const currentConfig: QCortexConfig = snapshot.valid ? snapshot.config : {};

    await writeConfigFile({
      ...currentConfig,
      browser: {
        ...currentConfig.browser,
        headless: true,
      },
    });

    return false;
  }

  await prompter.note(
    [
      "Google Account Login (Required)",
      "",
      "To enable the digital human agent to perform web tasks, you need to login to your Google account.",
      "This session will be saved for future headless browser automation.",
      "",
      `Please login at: ${GOOGLE_LOGIN_URL}`,
    ].join("\n"),
    "Google Login",
  );

  // First, copy existing Google profile if available
  await copyGoogleProfile();

  // Start browser in headed mode
  const started = await startBrowserHeaded();
  if (!started) {
    await prompter.note("Failed to start browser. Please try again or skip this step.");
    return false;
  }

  // Navigate to Google account page
  try {
    await execAsync(`qcortex browser --browser-profile qcortex navigate "${GOOGLE_LOGIN_URL}"`, {
      timeout: 30000,
    });
  } catch (error) {
    console.error("Failed to navigate to Google:", error);
  }

  // Wait for user to login
  await prompter.note(
    [
      "Please login to your Google account in the browser window that opened.",
      "The browser will automatically close once login is detected.",
      "",
      "Waiting for login...",
    ].join("\n"),
    "Login Required",
  );

  const loginSuccess = await waitForGoogleLogin(120000); // 2 minute timeout

  // Close browser
  await stopBrowser();

  if (loginSuccess) {
    await prompter.note("Google login successful! Session saved.", "Success");

    // Update config to enable headless mode for future use
    const snapshot = await readConfigFileSnapshot();
    const currentConfig: QCortexConfig = snapshot.valid ? snapshot.config : {};

    await writeConfigFile({
      ...currentConfig,
      browser: {
        ...currentConfig.browser,
        headless: true,
      },
    });

    return true;
  } else {
    await prompter.note(
      "Login not detected. You can continue without Google login, but the digital human agent won't work until you login manually.",
      "Login Timeout",
    );
    return false;
  }
}
