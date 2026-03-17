package ai.qcortex.app.protocol

import org.junit.Assert.assertEquals
import org.junit.Test

class QCortexProtocolConstantsTest {
  @Test
  fun canvasCommandsUseStableStrings() {
    assertEquals("canvas.present", QCortexCanvasCommand.Present.rawValue)
    assertEquals("canvas.hide", QCortexCanvasCommand.Hide.rawValue)
    assertEquals("canvas.navigate", QCortexCanvasCommand.Navigate.rawValue)
    assertEquals("canvas.eval", QCortexCanvasCommand.Eval.rawValue)
    assertEquals("canvas.snapshot", QCortexCanvasCommand.Snapshot.rawValue)
  }

  @Test
  fun a2uiCommandsUseStableStrings() {
    assertEquals("canvas.a2ui.push", QCortexCanvasA2UICommand.Push.rawValue)
    assertEquals("canvas.a2ui.pushJSONL", QCortexCanvasA2UICommand.PushJSONL.rawValue)
    assertEquals("canvas.a2ui.reset", QCortexCanvasA2UICommand.Reset.rawValue)
  }

  @Test
  fun capabilitiesUseStableStrings() {
    assertEquals("canvas", QCortexCapability.Canvas.rawValue)
    assertEquals("camera", QCortexCapability.Camera.rawValue)
    assertEquals("screen", QCortexCapability.Screen.rawValue)
    assertEquals("voiceWake", QCortexCapability.VoiceWake.rawValue)
    assertEquals("location", QCortexCapability.Location.rawValue)
    assertEquals("sms", QCortexCapability.Sms.rawValue)
    assertEquals("device", QCortexCapability.Device.rawValue)
    assertEquals("notifications", QCortexCapability.Notifications.rawValue)
    assertEquals("system", QCortexCapability.System.rawValue)
    assertEquals("appUpdate", QCortexCapability.AppUpdate.rawValue)
    assertEquals("photos", QCortexCapability.Photos.rawValue)
    assertEquals("contacts", QCortexCapability.Contacts.rawValue)
    assertEquals("calendar", QCortexCapability.Calendar.rawValue)
    assertEquals("motion", QCortexCapability.Motion.rawValue)
  }

  @Test
  fun cameraCommandsUseStableStrings() {
    assertEquals("camera.list", QCortexCameraCommand.List.rawValue)
    assertEquals("camera.snap", QCortexCameraCommand.Snap.rawValue)
    assertEquals("camera.clip", QCortexCameraCommand.Clip.rawValue)
  }

  @Test
  fun screenCommandsUseStableStrings() {
    assertEquals("screen.record", QCortexScreenCommand.Record.rawValue)
  }

  @Test
  fun notificationsCommandsUseStableStrings() {
    assertEquals("notifications.list", QCortexNotificationsCommand.List.rawValue)
    assertEquals("notifications.actions", QCortexNotificationsCommand.Actions.rawValue)
  }

  @Test
  fun deviceCommandsUseStableStrings() {
    assertEquals("device.status", QCortexDeviceCommand.Status.rawValue)
    assertEquals("device.info", QCortexDeviceCommand.Info.rawValue)
    assertEquals("device.permissions", QCortexDeviceCommand.Permissions.rawValue)
    assertEquals("device.health", QCortexDeviceCommand.Health.rawValue)
  }

  @Test
  fun systemCommandsUseStableStrings() {
    assertEquals("system.notify", QCortexSystemCommand.Notify.rawValue)
  }

  @Test
  fun photosCommandsUseStableStrings() {
    assertEquals("photos.latest", QCortexPhotosCommand.Latest.rawValue)
  }

  @Test
  fun contactsCommandsUseStableStrings() {
    assertEquals("contacts.search", QCortexContactsCommand.Search.rawValue)
    assertEquals("contacts.add", QCortexContactsCommand.Add.rawValue)
  }

  @Test
  fun calendarCommandsUseStableStrings() {
    assertEquals("calendar.events", QCortexCalendarCommand.Events.rawValue)
    assertEquals("calendar.add", QCortexCalendarCommand.Add.rawValue)
  }

  @Test
  fun motionCommandsUseStableStrings() {
    assertEquals("motion.activity", QCortexMotionCommand.Activity.rawValue)
    assertEquals("motion.pedometer", QCortexMotionCommand.Pedometer.rawValue)
  }
}
