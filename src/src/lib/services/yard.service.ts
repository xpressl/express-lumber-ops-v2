import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createAuditEvent } from "@/lib/events/audit";
import { emitToRoom } from "@/lib/socket";
import type { YardTaskStatus, YardTaskType } from "@prisma/client";

/** List yard tasks with filters */
export async function listTasks(params: {
  locationId: string;
  assignedTo?: string;
  status?: string;
  type?: string;
}) {
  return prisma.yardTask.findMany({
    where: {
      locationId: params.locationId,
      ...(params.assignedTo ? { assignedTo: params.assignedTo } : {}),
      ...(params.status ? { status: params.status as YardTaskStatus } : {
        status: { in: ["PENDING", "ASSIGNED", "IN_PROGRESS"] },
      }),
      ...(params.type ? { type: params.type as YardTaskType } : {}),
    },
    orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
  });
}

/** Create a yard task */
export async function createTask(input: {
  type: YardTaskType;
  orderId?: string;
  assignedTo?: string;
  priority?: number;
  bay?: string;
  notes?: string;
  locationId: string;
}, actorId: string) {
  const task = await prisma.yardTask.create({ data: input });

  emitToRoom(`yard:${input.locationId}`, "task:assigned", {
    taskId: task.id, assigneeId: input.assignedTo, locationId: input.locationId,
  });

  await createAuditEvent({
    actorId, actorName: actorId, action: "yard.task_created",
    entityType: "YardTask", entityId: task.id,
    locationId: input.locationId,
    metadata: { type: input.type, assignedTo: input.assignedTo } as Record<string, unknown>,
  });

  return task;
}

/** Update task status */
export async function updateTaskStatus(
  taskId: string,
  status: YardTaskStatus,
  actorId: string,
  notes?: string,
) {
  const task = await prisma.yardTask.update({
    where: { id: taskId },
    data: {
      status,
      ...(status === "IN_PROGRESS" ? { startedAt: new Date() } : {}),
      ...(status === "COMPLETED" ? { completedAt: new Date(), completedBy: actorId } : {}),
      ...(notes ? { notes } : {}),
    },
  });

  emitToRoom(`yard:${task.locationId}`, "task:completed", {
    taskId: task.id, locationId: task.locationId,
  });

  await createAuditEvent({
    actorId, actorName: "System",
    action: `yard.task_${status.toLowerCase()}`,
    entityType: "YardTask", entityId: task.id,
    locationId: task.locationId,
  });

  return task;
}

/** Assign task to worker */
export async function assignTask(taskId: string, workerId: string, actorId: string) {
  const task = await prisma.yardTask.update({
    where: { id: taskId },
    data: { assignedTo: workerId, status: "ASSIGNED" },
  });

  emitToRoom(`yard:${task.locationId}`, "task:assigned", {
    taskId: task.id, assigneeId: workerId, locationId: task.locationId,
  });

  await createAuditEvent({
    actorId, actorName: actorId, action: "yard.task_assigned",
    entityType: "YardTask", entityId: task.id,
    locationId: task.locationId,
    metadata: { assignedTo: workerId } as Record<string, unknown>,
  });

  return task;
}

/** Get workload summary by worker */
export async function getWorkload(locationId: string) {
  const tasks = await prisma.yardTask.findMany({
    where: { locationId, status: { in: ["PENDING", "ASSIGNED", "IN_PROGRESS"] } },
  });

  const byWorker: Record<string, { pending: number; inProgress: number; total: number }> = {};
  const unassigned = { pending: 0, total: 0 };

  for (const task of tasks) {
    if (!task.assignedTo) {
      unassigned.pending++;
      unassigned.total++;
      continue;
    }
    if (!byWorker[task.assignedTo]) byWorker[task.assignedTo] = { pending: 0, inProgress: 0, total: 0 };
    const w = byWorker[task.assignedTo]!;
    w.total++;
    if (task.status === "IN_PROGRESS") w.inProgress++;
    else w.pending++;
  }

  return { byWorker, unassigned, totalActive: tasks.length };
}

/** Log damage */
export async function logDamage(input: {
  orderId?: string;
  notes: string;
  photos?: string[];
  locationId: string;
}, actorId: string) {
  const task = await prisma.yardTask.create({
    data: {
      type: "DAMAGE_INSPECTION",
      orderId: input.orderId,
      notes: input.notes,
      photos: input.photos ?? [],
      locationId: input.locationId,
      status: "COMPLETED",
      completedAt: new Date(),
      completedBy: actorId,
    },
  });

  await createAuditEvent({
    actorId, actorName: "System", action: "yard.damage_logged",
    entityType: "YardTask", entityId: task.id,
    locationId: input.locationId,
    metadata: { notes: input.notes } as Record<string, unknown>,
  });

  return task;
}
