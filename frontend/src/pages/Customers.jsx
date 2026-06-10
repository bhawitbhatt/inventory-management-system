import { Pencil, Plus, Trash2, Users } from 'lucide-react'
import { useState } from 'react'

import { ConfirmDialog } from '../components/ConfirmDialog.jsx'
import { DataTable } from '../components/DataTable.jsx'
import { ErrorState } from '../components/ErrorState.jsx'
import EmptyState from '../components/EmptyState.jsx'
import Modal from '../components/Modal.jsx'
import { PageHeader } from '../components/PageHeader.jsx'
import { CustomerForm } from '../components/forms/CustomerForm.jsx'
import { Button } from '../components/ui/button.jsx'
import {
  useCreateCustomer,
  useCustomers,
  useDeleteCustomer,
  useUpdateCustomer,
} from '../hooks/use-customers.js'
import { formatDateTime } from '../lib/format.js'

export default function Customers() {
  const customersQ = useCustomers()
  const [editing, setEditing] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const createMut = useCreateCustomer()
  const updateMut = useUpdateCustomer()
  const deleteMut = useDeleteCustomer()

  function handleSubmit(payload) {
    if (editing === 'new') {
      createMut.mutate(payload, { onSuccess: () => setEditing(null) })
    } else if (editing && editing !== 'new') {
      updateMut.mutate(
        { id: editing.id, payload },
        { onSuccess: () => setEditing(null) },
      )
    }
  }

  function handleConfirmDelete() {
    if (!confirmDelete) return
    deleteMut.mutate(confirmDelete.id, {
      onSuccess: () => setConfirmDelete(null),
      onError: () => setConfirmDelete(null),
    })
  }

  const columns = [
    {
      id: 'full_name',
      header: 'Name',
      accessor: (row) => row.full_name,
      sortable: true,
      cell: (row) => (
        <span className="font-medium text-foreground">{row.full_name}</span>
      ),
    },
    {
      id: 'email',
      header: 'Email',
      accessor: (row) => row.email,
      sortable: true,
    },
    {
      id: 'phone',
      header: 'Phone',
      accessor: (row) => row.phone,
      cell: (row) => (
        <span className="tabular-nums text-muted-foreground">{row.phone}</span>
      ),
    },
    {
      id: 'created_at',
      header: 'Joined',
      accessor: (row) => row.created_at,
      sortable: true,
      cell: (row) => (
        <span className="text-muted-foreground">
          {formatDateTime(row.created_at)}
        </span>
      ),
    },
    {
      id: 'actions',
      header: <span className="sr-only">Actions</span>,
      align: 'right',
      width: '160px',
      cell: (row) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEditing(row)}
            aria-label={`Edit ${row.full_name}`}
          >
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => setConfirmDelete(row)}
            aria-label={`Delete ${row.full_name}`}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      ),
    },
  ]

  if (customersQ.error) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Customers"
          description="Manage customer records."
        />
        <ErrorState
          title="Couldn’t load customers"
          description={customersQ.error.message}
          onRetry={() => customersQ.refetch()}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        description="Manage customer records."
        actions={
          <Button onClick={() => setEditing('new')}>
            <Plus className="h-4 w-4" />
            Add customer
          </Button>
        }
      />

      <DataTable
        columns={columns}
        rows={customersQ.data ?? []}
        getRowId={(row) => row.id}
        searchableKeys={['full_name', 'email', 'phone']}
        searchPlaceholder="Search customers…"
        loading={customersQ.isLoading}
        emptyState={
          <EmptyState
            icon={Users}
            title="No customers yet"
            description="Add your first customer to start creating orders."
            action={
              <Button onClick={() => setEditing('new')}>
                <Plus className="h-4 w-4" />
                Add customer
              </Button>
            }
          />
        }
      />

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={
          editing && editing !== 'new' ? 'Edit customer' : 'Add customer'
        }
      >
        <CustomerForm
          customer={editing && editing !== 'new' ? editing : null}
          onSubmit={handleSubmit}
          onCancel={() => setEditing(null)}
          busy={createMut.isPending || updateMut.isPending}
        />
      </Modal>

      <ConfirmDialog
        open={confirmDelete !== null}
        title="Delete customer?"
        description={
          confirmDelete
            ? `This will permanently delete "${confirmDelete.full_name}" (${confirmDelete.email}).`
            : undefined
        }
        confirmLabel="Delete"
        variant="danger"
        busy={deleteMut.isPending}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}
