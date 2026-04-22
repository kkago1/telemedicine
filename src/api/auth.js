import client from './client'

// Returns { user, token } — no data wrapper
export const login = (body) =>
  client.post('/auth/login', body).then(r => r.data)

// Returns { message } — no user data
export const register = (body) =>
  client.post('/auth/register', body).then(r => r.data)

// Returns user object directly (with nested patient/practitioner profile)
export const me = () =>
  client.get('/auth/me').then(r => r.data)
