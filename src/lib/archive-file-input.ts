import { db } from '@/lib/db'

export type ArchiveFileInput = {
  fileCode?: unknown
  title?: unknown
  supplier?: unknown
  category?: unknown
  department?: unknown
  room?: unknown
  rack?: unknown
  shelf?: unknown
  boxNumber?: unknown
  retentionDate?: unknown
  status?: unknown
  notes?: unknown
}

type FieldName = 'supplier' | 'category' | 'room' | 'status'

const fieldLabels: Record<FieldName, string> = {
  supplier: 'Supplier',
  category: 'Category',
  room: 'Room',
  status: 'Status',
}

export function textValue(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

export function nullableTextValue(value: unknown) {
  const text = textValue(value)
  return text || null
}

export async function validateArchiveFileLookups(values: Partial<Record<FieldName, string | null>>) {
  const checks = [
    values.supplier
      ? db.supplier.findUnique({ where: { supplierName: values.supplier } }).then((found) => ({ field: 'supplier' as const, found }))
      : null,
    values.category
      ? db.category.findUnique({ where: { categoryName: values.category } }).then((found) => ({ field: 'category' as const, found }))
      : null,
    values.room
      ? db.room.findUnique({ where: { roomName: values.room } }).then((found) => ({ field: 'room' as const, found }))
      : null,
    values.status
      ? db.status.findUnique({ where: { statusName: values.status } }).then((found) => ({ field: 'status' as const, found }))
      : null,
  ].filter(Boolean)

  const results = await Promise.all(checks)
  const missing = results.find((result) => result && !result.found)

  if (missing) {
    return `${fieldLabels[missing.field]} does not exist in Settings`
  }

  return null
}
