import { db } from '@/lib/db'

interface LogActivityParams {
  action: string       // CREATE, UPDATE, DELETE, LOGIN, LOGOUT, STATUS_CHANGE, etc.
  entityType: string   // archive_file, category, supplier, room, department, user, etc.
  entityId?: string | null
  description: string
  details?: string | null
  performedBy?: string | null
}

export async function logActivity(params: LogActivityParams) {
  try {
    await db.activityLog.create({
      data: {
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId ?? null,
        description: params.description,
        details: params.details ?? null,
        performedBy: params.performedBy ?? null,
      },
    })
  } catch (error) {
    console.error('Failed to log activity:', error)
  }
}

// Auto-cleanup: delete activity logs older than 2 years
export async function cleanupOldActivities() {
  try {
    const twoYearsAgo = new Date()
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2)

    const result = await db.activityLog.deleteMany({
      where: {
        createdAt: {
          lt: twoYearsAgo,
        },
      },
    })

    return result.count
  } catch (error) {
    console.error('Failed to cleanup old activities:', error)
    return 0
  }
}
