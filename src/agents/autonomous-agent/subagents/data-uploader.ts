import type { Subagent, SubagentResult, TaskInput } from "../types.js";

interface DataUploaderConfig {
  browserTool?: {
    navigate: (url: string) => Promise<unknown>;
    upload: (inputRef: string, filePath: string) => Promise<unknown>;
    fill: (fields: { ref: string; value: string }[]) => Promise<unknown>;
    click: (ref: string) => Promise<unknown>;
    waitForSelector: (selector: string, timeoutMs?: number) => Promise<unknown>;
  };
  fileSystem?: {
    readFile: (path: string) => Promise<Buffer>;
  };
}

export class DataUploaderSubagent implements Subagent {
  name = "DataUploader";
  description = "Uploads files and data to websites, cloud storage, or web forms";

  private config: DataUploaderConfig;

  constructor(config: DataUploaderConfig = {}) {
    this.config = config;
  }

  canHandle(task: TaskInput): boolean {
    const desc = task.description.toLowerCase();
    const context = task.context;

    return (
      desc.includes("upload") ||
      desc.includes("submit") ||
      desc.includes("send") ||
      desc.includes("attach") ||
      context.destination === "web-form" ||
      context.destination === "google-drive" ||
      context.destination === "dropbox" ||
      context.filePath !== undefined
    );
  }

  async execute(task: TaskInput): Promise<SubagentResult> {
    const destination = task.context.destination as string;
    const webUrl = task.context.url as string;

    try {
      if (destination === "web-form" || webUrl) {
        return await this.uploadToWebForm(task);
      }

      if (destination === "google-drive") {
        return await this.uploadToGoogleDrive(task);
      }

      if (destination === "dropbox") {
        return await this.uploadToDropbox(task);
      }

      // Default to web form if URL provided
      if (webUrl) {
        return await this.uploadToWebForm(task);
      }

      return {
        success: false,
        error: {
          code: "UNSUPPORTED_DESTINATION",
          message: `Destination "${destination}" not supported`,
          recoverable: true,
          canEscalateToHuman: true,
        },
        requiresHumanHelp: true,
        humanHelpMessage: `Upload destination "${destination}" not supported. Please provide a web URL or specify a supported destination.`,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: "UPLOAD_FAILED",
          message: error instanceof Error ? error.message : String(error),
          recoverable: true,
          canEscalateToHuman: true,
        },
        requiresHumanHelp: true,
        humanHelpMessage: "Upload failed. Please help with the upload manually.",
      };
    }
  }

  private async uploadToWebForm(task: TaskInput): Promise<SubagentResult> {
    const url = task.context.url as string;
    const filePath = task.context.filePath as string;
    const data = task.context.data as Record<string, unknown>;

    if (!url) {
      return {
        success: false,
        error: {
          code: "NO_URL",
          message: "URL required for web form upload",
          recoverable: false,
          canEscalateToHuman: true,
        },
        requiresHumanHelp: true,
        humanHelpMessage: "Please provide the URL of the web form.",
      };
    }

    await this.config.browserTool?.navigate(url);

    if (filePath) {
      await this.config.browserTool?.upload("file-input", filePath);
    }

    if (data) {
      const fields = Object.entries(data).map(([key, value]) => ({
        ref: key,
        value: String(value),
      }));
      await this.config.browserTool?.fill(fields);
    }

    await this.config.browserTool?.click("submit");

    return {
      success: true,
      data: { uploaded: true, destination: "web-form", url },
    };
  }

  private async uploadToGoogleDrive(_task: TaskInput): Promise<SubagentResult> {
    await this.config.browserTool?.navigate("https://drive.google.com");
    await this.config.browserTool?.click("new-button");
    await this.config.browserTool?.click("file-upload");

    const filePath = _task.context.filePath as string;
    if (filePath) {
      await this.config.browserTool?.upload("file-input", filePath);
    }

    return {
      success: true,
      data: { uploaded: true, destination: "google-drive" },
    };
  }

  private async uploadToDropbox(_task: TaskInput): Promise<SubagentResult> {
    await this.config.browserTool?.navigate("https://www.dropbox.com");
    await this.config.browserTool?.click("upload-button");

    const filePath = _task.context.filePath as string;
    if (filePath) {
      await this.config.browserTool?.upload("file-input", filePath);
    }

    return {
      success: true,
      data: { uploaded: true, destination: "dropbox" },
    };
  }
}
