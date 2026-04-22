import client from './client'

export const login = (body) =>
  client.post('/auth/login', body).then(r => r.data.data)

export const register = (body) =>
  client.post('/auth/register', body).then(r => r.data.data)

export const me = () =>
  client.get('/auth/me').then(r => r.data.data)
