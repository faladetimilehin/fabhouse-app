import AuditLog, { AuditAction } from "@/models/AuditLog";

interface LogAdminActionArgs {
  adminId: string;
  adminName: string;
  action: AuditAction;
  targetType: "listing" | "user";
  targetId: string;
  targetLabel: string;
  reason?: string;
}

/**
 * Records an admin action for the audit log. Best-effort — a logging
 * failure should never block the actual admin action from completing,
 * so callers should fire this without awaiting critically or catch
 * errors from it.
 */
export async function logAdminAction(args: LogAdminActionArgs) {
  try {
    await AuditLog.create({
      admin: args.adminId,
      adminName: args.adminName,
      action: args.action,
      targetType: args.targetType,
      targetId: args.targetId,
      targetLabel: args.targetLabel,
      reason: args.reason,
    });
  } catch (err) {
    console.error("Failed to write audit log entry:", err);
  }
}
