import CoreLocation
import Foundation
import QCortexKit
import UIKit

typealias QCortexCameraSnapResult = (format: String, base64: String, width: Int, height: Int)
typealias QCortexCameraClipResult = (format: String, base64: String, durationMs: Int, hasAudio: Bool)

protocol CameraServicing: Sendable {
    func listDevices() async -> [CameraController.CameraDeviceInfo]
    func snap(params: QCortexCameraSnapParams) async throws -> QCortexCameraSnapResult
    func clip(params: QCortexCameraClipParams) async throws -> QCortexCameraClipResult
}

protocol ScreenRecordingServicing: Sendable {
    func record(
        screenIndex: Int?,
        durationMs: Int?,
        fps: Double?,
        includeAudio: Bool?,
        outPath: String?) async throws -> String
}

@MainActor
protocol LocationServicing: Sendable {
    func authorizationStatus() -> CLAuthorizationStatus
    func accuracyAuthorization() -> CLAccuracyAuthorization
    func ensureAuthorization(mode: QCortexLocationMode) async -> CLAuthorizationStatus
    func currentLocation(
        params: QCortexLocationGetParams,
        desiredAccuracy: QCortexLocationAccuracy,
        maxAgeMs: Int?,
        timeoutMs: Int?) async throws -> CLLocation
    func startLocationUpdates(
        desiredAccuracy: QCortexLocationAccuracy,
        significantChangesOnly: Bool) -> AsyncStream<CLLocation>
    func stopLocationUpdates()
    func startMonitoringSignificantLocationChanges(onUpdate: @escaping @Sendable (CLLocation) -> Void)
    func stopMonitoringSignificantLocationChanges()
}

@MainActor
protocol DeviceStatusServicing: Sendable {
    func status() async throws -> QCortexDeviceStatusPayload
    func info() -> QCortexDeviceInfoPayload
}

protocol PhotosServicing: Sendable {
    func latest(params: QCortexPhotosLatestParams) async throws -> QCortexPhotosLatestPayload
}

protocol ContactsServicing: Sendable {
    func search(params: QCortexContactsSearchParams) async throws -> QCortexContactsSearchPayload
    func add(params: QCortexContactsAddParams) async throws -> QCortexContactsAddPayload
}

protocol CalendarServicing: Sendable {
    func events(params: QCortexCalendarEventsParams) async throws -> QCortexCalendarEventsPayload
    func add(params: QCortexCalendarAddParams) async throws -> QCortexCalendarAddPayload
}

protocol RemindersServicing: Sendable {
    func list(params: QCortexRemindersListParams) async throws -> QCortexRemindersListPayload
    func add(params: QCortexRemindersAddParams) async throws -> QCortexRemindersAddPayload
}

protocol MotionServicing: Sendable {
    func activities(params: QCortexMotionActivityParams) async throws -> QCortexMotionActivityPayload
    func pedometer(params: QCortexPedometerParams) async throws -> QCortexPedometerPayload
}

struct WatchMessagingStatus: Sendable, Equatable {
    var supported: Bool
    var paired: Bool
    var appInstalled: Bool
    var reachable: Bool
    var activationState: String
}

struct WatchQuickReplyEvent: Sendable, Equatable {
    var replyId: String
    var promptId: String
    var actionId: String
    var actionLabel: String?
    var sessionKey: String?
    var note: String?
    var sentAtMs: Int?
    var transport: String
}

struct WatchNotificationSendResult: Sendable, Equatable {
    var deliveredImmediately: Bool
    var queuedForDelivery: Bool
    var transport: String
}

protocol WatchMessagingServicing: AnyObject, Sendable {
    func status() async -> WatchMessagingStatus
    func setReplyHandler(_ handler: (@Sendable (WatchQuickReplyEvent) -> Void)?)
    func sendNotification(
        id: String,
        params: QCortexWatchNotifyParams) async throws -> WatchNotificationSendResult
}

extension CameraController: CameraServicing {}
extension ScreenRecordService: ScreenRecordingServicing {}
extension LocationService: LocationServicing {}
