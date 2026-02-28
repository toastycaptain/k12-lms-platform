import Foundation

struct APIError: Error {
    let statusCode: Int
    let message: String
}

final class APIClient {
    private let baseURL: URL
    private let session: URLSession
    private var csrfToken: String?

    init(environment: AppEnvironment = .current, session: URLSession = .shared) {
        self.baseURL = environment.apiBaseURL
        self.session = session
    }

    func get<T: Decodable>(_ path: String, as type: T.Type) async throws -> T {
        let request = try await makeRequest(path: path, method: "GET")
        return try await execute(request, as: type)
    }

    func post<T: Decodable, Body: Encodable>(_ path: String, body: Body, as type: T.Type) async throws -> T {
        var request = try await makeRequest(path: path, method: "POST")
        request.httpBody = try JSONEncoder().encode(body)
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        return try await execute(request, as: type)
    }

    func patch<T: Decodable, Body: Encodable>(_ path: String, body: Body, as type: T.Type) async throws -> T {
        var request = try await makeRequest(path: path, method: "PATCH")
        request.httpBody = try JSONEncoder().encode(body)
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        return try await execute(request, as: type)
    }

    private func makeRequest(path: String, method: String, includeCSRF: Bool = true) async throws -> URLRequest {
        let normalizedPath = path.hasPrefix("/") ? path : "/\(path)"
        guard let url = URL(string: normalizedPath, relativeTo: baseURL) else {
            throw APIError(statusCode: 0, message: "Invalid path")
        }

        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Accept")

        if includeCSRF && method != "GET" {
            request.setValue(try await csrfTokenValue(), forHTTPHeaderField: "X-CSRF-Token")
        }

        return request
    }

    private func execute<T: Decodable>(_ request: URLRequest, as type: T.Type) async throws -> T {
        let (data, response) = try await session.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError(statusCode: 0, message: "Invalid response")
        }

        guard 200..<300 ~= httpResponse.statusCode else {
            let message = String(data: data, encoding: .utf8) ?? "Request failed"
            throw APIError(statusCode: httpResponse.statusCode, message: message)
        }

        return try JSONDecoder().decode(T.self, from: data)
    }

    private func csrfTokenValue() async throws -> String {
        if let csrfToken {
            return csrfToken
        }

        struct CSRFResponse: Decodable { let token: String }
        let request = try await makeRequest(path: "/api/v1/csrf", method: "GET", includeCSRF: false)
        let response: CSRFResponse = try await execute(request, as: CSRFResponse.self)

        guard !response.token.isEmpty else {
            throw APIError(statusCode: 0, message: "Unable to obtain CSRF token")
        }

        csrfToken = response.token
        return response.token
    }
}
