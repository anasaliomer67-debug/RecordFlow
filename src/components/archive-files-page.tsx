'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Pencil, Trash2, Search } from 'lucide-react'
import { toast } from 'sonner'

interface ArchiveFile {
  id: number
  fileCode: string
  title: string
  supplier: string | null
  category: string | null
  department: string | null
  room: string | null
  rack: string | null
  shelf: string | null
  boxNumber: string | null
  retentionDate: string | null
  status: string
  notes: string | null
  createdAt: string
}

interface Category {
  id: number
  categoryName: string
}

interface Supplier {
  id: number
  supplierName: string
}

interface Room {
  id: number
  roomName: string
}

interface Status {
  id: number
  statusName: string
}

const emptyForm = {
  fileCode: '',
  title: '',
  supplier: '',
  category: '',
  room: '',
  rack: '',
  shelf: '',
  boxNumber: '',
  retentionDate: '',
  status: 'Active',
  notes: '',
}

function getStatusBadgeVariant(status: string) {
  switch (status) {
    case 'Active':
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
    case 'Archived':
      return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
    case 'Borrowed':
      return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
    default:
      return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
  }
}

export function ArchiveFilesPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingFile, setEditingFile] = useState<ArchiveFile | null>(null)
  const [deletingFile, setDeletingFile] = useState<ArchiveFile | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Fetch archive files
  const { data: files = [], isLoading } = useQuery<ArchiveFile[]>({
    queryKey: ['archive-files', search, statusFilter, categoryFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter)
      if (categoryFilter && categoryFilter !== 'all') params.set('category', categoryFilter)
      const res = await fetch(`/api/archive-files?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch archive files')
      return res.json()
    },
  })

  // Fetch categories
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await fetch('/api/categories')
      if (!res.ok) throw new Error('Failed to fetch categories')
      return res.json()
    },
  })

  // Fetch suppliers
  const { data: suppliers = [] } = useQuery<Supplier[]>({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const res = await fetch('/api/suppliers')
      if (!res.ok) throw new Error('Failed to fetch suppliers')
      return res.json()
    },
  })

  // Fetch rooms
  const { data: rooms = [] } = useQuery<Room[]>({
    queryKey: ['rooms'],
    queryFn: async () => {
      const res = await fetch('/api/rooms')
      if (!res.ok) throw new Error('Failed to fetch rooms')
      return res.json()
    },
  })

  // Fetch statuses
  const { data: statuses = [] } = useQuery<Status[]>({
    queryKey: ['statuses'],
    queryFn: async () => {
      const res = await fetch('/api/statuses')
      if (!res.ok) throw new Error('Failed to fetch statuses')
      return res.json()
    },
  })

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const url = editingFile ? `/api/archive-files/${editingFile.id}` : '/api/archive-files'
      const method = editingFile ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Failed to save file')
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['archive-files'] })
      queryClient.invalidateQueries({ queryKey: ['archive-files-all'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success(editingFile ? 'File updated successfully' : 'File created successfully')
      closeDialog()
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/archive-files/${id}`, { method: 'DELETE' })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Failed to delete file')
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['archive-files'] })
      queryClient.invalidateQueries({ queryKey: ['archive-files-all'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('File deleted successfully')
      setDeleteDialogOpen(false)
      setDeletingFile(null)
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const openCreateDialog = () => {
    setEditingFile(null)
    setForm(emptyForm)
    setFormErrors({})
    setDialogOpen(true)
  }

  const openEditDialog = (file: ArchiveFile) => {
    setEditingFile(file)
    setForm({
      fileCode: file.fileCode,
      title: file.title,
      supplier: file.supplier || '',
      category: file.category || '',
      room: file.room || '',
      rack: file.rack || '',
      shelf: file.shelf || '',
      boxNumber: file.boxNumber || '',
      retentionDate: file.retentionDate || '',
      status: file.status,
      notes: file.notes || '',
    })
    setFormErrors({})
    setDialogOpen(true)
  }

  const closeDialog = () => {
    setDialogOpen(false)
    setEditingFile(null)
    setForm(emptyForm)
    setFormErrors({})
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}
    if (!form.fileCode.trim()) errors.fileCode = 'File code is required'
    if (!form.title.trim()) errors.title = 'Title is required'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSave = () => {
    if (!validateForm()) return
    saveMutation.mutate(form)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Archive Files</h2>
          <p className="text-muted-foreground">Manage your archive files and records</p>
        </div>
        <Button onClick={openCreateDialog} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
          <Plus className="size-4" />
          Add File
        </Button>
      </div>

      {/* Search & Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by code, title, supplier..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {statuses.map((s) => (
                  <SelectItem key={s.id} value={s.statusName}>
                    {s.statusName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.categoryName}>
                    {c.categoryName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : files.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File Code</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead className="hidden md:table-cell">Supplier</TableHead>
                    <TableHead className="hidden lg:table-cell">Category</TableHead>
                    <TableHead className="hidden lg:table-cell">Room</TableHead>
                    <TableHead className="hidden xl:table-cell">Box</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {files.map((file) => (
                    <TableRow key={file.id}>
                      <TableCell className="font-mono text-sm">{file.fileCode}</TableCell>
                      <TableCell className="max-w-40 truncate">{file.title}</TableCell>
                      <TableCell className="hidden md:table-cell">{file.supplier || '-'}</TableCell>
                      <TableCell className="hidden lg:table-cell">{file.category || '-'}</TableCell>
                      <TableCell className="hidden lg:table-cell">{file.room || '-'}</TableCell>
                      <TableCell className="hidden xl:table-cell">{file.boxNumber || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={getStatusBadgeVariant(file.status)}>
                          {file.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(file)}
                            className="size-8"
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setDeletingFile(file)
                              setDeleteDialogOpen(true)
                            }}
                            className="size-8 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex h-40 items-center justify-center text-muted-foreground">
              No archive files found. Click &quot;Add File&quot; to create one.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingFile ? 'Edit Archive File' : 'Add Archive File'}</DialogTitle>
            <DialogDescription>
              {editingFile ? 'Update the archive file details below.' : 'Fill in the details to create a new archive file.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fileCode">File Code *</Label>
                <Input
                  id="fileCode"
                  value={form.fileCode}
                  onChange={(e) => setForm({ ...form, fileCode: e.target.value })}
                  placeholder="e.g., ARC-001"
                />
                {formErrors.fileCode && (
                  <p className="text-xs text-destructive">{formErrors.fileCode}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="File title"
                />
                {formErrors.title && (
                  <p className="text-xs text-destructive">{formErrors.title}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Supplier</Label>
                <Select value={form.supplier} onValueChange={(v) => setForm({ ...form, supplier: v === '_none' ? '' : v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">None</SelectItem>
                    {suppliers.map((s) => (
                      <SelectItem key={s.id} value={s.supplierName}>
                        {s.supplierName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v === '_none' ? '' : v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">None</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.categoryName}>
                        {c.categoryName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Room</Label>
                <Select value={form.room} onValueChange={(v) => setForm({ ...form, room: v === '_none' ? '' : v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select room" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">None</SelectItem>
                    {rooms.map((r) => (
                      <SelectItem key={r.id} value={r.roomName}>
                        {r.roomName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((s) => (
                      <SelectItem key={s.id} value={s.statusName}>
                        {s.statusName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="rack">Rack</Label>
                <Input
                  id="rack"
                  value={form.rack}
                  onChange={(e) => setForm({ ...form, rack: e.target.value })}
                  placeholder="Rack number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shelf">Shelf</Label>
                <Input
                  id="shelf"
                  value={form.shelf}
                  onChange={(e) => setForm({ ...form, shelf: e.target.value })}
                  placeholder="Shelf number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="boxNumber">Box Number</Label>
                <Input
                  id="boxNumber"
                  value={form.boxNumber}
                  onChange={(e) => setForm({ ...form, boxNumber: e.target.value })}
                  placeholder="Box number"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="retentionDate">Retention Date</Label>
              <Input
                id="retentionDate"
                type="date"
                value={form.retentionDate}
                onChange={(e) => setForm({ ...form, retentionDate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Additional notes..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saveMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {saveMutation.isPending ? 'Saving...' : editingFile ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Archive File</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deletingFile?.fileCode} - {deletingFile?.title}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingFile && deleteMutation.mutate(deletingFile.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
