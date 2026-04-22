import client from './client'

export const createRequest = (body) =>
  client.post('/consultation-requests', body).then(r => r.data.data)

export const getMyRequests = (params = {}) =>
  client.get('/consultation-requests/mine', { params }).then(r => ({
    data: r.data.data,
    pagination: r.data.pagination,
  }))

export const getIncomingRequests = (params = {}) =>
  client.get('/consultation-requests/incoming', { params }).then(r => ({
    data: r.data.data,
    pagination: r.data.pagination,
  }))

export const getRequest = (id) =>
  client.get(`/consultation-requests/${id}`).then(r => r.data.data)

export const cancelRequest = (id) =>
  client.post(`/consultation-requests/${id}/cancel`).then(r => r.data.data)

export const acceptRequest = (id) =>
  client.post(`/consultation-requests/${id}/accept`).then(r => r.data.data)

export const rejectRequest = (id) =>
  client.post(`/consultation-requests/${id}/reject`).then(r => r.data.data)
