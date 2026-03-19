---
name: Autonomous Web Agent Design
description: Fully autonomous digital agent that can browse internet, complete web tasks, handle verifications, and access local system
type: project
---

# Autonomous Web Agent Design

**Date:** 2026-03-19
**Status:** Draft
**Author:** Claude

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

#### 2.2.2 Tool Modules

| Module                   | Purpose                     | Status   |
| ------------------------ | --------------------------- | -------- |
| `BrowserTool`            | Web automation (existing)   | Existing |
| `FileSystemTool`         | Local file operations       | New      |
| `CalendarTool`           | Google Calendar integration | New      |
| `EmailTool`              | Gmail API access            | New      |
| `ContactsTool`           | Google Contacts integration | New      |
| `NotificationTool`       | System notifications        | New      |
| `MobileVerificationTool` | SMS via QCortex app         | New      |
| `AppControlTool`         | Launch/control applications | New      |

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
interface FileSystemTool {
  // Read
  readFile(path: string): Promise<string>;
  listDirectory(path: string): Promise<FileInfo[]>;
  searchFiles(pattern: string): Promise<string[]>;

  // Write
  writeFile(path: string, content: string): Promise<void>;
  appendFile(path: string, content: string): Promise<void>;

  // Manage
  createDirectory(path: string): Promise<void>;
  deleteFile(path: string): Promise<void>;
  moveFile(from: string, to: string): Promise<void>;
  copyFile(from: string, to: string): Promise<void>;

  // Downloads
  getDownloadsPath(): string;
  moveDownloadedFile(from: string, to: string): Promise<void>;
}
```

### 3.3 Calendar Tool (Google Calendar API)

```typescript
interface CalendarTool {
  // Read
  listEvents(from: Date, to: Date): Promise<CalendarEvent[]>;
  getEvent(eventId: string): Promise<CalendarEvent>;

  // Write
  createEvent(event: CalendarEventInput): Promise<CalendarEvent>;
  updateEvent(eventId: string, updates: Partial<CalendarEvent>): Promise<CalendarEvent>;
  deleteEvent(eventId: string): Promise<void>;

  // Respond
  respondToEvent(eventId: string, response: "accept" | "decline" | "tentative"): Promise<void>;
}
```

### 3.4 Email Tool (Gmail API)

```typescript
interface EmailTool {
  // Read
  listEmails(query: string, maxResults?: number): Promise<Email[]>;
  getEmail(emailId: string): Promise<Email>;

  // Send
  sendEmail(to: string, subject: string, body: string, attachments?: string[]): Promise<string>;

  // Labels
  listLabels(): Promise<Label[]>;
  archiveEmail(emailId: string): Promise<void>;
  markAsRead(emailId: string): Promise<void>;

  // OTP Detection
  detectOTPInInbox(): Promise<OTP | null>;
}
```

### 3.5 Contacts Tool (Google Contacts)

```typescript
interface ContactsTool {
  // Read
  listContacts(): Promise<Contact[]>;
  searchContacts(query: string): Promise<Contact[]>;

  // Write
  createContact(contact: ContactInput): Promise<Contact>;
  updateContact(contactId: string, updates: Partial<Contact>): Promise<Contact>;
  deleteContact(contactId: string): Promise<void>;
}
```

### 3.6 Mobile Verification Tool

```typescript
interface MobileVerificationTool {
  // SMS (via QCortex app)
  requestSMSCode(phoneNumber: string): Promise<string>; // Returns session ID
  waitForSMS(sessionId: string, timeoutMs?: number): Promise<string>; // Returns OTP

  // Fallback to human
  requestHumanVerification(type: "sms" | "call" | "whatsapp"): Promise<void>;
}
```

### 3.7 Notification Tool

```typescript
interface NotificationTool {
  // Read
  getNotifications(): Promise<SystemNotification[]>;
  markAsRead(notificationId: string): Promise<void>;

  // Respond
  openNotification(notificationId: string): Promise<void>;
  replyToNotification(notificationId: string, response: string): Promise<void>;
}
```

### 3.8 App Control Tool

```typescript
interface AppControlTool {
  // Launch
  launchApp(bundleId: string): Promise<void>;
  openFileWithApp(filePath: string, appBundleId?: string): Promise<void>;

  // Control
  activateApp(bundleId: string): Promise<void>;
  quitApp(bundleId: string): Promise<void>;

  // List
  listRunningApps(): Promise<RunningApp[]>;
  listInstalledApps(): Promise<InstalledApp[]>;
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
- Pattern match for OTP codes (regex: `\d{4,8}`)
- Auto-extract and use within 5-minute window
- Clean up detection emails after use

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
│  ── Notifications ─────────────────────────────── │
│                                                    │
│  [●] On action   [☑] On complete   [☑] On error │
│                                                    │
│  ── Verification ─────────────────────────────── │
│                                                    │
│  Auto-retry: [3] times                            │
│  Escalate after: [5] failures                    │
│                                                    │
│                    [Save]  [Cancel]               │
└────────────────────────────────────────────────────┘
```

### 6.3 Preset Profiles

- **Maximum Privacy**: Assisted mode, read-only tools, all auto-approve off
- **Standard**: Assisted mode, read+write tools, important actions require approval
- **Full Automation**: Autonomous mode, all tools, full access

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
