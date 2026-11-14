import AppKit
import ApplicationServices
import CryptoKit
import Security

struct Selector: Decodable {
    let role: String
    let identifier: String?
    let descendantIdentifier: String?
    let description: String?
    let title: String?
    let value: String?
    let path: [Int]?
}
struct Target: Decodable {
    let bundleID: String
    let window: Selector
    let element: Selector?
}
struct Identity: Codable, Equatable {
    let bundleID: String
    let binarySHA256: String
    let cdHash: String
}
struct Frozen: Decodable {
    let bundleID: String
    let binarySHA256: String
    let cdHash: String
    let projectSourceSHA256: String
}
struct Contract: Decodable {
    let appPath: String
    let bundleID: String
    let frozen: Frozen?
    let targets: [String: Target]
}
struct Params: Decodable {
    let target: String?
    let source: String?
    let x: Double?
    let y: Double?
    let width: Double?
    let height: Double?
    let output: String?
}
struct Request: Decodable {
    let `protocol`: Int
    let operation: String
    let mode: String
    let contract: Contract
    let params: Params
    let issuedAt: Double
    let timeoutMs: Double
}
struct DriverError: Error {
    let status: String
    let reason: String
}
func require(_ condition: Bool, _ reason: String, _ status: String = "blocked") throws {
    if !condition { throw DriverError(status: status, reason: reason) }
}
func digest(_ data: Data) -> String {
    SHA256.hash(data: data).map { String(format: "%02x", $0) }.joined()
}
func attribute(_ element: AXUIElement, _ key: String) throws -> CFTypeRef? {
    var value: CFTypeRef?
    let result = AXUIElementCopyAttributeValue(element, key as CFString, &value)
    try require([AXError.success, .attributeUnsupported, .noValue].contains(result), "Native AX read failed, target state is unknown")
    return value
}
func text(_ element: AXUIElement, _ key: String) throws -> String? {
    try attribute(element, key) as? String
}
func children(_ element: AXUIElement) throws -> [AXUIElement] {
    try attribute(element, kAXChildrenAttribute) as? [AXUIElement] ?? []
}
func frame(_ element: AXUIElement) throws -> CGRect {
    guard let position = try attribute(element, kAXPositionAttribute), let size = try attribute(element, kAXSizeAttribute),
          CFGetTypeID(position) == AXValueGetTypeID(), CFGetTypeID(size) == AXValueGetTypeID() else {
        throw DriverError(status: "blocked", reason: "Target has no AX frame")
    }
    var point = CGPoint.zero
    var extent = CGSize.zero
    try require(AXValueGetValue(position as! AXValue, .cgPoint, &point) && AXValueGetValue(size as! AXValue, .cgSize, &extent), "Target frame unavailable")
    return CGRect(origin: point, size: extent)
}
func bounds(_ rect: CGRect) -> [String: Double] {
    ["x": rect.minX, "y": rect.minY, "width": rect.width, "height": rect.height]
}
func identity(_ contract: Contract) throws -> Identity {
    try require(!contract.bundleID.hasPrefix("com.apple."), "System apps cannot be the app under test", "error")
    let url = URL(fileURLWithPath: contract.appPath).resolvingSymlinksInPath()
    try require(url.pathExtension == "app", "Select an app bundle", "error")
    guard let bundle = Bundle(url: url), let binary = bundle.executableURL else {
        throw DriverError(status: "blocked", reason: "App bundle executable missing")
    }
    try require(bundle.bundleIdentifier == contract.bundleID, "Bundle identifier mismatch", "error")
    var code: SecStaticCode?
    try require(SecStaticCodeCreateWithPath(url as CFURL, [], &code) == errSecSuccess && code != nil, "Code signature unavailable")
    try require(SecStaticCodeCheckValidity(code!, SecCSFlags(rawValue: kSecCSStrictValidate), nil) == errSecSuccess, "Strict code signature verification failed", "error")
    var info: CFDictionary?
    try require(SecCodeCopySigningInformation(code!, SecCSFlags(rawValue: kSecCSSigningInformation), &info) == errSecSuccess, "Code signature metadata unavailable")
    guard let cdHash = (info as? [String: Any])?[kSecCodeInfoUnique as String] as? Data else {
        throw DriverError(status: "blocked", reason: "Code directory hash unavailable")
    }
    return Identity(bundleID: contract.bundleID, binarySHA256: digest(try Data(contentsOf: binary)), cdHash: cdHash.map { String(format: "%02x", $0) }.joined())
}

final class Driver {
    let request: Request
    var visited = 0
    init(_ request: Request) { self.request = request }
    func fresh() throws {
        try require(Date().timeIntervalSince1970 * 1000 - request.issuedAt < request.timeoutMs, "Native selector deadline expired")
    }
    func walk(_ element: AXUIElement, _ path: [Int] = []) throws -> [(AXUIElement, [Int])] {
        try fresh()
        visited += 1
        try require(path.count <= 30 && visited <= 4000, "Scoped AX tree exceeds traversal budget")
        var nodes = [(element, path)]
        for (index, child) in try children(element).enumerated() {
            nodes += try walk(child, path + [index])
        }
        return nodes
    }
    func matches(_ element: AXUIElement, _ path: [Int], _ selector: Selector) throws -> Bool {
        try require(selector.descendantIdentifier != nil || selector.identifier != nil || selector.description != nil || selector.title != nil || selector.value != nil || selector.path != nil, "Exact identifier, title or structural path required", "error")
        return try text(element, kAXRoleAttribute) == selector.role &&
            (selector.identifier == nil || text(element, kAXIdentifierAttribute) == selector.identifier) &&
            (selector.description == nil || text(element, kAXDescriptionAttribute) == selector.description) &&
            (selector.title == nil || text(element, kAXTitleAttribute) == selector.title) &&
            (selector.value == nil || text(element, kAXValueAttribute) == selector.value) &&
            (selector.path == nil || path == selector.path)
    }
    func resolve(_ name: String, unique: Bool = true) throws -> (NSRunningApplication, AXUIElement, [(AXUIElement, [Int])], [(AXUIElement, [Int])]) {
        try fresh()
        guard let target = request.contract.targets[name] else { throw DriverError(status: "error", reason: "Unknown contract target") }
        try require(target.window.identifier != nil || target.window.title != nil || target.window.descendantIdentifier != nil, "Exact window identifier, title or descendant identifier required", "error")
        try require(target.window.descendantIdentifier == nil || target.bundleID == request.contract.bundleID, "Descendant window selectors require the frozen app", "error")
        try require(target.element?.descendantIdentifier == nil, "Descendant identifiers select windows only", "error")
        let allowed = [request.contract.bundleID, "com.apple.systempreferences"]
        try require(allowed.contains(target.bundleID), "Target is outside the app and System Settings scope", "error")
        if request.mode == "fixture" {
            try require(target.bundleID == request.contract.bundleID, "Fixture mode cannot target System Settings or another app", "error")
        }
        let apps = NSRunningApplication.runningApplications(withBundleIdentifier: target.bundleID)
        try require(apps.count == 1, "Exactly one running target app required")
        let app = apps[0]
        if target.bundleID == request.contract.bundleID {
            try require(app.bundleURL?.resolvingSymlinksInPath() == URL(fileURLWithPath: request.contract.appPath).resolvingSymlinksInPath(), "Running app is not the frozen bundle", "error")
        }
        let ax = AXUIElementCreateApplication(app.processIdentifier)
        AXUIElementSetMessagingTimeout(ax, 0.5)
        guard let windows = try attribute(ax, kAXWindowsAttribute) as? [AXUIElement] else {
            throw DriverError(status: "blocked", reason: "Target app AX window list unavailable")
        }
        visited = 0
        let trees = try windows.map { try walk($0) }
        for nodes in trees {
            try require(try !nodes.contains { element, _ in
                try ["AXSheet", "AXDialog"].contains(text(element, kAXRoleAttribute) ?? "") ||
                ["AXDialog", "AXSystemDialog"].contains(text(element, kAXSubroleAttribute) ?? "")
            }, "Native dialog present, leave OS consent to the user")
        }
        let selected = try trees.filter { nodes in
            guard try matches(nodes[0].0, [], target.window) else { return false }
            guard let identifier = target.window.descendantIdentifier else { return true }
            let count = try nodes.dropFirst().filter { try text($0.0, kAXIdentifierAttribute) == identifier }.count
            try require(count <= 1, "Ambiguous contract window descendant")
            return count == 1
        }
        try require(selected.count <= 1, "Ambiguous contract window")
        if selected.isEmpty && !unique { return (app, ax, [], []) }
        try require(selected.count == 1, "Contract window missing")
        let nodes = selected[0]
        let elements = try target.element.map { selector in try nodes.filter { try matches($0.0, $0.1, selector) } } ?? [nodes[0]]
        if unique { try require(elements.count == 1, "Exactly one fresh contract element required") }
        return (app, nodes[0].0, elements, nodes)
    }
    func windowInfo(_ pid: pid_t, _ rect: CGRect) throws -> (UInt32, [[String: Any]]) {
        let infos = CGWindowListCopyWindowInfo([.optionOnScreenOnly, .excludeDesktopElements], kCGNullWindowID) as? [[String: Any]] ?? []
        let candidates = infos.filter { info in
            guard (info[kCGWindowOwnerPID as String] as? pid_t) == pid, let box = windowRect(info) else { return false }
            return abs(box.minX - rect.minX) < 2 && abs(box.minY - rect.minY) < 2 && abs(box.width - rect.width) < 3 && abs(box.height - rect.height) < 3
        }
        try require(candidates.count == 1, "Exactly one on-screen contract window required")
        return (candidates[0][kCGWindowNumber as String] as! UInt32, infos)
    }
    func windowRect(_ info: [String: Any]) -> CGRect? {
        guard let value = info[kCGWindowBounds as String] as? NSDictionary else { return nil }
        return CGRect(dictionaryRepresentation: value as CFDictionary)
    }
    func visible(_ pid: pid_t, _ window: AXUIElement, _ element: AXUIElement) throws -> CGPoint {
        let rect = try frame(element)
        let point = CGPoint(x: rect.midX, y: rect.midY)
        let windowFrame = try frame(window)
        let (number, infos) = try windowInfo(pid, windowFrame)
        try require(rect.width > 0 && rect.height > 0 && windowFrame.contains(rect), "Contract element is outside its window")
        let top = infos.first { info in
            (info[kCGWindowAlpha as String] as? Double ?? 1) > 0 && (windowRect(info)?.contains(point) ?? false)
        }?[kCGWindowNumber as String] as? UInt32
        try require(top == number, "Contract element is obscured")
        return point
    }
    func mouse(_ kind: CGEventType, _ point: CGPoint) throws {
        guard let event = CGEvent(mouseEventSource: nil, mouseType: kind, mouseCursorPosition: point, mouseButton: .left) else {
            throw DriverError(status: "blocked", reason: "Native event source unavailable")
        }
        event.post(tap: .cghidEventTap)
    }
    func run() throws -> Any {
        try require(request.protocol == 1 && ["observe", "fixture", "manual-live"].contains(request.mode), "Unsupported protocol or mode", "error")
        try require(request.timeoutMs >= 500 && request.timeoutMs <= 30000 && request.issuedAt <= Date().timeIntervalSince1970 * 1000 + 1000, "Invalid request deadline", "error")
        try fresh()
        if request.operation == "identity" {
            return try JSONSerialization.jsonObject(with: JSONEncoder().encode(identity(request.contract)))
        }
        let session = CGSessionCopyCurrentDictionary() as? [String: Any] ?? [:]
        let unlocked = session["CGSSessionScreenIsLocked"] as? Bool != true && session["kCGSSessionOnConsoleKey"] as? Bool == true
        if request.operation == "preflight" {
            return ["guiUnlocked": unlocked, "harnessAXTrusted": AXIsProcessTrusted(), "harnessScreenCaptureAuthorized": CGPreflightScreenCaptureAccess()]
        }
        try require(unlocked && AXIsProcessTrusted(), "Unlocked GUI and automation harness Accessibility access required")
        guard let frozen = request.contract.frozen else { throw DriverError(status: "error", reason: "Frozen identity required") }
        try require(frozen.projectSourceSHA256.range(of: "^[a-f0-9]{64}$", options: .regularExpression) != nil, "Project source manifest fingerprint required", "error")
        try require(try identity(request.contract) == Identity(bundleID: frozen.bundleID, binarySHA256: frozen.binarySHA256, cdHash: frozen.cdHash), "Frozen app identity changed", "error")
        let observations = ["snapshot", "inspect", "capture"]
        if !observations.contains(request.operation) {
            try require(["fixture", "manual-live"].contains(request.mode), "Native actions need explicit fixture or manual-live scope")
        }
        if request.mode == "fixture" {
            let appURL = URL(fileURLWithPath: request.contract.appPath).resolvingSymlinksInPath()
            let roots = [URL(fileURLWithPath: "/tmp").resolvingSymlinksInPath(), FileManager.default.temporaryDirectory.resolvingSymlinksInPath()]
            try require(request.contract.bundleID.hasPrefix("com.example.") && roots.contains { appURL.path.hasPrefix($0.path + "/") }, "Fixture mode requires a scratch com.example app", "error")
        }
        guard let name = request.params.target else { throw DriverError(status: "error", reason: "Contract target required") }
        let (app, window, elements, nodes) = try resolve(name, unique: request.operation != "snapshot")
        if request.operation == "snapshot" {
            return ["matches": elements.count, "elements": try elements.map { element, _ -> [String: Any] in
                var value: [String: Any] = ["frame": bounds(try frame(element))]
                if let enabled = try attribute(element, kAXEnabledAttribute) as? Bool { value["enabled"] = enabled }
                if let selected = try attribute(element, kAXSelectedAttribute) as? Bool { value["selected"] = selected }
                if let number = try attribute(element, kAXValueAttribute) as? NSNumber { value["value"] = number }
                return value
            }]
        }
        let element = elements[0].0
        if request.operation == "inspect" {
            let prefix = elements[0].1
            return try nodes.filter { $0.1.starts(with: prefix) }.map { node, path -> [String: Any] in
                var value: [String: Any] = ["role": try text(node, kAXRoleAttribute) ?? "", "path": Array(path.dropFirst(prefix.count))]
                if let identifier = try text(node, kAXIdentifierAttribute) { value["identifier"] = identifier }
                if let rect = try? frame(node) { value["frame"] = bounds(rect) }
                return value
            }
        }
        if request.operation == "capture" {
            try require(CGPreflightScreenCaptureAccess(), "Automation harness Screen Capture access required for live window evidence")
            let rect = try frame(window)
            try require(rect.width <= 1000 && rect.height <= 1000, "Capture must be a narrow contract window")
            guard let output = request.params.output, output.hasSuffix(".png") else { throw DriverError(status: "error", reason: "Private PNG output path required") }
            try require(!FileManager.default.fileExists(atPath: output), "Capture output already exists", "error")
            let (number, _) = try windowInfo(app.processIdentifier, rect)
            let capture = Process()
            capture.executableURL = URL(fileURLWithPath: "/usr/sbin/screencapture")
            capture.arguments = ["-x", "-o", "-l", String(number), output]
            capture.standardOutput = FileHandle.nullDevice
            capture.standardError = FileHandle.nullDevice
            try capture.run()
            capture.waitUntilExit()
            try require(capture.terminationStatus == 0 && FileManager.default.fileExists(atPath: output), "Scoped window capture unavailable")
            try FileManager.default.setAttributes([.posixPermissions: 0o600], ofItemAtPath: output)
            return ["capturedWindow": true]
        }
        if request.operation == "move" || request.operation == "resize" {
            let current = try frame(window)
            let proposed = CGRect(x: request.params.x ?? current.minX, y: request.params.y ?? current.minY,
                                  width: request.params.width ?? current.width, height: request.params.height ?? current.height)
            var displays = [CGDirectDisplayID](repeating: 0, count: 32)
            var count: UInt32 = 0
            try require(CGGetActiveDisplayList(32, &displays, &count) == .success && proposed.width > 0 && proposed.height > 0 && displays.prefix(Int(count)).contains { CGDisplayBounds($0).contains(proposed) }, "Window must fit an active display")
            var point = proposed.origin
            var size = proposed.size
            let value = request.operation == "move" ? AXValueCreate(.cgPoint, &point) : AXValueCreate(.cgSize, &size)
            try require(AXUIElementSetAttributeValue(window, (request.operation == "move" ? kAXPositionAttribute : kAXSizeAttribute) as CFString, value!) == .success, "Window geometry action rejected")
            return ["dispatched": request.operation]
        }
        if request.operation == "hide" {
            try require(app.hide(), "Target app could not hide")
            return ["dispatched": "hide"]
        }
        if request.operation == "close" || request.operation == "press" {
            let button: AXUIElement
            if request.operation == "close" {
                guard let close = try attribute(window, kAXCloseButtonAttribute) else { throw DriverError(status: "blocked", reason: "Contract window close button missing") }
                button = close as! AXUIElement
            } else { button = element }
            _ = try visible(app.processIdentifier, window, button)
            try require(AXUIElementPerformAction(button, kAXPressAction as CFString) == .success, "AXPress rejected")
            return ["dispatched": request.operation, "input": "AXPress"]
        }
        try require(["click", "drag"].contains(request.operation), "Unknown native operation", "error")
        try require(NSWorkspace.shared.frontmostApplication?.processIdentifier == app.processIdentifier, "Destination app must already be frontmost")
        let end = try visible(app.processIdentifier, window, element)
        if request.operation == "click" {
            try mouse(.mouseMoved, end)
            try mouse(.leftMouseDown, end)
            usleep(80000)
            try mouse(.leftMouseUp, end)
            return ["dispatched": "click", "input": "CGEvent"]
        }
        try require(try ["AXList", "AXTable", "AXOutline", "AXScrollArea"].contains(text(element, kAXRoleAttribute) ?? ""), "Drag destination must be an exact list target", "error")
        guard let sourceName = request.params.source else { throw DriverError(status: "error", reason: "Drag source target required") }
        let (sourceApp, sourceWindow, sources, _) = try resolve(sourceName)
        try require(sourceApp.bundleIdentifier == request.contract.bundleID, "Drag source must belong to the frozen app", "error")
        let start = try visible(sourceApp.processIdentifier, sourceWindow, sources[0].0)
        let pasteboard = NSPasteboard(name: .drag)
        let previousChange = pasteboard.changeCount
        try mouse(.mouseMoved, start)
        try mouse(.leftMouseDown, start)
        var released = false
        defer { if !released { try? mouse(.leftMouseUp, start) } }
        usleep(150000)
        for step in 1...40 {
            try fresh()
            let progress = Double(step) / 40
            try mouse(.leftMouseDragged, CGPoint(x: start.x + (end.x - start.x) * progress, y: start.y + (end.y - start.y) * progress))
            usleep(30000)
            if step % 8 == 0 {
                try require(NSWorkspace.shared.frontmostApplication?.processIdentifier == app.processIdentifier, "Destination lost foreground during drag", "error")
                let (_, freshWindow, freshElements, _) = try resolve(sourceName)
                _ = try visible(sourceApp.processIdentifier, freshWindow, freshElements[0].0)
                let (_, freshTarget, freshList, _) = try resolve(name)
                _ = try windowInfo(app.processIdentifier, frame(freshTarget))
                let rect = try frame(freshList[0].0)
                let point = CGPoint(x: rect.midX, y: rect.midY)
                try require(abs(point.x - end.x) < 2 && abs(point.y - end.y) < 2, "Drag destination moved during gesture", "error")
            }
        }
        let urls = pasteboard.readObjects(forClasses: [NSURL.self], options: [.urlReadingFileURLsOnly: true]) as? [URL] ?? []
        let expected = URL(fileURLWithPath: request.contract.appPath).resolvingSymlinksInPath()
        try require(pasteboard.changeCount != previousChange && urls.count == 1 && urls[0].resolvingSymlinksInPath() == expected, "Drag pasteboard must contain only the frozen app file URL", "error")
        try mouse(.leftMouseUp, end)
        released = true
        return ["dispatched": "drag", "input": "CGEvent", "fileURLVerified": true, "foregroundSamples": 5, "acceptanceVerified": false]
    }
}

func emit(_ status: String, _ data: Any? = nil, _ reason: String? = nil) {
    var reply: [String: Any] = ["protocol": 1, "status": status]
    if let data { reply["data"] = data }
    if let reason { reply["reason"] = reason }
    let bytes = try! JSONSerialization.data(withJSONObject: reply, options: .sortedKeys)
    FileHandle.standardOutput.write(bytes)
    FileHandle.standardOutput.write(Data([10]))
}
do {
    let request = try JSONDecoder().decode(Request.self, from: FileHandle.standardInput.readDataToEndOfFile())
    emit("ok", try Driver(request).run())
} catch let error as DriverError {
    emit(error.status, nil, error.reason)
    exit(error.status == "blocked" ? 2 : 1)
} catch {
    emit("error", nil, "Native request, bundle or output could not be read")
    exit(1)
}
