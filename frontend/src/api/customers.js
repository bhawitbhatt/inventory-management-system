import { api } from './client.js'

export const customersApi = {
  list: () => api.get('/customers').then((r) => r.data),
  get: (id) => api.get(`/customers/${id}`).then((r) => r.data),
  create: (payload) => api.post('/customers', payload).then((r) => r.data),
  remove: (id) => api.delete(`/customers/${id}`).then((r) => r.data),
}
