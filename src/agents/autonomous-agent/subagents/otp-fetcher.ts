import type { Subagent, SubagentResult, TaskInput } from "../types.js";

interface GmailMessage {
  id: string;
  subject?: string;
  body?: string;
}

interface OTPFetcherConfig {
  gmailClient?: {
    listMessages: (query: string) => Promise<GmailMessage[]>;
    getMessage: (id: string) => Promise<GmailMessage>;
  };
  mobileClient?: {
    waitForSMS: (phoneNumber: string, timeoutMs: number) => Promise<string>;
  };
  pollingIntervalMs?: number;
  timeoutMs?: number;
}

export class OTPFetcherSubagent implements Subagent {
  name = "OTPFetcher";
  description = "Retrieves verification codes (OTP) from email, SMS, or other sources";

  private config: Required<OTPFetcherConfig>;

  constructor(config: OTPFetcherConfig = {}) {
    this.config = {
      gmailClient: config.gmailClient!,
      mobileClient: config.mobileClient!,
      pollingIntervalMs: config.pollingIntervalMs ?? 5000,
      timeoutMs: config.timeoutMs ?? 60000,
    };
  }

  canHandle(task: TaskInput): boolean {
    const desc = task.description.toLowerCase();
    const context = task.context;
    const source = context.source as string | undefined;

    return (
      desc.includes("otp") ||
      desc.includes("verification code") ||
      desc.includes("confirm") ||
      desc.includes("2fa") ||
      desc.includes("two-factor") ||
      source === "gmail" ||
      source === "email" ||
      source === "sms" ||
      source === "mobile"
    );
  }

  async execute(task: TaskInput): Promise<SubagentResult> {
    const source = (task.context.source as string) || "gmail";

    try {
      if (source === "gmail" || source === "email") {
        return await this.fetchFromGmail(task);
      } else if (source === "sms" || source === "mobile") {
        return await this.fetchFromMobile(task);
      }

      // Try both sources if not specified
      if (this.config.gmailClient) {
        const gmailResult = await this.fetchFromGmail(task);
        if (gmailResult.success) {
          return gmailResult;
        }
      }

      if (this.config.mobileClient) {
        const mobileResult = await this.fetchFromMobile(task);
        return mobileResult;
      }

      // No clients configured - escalate to human
      return {
        success: false,
        error: {
          code: "OTP_FETCH_ERROR",
          message: "No OTP clients configured (no Gmail or mobile client available)",
          recoverable: true,
          canEscalateToHuman: true,
        },
        requiresHumanHelp: true,
        humanHelpMessage:
          "Could not automatically retrieve OTP. Please enter the verification code manually.",
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: "OTP_FETCH_ERROR",
          message: error instanceof Error ? error.message : String(error),
          recoverable: true,
          canEscalateToHuman: true,
        },
        requiresHumanHelp: true,
        humanHelpMessage:
          "Could not automatically retrieve OTP. Please enter the verification code manually.",
      };
    }
  }

  private async fetchFromGmail(_task: TaskInput): Promise<SubagentResult> {
    if (!this.config.gmailClient) {
      return {
        success: false,
        error: {
          code: "OTP_FETCH_ERROR",
          message: "Gmail client is not configured",
          recoverable: true,
          canEscalateToHuman: true,
        },
        requiresHumanHelp: true,
        humanHelpMessage:
          "Could not automatically retrieve OTP. Please enter the verification code manually.",
      };
    }

    const startTime = Date.now();

    try {
      // Poll for verification emails
      while (Date.now() - startTime < this.config.timeoutMs) {
        const messages = await this.config.gmailClient.listMessages(
          "subject:(verification OR code OR otp OR security) is:unread",
        );

        if (messages.length > 0) {
          // Get the most recent message
          const message = await this.config.gmailClient.getMessage(messages[0].id);
          const text = `${message.subject || ""} ${message.body || ""}`;

          const otp = this.extractOTP(text);
          if (otp) {
            return {
              success: true,
              data: {
                otp,
                source: "gmail",
                messageId: message.id,
              },
              metadata: {
                attempts: 1,
                source: "gmail",
              },
            };
          }
        }

        // Wait before polling again
        await new Promise((resolve) => setTimeout(resolve, this.config.pollingIntervalMs));
      }

      // Timeout reached
      return {
        success: false,
        error: {
          code: "OTP_TIMEOUT",
          message: `Timed out after ${this.config.timeoutMs}ms waiting for OTP email`,
          recoverable: true,
          canEscalateToHuman: true,
        },
        requiresHumanHelp: true,
        humanHelpMessage:
          "Did not receive verification email in time. Please enter the code manually or check your email.",
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: "GMAIL_FETCH_ERROR",
          message: error instanceof Error ? error.message : String(error),
          recoverable: true,
          canEscalateToHuman: true,
        },
        requiresHumanHelp: true,
        humanHelpMessage:
          "Could not fetch from Gmail. Please enter the verification code manually.",
      };
    }
  }

  private async fetchFromMobile(task: TaskInput): Promise<SubagentResult> {
    if (!this.config.mobileClient) {
      return {
        success: false,
        error: {
          code: "OTP_FETCH_ERROR",
          message: "Mobile client is not configured",
          recoverable: true,
          canEscalateToHuman: true,
        },
        requiresHumanHelp: true,
        humanHelpMessage:
          "Could not automatically retrieve OTP. Please enter the verification code manually.",
      };
    }

    const phoneNumber = (task.context.phoneNumber as string) || "";

    if (!phoneNumber) {
      return {
        success: false,
        error: {
          code: "MISSING_PHONE_NUMBER",
          message: "Phone number is required for SMS OTP retrieval",
          recoverable: false,
          canEscalateToHuman: true,
        },
        requiresHumanHelp: true,
        humanHelpMessage: "Please provide a phone number for SMS retrieval.",
      };
    }

    try {
      const smsText = await this.config.mobileClient.waitForSMS(phoneNumber, this.config.timeoutMs);

      const otp = this.extractOTP(smsText);
      if (otp) {
        return {
          success: true,
          data: {
            otp,
            source: "sms",
            phoneNumber,
          },
          metadata: {
            attempts: 1,
            source: "sms",
          },
        };
      }

      return {
        success: false,
        error: {
          code: "OTP_EXTRACTION_FAILED",
          message: "Could not extract OTP from SMS",
          recoverable: true,
          canEscalateToHuman: true,
        },
        requiresHumanHelp: true,
        humanHelpMessage: "Could not extract verification code from SMS. Please enter it manually.",
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: "SMS_FETCH_ERROR",
          message: error instanceof Error ? error.message : String(error),
          recoverable: true,
          canEscalateToHuman: true,
        },
        requiresHumanHelp: true,
        humanHelpMessage: "Could not receive SMS. Please enter the verification code manually.",
      };
    }
  }

  private extractOTP(text: string): string | null {
    // Patterns to match various OTP formats
    const patterns = [
      // Match labeled OTP codes (e.g., "Your OTP is 123456")
      /(?:code|otp|verification|pin|security)[^\d]*(\d{4,8})/i,
      // Match standalone 6-digit codes
      /\b(\d{6})\b/,
      // Match 4-8 digit codes with specific prefixes
      /(?:passcode|one-time|auth)[^\d]*(\d{4,8})/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    return null;
  }
}
