import { defineStore } from 'pinia'
import api from '../utils/api'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('token') || null,
    user: JSON.parse(localStorage.getItem('user') || 'null') || null
  }),
  actions: {
    setToken(token) {
      this.token = token
      localStorage.setItem('token', token)
    },
    setUser(user) {
      this.user = user
      localStorage.setItem('user', JSON.stringify(user))
    },
    setSession(token, user) {
      this.token = token
      this.user = user
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
    },
    clearSession() {
      this.token = null
      this.user = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    },
    async register(payload) {
      const res = await api.post('/auth/register', payload)
      return res.data
    },
    logout() {
      this.clearSession()
    },
    async fetchProfile() {
      const res = await api.get('/profile')
      return res.data
    },
    async updateProfile(payload) {
      const res = await api.put('/profile', payload)
      // update stored user
      this.user = res.data
      localStorage.setItem('user', JSON.stringify(this.user))
      return res.data
    }
  }
})