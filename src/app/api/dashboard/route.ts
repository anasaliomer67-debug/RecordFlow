import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/require-auth'

export async function GET() {
  try {
    const auth = await requireAuth()
    if (!auth.authenticated) return auth.error

    const [
      totalFiles,
      activeFiles,
      archivedFiles,
      borrowedFiles,
      totalCategories,
      totalSuppliers,
      totalRooms,
      totalUsers,
      recentFiles,
      filesByCategoryRaw,
      filesByStatusRaw,
      filesBySupplierRaw,
    ] = await Promise.all([
      db.archiveFile.count(),
      db.archiveFile.count({ where: { status: 'Active' } }),
      db.archiveFile.count({ where: { status: 'Archived' } }),
      db.archiveFile.count({ where: { status: 'Borrowed' } }),
      db.category.count(),
      db.supplier.count(),
      db.room.count(),
      db.user.count(),
      db.archiveFile.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          fileCode: true,
          title: true,
          category: true,
          status: true,
          fromDate: true,
          toDate: true,
          notes: true,
          createdAt: true,
        },
      }),
      db.archiveFile.groupBy({
        by: ['category'],
        _count: { category: true },
      }),
      db.archiveFile.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      db.archiveFile.groupBy({
        by: ['supplier'],
        _count: { supplier: true },
      }),
    ])

    const filesByCategory = filesByCategoryRaw
      .filter((item) => item.category !== null)
      .map((item) => ({
        category: item.category,
        count: item._count.category,
      }))

    const filesByStatus = filesByStatusRaw.map((item) => ({
      status: item.status,
      count: item._count.status,
    }))

    const filesBySupplier = filesBySupplierRaw
      .filter((item) => item.supplier !== null)
      .map((item) => ({
        supplier: item.supplier,
        count: item._count.supplier,
      }))

    return NextResponse.json({
      totalFiles,
      activeFiles,
      archivedFiles,
      borrowedFiles,
      totalCategories,
      totalSuppliers,
      totalRooms,
      totalUsers,
      recentFiles,
      filesByCategory,
      filesByStatus,
      filesBySupplier,
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    )
  }
}
