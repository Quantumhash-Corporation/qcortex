/**
 * Browser Controller
 *
 * Connects the autonomous agent to QCortex's browser automation system.
 * Uses the CLI commands to control the browser.
 */

import { exec } from "child_process";
import * as fs from "fs/promises";
import * as path from "path";
import { promisify } from "util";

const execAsync = promisify(exec);

export interface BrowserSnapshot {
  content: string;
  refs: Record<string, string>;
}

export interface BrowserConfig {
  profile?: string;
  timeout?: number;
}

/**
 * Browser controller for autonomous web agent
 */
export class BrowserController {
  private profile: string;
  private timeout: number;

  constructor(config: BrowserConfig = {}) {
    this.profile = config.profile || "qcortex";
    this.timeout = config.timeout || 30000;
  }

  /**
   * Check if browser is available and running
   */
  async status(): Promise<{ running: boolean; tabs: number }> {
    try {
      const { stdout } = await execAsync(
        `qcortex browser --browser-profile ${this.profile} status --json`,
        { timeout: 5000 },
      );
      const result = JSON.parse(stdout);
      return {
        running: result.state === "running",
        tabs: result.tabs?.length || 0,
      };
    } catch {
      return { running: false, tabs: 0 };
    }
  }

  /**
   * Start the browser
   */
  async start(): Promise<boolean> {
    try {
      await execAsync(`qcortex browser --browser-profile ${this.profile} start`, {
        timeout: this.timeout,
      });
      return true;
    } catch (error) {
      console.error("Failed to start browser:", error);
      return false;
    }
  }

  /**
   * Navigate to a URL
   */
  async navigate(url: string): Promise<boolean> {
    try {
      await execAsync(`qcortex browser --browser-profile ${this.profile} navigate "${url}"`, {
        timeout: this.timeout,
      });
      return true;
    } catch (error) {
      console.error("Failed to navigate:", error);
      return false;
    }
  }

  /**
   * Get a snapshot of the current page
   */
  async snapshot(format: "ai" | "interactive" = "interactive"): Promise<BrowserSnapshot | null> {
    try {
      const formatFlag = format === "interactive" ? "--interactive" : "";
      const { stdout } = await execAsync(
        `qcortex browser --browser-profile ${this.profile} snapshot ${formatFlag} --json`,
        { timeout: this.timeout },
      );
      return JSON.parse(stdout);
    } catch (error) {
      console.error("Failed to get snapshot:", error);
      return null;
    }
  }

  /**
   * Take a screenshot
   */
  async screenshot(outputPath?: string): Promise<string | null> {
    const targetPath = outputPath || `/tmp/qcortex/screenshots/screenshot-${Date.now()}.png`;

    try {
      // Ensure directory exists
      await fs.mkdir(path.dirname(targetPath), { recursive: true });

      await execAsync(
        `qcortex browser --browser-profile ${this.profile} screenshot --full-page --output "${targetPath}"`,
        { timeout: this.timeout },
      );
      return targetPath;
    } catch (error) {
      console.error("Failed to take screenshot:", error);
      return null;
    }
  }

  /**
   * Click an element by ref
   */
  async click(ref: string, options: { double?: boolean } = {}): Promise<boolean> {
    try {
      const doubleFlag = options.double ? "--double" : "";
      await execAsync(
        `qcortex browser --browser-profile ${this.profile} click ${ref} ${doubleFlag}`,
        { timeout: this.timeout },
      );
      return true;
    } catch (error) {
      console.error("Failed to click:", error);
      return false;
    }
  }

  /**
   * Type text into an element
   */
  async type(ref: string, text: string, options: { submit?: boolean } = {}): Promise<boolean> {
    try {
      const submitFlag = options.submit ? "--submit" : "";
      // Escape special characters for shell
      const escapedText = text.replace(/"/g, '\\"');
      await execAsync(
        `qcortex browser --browser-profile ${this.profile} type ${ref} "${escapedText}" ${submitFlag}`,
        { timeout: this.timeout },
      );
      return true;
    } catch (error) {
      console.error("Failed to type:", error);
      return false;
    }
  }

  /**
   * Fill multiple form fields at once
   */
  async fill(fields: Array<{ ref: string; value: string }>): Promise<boolean> {
    try {
      const fieldsJson = JSON.stringify(fields);
      await execAsync(
        `qcortex browser --browser-profile ${this.profile} fill --fields '${fieldsJson}'`,
        { timeout: this.timeout },
      );
      return true;
    } catch (error) {
      console.error("Failed to fill form:", error);
      return false;
    }
  }

  /**
   * Wait for something on the page
   */
  async wait(options: {
    text?: string;
    selector?: string;
    url?: string;
    timeout?: number;
  }): Promise<boolean> {
    try {
      const args: string[] = [];
      if (options.text) {
        args.push(`--text "${options.text}"`);
      }
      if (options.selector) {
        args.push(options.selector);
      }
      if (options.url) {
        args.push(`--url "${options.url}"`);
      }
      const timeout = options.timeout || this.timeout;

      await execAsync(`qcortex browser --browser-profile ${this.profile} wait ${args.join(" ")}`, {
        timeout,
      });
      return true;
    } catch (error) {
      console.error("Failed to wait:", error);
      return false;
    }
  }

  /**
   * Upload a file
   */
  async upload(filePath: string, inputRef?: string): Promise<boolean> {
    try {
      if (inputRef) {
        await execAsync(
          `qcortex browser --browser-profile ${this.profile} upload "${filePath}" --input-ref ${inputRef}`,
          { timeout: this.timeout },
        );
      } else {
        // Upload and wait for file chooser
        await execAsync(`qcortex browser --browser-profile ${this.profile} upload "${filePath}"`, {
          timeout: this.timeout,
        });
      }
      return true;
    } catch (error) {
      console.error("Failed to upload:", error);
      return false;
    }
  }

  /**
   * Get current URL
   */
  async getUrl(): Promise<string | null> {
    try {
      const { stdout } = await execAsync(
        `qcortex browser --browser-profile ${this.profile} tab --json`,
        { timeout: 5000 },
      );
      const result = JSON.parse(stdout);
      return result.url || null;
    } catch {
      return null;
    }
  }

  /**
   * Get list of open tabs
   */
  async listTabs(): Promise<Array<{ id: string; title: string; url: string }>> {
    try {
      const { stdout } = await execAsync(
        `qcortex browser --browser-profile ${this.profile} tabs --json`,
        { timeout: 5000 },
      );
      return JSON.parse(stdout);
    } catch {
      return [];
    }
  }

  /**
   * Open a new tab
   */
  async openTab(url?: string): Promise<boolean> {
    try {
      const urlArg = url ? `"${url}"` : "";
      await execAsync(`qcortex browser --browser-profile ${this.profile} tab new ${urlArg}`, {
        timeout: this.timeout,
      });
      return true;
    } catch (error) {
      console.error("Failed to open tab:", error);
      return false;
    }
  }

  /**
   * Close a tab
   */
  async closeTab(tabId: string): Promise<boolean> {
    try {
      await execAsync(`qcortex browser --browser-profile ${this.profile} tab close ${tabId}`, {
        timeout: 5000,
      });
      return true;
    } catch (error) {
      console.error("Failed to close tab:", error);
      return false;
    }
  }

  /**
   * Press a keyboard key
   */
  async press(key: string): Promise<boolean> {
    try {
      await execAsync(`qcortex browser --browser-profile ${this.profile} press ${key}`, {
        timeout: this.timeout,
      });
      return true;
    } catch (error) {
      console.error("Failed to press key:", error);
      return false;
    }
  }
}

/**
 * Factory to create browser controller with defaults
 */
export function createBrowserController(config?: BrowserConfig): BrowserController {
  return new BrowserController(config);
}
