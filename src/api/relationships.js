import client from './client'

export const getRelationships = (params = {}) =>
  client.get('/relationships', { params }).then(r => ({
    data: r.data.data,
    pagination: r.data.pagination,
  }))

export const getRelationship = (id) =>
  client.get(`/relationships/${id}`).then(r => r.data.data)

export const terminateRelationship = (id) =>
  client.post(`/relationships/${id}/terminate`).then(r => r.data.data)
