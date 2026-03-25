import { emitToRoom } from "@/lib/socket";

/** Notification types */
export type NotificationType = "info" | "warning" | "error" | "success" | "approval";

export interface NotificationPayload {
  title: string;
  body: string;
  type: NotificationType;
  entityType?: string;
  entityId?: string;
  actionUrl?: string;
}

/** Send an in-app notification to a specific user */
export async function notifyUser(userId: string, payload: NotificationPayload): Promise<void> {
  emitToRoom(`notifications:${userId}`, "notification:new", {
    id: crypto.randomUUID(),
    ...payload,
    timestamp: new Date().toISOString(),
  });
}

/** Send notifications to all users with specific roles at a location */
export async function notifyRole(
  _roles: string[],
  _locationId: string,
  _payload: NotificationPayload,
): Promise<void> {
  // TODO: Look up users with these roles at this location and call notifyUser for each
  // For now this is a shell — will be implemented with user lookup in Phase 3
}

/** Send an SMS notification (via Twilio) */
export async function sendSMS(
  _phoneNumber: string,
  _message: string,
): Promise<{ success: boolean; error?: string }> {
  // TODO: Implement Twilio integration
  // Requires TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER env vars
  console.warn("[SMS] SMS sending not yet configured");
  return { success: false, error: "SMS not configured" };
}

/** Send an email notification (via Resend) */
export async function sendEmail(
  _to: string,
  _subject: string,
  _html: string,
): Promise<{ success: boolean; error?: string }> {
  // TODO: Implement Resend integration
  // Requires RESEND_API_KEY, RESEND_FROM_EMAIL env vars
  console.warn("[Email] Email sending not yet configured");
  return { success: false, error: "Email not configured" };
}

/** Dispatch notification through appropriate channels based on preferences */
export async function dispatchNotification(
  userId: string,
  payload: NotificationPayload,
  channels: { inApp?: boolean; sms?: boolean; email?: boolean } = { inApp: true },
): Promise<void> {
  if (channels.inApp !== false) {
    await notifyUser(userId, payload);
  }

  // SMS and email channels will be implemented when integrations are ready
  // They require looking up user contact info and checking communication preferences
}
