'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
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
import { Plus, Pencil, Trash2, DoorOpen } from 'lucide-react'
import { toast } from 'sonner'

interface Room {
  id: number
  roomName: string
}

interface ArchiveFile {
  id: number
  room: string | null
}

export function LocationsPage() {
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingRoom, setEditingRoom] = useState<Room | null>(null)
  const [deletingRoom, setDeletingRoom] = useState<Room | null>(null)
  const [roomName, setRoomName] = useState('')
  const [formError, setFormError] = useState('')

  // Fetch rooms
  const { data: rooms = [], isLoading } = useQuery<Room[]>({
    queryKey: ['rooms'],
    queryFn: async () => {
      const res = await fetch('/api/rooms')
      if (!res.ok) throw new Error('Failed to fetch rooms')
      return res.json()
    },
  })

  // Fetch archive files for counting
  const { data: archiveFiles = [] } = useQuery<ArchiveFile[]>({
    queryKey: ['archive-files-all'],
    queryFn: async () => {
      const res = await fetch('/api/archive-files')
      if (!res.ok) throw new Error('Failed to fetch archive files')
      return res.json()
    },
  })

  // Count files per room
  const fileCountByRoom = archiveFiles.reduce<Record<string, number>>((acc, file) => {
    if (file.room) {
      acc[file.room] = (acc[file.room] || 0) + 1
    }
    return acc
  }, {})

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: { roomName: string }) => {
      const url = editingRoom ? `/api/rooms/${editingRoom.id}` : '/api/rooms'
      const method = editingRoom ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Failed to save room')
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
      toast.success(editingRoom ? 'Room updated successfully' : 'Room created successfully')
      closeDialog()
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/rooms/${id}`, { method: 'DELETE' })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Failed to delete room')
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
      queryClient.invalidateQueries({ queryKey: ['archive-files'] })
      toast.success('Room deleted successfully')
      setDeleteDialogOpen(false)
      setDeletingRoom(null)
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const openCreateDialog = () => {
    setEditingRoom(null)
    setRoomName('')
    setFormError('')
    setDialogOpen(true)
  }

  const openEditDialog = (room: Room) => {
    setEditingRoom(room)
    setRoomName(room.roomName)
    setFormError('')
    setDialogOpen(true)
  }

  const closeDialog = () => {
    setDialogOpen(false)
    setEditingRoom(null)
    setRoomName('')
    setFormError('')
  }

  const handleSave = () => {
    if (!roomName.trim()) {
      setFormError('Room name is required')
      return
    }
    saveMutation.mutate({ roomName: roomName.trim() })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Locations</h2>
          <p className="text-muted-foreground">Manage rooms and storage locations</p>
        </div>
        <Button onClick={openCreateDialog} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
          <Plus className="size-4" />
          Add Room
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="rooms">
        <TabsList>
          <TabsTrigger value="rooms">Rooms</TabsTrigger>
          <TabsTrigger value="racks" disabled>Racks & Shelves</TabsTrigger>
        </TabsList>
        <TabsContent value="rooms" className="mt-4">
          {isLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : rooms.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {rooms.map((room) => (
                <Card key={room.id} className="group transition-shadow hover:shadow-md">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-900/30">
                          <DoorOpen className="size-5 text-teal-600 dark:text-teal-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{room.roomName}</h3>
                          <p className="text-sm text-muted-foreground">
                            {fileCountByRoom[room.roomName] || 0} files
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={() => openEditDialog(room)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-destructive hover:text-destructive"
                          onClick={() => {
                            setDeletingRoom(room)
                            setDeleteDialogOpen(true)
                          }}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex h-40 items-center justify-center rounded-lg border border-dashed text-muted-foreground">
              No rooms found. Click &quot;Add Room&quot; to create one.
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRoom ? 'Edit Room' : 'Add Room'}</DialogTitle>
            <DialogDescription>
              {editingRoom ? 'Update the room name below.' : 'Enter a name for the new room.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="roomName">Room Name *</Label>
              <Input
                id="roomName"
                value={roomName}
                onChange={(e) => {
                  setRoomName(e.target.value)
                  setFormError('')
                }}
                placeholder="e.g., Storage Room A"
              />
              {formError && <p className="text-xs text-destructive">{formError}</p>}
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
              {saveMutation.isPending ? 'Saving...' : editingRoom ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Room</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deletingRoom?.roomName}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingRoom && deleteMutation.mutate(deletingRoom.id)}
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
