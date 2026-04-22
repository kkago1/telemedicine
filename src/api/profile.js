import client from './client'

// Returns { data: [...practitioners], pagination: { page, pageSize, total, totalPages } }
export const getPractitioners = (params = {}) =>
  client.get('/profile/practitioners', { params }).then(r => ({
    data: r.data.data,
    pagination: r.data.pagination,
  }))

// Returns practitioner object
export const getPractitioner = (id) =>
  client.get(`/profile/practitioners/${id}`).then(r => r.data.data)
