import Foundation

// Stable identifier used for both the macOS LaunchAgent label and Nix-managed defaults suite.
// nix-qcortex writes app defaults into this suite to survive app bundle identifier churn.
let launchdLabel = "ai.qcortex.mac"
let gatewayLaunchdLabel = "ai.qcortex.gateway"
let onboardingVersionKey = "qcortex.onboardingVersion"
let onboardingSeenKey = "qcortex.onboardingSeen"
let currentOnboardingVersion = 7
let pauseDefaultsKey = "qcortex.pauseEnabled"
let iconAnimationsEnabledKey = "qcortex.iconAnimationsEnabled"
let swabbleEnabledKey = "qcortex.swabbleEnabled"
let swabbleTriggersKey = "qcortex.swabbleTriggers"
let voiceWakeTriggerChimeKey = "qcortex.voiceWakeTriggerChime"
let voiceWakeSendChimeKey = "qcortex.voiceWakeSendChime"
let showDockIconKey = "qcortex.showDockIcon"
let defaultVoiceWakeTriggers = ["qcortex"]
let voiceWakeMaxWords = 32
let voiceWakeMaxWordLength = 64
let voiceWakeMicKey = "qcortex.voiceWakeMicID"
let voiceWakeMicNameKey = "qcortex.voiceWakeMicName"
let voiceWakeLocaleKey = "qcortex.voiceWakeLocaleID"
let voiceWakeAdditionalLocalesKey = "qcortex.voiceWakeAdditionalLocaleIDs"
let voicePushToTalkEnabledKey = "qcortex.voicePushToTalkEnabled"
let talkEnabledKey = "qcortex.talkEnabled"
let iconOverrideKey = "qcortex.iconOverride"
let connectionModeKey = "qcortex.connectionMode"
let remoteTargetKey = "qcortex.remoteTarget"
let remoteIdentityKey = "qcortex.remoteIdentity"
let remoteProjectRootKey = "qcortex.remoteProjectRoot"
let remoteCliPathKey = "qcortex.remoteCliPath"
let canvasEnabledKey = "qcortex.canvasEnabled"
let cameraEnabledKey = "qcortex.cameraEnabled"
let systemRunPolicyKey = "qcortex.systemRunPolicy"
let systemRunAllowlistKey = "qcortex.systemRunAllowlist"
let systemRunEnabledKey = "qcortex.systemRunEnabled"
let locationModeKey = "qcortex.locationMode"
let locationPreciseKey = "qcortex.locationPreciseEnabled"
let peekabooBridgeEnabledKey = "qcortex.peekabooBridgeEnabled"
let deepLinkKeyKey = "qcortex.deepLinkKey"
let modelCatalogPathKey = "qcortex.modelCatalogPath"
let modelCatalogReloadKey = "qcortex.modelCatalogReload"
let cliInstallPromptedVersionKey = "qcortex.cliInstallPromptedVersion"
let heartbeatsEnabledKey = "qcortex.heartbeatsEnabled"
let debugPaneEnabledKey = "qcortex.debugPaneEnabled"
let debugFileLogEnabledKey = "qcortex.debug.fileLogEnabled"
let appLogLevelKey = "qcortex.debug.appLogLevel"
let voiceWakeSupported: Bool = ProcessInfo.processInfo.operatingSystemVersion.majorVersion >= 26
