import { createAuditEvent, type CreateAuditEventInput } from "./audit";
import type { SessionUser } from "@/lib/auth/options";

/** Lightweight actor identity for audit trails */
export interface Actor {
  id: string;
  name: string;
}

/** Build an Actor from a session user */
export function toActor(user: SessionUser): Actor {
  return { id: user.id, name: `${user.firstName} ${user.lastName}` };
}

/** Create an audit event with actor name resolved from session user */
export async function audit(
  user: { id: string; firstName: string; lastName: string },
  input: Omit<CreateAuditEventInput, "actorId" | "actorName">,
) {
  return createAuditEvent({
    ...input,
    actorId: user.id,
    actorName: `${user.firstName} ${user.lastName}`,
  });
}

/** Resolve actor display name from session user */
export function actorName(user: SessionUser): string {
  return `${user.firstName} ${user.lastName}`;
}
