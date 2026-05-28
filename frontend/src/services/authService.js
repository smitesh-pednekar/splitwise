import api from './api'

export const register = (data) => api.post('/api/v1/auth/register/', data)
export const login = (data) => api.post('/api/v1/auth/login/', data)
export const getMe = () => api.get('/api/v1/auth/me/')
export const searchUser = (email) => api.get(`/api/v1/users/search/?email=${encodeURIComponent(email)}`)
