import client from './client'

export const createRequest = (body) =>
  client.post('/connection-requests', body).then(r => r.data.data)

export const getMyRequests = (params = {}) =>
  client.get('/connection-requests/mine', { params }).then(r => ({
    data: r.data.data,
    pagination: r.data.pagination,
  }))

export const getIncomingRequests = (params = {}) =>
  client.get('/connection-requests/incoming', { params }).then(r => ({
    data: r.data.data,
    pagination: r.data.pagination,
  }))

export const getRequest = (id) =>
  client.get(`/connection-requests/${id}`).then(r => r.data.data)

export const cancelRequest = (id) =>
  client.post(`/connection-requests/${id}/cancel`).then(r => r.data.data)

export const acceptRequest = (id) =>
  client.post(`/connection-requests/${id}/accept`).then(r => r.data.data)

export const rejectRequest = (id) =>
  client.post(`/connection-requests/${id}/reject`).then(r => r.data.data)
