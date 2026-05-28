import api from './api'

export const getExpenses = (groupId) => api.get(`/api/v1/groups/${groupId}/expenses/`)
export const createExpense = (groupId, data) => api.post(`/api/v1/groups/${groupId}/expenses/`, data)
export const updateExpense = (groupId, expenseId, data) => api.put(`/api/v1/groups/${groupId}/expenses/${expenseId}/`, data)
export const deleteExpense = (groupId, expenseId) => api.delete(`/api/v1/groups/${groupId}/expenses/${expenseId}/`)
