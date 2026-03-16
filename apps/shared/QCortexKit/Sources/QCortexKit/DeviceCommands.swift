import Foundation

public enum QCortexDeviceCommand: String, Codable, Sendable {
    case status = "device.status"
    case info = "device.info"
}

public enum QCortexBatteryState: String, Codable, Sendable {
    case unknown
    case unplugged
    case charging
    case full
}

public enum QCortexThermalState: String, Codable, Sendable {
    case nominal
    case fair
    case serious
    case critical
}

public enum QCortexNetworkPathStatus: String, Codable, Sendable {
    case satisfied
    case unsatisfied
    case requiresConnection
}

public enum QCortexNetworkInterfaceType: String, Codable, Sendable {
    case wifi
    case cellular
    case wired
    case other
}

public struct QCortexBatteryStatusPayload: Codable, Sendable, Equatable {
    public var level: Double?
    public var state: QCortexBatteryState
    public var lowPowerModeEnabled: Bool

    public init(level: Double?, state: QCortexBatteryState, lowPowerModeEnabled: Bool) {
        self.level = level
        self.state = state
        self.lowPowerModeEnabled = lowPowerModeEnabled
    }
}

public struct QCortexThermalStatusPayload: Codable, Sendable, Equatable {
    public var state: QCortexThermalState

    public init(state: QCortexThermalState) {
        self.state = state
    }
}

public struct QCortexStorageStatusPayload: Codable, Sendable, Equatable {
    public var totalBytes: Int64
    public var freeBytes: Int64
    public var usedBytes: Int64

    public init(totalBytes: Int64, freeBytes: Int64, usedBytes: Int64) {
        self.totalBytes = totalBytes
        self.freeBytes = freeBytes
        self.usedBytes = usedBytes
    }
}

public struct QCortexNetworkStatusPayload: Codable, Sendable, Equatable {
    public var status: QCortexNetworkPathStatus
    public var isExpensive: Bool
    public var isConstrained: Bool
    public var interfaces: [QCortexNetworkInterfaceType]

    public init(
        status: QCortexNetworkPathStatus,
        isExpensive: Bool,
        isConstrained: Bool,
        interfaces: [QCortexNetworkInterfaceType])
    {
        self.status = status
        self.isExpensive = isExpensive
        self.isConstrained = isConstrained
        self.interfaces = interfaces
    }
}

public struct QCortexDeviceStatusPayload: Codable, Sendable, Equatable {
    public var battery: QCortexBatteryStatusPayload
    public var thermal: QCortexThermalStatusPayload
    public var storage: QCortexStorageStatusPayload
    public var network: QCortexNetworkStatusPayload
    public var uptimeSeconds: Double

    public init(
        battery: QCortexBatteryStatusPayload,
        thermal: QCortexThermalStatusPayload,
        storage: QCortexStorageStatusPayload,
        network: QCortexNetworkStatusPayload,
        uptimeSeconds: Double)
    {
        self.battery = battery
        self.thermal = thermal
        self.storage = storage
        self.network = network
        self.uptimeSeconds = uptimeSeconds
    }
}

public struct QCortexDeviceInfoPayload: Codable, Sendable, Equatable {
    public var deviceName: String
    public var modelIdentifier: String
    public var systemName: String
    public var systemVersion: String
    public var appVersion: String
    public var appBuild: String
    public var locale: String

    public init(
        deviceName: String,
        modelIdentifier: String,
        systemName: String,
        systemVersion: String,
        appVersion: String,
        appBuild: String,
        locale: String)
    {
        self.deviceName = deviceName
        self.modelIdentifier = modelIdentifier
        self.systemName = systemName
        self.systemVersion = systemVersion
        self.appVersion = appVersion
        self.appBuild = appBuild
        self.locale = locale
    }
}
