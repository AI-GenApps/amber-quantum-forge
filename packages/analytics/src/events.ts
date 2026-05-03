export type AnalyticsEvent =
  | { type: "screen_view"; screen: string }
  | { type: "auth_sign_in"; provider: "google" | "apple" }
  | { type: "auth_sign_out" }
  | { type: "chat_message_sent"; sessionId: string }
  | { type: "subscription_started"; productId: string };
