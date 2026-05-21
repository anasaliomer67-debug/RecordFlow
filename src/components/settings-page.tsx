'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { Plus, Pencil, Trash2, Tag, Truck, CircleDot } from 'lucide-react'
import { toast } from 'sonner'

interface Category {
  id: number
  categoryName: string
}

interface Supplier {
  id: number
  supplierName: string
}

interface Status {
  id: number
  statusName: string
}

// ─── Categories Section ───────────────────────────────────────────────
function CategoriesSection() {
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Category | null>(null)
  const [deletingItem, setDeletingItem] = useState<Category | null>(null)
  const [name, setName] = useState('')
  const [formError, setFormError] = useState('')

  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await fetch('/api/categories')
      if (!res.ok) throw new Error('Failed to fetch categories')
      return res.json()
    },
  })

  const saveMutation = useMutation({
    mutationFn: async (data: { categoryName: string }) => {
      const url = editingItem ? `/api/categories/${editingItem.id}` : '/api/categories'
      const method = editingItem ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Failed to save category')
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      toast.success(editingItem ? 'Category updated' : 'Category created')
      closeDialog()
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Failed to delete category')
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      toast.success('Category deleted')
      setDeleteDialogOpen(false)
      setDeletingItem(null)
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const openCreate = () => {
    setEditingItem(null)
    setName('')
    setFormError('')
    setDialogOpen(true)
  }

  const openEdit = (item: Category) => {
    setEditingItem(item)
    setName(item.categoryName)
    setFormError('')
    setDialogOpen(true)
  }

  const closeDialog = () => {
    setDialogOpen(false)
    setEditingItem(null)
    setName('')
    setFormError('')
  }

  const handleSave = () => {
    if (!name.trim()) {
      setFormError('Category name is required')
      return
    }
    saveMutation.mutate({ categoryName: name.trim() })
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Categories</h3>
        <Button onClick={openCreate} size="sm" className="gap-2 bg-emerald-600 hover:bg-emerald-700">
          <Plus className="size-4" />
          Add
        </Button>
      </div>
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : categories.length > 0 ? (
        <div className="space-y-2">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-accent/50"
            >
              <div className="flex items-center gap-3">
                <Tag className="size-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm font-medium">{cat.categoryName}</span>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="size-8" onClick={() => openEdit(cat)}>
                  <Pencil className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-destructive hover:text-destructive"
                  onClick={() => {
                    setDeletingItem(cat)
                    setDeleteDialogOpen(true)
                  }}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="py-8 text-center text-muted-foreground">No categories found</p>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Category' : 'Add Category'}</DialogTitle>
            <DialogDescription>
              {editingItem ? 'Update the category name.' : 'Enter a name for the new category.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            <Label htmlFor="catName">Category Name *</Label>
            <Input
              id="catName"
              value={name}
              onChange={(e) => { setName(e.target.value); setFormError('') }}
              placeholder="e.g., Financial Records"
            />
            {formError && <p className="text-xs text-destructive">{formError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending} className="bg-emerald-600 hover:bg-emerald-700">
              {saveMutation.isPending ? 'Saving...' : editingItem ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deletingItem?.categoryName}&quot;?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deletingItem && deleteMutation.mutate(deletingItem.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

// ─── Suppliers Section ────────────────────────────────────────────────
function SuppliersSection() {
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Supplier | null>(null)
  const [deletingItem, setDeletingItem] = useState<Supplier | null>(null)
  const [name, setName] = useState('')
  const [formError, setFormError] = useState('')

  const { data: suppliers = [], isLoading } = useQuery<Supplier[]>({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const res = await fetch('/api/suppliers')
      if (!res.ok) throw new Error('Failed to fetch suppliers')
      return res.json()
    },
  })

  const saveMutation = useMutation({
    mutationFn: async (data: { supplierName: string }) => {
      const url = editingItem ? `/api/suppliers/${editingItem.id}` : '/api/suppliers'
      const method = editingItem ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Failed to save supplier')
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      toast.success(editingItem ? 'Supplier updated' : 'Supplier created')
      closeDialog()
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/suppliers/${id}`, { method: 'DELETE' })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Failed to delete supplier')
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      toast.success('Supplier deleted')
      setDeleteDialogOpen(false)
      setDeletingItem(null)
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const openCreate = () => {
    setEditingItem(null)
    setName('')
    setFormError('')
    setDialogOpen(true)
  }

  const openEdit = (item: Supplier) => {
    setEditingItem(item)
    setName(item.supplierName)
    setFormError('')
    setDialogOpen(true)
  }

  const closeDialog = () => {
    setDialogOpen(false)
    setEditingItem(null)
    setName('')
    setFormError('')
  }

  const handleSave = () => {
    if (!name.trim()) {
      setFormError('Supplier name is required')
      return
    }
    saveMutation.mutate({ supplierName: name.trim() })
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Suppliers</h3>
        <Button onClick={openCreate} size="sm" className="gap-2 bg-emerald-600 hover:bg-emerald-700">
          <Plus className="size-4" />
          Add
        </Button>
      </div>
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : suppliers.length > 0 ? (
        <div className="space-y-2">
          {suppliers.map((sup) => (
            <div
              key={sup.id}
              className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-accent/50"
            >
              <div className="flex items-center gap-3">
                <Truck className="size-4 text-teal-600 dark:text-teal-400" />
                <span className="text-sm font-medium">{sup.supplierName}</span>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="size-8" onClick={() => openEdit(sup)}>
                  <Pencil className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-destructive hover:text-destructive"
                  onClick={() => {
                    setDeletingItem(sup)
                    setDeleteDialogOpen(true)
                  }}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="py-8 text-center text-muted-foreground">No suppliers found</p>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Supplier' : 'Add Supplier'}</DialogTitle>
            <DialogDescription>
              {editingItem ? 'Update the supplier name.' : 'Enter a name for the new supplier.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            <Label htmlFor="supName">Supplier Name *</Label>
            <Input
              id="supName"
              value={name}
              onChange={(e) => { setName(e.target.value); setFormError('') }}
              placeholder="e.g., ABC Corporation"
            />
            {formError && <p className="text-xs text-destructive">{formError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending} className="bg-emerald-600 hover:bg-emerald-700">
              {saveMutation.isPending ? 'Saving...' : editingItem ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Supplier</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deletingItem?.supplierName}&quot;?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deletingItem && deleteMutation.mutate(deletingItem.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

// ─── Statuses Section ─────────────────────────────────────────────────
function StatusesSection() {
  const { data: statuses = [], isLoading } = useQuery<Status[]>({
    queryKey: ['statuses'],
    queryFn: async () => {
      const res = await fetch('/api/statuses')
      if (!res.ok) throw new Error('Failed to fetch statuses')
      return res.json()
    },
  })

  const getStatusColor = (statusName: string) => {
    switch (statusName) {
      case 'Active':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
      case 'Archived':
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
      case 'Borrowed':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
      case 'Disposed':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
    }
  }

  return (
    <>
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Statuses</h3>
        <p className="text-sm text-muted-foreground">Status types are read-only</p>
      </div>
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : statuses.length > 0 ? (
        <div className="space-y-2">
          {statuses.map((status) => (
            <div
              key={status.id}
              className="flex items-center gap-3 rounded-lg border p-3"
            >
              <CircleDot className="size-4 text-slate-500" />
              <Badge variant="secondary" className={getStatusColor(status.statusName)}>
                {status.statusName}
              </Badge>
            </div>
          ))}
        </div>
      ) : (
        <p className="py-8 text-center text-muted-foreground">No statuses found</p>
      )}
    </>
  )
}

// ─── Main Settings Page ───────────────────────────────────────────────
export function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">Manage system configuration and reference data</p>
      </div>

      <Tabs defaultValue="categories">
        <TabsList>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
          <TabsTrigger value="statuses">Statuses</TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="mt-4">
          <Card>
            <CardContent className="p-6">
              <CategoriesSection />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suppliers" className="mt-4">
          <Card>
            <CardContent className="p-6">
              <SuppliersSection />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="statuses" className="mt-4">
          <Card>
            <CardContent className="p-6">
              <StatusesSection />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
