import { playSound } from "react-sounds";

/**
 * Play a notification sound safely without breaking UI flows
 * even if browser autoplay is restricted or permissions are pending.
 */
export async function playNotificationSound(
  type: "success" | "error" | "warning" | "info" = "success",
) {
  try {
    const soundMap = {
      success: "notification/success" as const,
      error: "notification/error" as const,
      warning: "notification/warning" as const,
      info: "notification/notification" as const,
    };
    await playSound(soundMap[type], { volume: 0.6 });
  } catch (err) {
    // Ignore audio permission or autoplay errors silently
    console.debug("Audio playback ignored:", err);
  }
}
