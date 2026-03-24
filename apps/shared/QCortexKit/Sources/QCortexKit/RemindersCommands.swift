import Foundation

public enum QCortexRemindersCommand: String, Codable, Sendable {
    case list = "reminders.list"
    case add = "reminders.add"
}

public enum QCortexReminderStatusFilter: String, Codable, Sendable {
    case incomplete
    case completed
    case all
}

public struct QCortexRemindersListParams: Codable, Sendable, Equatable {
    public var status: QCortexReminderStatusFilter?
    public var limit: Int?

    public init(status: QCortexReminderStatusFilter? = nil, limit: Int? = nil) {
        self.status = status
        self.limit = limit
    }
}

public struct QCortexRemindersAddParams: Codable, Sendable, Equatable {
    public var title: String
    public var dueISO: String?
    public var notes: String?
    public var listId: String?
    public var listName: String?

    public init(
        title: String,
        dueISO: String? = nil,
        notes: String? = nil,
        listId: String? = nil,
        listName: String? = nil)
    {
        self.title = title
        self.dueISO = dueISO
        self.notes = notes
        self.listId = listId
        self.listName = listName
    }
}

public struct QCortexReminderPayload: Codable, Sendable, Equatable {
    public var identifier: String
    public var title: String
    public var dueISO: String?
    public var completed: Bool
    public var listName: String?

    public init(
        identifier: String,
        title: String,
        dueISO: String? = nil,
        completed: Bool,
        listName: String? = nil)
    {
        self.identifier = identifier
        self.title = title
        self.dueISO = dueISO
        self.completed = completed
        self.listName = listName
    }
}

public struct QCortexRemindersListPayload: Codable, Sendable, Equatable {
    public var reminders: [QCortexReminderPayload]

    public init(reminders: [QCortexReminderPayload]) {
        self.reminders = reminders
    }
}

public struct QCortexRemindersAddPayload: Codable, Sendable, Equatable {
    public var reminder: QCortexReminderPayload

    public init(reminder: QCortexReminderPayload) {
        self.reminder = reminder
    }
}
