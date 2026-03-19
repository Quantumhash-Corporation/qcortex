---
name: Autonomous Web Agent Design
description: Fully autonomous digital agent that can browse internet, complete web tasks, handle verifications, and access local system
type: project
---

# Autonomous Web Agent Design

**Date:** 2026-03-19
**Status:** Draft
**Author:** Sbapan

## 1. Overview

### 1.1 What We're Building

A **fully autonomous digital agent** ("QCortex Agent") that operates as a digital human - capable of completing any web-based or system-based task a user can do with their devices. The agent combines:

- **Internet access**: Browse websites, fill forms, create accounts, download/upload files
- **Verification handling**: OTP via Gmail/Google Workspace, mobile app for SMS
- **Local system access**: Files, applications, calendar, email, contacts, notifications
- **Dual-mode operation**: Autonomous (independent) or Assisted (asks first)
- **Granular user controls**: Configurable tool permissions, scope, and functions

### 1.2 Key Principles

- **User consent-first**: All actions respect user-defined permissions
- **Verification handling**: Smart escalation - agent tries to solve, falls back to human
- **100% accuracy focus**: Robust error handling, retry logic, verification steps
- **Dual-mode**: Users choose between fully autonomous or assisted operation
- **Hybrid execution**: Subagents for complex tasks, tools as fallback
- **Human-in-loop**: When both fail, ask user for help and retry

---

## 2. Architecture

### 2.1 System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         QCortex Agent                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌───────────────┐    ┌───────────────┐    ┌───────────────┐       │
│  │   User        │    │    Tool       │    │    Task       │       │
│  │   Settings    │───▶│   Registry   │───▶│   Executor    │       │
│  │   (permissions│    │   (enabled)   │    │  (auto/       │       │
│  │    per-tool)  │    │               │    │   assisted)   │       │
│  └───────────────┘    └───────────────┘    └───────────────┘       │
│         │                    │                      │                │
│         ▼                    ▼                      ▼                │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                      Tool Modules                               │ │
│  │                                                                  │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │ │
│  │  │  Browser    │  │   Files     │  │  Calendar   │            │ │
│  │  │  Automation │  │   System    │  │   (Google)  │            │ │
│  │  │  (existing) │  │             │  │             │            │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘            │ │
│  │                                                                  │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │ │
│  │  │    Email    │  │  Contacts   │  │  Notifs     │            │ │
│  │  │  (Gmail API)│  │  (Google)   │  │  (System)   │            │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘            │ │
│  │                                                                  │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │ │
│  │  │  Mobile     │  │   Apps      │  │  Download/  │            │ │
│  │  │  (SMS/App)  │  │  Control    │  │  Upload     │            │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘            │ │
│  │                                                                  │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ┌───────────────┐    ┌───────────────┐    ┌───────────────┐       │
│  │   Session     │    │  Verification │    │   Browser     │       │
│  │   Manager     │    │   Handler     │    │   Controller  │       │
│  │   (context)   │    │  (OTP/2FA)    │    │  (Playwright) │       │
│  └───────────────┘    └───────────────┘    └───────────────┘       │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Integration Points                               │
├─────────────────────────────────────────────────────────────────────┤
│  • Gateway (existing)         - Agent communication, auth           │
│  • Browser automation (exist) - Web browsing, form filling          │
│  • Gmail API                 - Email access, OTP reading            │
│  • Google Calendar API       - Event scheduling                    │
│  • Mobile App                - SMS/Call verification               │
│  • macOS/iOS System          - Notifications, app control          │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Core Components

#### 2.2.1 Agent Core (`src/agents/autonomous-agent/`)

- **AgentController**: Manages agent lifecycle (start/stop/mode switching)
- **TaskExecutor**: Executes tasks in auto or assisted mode
- **SessionManager**: Maintains context across tasks
- **ToolRegistry**: Registers and manages all available tools
- **SubagentDispatcher**: Dispatches specialized subagents for complex tasks

#### 2.2.1b Subagent Dispatch System

The agent uses a hybrid approach: tries subagents first, falls back to tools, escalates to human when both fail.

```
User Task
    │
    ▼
┌─────────────────┐
│  Analyze Task  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│ Dispatch        │────▶│ Subagent        │
│ Subagent        │     │ Executes Task   │
└────────┬────────┘     └────────┬────────┘
         │                      │
    Success?               Success
         │                      │
    No                       │
         │                      ▼
         ▼              ┌─────────────┐
┌─────────────────┐     │ Task        │
│ Fallback to     │────▶│ Complete    │
│ Tools           │     └─────────────┘
└────────┬────────┘
         │
    Success?
         │
         ▼
    ┌─────────────┐     ┌─────────────────┐
    │ Both Failed │────▶│ Ask Human for   │
    │             │     │ Help & Retry    │
    └─────────────┘     └─────────────────┘
```

**Available Subagents:**

| Subagent            | Purpose                       | Example Tasks                           |
| ------------------- | ----------------------------- | --------------------------------------- |
| `AccountCreator`    | Create accounts on websites   | Sign up for services, register accounts |
| `OTPFetcher`        | Retrieve verification codes   | Read Gmail OTPs, fetch SMS codes        |
| `DataUploader`      | Upload files/data to sites    | Submit forms, upload documents          |
| `BrowserController` | Control browser for web tasks | Navigate, fill forms, scrape            |
| `FileManager`       | Manage local files            | Organize, move, rename files            |
| `EmailAgent`        | Handle email operations       | Send emails, read inbox, manage labels  |

**Subagent Interface:**

```typescript
interface Subagent {
  name: string;
  description: string;
  execute(task: TaskInput): Promise<SubagentResult>;
}

interface SubagentResult {
  success: boolean;
  data?: unknown;
  error?: {
    code: string;
    message: string;
    recoverable: boolean;
    canEscalateToHuman: boolean;
  };
  requiresHumanHelp?: boolean;
  humanHelpMessage?: string;
}

interface TaskInput {
  id: string;
  description: string;
  context: Record<string, unknown>;
  userPreferences: UserPreferences;
}
```

**Fallback Chain:**

1. Try subagent first
2. If subagent fails with `recoverable: true`, try corresponding tool
3. If tool fails, check `canEscalateToHuman`
4. If can escalate, ask user for help with specific `humanHelpMessage`
5. Retry with user-provided information

#### 2.2.2 Tool Modules

| Module                   | Purpose                     | Integration Point                                     |
| ------------------------ | --------------------------- | ----------------------------------------------------- |
| `BrowserTool`            | Web automation (existing)   | `src/agents/tools/browser-tool.ts` + `src/browser/`   |
| `FileSystemTool`         | Local file operations       | New module                                            |
| `CalendarTool`           | Google Calendar integration | Use existing Google OAuth + new Calendar client       |
| `EmailTool`              | Gmail API access            | Extend existing `src/hooks/gmail-ops.ts`              |
| `ContactsTool`           | Google Contacts integration | New module using Google Contacts API                  |
| `NotificationTool`       | System notifications        | macOS:`src/channels/dock.ts`, iOS: out of scope       |
| `MobileVerificationTool` | SMS via QCortex app         | Mobile app integration via secure channel             |
| `AppControlTool`         | Launch/control applications | macOS: AppleScript/Launch Services, iOS: out of scope |

#### 2.2.3 Verification Handler

- **GmailOTPReader**: Reads OTPs from Gmail/Google Workspace
- **MobileSMSReader**: Receives SMS via QCortex mobile app
- **VerificationQueue**: Manages pending verifications
- **FallbackHandler**: Escalates to human when auto-fails

#### 2.2.4 Permission System

- **UserSettingsManager**: Stores user preferences
- **ToolPermissionGranter**: Enables/disables tools per user config
- **ScopeController**: Limits what data the agent can access
- **AuditLogger**: Logs all agent actions for review

#### 2.2.5 Authentication & OAuth

Google API integration requires OAuth2 authentication. The agent uses the existing QCortex Google integration (OAuth flow already in codebase).

| Tool          | Required OAuth Scope(s)                             |
| ------------- | --------------------------------------------------- |
| Email (Gmail) | `gmail.readonly`, `gmail.send`                      |
| Calendar      | `calendar`, `calendar.events`                       |
| Contacts      | `https://www.googleapis.com/auth/contacts.readonly` |
| Drive (files) | `drive.readonly`, `drive.file`                      |

**Credential Flow:**

1. User authorizes QCortex via existing Google OAuth (already implemented)
2. Agent accesses Google APIs using stored refresh tokens
3. Tokens are stored securely in credential store
4. Agent requests only the scopes enabled in user settings

### 2.3 Data Flow

```
User Task
    │
    ▼
┌─────────────────┐
│  Parse Request  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│ Check Tool      │────▶│ Tool Disabled?  │
│ Permissions     │     │ → Ask user      │
└────────┬────────┘     └─────────────────┘
         │
    Yes (allowed)
         │
         ▼
┌─────────────────┐
│ Dual-mode check │
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
 Auto     Assisted
    │         │
    ▼         ▼
┌─────────┐ ┌─────────────┐
│ Execute │ │ Describe    │──▶ User Approval
│ Task    │ │ Action      │
└────┬────┘ └─────────────┘
     │           │
     │     (Approved)
     │           │
     └─────┬─────┘
           │
           ▼
    ┌─────────────┐
    │Verification │
    │ Required?   │
    └──────┬──────┘
           │
      ┌────┴────┐
      ▼         ▼
   Yes        No
      │         │
      ▼         ▼
┌──────────┐ ┌─────────┐
│ Handle   │ │ Complete│
│ OTP/2FA  │ │ Task    │
└────┬─────┘ └─────────┘
     │
     ▼
┌──────────┐
│ Success/ │
│ Fail     │
└──────────┘
```

---

## 3. Tool Specifications

### 3.1 Browser Automation (Existing)

Leverages existing Playwright-based automation:

- `navigate`: Open URLs
- `snapshot`: Get page content with refs
- `click`, `type`, `fill`: Form interaction
- `upload`, `download`: File handling
- `screenshot`: Visual capture

### 3.2 File System Tool

```typescript
type ToolResult<T> = { success: true; data: T } | { success: false; error: ToolError };

interface ToolError {
  code: string;
  message: string;
  recoverable: boolean;
}

interface FileSystemTool {
  // Read
  readFile(path: string): Promise<ToolResult<string>>;
  listDirectory(path: string): Promise<ToolResult<FileInfo[]>>;
  searchFiles(pattern: string): Promise<ToolResult<string[]>>;

  // Write
  writeFile(path: string, content: string): Promise<ToolResult<void>>;
  appendFile(path: string, content: string): Promise<ToolResult<void>>;

  // Manage
  createDirectory(path: string): Promise<ToolResult<void>>;
  deleteFile(path: string): Promise<ToolResult<void>>;
  moveFile(from: string, to: string): Promise<ToolResult<void>>;
  copyFile(from: string, to: string): Promise<ToolResult<void>>;

  // Downloads
  getDownloadsPath(): string;
  moveDownloadedFile(from: string, to: string): Promise<ToolResult<void>>;
}
```

### 3.3 Calendar Tool (Google Calendar API)

```typescript
interface CalendarTool {
  // Read
  listEvents(from: Date, to: Date): Promise<ToolResult<CalendarEvent[]>>;
  getEvent(eventId: string): Promise<ToolResult<CalendarEvent>>;

  // Write
  createEvent(event: CalendarEventInput): Promise<ToolResult<CalendarEvent>>;
  updateEvent(eventId: string, updates: Partial<CalendarEvent>): Promise<ToolResult<CalendarEvent>>;
  deleteEvent(eventId: string): Promise<ToolResult<void>>;

  // Respond
  respondToEvent(
    eventId: string,
    response: "accept" | "decline" | "tentative",
  ): Promise<ToolResult<void>>;
}
```

### 3.4 Email Tool (Gmail API)

```typescript
interface EmailTool {
  // Read
  listEmails(query: string, maxResults?: number): Promise<ToolResult<Email[]>>;
  getEmail(emailId: string): Promise<ToolResult<Email>>;

  // Send
  sendEmail(
    to: string,
    subject: string,
    body: string,
    attachments?: string[],
  ): Promise<ToolResult<string>>;

  // Labels
  listLabels(): Promise<ToolResult<Label[]>>;
  archiveEmail(emailId: string): Promise<ToolResult<void>>;
  markAsRead(emailId: string): Promise<ToolResult<void>>;

  // OTP Detection
  detectOTPInInbox(): Promise<ToolResult<OTP | null>>;
}
```

### 3.5 Contacts Tool (Google Contacts)

```typescript
interface ContactsTool {
  // Read
  listContacts(): Promise<ToolResult<Contact[]>>;
  searchContacts(query: string): Promise<ToolResult<Contact[]>>;

  // Write
  createContact(contact: ContactInput): Promise<ToolResult<Contact>>;
  updateContact(contactId: string, updates: Partial<Contact>): Promise<ToolResult<Contact>>;
  deleteContact(contactId: string): Promise<ToolResult<void>>;
}
```

### 3.6 Mobile Verification Tool

**Note:** On iOS, the QCortex app cannot register as default SMS handler due to platform restrictions. On Android, this requires user to set as default SMS app. For platforms where direct SMS access isn't available, the agent will fall back to human-in-the-loop verification.

```typescript
interface MobileVerificationTool {
  // SMS (via QCortex app)
  requestSMSCode(phoneNumber: string): Promise<ToolResult<string>>; // Returns session ID
  waitForSMS(sessionId: string, timeoutMs?: number): Promise<ToolResult<string>>; // Returns OTP

  // Fallback to human - sends notification to user requesting the code
  requestHumanVerification(type: "sms" | "call" | "whatsapp"): Promise<ToolResult<void>>;
}
```

### 3.7 Notification Tool

```typescript
interface NotificationTool {
  // Read
  getNotifications(): Promise<ToolResult<SystemNotification[]>>;
  markAsRead(notificationId: string): Promise<ToolResult<void>>;

  // Respond
  openNotification(notificationId: string): Promise<ToolResult<void>>;
  replyToNotification(notificationId: string, response: string): Promise<ToolResult<void>>;
}
```

### 3.8 App Control Tool

```typescript
interface AppControlTool {
  // Launch
  launchApp(bundleId: string): Promise<ToolResult<void>>;
  openFileWithApp(filePath: string, appBundleId?: string): Promise<ToolResult<void>>;

  // Control
  activateApp(bundleId: string): Promise<ToolResult<void>>;
  quitApp(bundleId: string): Promise<ToolResult<void>>;

  // List
  listRunningApps(): Promise<ToolResult<RunningApp[]>>;
  listInstalledApps(): Promise<ToolResult<InstalledApp[]>>;
}
```

---

## 4. Dual-Mode Operation

### 4.1 Autonomous Mode

- Agent analyzes task, plans steps, executes without interruption
- Uses verification handlers (Gmail OTP, Mobile SMS) automatically
- Logs all actions for review
- Retries failed operations with backoff
- Escalates to human only on repeated failures

### 4.2 Assisted Mode

- Agent describes intended action before executing
- Waits for user approval (timeout configurable)
- Shows: target URL, action type, data involved
- User can: Approve, Deny, Modify, Cancel
- Remember preferences for similar actions
- **autoApprove setting**: When enabled (per-tool), repeats similar actions without asking

### 4.3 Mode Switching

```typescript
enum AgentMode {
  AUTONOMOUS = "autonomous",
  ASSISTED = "assisted",
}

interface AgentSettings {
  mode: AgentMode;
  tools: {
    [toolName: string]: {
      enabled: boolean;
      scope: "read" | "write" | "all";
      autoApprove: boolean; // Only in assisted mode
    };
  };
  notifications: {
    onAction: boolean;
    onComplete: boolean;
    onError: boolean;
  };
  verification: {
    autoRetry: number;
    escalateAfterFails: number;
  };
}
```

---

## 5. Verification Handling

### 5.1 OTP Flow

```
Agent encounters verification
         │
         ▼
┌─────────────────┐
│ Detect type     │
│ (email/sms/2fa) │
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
 Email      SMS
    │         │
    ▼         ▼
┌────────┐ ┌──────────┐
│ Try    │ │ Via      │
│ Gmail  │ │ Mobile   │
│ API    │ │ App      │
└───┬────┘ │          │
    │      └────┬─────┘
    │           │
    └─────┬─────┘
          │
          ▼
    ┌─────────────────┐
    │ Verify code    │
    └────────┬────────┘
         │   │
    Success  Fail
         │   │
         ▼   ▼
   Continue  Retry (max 3)
         │   │
         ▼   ▼
   Complete  Escalate to
             Human
```

### 5.2 Gmail OTP Integration

- Use Gmail API to watch inbox for new emails
- Pattern match for OTP codes using context-aware regex:
  - Primary: `(?:code|otp|verification|pin)[^\d]*(\d{4,8})` (with code context)
  - Fallback: `\b(\d{6})\b` (6-digit codes - most common)
- Confidence scoring: numeric patterns that appear near verification keywords get higher score
- Score threshold: if multiple matches, prefer 6-digit codes over longer/shorter
- Auto-extract and use within 5-minute window
- Clean up detection emails after use (optional, user setting)

### 5.3 Mobile App SMS Integration

- QCortex app registers as default SMS handler (with permission)
- Forward SMS to agent via secure channel
- Support: OTP SMS, WhatsApp codes, voice call verification
- User can set "approve forward" permission

---

## 6. User Settings & Permissions

### 6.1 Permission Categories

| Category      | Options                   | Description                    |
| ------------- | ------------------------- | ------------------------------ |
| Tools         | Enabled/Disabled per tool | Which tools are available      |
| Scope         | None/Read/Write/All       | Data access level per tool     |
| Auto-Approve  | Yes/No                    | Skip approval in assisted mode |
| Notifications | All/Important/None        | When to notify user            |

### 6.1.1 Verification & Security Controls

Additional granular controls for sensitive operations:

| Setting            | Options                                   | Description             |
| ------------------ | ----------------------------------------- | ----------------------- |
| **OTP Handling**   | Auto-read / Manual input / Ask me         | How OTPs are handled    |
| **Payment Mode**   | Disabled / View only / Full access        | Payment capabilities    |
| **Form Auto-fill** | Ask each time / Use saved data / Disabled | Personal info handling  |
| **External Sites** | Always ask / Trusted sites only / Blocked | Site access control     |
| **Data Sharing**   | Allow / Ask each time / Block             | Sharing data externally |

**OTP Handling Options:**

- **Auto-read**: Agent automatically reads OTPs from Gmail (default)
- **Manual input**: Agent pauses and asks you to enter the code
- **Ask me**: Agent asks which method you prefer each time

**Payment Mode Options:**

- **Disabled**: No payment capabilities
- **View only**: Can view payment methods, cannot make transactions
- **Full access**: Can complete purchases (with confirmation for high-value)

**Form Auto-fill Options:**

- **Ask each time**: Agent asks before filling any form
- **Use saved data**: Uses data you provided to agent (see below)
- **Disabled**: Agent never auto-fills forms

### 6.2 Settings UI

```
┌────────────────────────────────────────────────────┐
│  Agent Settings                              [X]   │
├────────────────────────────────────────────────────┤
│                                                    │
│  Mode: [○ Autonomous  ● Assisted]                 │
│                                                    │
│  ── Tools ─────────────────────────────────────── │
│                                                    │
│  ☑ Browser     [Read ● Write ● All] [☑ Auto]    │
│  ☑ Files       [● Read ○ Write ○ All] [☐ Auto]   │
│  ☑ Calendar    [● Read ○ Write ○ All] [☐ Auto]   │
│  ☑ Email       [○ Read ● Write ○ All] [☐ Auto]   │
│  ☐ Contacts    [○ Read ○ Write ○ All] [☐ Auto]   │
│  ☑ Mobile SMS  [● Read ○ Write ○ All] [☐ Auto]   │
│  ☐ Apps        [○ Read ○ Write ○ All] [☐ Auto]   │
│                                                    │
│  ── Verification & Security ─────────────────────│
│                                                    │
│  OTP Handling:  [○ Auto  ● Manual  ○ Ask each]   │
│  Payment Mode: [○ Disabled  ○ View  ● Full]      │
│  Form Fill:    [○ Ask  ● Use saved  ○ Disabled] │
│                                                    │
│  ── Your Data ─────────────────────────────────── │
│                                                    │
│  [Manage saved data...]  [Add payment method...]  │
│                                                    │
│  ── Notifications ─────────────────────────────── │
│                                                    │
│  [●] On action   [☑] On complete   [☑] On error │
│                                                    │
│  ── Safety ────────────────────────────────────── │
│                                                    │
│  Payment approval: [Always]  Amount threshold: $0│
│  Session timeout: [30 min]  [☐ 2FA for settings] │
│  Emergency PIN: [______]                          │
│                                                    │
│                    [Save]  [Cancel]               │
└────────────────────────────────────────────────────┘
```

### 6.3 Preset Profiles

- **Maximum Privacy**: Assisted mode, read-only tools, all auto-approve off
- **Standard**: Assisted mode, read+write tools, important actions require approval
- **Full Automation**: Autonomous mode, all tools, full access

### 6.4 User-Provided Data

Users can optionally provide personal information for the agent to use:

| Data Field    | Use Case                                        | Storage             |
| ------------- | ----------------------------------------------- | ------------------- |
| Name          | Form filling, emails                            | Encrypted           |
| Email         | Form filling, account creation                  | Encrypted           |
| Phone         | Form filling, verifications                     | Encrypted           |
| Address       | Shipping forms                                  | Encrypted           |
| Date of Birth | Age verification                                | Encrypted           |
| Credit Card   | Payments (never stored, just use when provided) | Never stored        |
| Bank Details  | Payments                                        | Encrypted, optional |

**How it works:**

- User provides data via Settings UI
- Data is encrypted and stored securely
- When agent encounters a form, it uses this data (if allowed in settings)
- For payments, user can provide card details per-transaction
- **Never automatically stores payment information** - user must explicitly save

**Privacy:**

- All user data is encrypted at rest
- Data is only used when explicitly needed
- User can delete all saved data at any time
- Audit log shows when data was used

---

## 7. Security & Privacy

### 7.1 Data Handling

- All credentials stored securely (Keychain/credential store)
- Agent sessions encrypted
- No persistent storage of sensitive data (OTPs cleared after use)
- User data stays local (or explicitly synced)

### 7.2 Access Controls

- Per-tool permission gates
- Scope limiting (read-only vs write)
- Action audit logging
- User consent for each permission category

### 7.3 Safety Features

- Confirmation for destructive actions (delete, send, purchase)
- Rate limiting to prevent abuse
- Session timeout (configurable)
- Emergency stop (global kill switch)

### 7.4 Enhanced Security Controls

| Security Setting                  | Default | Description                                 |
| --------------------------------- | ------- | ------------------------------------------- |
| **Require approval for payments** | Always  | Always ask before any payment               |
| **Payment amount threshold**      | $0      | Amount above which always requires approval |
| **Block external data sharing**   | Ask     | Ask before sending data outside             |
| **Session timeout**               | 30 min  | Auto-lock after inactivity                  |
| **Two-factor for settings**       | Off     | Require auth to change settings             |
| **Emergency PIN**                 | None    | Quick kill switch PIN                       |

**Payment Security:**

- No automatic payment processing
- Agent shows exact amount and merchant before each transaction
- User must explicitly approve each payment
- For subscriptions: ask once, confirm renewal amounts

**Kill Switch:**

- Global emergency stop (keyboard shortcut or menu)
- Instantly stops all agent activity
- Closes browser, clears session
- Can set a PIN to prevent accidental activation

---

## 8. Implementation Phases

### Phase 1: Foundation

- Agent core infrastructure
- Tool registry system
- Permission/settings UI
- Basic task executor

### Phase 2: Core Tools

- Browser automation (existing - integrate)
- File system tool
- Calendar tool (Google Calendar API)
- Email tool (Gmail API)

### Phase 3: Verification

- Gmail OTP reader
- Mobile SMS integration
- Fallback handler

### Phase 4: Extended Tools

- Contacts tool
- Notification tool
- App control tool
- Mobile verification (calls, WhatsApp)

### Phase 5: Polish

- Dual-mode refinement
- Settings presets
- Audit logging
- Performance optimization

---

## 9. Success Criteria

- [ ] Agent can browse any website and complete form submissions
- [ ] Agent can create accounts on major platforms
- [ ] Agent successfully handles email OTPs with >90% success rate
- [ ] Agent can schedule calendar events autonomously
- [ ] User can configure all tool permissions via settings UI
- [ ] Dual-mode switching works seamlessly
- [ ] All actions logged for audit
- [ ] No data leaks or unauthorized access

---

## 10. Risks & Mitigation

| Risk                      | Impact | Mitigation                            |
| ------------------------- | ------ | ------------------------------------- |
| OTP services change       | Medium | Multiple fallback methods             |
| Website structure changes | High   | Robust element detection, retry logic |
| Permission misuse         | High   | User audit logs, granular controls    |
| Rate limiting             | Medium | Polite crawling, exponential backoff  |
| Session timeout           | Low    | State persistence, checkpoint resume  |

---

_This design will be refined through implementation feedback._
