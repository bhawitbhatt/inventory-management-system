import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'

import { customerFormSchema } from '../../schemas/customer-form.js'
import { Button } from '../ui/button.jsx'
import { Input } from '../ui/input.jsx'
import { FormField } from './FormField.jsx'

const EMPTY_VALUES = {
  full_name: '',
  email: '',
  phone: '',
}

/**
 * Customer create/edit form.
 *
 * Backend exposes PUT /customers/{id}, so the edit flow is real. Email
 * is locked when editing — the backend allows changing it but UX-wise
 * we keep it stable to avoid accidental duplicates; users delete-and-recreate
 * for clean email migrations.
 *
 * @param {object} props
 * @param {object} [props.customer]
 * @param {(payload: object) => void} props.onSubmit
 * @param {() => void} [props.onCancel]
 * @param {boolean} [props.busy]
 */
export function CustomerForm({ customer, onSubmit, onCancel, busy = false }) {
  const isEdit = customer != null
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(customerFormSchema),
    defaultValues: isEdit
      ? {
          full_name: customer.full_name,
          email: customer.email,
          phone: customer.phone,
        }
      : EMPTY_VALUES,
  })

  useEffect(() => {
    reset(
      isEdit
        ? {
            full_name: customer.full_name,
            email: customer.email,
            phone: customer.phone,
          }
        : EMPTY_VALUES,
    )
  }, [customer, isEdit, reset])

  const submit = handleSubmit((values) => {
    onSubmit({
      full_name: values.full_name,
      email: values.email,
      phone: values.phone,
    })
  })

  const pending = busy || isSubmitting

  return (
    <form className="space-y-4" onSubmit={submit} noValidate>
      <FormField
        label="Full name"
        htmlFor="customer-name"
        error={errors.full_name?.message}
        required
      >
        <Input
          id="customer-name"
          autoComplete="name"
          placeholder="Jane Doe"
          {...register('full_name')}
        />
      </FormField>

      <FormField
        label="Email"
        htmlFor="customer-email"
        error={errors.email?.message}
        hint={
          isEdit
            ? 'Changing the email may collide with an existing record.'
            : undefined
        }
        required
      >
        <Input
          id="customer-email"
          type="email"
          autoComplete="email"
          placeholder="jane@example.com"
          {...register('email')}
        />
      </FormField>

      <FormField
        label="Phone"
        htmlFor="customer-phone"
        error={errors.phone?.message}
        required
      >
        <Input
          id="customer-phone"
          type="tel"
          autoComplete="tel"
          placeholder="+1-555-0100"
          {...register('phone')}
        />
      </FormField>

      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={pending}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending
            ? 'Saving…'
            : isEdit
              ? 'Save changes'
              : 'Add customer'}
        </Button>
      </div>
    </form>
  )
}
