import client from './client'

export const scheduleConsultation = (body) =>
  client.post('/consultations', body).then(r => r.data.data)

export const getMyConsultations = (params = {}) =>
  client.get('/consultations/mine', { params }).then(r => ({
    data: r.data.data,
    pagination: r.data.pagination,
  }))

export const getMySessions = (params = {}) =>
  client.get('/consultations/my-sessions', { params }).then(r => ({
    data: r.data.data,
    pagination: r.data.pagination,
  }))

export const getConsultation = (id) =>
  client.get(`/consultations/${id}`).then(r => r.data.data)

export const updateConsultationStatus = (id, status) =>
  client.patch(`/consultations/${id}/status`, { status }).then(r => r.data.data)
