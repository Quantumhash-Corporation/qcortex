import { html } from "lit";
import { ConnectErrorDetailCodes } from "../../../../src/gateway/protocol/connect-error-details.js";
import { t, i18n, SUPPORTED_LOCALES, type Locale } from "../../i18n/index.ts";
import { buildExternalLinkRel, EXTERNAL_LINK_TARGET } from "../external-link.ts";
import { formatRelativeTimestamp, formatDurationHuman } from "../format.ts";
import type { GatewayHelloOk } from "../gateway.ts";
import { formatNextRun } from "../presenter.ts";
import type { UiSettings } from "../storage.ts";
import { shouldShowPairingHint } from "./overview-hints.ts";

export type OverviewProps = {
  connected: boolean;
  hello: GatewayHelloOk | null;
  settings: UiSettings;
  password: string;
  lastError: string | null;
  lastErrorCode: string | null;
  presenceCount: number;
  sessionsCount: number | null;
  cronEnabled: boolean | null;
  cronNext: number | null;
  lastChannelsRefresh: number | null;
  onSettingsChange: (next: UiSettings) => void;
  onPasswordChange: (next: string) => void;
  onSessionKeyChange: (next: string) => void;
  onConnect: () => void;
  onRefresh: () => void;
};

export function renderOverview(props: OverviewProps) {
  const snapshot = props.hello?.snapshot as
    | {
        uptimeMs?: number;
        policy?: { tickIntervalMs?: number };
        authMode?: "none" | "token" | "password" | "trusted-proxy";
      }
    | undefined;
  const uptime = snapshot?.uptimeMs ? formatDurationHuman(snapshot.uptimeMs) : t("common.na");
  const tick = snapshot?.policy?.tickIntervalMs
    ? `${snapshot.policy.tickIntervalMs}ms`
    : t("common.na");
  const authMode = snapshot?.authMode;
  const isTrustedProxy = authMode === "trusted-proxy";

  const pairingHint = (() => {
    if (!shouldShowPairingHint(props.connected, props.lastError, props.lastErrorCode)) {
      return null;
    }
    return html`
      <div style="margin-top: 10px; font-size: 13px; line-height: 1.6; color: var(--muted)">
        ${t("overview.pairing.hint")}
        <div style="margin-top: 8px; display: grid; gap: 4px;">
          <code class="code-chip">qcortex devices list</code>
          <code class="code-chip">qcortex devices approve &lt;requestId&gt;</code>
        </div>
        <div style="margin-top: 8px; font-size: 12px;">
          ${t("overview.pairing.mobileHint")}
        </div>
        <div style="margin-top: 8px">
          <a
            class="session-link"
            href="https://docs.qcortex.ai/web/control-ui#device-pairing-first-connection"
            target=${EXTERNAL_LINK_TARGET}
            rel=${buildExternalLinkRel()}
            title="Device pairing docs (opens in new tab)"
            >Docs: Device pairing →</a
          >
        </div>
      </div>
    `;
  })();

  const authHint = (() => {
    if (props.connected || !props.lastError) {
      return null;
    }
    const lower = props.lastError.toLowerCase();
    const authRequiredCodes = new Set<string>([
      ConnectErrorDetailCodes.AUTH_REQUIRED,
      ConnectErrorDetailCodes.AUTH_TOKEN_MISSING,
      ConnectErrorDetailCodes.AUTH_PASSWORD_MISSING,
      ConnectErrorDetailCodes.AUTH_TOKEN_NOT_CONFIGURED,
      ConnectErrorDetailCodes.AUTH_PASSWORD_NOT_CONFIGURED,
    ]);
    const authFailureCodes = new Set<string>([
      ...authRequiredCodes,
      ConnectErrorDetailCodes.AUTH_UNAUTHORIZED,
      ConnectErrorDetailCodes.AUTH_TOKEN_MISMATCH,
      ConnectErrorDetailCodes.AUTH_PASSWORD_MISMATCH,
      ConnectErrorDetailCodes.AUTH_DEVICE_TOKEN_MISMATCH,
      ConnectErrorDetailCodes.AUTH_RATE_LIMITED,
      ConnectErrorDetailCodes.AUTH_TAILSCALE_IDENTITY_MISSING,
      ConnectErrorDetailCodes.AUTH_TAILSCALE_PROXY_MISSING,
      ConnectErrorDetailCodes.AUTH_TAILSCALE_WHOIS_FAILED,
      ConnectErrorDetailCodes.AUTH_TAILSCALE_IDENTITY_MISMATCH,
    ]);
    const authFailed = props.lastErrorCode
      ? authFailureCodes.has(props.lastErrorCode)
      : lower.includes("unauthorized") || lower.includes("connect failed");
    if (!authFailed) {
      return null;
    }
    const hasToken = Boolean(props.settings.token.trim());
    const hasPassword = Boolean(props.password.trim());
    const isAuthRequired = props.lastErrorCode
      ? authRequiredCodes.has(props.lastErrorCode)
      : !hasToken && !hasPassword;
    if (isAuthRequired) {
      return html`
        <div style="margin-top: 10px; font-size: 13px; line-height: 1.6; color: var(--muted)">
          ${t("overview.auth.required")}
          <div style="margin-top: 8px; display: grid; gap: 4px;">
            <code class="code-chip">qcortex dashboard --no-open</code>
            <code class="code-chip">qcortex doctor --generate-gateway-token</code>
          </div>
          <div style="margin-top: 8px">
            <a
              class="session-link"
              href="https://docs.qcortex.ai/web/dashboard"
              target=${EXTERNAL_LINK_TARGET}
              rel=${buildExternalLinkRel()}
              title="Control UI auth docs (opens in new tab)"
              >Docs: Control UI auth →</a
            >
          </div>
        </div>
      `;
    }
    return html`
      <div style="margin-top: 10px; font-size: 13px; line-height: 1.6; color: var(--muted)">
        ${t("overview.auth.failed", { command: "qcortex dashboard --no-open" })}
        <div style="margin-top: 8px">
          <a
            class="session-link"
            href="https://docs.qcortex.ai/web/dashboard"
            target=${EXTERNAL_LINK_TARGET}
            rel=${buildExternalLinkRel()}
            title="Control UI auth docs (opens in new tab)"
            >Docs: Control UI auth →</a
          >
        </div>
      </div>
    `;
  })();

  const insecureContextHint = (() => {
    if (props.connected || !props.lastError) {
      return null;
    }
    const isSecureContext = typeof window !== "undefined" ? window.isSecureContext : true;
    if (isSecureContext) {
      return null;
    }
    const lower = props.lastError.toLowerCase();
    const insecureContextCode =
      props.lastErrorCode === ConnectErrorDetailCodes.CONTROL_UI_DEVICE_IDENTITY_REQUIRED ||
      props.lastErrorCode === ConnectErrorDetailCodes.DEVICE_IDENTITY_REQUIRED;
    if (
      !insecureContextCode &&
      !lower.includes("secure context") &&
      !lower.includes("device identity required")
    ) {
      return null;
    }
    return html`
      <div style="margin-top: 10px; font-size: 13px; line-height: 1.6; color: var(--muted)">
        ${t("overview.insecure.hint", { url: "http://127.0.0.1:18789" })}
        <div style="margin-top: 8px;">
          ${t("overview.insecure.stayHttp", { config: "gateway.controlUi.allowInsecureAuth: true" })}
        </div>
        <div style="margin-top: 8px; display: flex; gap: 12px; flex-wrap: wrap;">
          <a
            class="session-link"
            href="https://docs.qcortex.ai/gateway/tailscale"
            target=${EXTERNAL_LINK_TARGET}
            rel=${buildExternalLinkRel()}
            title="Tailscale Serve docs (opens in new tab)"
            >Docs: Tailscale Serve →</a
          >
          <a
            class="session-link"
            href="https://docs.qcortex.ai/web/control-ui#insecure-http"
            target=${EXTERNAL_LINK_TARGET}
            rel=${buildExternalLinkRel()}
            title="Insecure HTTP docs (opens in new tab)"
            >Docs: Insecure HTTP →</a
          >
        </div>
      </div>
    `;
  })();

  const currentLocale = i18n.getLocale();

  return html`
    <!-- ── Hero row: Access + Snapshot ──────────────────────────────────── -->
    <div class="overview-hero-layout overview-section">

      <!-- Access / Connection card -->
      <div class="connection-card ${props.connected ? "connection-card--connected" : "connection-card--disconnected"}">
        <div class="connection-card__header">
          <div class="connection-card__status-icon" aria-hidden="true">
            ${
              props.connected
                ? html`
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <path d="M5 12.55a11 11 0 0 1 14.08 0"></path>
                      <path d="M1.42 9a16 16 0 0 1 21.16 0"></path>
                      <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
                      <circle cx="12" cy="20" r="1"></circle>
                    </svg>
                  `
                : html`
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <line x1="2" y1="2" x2="22" y2="22"></line>
                      <path d="M8.5 16.5a5 5 0 0 1 7 0"></path>
                      <path d="M2 8.82a15 15 0 0 1 4.17-2.65"></path>
                      <path d="M10.66 5c4.01-.36 8.14.9 11.34 3.76"></path>
                      <path d="M16.85 11.25a10 10 0 0 1 2.22 1.68"></path>
                      <path d="M5 13a10 10 0 0 1 5.24-2.76"></path>
                      <circle cx="12" cy="20" r="1"></circle>
                    </svg>
                  `
            }
          </div>
          <div>
            <div class="connection-card__title">${t("overview.access.title")}</div>
            <div class="connection-card__subtitle">${t("overview.access.subtitle")}</div>
          </div>
          <div style="margin-left: auto; flex-shrink: 0">
            <span class="badge ${props.connected ? "badge--success" : "badge--warn"}">
              <span class="statusDot ${props.connected ? "ok" : "warn"}" style="width:6px;height:6px;box-shadow:none;animation:none"></span>
              ${props.connected ? t("common.ok") : t("common.offline")}
            </span>
          </div>
        </div>

        <div class="connection-card__body">
          <label class="field">
            <span>${t("overview.access.wsUrl")}</span>
            <input
              .value=${props.settings.gatewayUrl}
              @input=${(e: Event) => {
                const v = (e.target as HTMLInputElement).value;
                props.onSettingsChange({ ...props.settings, gatewayUrl: v });
              }}
              placeholder="ws://100.x.y.z:18789"
            />
          </label>
          ${
            isTrustedProxy
              ? ""
              : html`
              <label class="field">
                <span>${t("overview.access.token")}</span>
                <input
                  .value=${props.settings.token}
                  @input=${(e: Event) => {
                    const v = (e.target as HTMLInputElement).value;
                    props.onSettingsChange({ ...props.settings, token: v });
                  }}
                  placeholder="QCORTEX_GATEWAY_TOKEN"
                />
              </label>
              <label class="field">
                <span>${t("overview.access.password")}</span>
                <input
                  type="password"
                  .value=${props.password}
                  @input=${(e: Event) => {
                    const v = (e.target as HTMLInputElement).value;
                    props.onPasswordChange(v);
                  }}
                  placeholder="system or shared password"
                />
              </label>
            `
          }
          <div class="form-grid" style="grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));">
            <label class="field">
              <span>${t("overview.access.sessionKey")}</span>
              <input
                .value=${props.settings.sessionKey}
                @input=${(e: Event) => {
                  const v = (e.target as HTMLInputElement).value;
                  props.onSessionKeyChange(v);
                }}
              />
            </label>
            <label class="field">
              <span>${t("overview.access.language")}</span>
              <select
                .value=${currentLocale}
                @change=${(e: Event) => {
                  const v = (e.target as HTMLSelectElement).value as Locale;
                  void i18n.setLocale(v);
                  props.onSettingsChange({ ...props.settings, locale: v });
                }}
              >
                ${SUPPORTED_LOCALES.map((loc) => {
                  const key = loc.replace(/-([a-zA-Z])/g, (_, c) => c.toUpperCase());
                  return html`<option value=${loc}>${t(`languages.${key}`)}</option>`;
                })}
              </select>
            </label>
          </div>
        </div>

        <div class="connection-card__footer">
          <button class="btn primary" @click=${() => props.onConnect()}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.55a11 11 0 0 1 14.08 0"></path><path d="M1.42 9a16 16 0 0 1 21.16 0"></path><path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path><circle cx="12" cy="20" r="1"></circle></svg>
            ${t("common.connect")}
          </button>
          <button class="btn" @click=${() => props.onRefresh()}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"></path><path d="M21 3v5h-5"></path></svg>
            ${t("common.refresh")}
          </button>
          <span class="muted" style="font-size: 12px; margin-left: 4px">
            ${isTrustedProxy ? t("overview.access.trustedProxy") : t("overview.access.connectHint")}
          </span>
        </div>
      </div>

      <!-- Snapshot / Status card -->
      <div class="status-card">
        <div class="status-card__header">
          <div class="status-card__header-left">
            <div class="status-card__icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
            </div>
            <div>
              <div class="status-card__title">${t("overview.snapshot.title")}</div>
              <div class="status-card__sub">${t("overview.snapshot.subtitle")}</div>
            </div>
          </div>
          <span class="badge ${props.connected ? "badge--success" : "badge--warn"}">
            <span class="statusDot ${props.connected ? "ok" : "warn"}" style="width:6px;height:6px;box-shadow:none;animation:none"></span>
            ${props.connected ? t("common.ok") : t("common.offline")}
          </span>
        </div>

        <div class="status-card__body">
          <div class="stat-row">
            <span class="stat-row__key">${t("overview.snapshot.status")}</span>
            <span class="stat-row__value ${props.connected ? "ok" : "warn"}">
              ${props.connected ? t("common.ok") : t("common.offline")}
            </span>
          </div>
          <div class="stat-row">
            <span class="stat-row__key">${t("overview.snapshot.uptime")}</span>
            <span class="stat-row__value mono">${uptime}</span>
          </div>
          <div class="stat-row">
            <span class="stat-row__key">${t("overview.snapshot.tickInterval")}</span>
            <span class="stat-row__value mono">${tick}</span>
          </div>
          <div class="stat-row">
            <span class="stat-row__key">${t("overview.snapshot.lastChannelsRefresh")}</span>
            <span class="stat-row__value mono">
              ${props.lastChannelsRefresh ? formatRelativeTimestamp(props.lastChannelsRefresh) : t("common.na")}
            </span>
          </div>

          ${
            props.lastError
              ? html`
              <div class="callout-v2 callout-v2--danger">
                <div class="callout-v2__icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                </div>
                <div class="callout-v2__body">
                  <div>${props.lastError}</div>
                  ${pairingHint ?? ""}
                  ${authHint ?? ""}
                  ${insecureContextHint ?? ""}
                </div>
              </div>`
              : html`
              <div class="callout-v2 callout-v2--info">
                <div class="callout-v2__icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>
                </div>
                <div class="callout-v2__body">
                  ${t("overview.snapshot.channelsHint")}
                </div>
              </div>`
          }
        </div>
      </div>

    </div>

    <!-- ── KPI Metrics row ──────────────────────────────────────────────── -->
    <div class="overview-stats-grid overview-section">

      <div class="kpi-card animate-rise animate-rise-1">
        <div class="kpi-card__top">
          <div class="kpi-card__icon" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="3" rx="2"></rect><line x1="8" x2="16" y1="21" y2="21"></line><line x1="12" x2="12" y1="17" y2="21"></line></svg>
          </div>
        </div>
        <div class="kpi-card__value">${props.presenceCount}</div>
        <div class="kpi-card__label">${t("overview.stats.instances")}</div>
        <div class="kpi-card__sub">${t("overview.stats.instancesHint")}</div>
      </div>

      <div class="kpi-card animate-rise animate-rise-2">
        <div class="kpi-card__top">
          <div class="kpi-card__icon" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
          </div>
        </div>
        <div class="kpi-card__value">${props.sessionsCount ?? t("common.na")}</div>
        <div class="kpi-card__label">${t("overview.stats.sessions")}</div>
        <div class="kpi-card__sub">${t("overview.stats.sessionsHint")}</div>
      </div>

      <div class="kpi-card animate-rise animate-rise-3">
        <div class="kpi-card__top">
          <div class="kpi-card__icon" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          </div>
          ${
            props.cronEnabled != null
              ? html`<span class="badge ${props.cronEnabled ? "badge--success" : "badge--default"}">
                ${props.cronEnabled ? t("common.enabled") : t("common.disabled")}
              </span>`
              : ""
          }
        </div>
        <div class="kpi-card__value">
          ${props.cronEnabled == null ? t("common.na") : props.cronEnabled ? t("common.enabled") : t("common.disabled")}
        </div>
        <div class="kpi-card__label">${t("overview.stats.cron")}</div>
        <div class="kpi-card__sub">${t("overview.stats.cronNext", { time: formatNextRun(props.cronNext) })}</div>
      </div>

    </div>

    <!-- ── Info Notes ───────────────────────────────────────────────────── -->
    <div class="card overview-section" style="padding: 22px;">
      <div class="section-header">
        <div class="section-header__left">
          <div class="section-header__icon" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>
          </div>
          <div>
            <div class="section-header__title">${t("overview.notes.title")}</div>
            <div class="section-header__sub" style="display:block">${t("overview.notes.subtitle")}</div>
          </div>
        </div>
      </div>
      <div class="overview-notes-grid">
        <div class="note-card">
          <div class="note-card__icon" aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
          </div>
          <div class="note-card__title">${t("overview.notes.tailscaleTitle")}</div>
          <div class="note-card__text">${t("overview.notes.tailscaleText")}</div>
        </div>
        <div class="note-card">
          <div class="note-card__icon" aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
          </div>
          <div class="note-card__title">${t("overview.notes.sessionTitle")}</div>
          <div class="note-card__text">${t("overview.notes.sessionText")}</div>
        </div>
        <div class="note-card">
          <div class="note-card__icon" aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          </div>
          <div class="note-card__title">${t("overview.notes.cronTitle")}</div>
          <div class="note-card__text">${t("overview.notes.cronText")}</div>
        </div>
      </div>
    </div>
  `;
}
