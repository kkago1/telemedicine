import client from './client'

export const getStats = () =>
  client.get('/admin/stats').then(r => r.data.data)

export const getPractitioners = (params = {}) =>
  client.get('/admin/practitioners', { params }).then(r => ({
    data: r.data.data,
    pagination: r.data.pagination,
  }))

export const approvePractitioner = (id) =>
  client.post(`/admin/practitioners/${id}/approve`).then(r => r.data.data)

export const rejectPractitioner = (id) =>
  client.post(`/admin/practitioners/${id}/reject`).then(r => r.data.data)

export const getUsers = (params = {}) =>
  client.get('/admin/users', { params }).then(r => ({
    data: r.data.data,
    pagination: r.data.pagination,
  }))

export const activateUser = (id) =>
  client.post(`/admin/users/${id}/activate`).then(r => r.data.data)

export const deactivateUser = (id) =>
  client.post(`/admin/users/${id}/deactivate`).then(r => r.data.data)
