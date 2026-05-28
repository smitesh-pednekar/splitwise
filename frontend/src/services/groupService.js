import api from './api'

export const getGroups = () => api.get('/api/v1/groups/')
export const createGroup = (data) => api.post('/api/v1/groups/', data)
export const getGroup = (id) => api.get(`/api/v1/groups/${id}/`)
export const deleteGroup = (id) => api.delete(`/api/v1/groups/${id}/`)
export const addMember = (groupId, email) => api.post(`/api/v1/groups/${groupId}/members/`, { email })
export const removeMember = (groupId, userId) => api.delete(`/api/v1/groups/${groupId}/members/${userId}/`)
export const getGroupBalances = (groupId) => api.get(`/api/v1/groups/${groupId}/balances/`)
export const getDashboardBalances = () => api.get('/api/v1/dashboard/balances/')
