import client from './client'

export const createConsultationRequest = (body) =>
  client.post('/consultation-requests', body).then(r => r.data.data)

export const getMyConsultationRequests = (params = {}) =>
  client.get('/consultation-requests/mine', { params }).then(r => ({
    data: r.data.data,
    pagination: r.data.pagination,
  }))

export const getIncomingConsultationRequests = (params = {}) =>
  client.get('/consultation-requests/incoming', { params }).then(r => ({
    data: r.data.data,
    pagination: r.data.pagination,
  }))

export const getConsultationRequest = (id) =>
  client.get(`/consultation-requests/${id}`).then(r => r.data.data)

export const cancelConsultationRequest = (id) =>
  client.post(`/consultation-requests/${id}/cancel`).then(r => r.data.data)

export const rejectConsultationRequest = (id) =>
  client.post(`/consultation-requests/${id}/reject`).then(r => r.data.data)
