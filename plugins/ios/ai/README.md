# StarterAI

Swift package providing AI chat session management for the Starter iOS app.

## Overview

`StarterAI` exposes an `AISession` protocol with two concrete implementations:

- `RemoteAISession` — streams tokens from `POST /api/ai/chat` using the Vercel AI SDK data-stream format
- `OnDeviceAISession` — stub that throws `501`; reserved for future CoreML integration

## Usage

```swift
let session: AISession = RemoteAISession(
    baseURL: URL(string: "https://api.example.com")!,
    getAccessToken: { try await AuthManager.shared.currentAccessToken() }
)
let stream = try await session.send("Hello!")
for try await token in stream {
    print(token, terminator: "")
}
```

## Swapping implementations

Replace `RemoteAISession` with `OnDeviceAISession` in your factory/DI layer:

```swift
let session: AISession = OnDeviceAISession()
```

## Future: CoreML integration

1. Add a `CoreML` model to the app bundle or download via `BackgroundTasks`
2. Implement `OnDeviceAISession.send(_:)` using `MLModel` inference
3. Wire tokeniser + detokeniser around the model's input/output feature providers
