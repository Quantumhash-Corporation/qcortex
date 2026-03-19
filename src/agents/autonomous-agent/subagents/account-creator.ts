import type { Subagent, SubagentResult, TaskInput } from "../types.js";

interface AccountCreatorConfig {
  browserTool?: {
    navigate: (url: string) => Promise<unknown>;
    snapshot: () => Promise<unknown>;
    click: (ref: string) => Promise<unknown>;
    type: (ref: string, text: string) => Promise<unknown>;
    fill: (fields: { ref: string; value: string }[]) => Promise<unknown>;
    waitForSelector: (selector: string, timeoutMs?: number) => Promise<unknown>;
  };
  otpFetcher?: (task: TaskInput) => Promise<SubagentResult>;
}

export class AccountCreatorSubagent implements Subagent {
  name = "AccountCreator";
  description = "Creates accounts on websites, handles form filling and OTP verification";

  private config: AccountCreatorConfig;

  constructor(config: AccountCreatorConfig = {}) {
    this.config = config;
  }

  canHandle(task: TaskInput): boolean {
    const hasWebsite = !!task.context.website;
    if (!hasWebsite) {
      return false;
    }

    const desc = task.description.toLowerCase();
    return (
      desc.includes("account") ||
      desc.includes("sign up") ||
      desc.includes("register") ||
      desc.includes("create")
    );
  }

  async execute(task: TaskInput): Promise<SubagentResult> {
    const website = task.context.website as string;
    const formData = (task.context.formData as Record<string, string>) || {};
    const email = task.context.email as string;

    if (!website) {
      return {
        success: false,
        error: {
          code: "MISSING_WEBSITE",
          message: "Website URL is required",
          recoverable: false,
          canEscalateToHuman: true,
        },
        requiresHumanHelp: true,
        humanHelpMessage: "Please provide the website URL where to create the account.",
      };
    }

    try {
      // Navigate to signup page
      const signupUrl = this.getSignupUrl(website);
      await this.config.browserTool?.navigate(signupUrl);

      // Get page snapshot to understand form structure
      await this.config.browserTool?.snapshot();

      // Fill in form fields
      const fields = this.prepareFormFields(formData, email);
      if (fields.length > 0) {
        await this.config.browserTool?.fill(fields);
      }

      // Submit form
      await this.config.browserTool?.click("submit");
      await this.config.browserTool?.waitForSelector("form", 3000).catch(() => {
        /* ignore timeout */
      });

      // Check for OTP/verification requirement
      const resultSnapshot = await this.config.browserTool?.snapshot();
      const needsVerification = this.detectVerificationRequired(resultSnapshot);

      if (needsVerification && this.config.otpFetcher) {
        // Fetch OTP and submit
        const otpResult = await this.config.otpFetcher({
          ...task,
          context: { ...task.context, source: "gmail" },
        });

        if (otpResult.success && otpResult.data) {
          const otp = (otpResult.data as { otp: string }).otp;
          await this.config.browserTool?.type("otp-input", otp);
          await this.config.browserTool?.click("verify");

          return {
            success: true,
            data: {
              accountCreated: true,
              website,
              email,
              verified: true,
            },
          };
        }
      }

      return {
        success: true,
        data: {
          accountCreated: true,
          website,
          email,
          verified: !needsVerification,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: "ACCOUNT_CREATION_FAILED",
          message: error instanceof Error ? error.message : String(error),
          recoverable: true,
          canEscalateToHuman: true,
        },
        requiresHumanHelp: true,
        humanHelpMessage: `Could not complete account creation on ${website}. Please help with: ${
          error instanceof Error ? error.message : String(error)
        }`,
      };
    }
  }

  private getSignupUrl(website: string): string {
    const url = website.startsWith("http") ? website : `https://${website}`;
    const signupPaths = [
      "/signup",
      "/register",
      "/sign-up",
      "/join",
      "/create-account",
      "/auth/signup",
    ];
    return `${url}${signupPaths[0]}`;
  }

  private prepareFormFields(
    formData: Record<string, string>,
    email?: string,
  ): { ref: string; value: string }[] {
    const fields: { ref: string; value: string }[] = [];

    if (formData.email || email) {
      fields.push({ ref: "email", value: formData.email || email || "" });
    }
    if (formData.password) {
      fields.push({ ref: "password", value: formData.password });
    }
    if (formData.name) {
      fields.push({ ref: "name", value: formData.name });
    }
    if (formData.username) {
      fields.push({ ref: "username", value: formData.username });
    }

    return fields;
  }

  private detectVerificationRequired(snapshot: unknown): boolean {
    if (!snapshot) {
      return false;
    }
    const text = JSON.stringify(snapshot).toLowerCase();
    return (
      text.includes("verify") ||
      text.includes("verification") ||
      text.includes("otp") ||
      text.includes("code") ||
      text.includes("confirm") ||
      (text.includes("email") && text.includes("sent"))
    );
  }
}
