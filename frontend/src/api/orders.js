import { api } from './client.js'

export const ordersApi = {
  list: () => api.get('/orders').then((r) => r.data),
  get: (id) => api.get(`/orders/${id}`).then((r) => r.data),
  create: (payload) => api.post('/orders', payload).then((r) => r.data),
  remove: (id) => api.delete(`/orders/${id}`).then((r) => r.data),
}
