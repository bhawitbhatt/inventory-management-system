import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'

import { customersApi } from '../api/customers.js'
import { extractError } from '../api/client.js'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import EmptyState from '../components/EmptyState.jsx'
import Modal from '../components/Modal.jsx'
import Spinner from '../components/Spinner.jsx'
import { formatDateTime } from '../lib/format.js'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function Customers() {
  const qc = useQueryClient()
  const { data = [], isLoading, error } = useQuery({
    queryKey: ['customers'],
    queryFn: customersApi.list,
  })
  const [creating, setCreating] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const createMut = useMutation({
    mutationFn: customersApi.create,
    onSuccess: () => {
      toast.success('Customer added')
      qc.invalidateQueries({ queryKey: ['customers'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      setCreating(false)
    },
    onError: (e) => toast.error(extractError(e)),
  })

  const deleteMut = useMutation({
    mutationFn: customersApi.remove,
    onSuccess: () => {
      toast.success('Customer deleted')
      qc.invalidateQueries({ queryKey: ['customers'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      setConfirmDelete(null)
    },
    onError: (e) => {
      toast.error(extractError(e))
      setConfirmDelete(null)
    },
  })

  if (isLoading) return <Spinner />
  if (error) {
    return (
      <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-5 text-sm text-destructive">
        Failed to load customers: {error.message}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Customers</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage customer records.</p>
        </div>
        <button type="button" className="btn-primary" onClick={() => setCreating(true)}>
          + Add customer
        </button>
      </header>

      {data.length === 0 ? (
        <EmptyState
          title="No customers yet"
          description="Add your first customer to start creating orders."
          action={
            <button type="button" className="btn-primary" onClick={() => setCreating(true)}>
              Add customer
            </button>
          }
        />
      ) : (
        <div className="card overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted">
              <tr>
                <th className="table-th">Name</th>
                <th className="table-th">Email</th>
                <th className="table-th">Phone</th>
                <th className="table-th">Created</th>
                <th className="table-th text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-background">
              {data.map((c) => (
                <tr key={c.id}>
                  <td className="table-td font-medium text-foreground">{c.full_name}</td>
                  <td className="table-td">{c.email}</td>
                  <td className="table-td">{c.phone}</td>
                  <td className="table-td text-muted-foreground">{formatDateTime(c.created_at)}</td>
                  <td className="table-td text-right">
                    <button
                      type="button"
                      className="btn-ghost px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10"
                      onClick={() => setConfirmDelete(c)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CustomerFormModal
        open={creating}
        onClose={() => setCreating(false)}
        onSubmit={(payload) => createMut.mutate(payload)}
        busy={createMut.isPending}
      />

      <ConfirmDialog
        open={confirmDelete !== null}
        title="Delete customer?"
        message={
          confirmDelete
            ? `This will permanently delete "${confirmDelete.full_name}" (${confirmDelete.email}).`
            : ''
        }
        confirmLabel="Delete"
        danger
        busy={deleteMut.isPending}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => deleteMut.mutate(confirmDelete.id)}
      />
    </div>
  )
}

function CustomerFormModal({ open, onClose, onSubmit, busy }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({ defaultValues: { full_name: '', email: '', phone: '' } })

  const submit = handleSubmit((values) => {
    onSubmit({
      full_name: values.full_name.trim(),
      email: values.email.trim(),
      phone: values.phone.trim(),
    })
  })

  return (
    <Modal
      open={open}
      onClose={() => {
        reset()
        onClose()
      }}
      title="Add customer"
      footer={
        <>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              reset()
              onClose()
            }}
            disabled={busy}
          >
            Cancel
          </button>
          <button type="button" className="btn-primary" onClick={submit} disabled={busy}>
            {busy ? 'Adding…' : 'Add customer'}
          </button>
        </>
      }
    >
      <form className="space-y-4" onSubmit={submit}>
        <div>
          <label className="label" htmlFor="full_name">
            Full name
          </label>
          <input
            id="full_name"
            className="input"
            placeholder="Jane Doe"
            {...register('full_name', { required: 'Name is required', maxLength: 200 })}
          />
          {errors.full_name && (
            <p className="mt-1 text-xs text-destructive">{errors.full_name.message}</p>
          )}
        </div>
        <div>
          <label className="label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            className="input"
            placeholder="jane@example.com"
            {...register('email', {
              required: 'Email is required',
              pattern: { value: EMAIL_PATTERN, message: 'Enter a valid email' },
            })}
          />
          {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
        </div>
        <div>
          <label className="label" htmlFor="phone">
            Phone
          </label>
          <input
            id="phone"
            className="input"
            placeholder="+1-555-0100"
            {...register('phone', {
              required: 'Phone is required',
              minLength: { value: 3, message: 'Phone too short' },
              maxLength: 32,
            })}
          />
          {errors.phone && <p className="mt-1 text-xs text-destructive">{errors.phone.message}</p>}
        </div>
      </form>
    </Modal>
  )
}
