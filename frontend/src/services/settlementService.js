import api from './api'

export const getSettlements = (groupId) => api.get(`/api/v1/groups/${groupId}/settlements/`)
export const createSettlement = (groupId, data) => api.post(`/api/v1/groups/${groupId}/settlements/`, data)
