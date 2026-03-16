package ai.qcortex.app.node

import ai.qcortex.app.protocol.QCortexCalendarCommand
import ai.qcortex.app.protocol.QCortexCameraCommand
import ai.qcortex.app.protocol.QCortexCapability
import ai.qcortex.app.protocol.QCortexContactsCommand
import ai.qcortex.app.protocol.QCortexDeviceCommand
import ai.qcortex.app.protocol.QCortexLocationCommand
import ai.qcortex.app.protocol.QCortexMotionCommand
import ai.qcortex.app.protocol.QCortexNotificationsCommand
import ai.qcortex.app.protocol.QCortexPhotosCommand
import ai.qcortex.app.protocol.QCortexSmsCommand
import ai.qcortex.app.protocol.QCortexSystemCommand
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class InvokeCommandRegistryTest {
  private val coreCapabilities =
    setOf(
      QCortexCapability.Canvas.rawValue,
      QCortexCapability.Screen.rawValue,
      QCortexCapability.Device.rawValue,
      QCortexCapability.Notifications.rawValue,
      QCortexCapability.System.rawValue,
      QCortexCapability.AppUpdate.rawValue,
      QCortexCapability.Photos.rawValue,
      QCortexCapability.Contacts.rawValue,
      QCortexCapability.Calendar.rawValue,
    )

  private val optionalCapabilities =
    setOf(
      QCortexCapability.Camera.rawValue,
      QCortexCapability.Location.rawValue,
      QCortexCapability.Sms.rawValue,
      QCortexCapability.VoiceWake.rawValue,
      QCortexCapability.Motion.rawValue,
    )

  private val coreCommands =
    setOf(
      QCortexDeviceCommand.Status.rawValue,
      QCortexDeviceCommand.Info.rawValue,
      QCortexDeviceCommand.Permissions.rawValue,
      QCortexDeviceCommand.Health.rawValue,
      QCortexNotificationsCommand.List.rawValue,
      QCortexNotificationsCommand.Actions.rawValue,
      QCortexSystemCommand.Notify.rawValue,
      QCortexPhotosCommand.Latest.rawValue,
      QCortexContactsCommand.Search.rawValue,
      QCortexContactsCommand.Add.rawValue,
      QCortexCalendarCommand.Events.rawValue,
      QCortexCalendarCommand.Add.rawValue,
      "app.update",
    )

  private val optionalCommands =
    setOf(
      QCortexCameraCommand.Snap.rawValue,
      QCortexCameraCommand.Clip.rawValue,
      QCortexCameraCommand.List.rawValue,
      QCortexLocationCommand.Get.rawValue,
      QCortexMotionCommand.Activity.rawValue,
      QCortexMotionCommand.Pedometer.rawValue,
      QCortexSmsCommand.Send.rawValue,
    )

  private val debugCommands = setOf("debug.logs", "debug.ed25519")

  @Test
  fun advertisedCapabilities_respectsFeatureAvailability() {
    val capabilities = InvokeCommandRegistry.advertisedCapabilities(defaultFlags())

    assertContainsAll(capabilities, coreCapabilities)
    assertMissingAll(capabilities, optionalCapabilities)
  }

  @Test
  fun advertisedCapabilities_includesFeatureCapabilitiesWhenEnabled() {
    val capabilities =
      InvokeCommandRegistry.advertisedCapabilities(
        defaultFlags(
          cameraEnabled = true,
          locationEnabled = true,
          smsAvailable = true,
          voiceWakeEnabled = true,
          motionActivityAvailable = true,
          motionPedometerAvailable = true,
        ),
      )

    assertContainsAll(capabilities, coreCapabilities + optionalCapabilities)
  }

  @Test
  fun advertisedCommands_respectsFeatureAvailability() {
    val commands = InvokeCommandRegistry.advertisedCommands(defaultFlags())

    assertContainsAll(commands, coreCommands)
    assertMissingAll(commands, optionalCommands + debugCommands)
  }

  @Test
  fun advertisedCommands_includesFeatureCommandsWhenEnabled() {
    val commands =
      InvokeCommandRegistry.advertisedCommands(
        defaultFlags(
          cameraEnabled = true,
          locationEnabled = true,
          smsAvailable = true,
          motionActivityAvailable = true,
          motionPedometerAvailable = true,
          debugBuild = true,
        ),
      )

    assertContainsAll(commands, coreCommands + optionalCommands + debugCommands)
  }

  @Test
  fun advertisedCommands_onlyIncludesSupportedMotionCommands() {
    val commands =
      InvokeCommandRegistry.advertisedCommands(
        NodeRuntimeFlags(
          cameraEnabled = false,
          locationEnabled = false,
          smsAvailable = false,
          voiceWakeEnabled = false,
          motionActivityAvailable = true,
          motionPedometerAvailable = false,
          debugBuild = false,
        ),
      )

    assertTrue(commands.contains(QCortexMotionCommand.Activity.rawValue))
    assertFalse(commands.contains(QCortexMotionCommand.Pedometer.rawValue))
  }

  private fun defaultFlags(
    cameraEnabled: Boolean = false,
    locationEnabled: Boolean = false,
    smsAvailable: Boolean = false,
    voiceWakeEnabled: Boolean = false,
    motionActivityAvailable: Boolean = false,
    motionPedometerAvailable: Boolean = false,
    debugBuild: Boolean = false,
  ): NodeRuntimeFlags =
    NodeRuntimeFlags(
      cameraEnabled = cameraEnabled,
      locationEnabled = locationEnabled,
      smsAvailable = smsAvailable,
      voiceWakeEnabled = voiceWakeEnabled,
      motionActivityAvailable = motionActivityAvailable,
      motionPedometerAvailable = motionPedometerAvailable,
      debugBuild = debugBuild,
    )

  private fun assertContainsAll(actual: List<String>, expected: Set<String>) {
    expected.forEach { value -> assertTrue(actual.contains(value)) }
  }

  private fun assertMissingAll(actual: List<String>, forbidden: Set<String>) {
    forbidden.forEach { value -> assertFalse(actual.contains(value)) }
  }
}
