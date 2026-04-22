import client from './client'

export const getMyRecords = (params = {}) =>
  client.get('/medical-records/mine', { params }).then(r => ({
    data: r.data.data,
    pagination: r.data.pagination,
  }))

export const getRecord = (id) =>
  client.get(`/medical-records/${id}`).then(r => r.data.data)

export const getPatientRecords = (patientId, params = {}) =>
  client.get(`/patients/${patientId}/medical-records`, { params }).then(r => ({
    data: r.data.data,
    pagination: r.data.pagination,
  }))

export const createRecord = (body) =>
  client.post('/medical-records', body).then(r => r.data.data)

export const updateRecord = (id, body) =>
  client.patch(`/medical-records/${id}`, body).then(r => r.data.data)
