import Foundation

public enum QCortexChatTransportEvent: Sendable {
    case health(ok: Bool)
    case tick
    case chat(QCortexChatEventPayload)
    case agent(QCortexAgentEventPayload)
    case seqGap
}

public protocol QCortexChatTransport: Sendable {
    func requestHistory(sessionKey: String) async throws -> QCortexChatHistoryPayload
    func sendMessage(
        sessionKey: String,
        message: String,
        thinking: String,
        idempotencyKey: String,
        attachments: [QCortexChatAttachmentPayload]) async throws -> QCortexChatSendResponse

    func abortRun(sessionKey: String, runId: String) async throws
    func listSessions(limit: Int?) async throws -> QCortexChatSessionsListResponse

    func requestHealth(timeoutMs: Int) async throws -> Bool
    func events() -> AsyncStream<QCortexChatTransportEvent>

    func setActiveSessionKey(_ sessionKey: String) async throws
}

extension QCortexChatTransport {
    public func setActiveSessionKey(_: String) async throws {}

    public func abortRun(sessionKey _: String, runId _: String) async throws {
        throw NSError(
            domain: "QCortexChatTransport",
            code: 0,
            userInfo: [NSLocalizedDescriptionKey: "chat.abort not supported by this transport"])
    }

    public func listSessions(limit _: Int?) async throws -> QCortexChatSessionsListResponse {
        throw NSError(
            domain: "QCortexChatTransport",
            code: 0,
            userInfo: [NSLocalizedDescriptionKey: "sessions.list not supported by this transport"])
    }
}
