import Foundation

public enum QCortexCameraCommand: String, Codable, Sendable {
    case list = "camera.list"
    case snap = "camera.snap"
    case clip = "camera.clip"
}

public enum QCortexCameraFacing: String, Codable, Sendable {
    case back
    case front
}

public enum QCortexCameraImageFormat: String, Codable, Sendable {
    case jpg
    case jpeg
}

public enum QCortexCameraVideoFormat: String, Codable, Sendable {
    case mp4
}

public struct QCortexCameraSnapParams: Codable, Sendable, Equatable {
    public var facing: QCortexCameraFacing?
    public var maxWidth: Int?
    public var quality: Double?
    public var format: QCortexCameraImageFormat?
    public var deviceId: String?
    public var delayMs: Int?

    public init(
        facing: QCortexCameraFacing? = nil,
        maxWidth: Int? = nil,
        quality: Double? = nil,
        format: QCortexCameraImageFormat? = nil,
        deviceId: String? = nil,
        delayMs: Int? = nil)
    {
        self.facing = facing
        self.maxWidth = maxWidth
        self.quality = quality
        self.format = format
        self.deviceId = deviceId
        self.delayMs = delayMs
    }
}

public struct QCortexCameraClipParams: Codable, Sendable, Equatable {
    public var facing: QCortexCameraFacing?
    public var durationMs: Int?
    public var includeAudio: Bool?
    public var format: QCortexCameraVideoFormat?
    public var deviceId: String?

    public init(
        facing: QCortexCameraFacing? = nil,
        durationMs: Int? = nil,
        includeAudio: Bool? = nil,
        format: QCortexCameraVideoFormat? = nil,
        deviceId: String? = nil)
    {
        self.facing = facing
        self.durationMs = durationMs
        self.includeAudio = includeAudio
        self.format = format
        self.deviceId = deviceId
    }
}
