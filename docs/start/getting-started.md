---
summary: "Get QCortex installed and run your first chat in minutes."
read_when:
  - First time setup from zero
  - You want the fastest path to a working chat
title: "Getting Started"
---

# Getting Started

Goal: go from zero to a first working chat with minimal setup.

<Info>
Fastest chat: open the Control UI (no channel setup needed). Run `qcortex dashboard`
and chat in the browser, or open `http://127.0.0.1:18789/` on the
<Tooltip headline="Gateway host" tip="The machine running the QCortex gateway service.">gateway host</Tooltip>.
Docs: [Dashboard](/web/dashboard) and [Control UI](/web/control-ui).
</Info>

## Prereqs

- Node 22 or newer

<Tip>
Check your Node version with `node --version` if you are unsure.
</Tip>

## Quick setup (CLI)

<Steps>
  <Step title="Install QCortex">
    <Tabs>
      <Tab title="macOS/Linux">
        ```bash
        curl -fsSL https://qcortex.ai/install.sh | bash
        ```
        <img
  src="/assets/install-script.svg"
  alt="Install Script Process"
  className="rounded-lg"
/>
      </Tab>
      <Tab title="Windows (PowerShell)">
        ```powershell
        iwr -useb https://qcortex.ai/install.ps1 | iex
        ```
      </Tab>
    </Tabs>

    <Note>
    Other install methods: [Install](/install).
    </Note>

  </Step>
  <Step title="Run onboarding wizard">
    ```bash
    qcortex onboard --install-daemon
    ```

    The wizard asks "What would you like to do?" to guide you through setup:
    - **QuickStart** — recommended defaults, get running in minutes
    - **Advanced** — full control over all options
    See [Onboarding Wizard](/start/wizard) for details.

  </Step>
  <Step title="Start chatting">
    ```bash
    qcortex dashboard
    ```
  </Step>
</Steps>

<Check>
If the Control UI loads, your Gateway is ready for use.
</Check>

## Optional checks and extras

<AccordionGroup>
  <Accordion title="Run the Gateway in the foreground">
    Useful for quick tests or troubleshooting.

    ```bash
    qcortex gateway --port 18789
    ```

  </Accordion>
  <Accordion title="Send a test message">
    Requires a configured channel.

    ```bash
    qcortex message send --target +15555550123 --message "Hello from QCortex"
    ```

  </Accordion>
</AccordionGroup>

## Useful environment variables

If you run QCortex as a service account or want custom config/state locations:

- `QCORTEX_HOME` sets the home directory used for internal path resolution.
- `QCORTEX_STATE_DIR` overrides the state directory.
- `QCORTEX_CONFIG_PATH` overrides the config file path.

Full environment variable reference: [Environment vars](/help/environment).

## Go deeper

<Columns>
  <Card title="Onboarding Wizard (details)" href="/start/wizard">
    Full CLI wizard reference and advanced options.
  </Card>
  <Card title="macOS app onboarding" href="/start/onboarding">
    First run flow for the macOS app.
  </Card>
</Columns>

## What you will have

- A running Gateway
- Auth configured
- Control UI access or a connected channel

## Next steps

- DM safety and approvals: [Pairing](/channels/pairing)
- Connect more channels: [Channels](/channels)
- Advanced workflows and from source: [Setup](/start/setup)
