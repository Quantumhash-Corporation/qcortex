package ai.qcortex.app.node

import ai.qcortex.app.protocol.QCortexCalendarCommand
import ai.qcortex.app.protocol.QCortexCanvasA2UICommand
import ai.qcortex.app.protocol.QCortexCanvasCommand
import ai.qcortex.app.protocol.QCortexCameraCommand
import ai.qcortex.app.protocol.QCortexCapability
import ai.qcortex.app.protocol.QCortexContactsCommand
import ai.qcortex.app.protocol.QCortexDeviceCommand
import ai.qcortex.app.protocol.QCortexLocationCommand
import ai.qcortex.app.protocol.QCortexMotionCommand
import ai.qcortex.app.protocol.QCortexNotificationsCommand
import ai.qcortex.app.protocol.QCortexPhotosCommand
import ai.qcortex.app.protocol.QCortexScreenCommand
import ai.qcortex.app.protocol.QCortexSmsCommand
import ai.qcortex.app.protocol.QCortexSystemCommand

data class NodeRuntimeFlags(
  val cameraEnabled: Boolean,
  val locationEnabled: Boolean,
  val smsAvailable: Boolean,
  val voiceWakeEnabled: Boolean,
  val motionActivityAvailable: Boolean,
  val motionPedometerAvailable: Boolean,
  val debugBuild: Boolean,
)

enum class InvokeCommandAvailability {
  Always,
  CameraEnabled,
  LocationEnabled,
  SmsAvailable,
  MotionActivityAvailable,
  MotionPedometerAvailable,
  DebugBuild,
}

enum class NodeCapabilityAvailability {
  Always,
  CameraEnabled,
  LocationEnabled,
  SmsAvailable,
  VoiceWakeEnabled,
  MotionAvailable,
}

data class NodeCapabilitySpec(
  val name: String,
  val availability: NodeCapabilityAvailability = NodeCapabilityAvailability.Always,
)

data class InvokeCommandSpec(
  val name: String,
  val requiresForeground: Boolean = false,
  val availability: InvokeCommandAvailability = InvokeCommandAvailability.Always,
)

object InvokeCommandRegistry {
  val capabilityManifest: List<NodeCapabilitySpec> =
    listOf(
      NodeCapabilitySpec(name = QCortexCapability.Canvas.rawValue),
      NodeCapabilitySpec(name = QCortexCapability.Screen.rawValue),
      NodeCapabilitySpec(name = QCortexCapability.Device.rawValue),
      NodeCapabilitySpec(name = QCortexCapability.Notifications.rawValue),
      NodeCapabilitySpec(name = QCortexCapability.System.rawValue),
      NodeCapabilitySpec(name = QCortexCapability.AppUpdate.rawValue),
      NodeCapabilitySpec(
        name = QCortexCapability.Camera.rawValue,
        availability = NodeCapabilityAvailability.CameraEnabled,
      ),
      NodeCapabilitySpec(
        name = QCortexCapability.Sms.rawValue,
        availability = NodeCapabilityAvailability.SmsAvailable,
      ),
      NodeCapabilitySpec(
        name = QCortexCapability.VoiceWake.rawValue,
        availability = NodeCapabilityAvailability.VoiceWakeEnabled,
      ),
      NodeCapabilitySpec(
        name = QCortexCapability.Location.rawValue,
        availability = NodeCapabilityAvailability.LocationEnabled,
      ),
      NodeCapabilitySpec(name = QCortexCapability.Photos.rawValue),
      NodeCapabilitySpec(name = QCortexCapability.Contacts.rawValue),
      NodeCapabilitySpec(name = QCortexCapability.Calendar.rawValue),
      NodeCapabilitySpec(
        name = QCortexCapability.Motion.rawValue,
        availability = NodeCapabilityAvailability.MotionAvailable,
      ),
    )

  val all: List<InvokeCommandSpec> =
    listOf(
      InvokeCommandSpec(
        name = QCortexCanvasCommand.Present.rawValue,
        requiresForeground = true,
      ),
      InvokeCommandSpec(
        name = QCortexCanvasCommand.Hide.rawValue,
        requiresForeground = true,
      ),
      InvokeCommandSpec(
        name = QCortexCanvasCommand.Navigate.rawValue,
        requiresForeground = true,
      ),
      InvokeCommandSpec(
        name = QCortexCanvasCommand.Eval.rawValue,
        requiresForeground = true,
      ),
      InvokeCommandSpec(
        name = QCortexCanvasCommand.Snapshot.rawValue,
        requiresForeground = true,
      ),
      InvokeCommandSpec(
        name = QCortexCanvasA2UICommand.Push.rawValue,
        requiresForeground = true,
      ),
      InvokeCommandSpec(
        name = QCortexCanvasA2UICommand.PushJSONL.rawValue,
        requiresForeground = true,
      ),
      InvokeCommandSpec(
        name = QCortexCanvasA2UICommand.Reset.rawValue,
        requiresForeground = true,
      ),
      InvokeCommandSpec(
        name = QCortexScreenCommand.Record.rawValue,
        requiresForeground = true,
      ),
      InvokeCommandSpec(
        name = QCortexSystemCommand.Notify.rawValue,
      ),
      InvokeCommandSpec(
        name = QCortexCameraCommand.List.rawValue,
        requiresForeground = true,
        availability = InvokeCommandAvailability.CameraEnabled,
      ),
      InvokeCommandSpec(
        name = QCortexCameraCommand.Snap.rawValue,
        requiresForeground = true,
        availability = InvokeCommandAvailability.CameraEnabled,
      ),
      InvokeCommandSpec(
        name = QCortexCameraCommand.Clip.rawValue,
        requiresForeground = true,
        availability = InvokeCommandAvailability.CameraEnabled,
      ),
      InvokeCommandSpec(
        name = QCortexLocationCommand.Get.rawValue,
        availability = InvokeCommandAvailability.LocationEnabled,
      ),
      InvokeCommandSpec(
        name = QCortexDeviceCommand.Status.rawValue,
      ),
      InvokeCommandSpec(
        name = QCortexDeviceCommand.Info.rawValue,
      ),
      InvokeCommandSpec(
        name = QCortexDeviceCommand.Permissions.rawValue,
      ),
      InvokeCommandSpec(
        name = QCortexDeviceCommand.Health.rawValue,
      ),
      InvokeCommandSpec(
        name = QCortexNotificationsCommand.List.rawValue,
      ),
      InvokeCommandSpec(
        name = QCortexNotificationsCommand.Actions.rawValue,
      ),
      InvokeCommandSpec(
        name = QCortexPhotosCommand.Latest.rawValue,
      ),
      InvokeCommandSpec(
        name = QCortexContactsCommand.Search.rawValue,
      ),
      InvokeCommandSpec(
        name = QCortexContactsCommand.Add.rawValue,
      ),
      InvokeCommandSpec(
        name = QCortexCalendarCommand.Events.rawValue,
      ),
      InvokeCommandSpec(
        name = QCortexCalendarCommand.Add.rawValue,
      ),
      InvokeCommandSpec(
        name = QCortexMotionCommand.Activity.rawValue,
        availability = InvokeCommandAvailability.MotionActivityAvailable,
      ),
      InvokeCommandSpec(
        name = QCortexMotionCommand.Pedometer.rawValue,
        availability = InvokeCommandAvailability.MotionPedometerAvailable,
      ),
      InvokeCommandSpec(
        name = QCortexSmsCommand.Send.rawValue,
        availability = InvokeCommandAvailability.SmsAvailable,
      ),
      InvokeCommandSpec(
        name = "debug.logs",
        availability = InvokeCommandAvailability.DebugBuild,
      ),
      InvokeCommandSpec(
        name = "debug.ed25519",
        availability = InvokeCommandAvailability.DebugBuild,
      ),
      InvokeCommandSpec(name = "app.update"),
    )

  private val byNameInternal: Map<String, InvokeCommandSpec> = all.associateBy { it.name }

  fun find(command: String): InvokeCommandSpec? = byNameInternal[command]

  fun advertisedCapabilities(flags: NodeRuntimeFlags): List<String> {
    return capabilityManifest
      .filter { spec ->
        when (spec.availability) {
          NodeCapabilityAvailability.Always -> true
          NodeCapabilityAvailability.CameraEnabled -> flags.cameraEnabled
          NodeCapabilityAvailability.LocationEnabled -> flags.locationEnabled
          NodeCapabilityAvailability.SmsAvailable -> flags.smsAvailable
          NodeCapabilityAvailability.VoiceWakeEnabled -> flags.voiceWakeEnabled
          NodeCapabilityAvailability.MotionAvailable -> flags.motionActivityAvailable || flags.motionPedometerAvailable
        }
      }
      .map { it.name }
  }

  fun advertisedCommands(flags: NodeRuntimeFlags): List<String> {
    return all
      .filter { spec ->
        when (spec.availability) {
          InvokeCommandAvailability.Always -> true
          InvokeCommandAvailability.CameraEnabled -> flags.cameraEnabled
          InvokeCommandAvailability.LocationEnabled -> flags.locationEnabled
          InvokeCommandAvailability.SmsAvailable -> flags.smsAvailable
          InvokeCommandAvailability.MotionActivityAvailable -> flags.motionActivityAvailable
          InvokeCommandAvailability.MotionPedometerAvailable -> flags.motionPedometerAvailable
          InvokeCommandAvailability.DebugBuild -> flags.debugBuild
        }
      }
      .map { it.name }
  }
}
