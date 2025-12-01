<template>
  <div class="card form-card">
    <h3 class="card-title">{{ title }}</h3>

    <!-- Login Mode with Email/Password -->
    <form v-if="mode === 'login' && !otpSent" @submit.prevent="handleLogin">
      <div class="form-row">
        <label>Email</label>
        <input 
          v-model="form.email" 
          type="email" 
          required 
          placeholder="Enter your email"
        />
      </div>

      <div class="form-row">
        <label>Password</label>
        <input 
          v-model="form.password" 
          type="password" 
          required 
          placeholder="Enter your password"
          minlength="6"
        />
      </div>

      <div v-if="error" class="error-message">{{ error }}</div>

      <div class="form-actions">
        <button class="btn btn-primary" type="submit" :disabled="loading">
          {{ loading ? 'Processing...' : 'Login' }}
        </button>
        <router-link class="btn btn-secondary" to="/register">Register</router-link>
      </div>
    </form>

    <!-- OTP Verification Mode -->
    <form v-else-if="mode === 'login' && otpSent" @submit.prevent="handleOTP">
      <div class="form-row">
        <label>Enter OTP sent to {{ form.email }}</label>
        <input 
          v-model="form.otp" 
          type="text" 
          required 
          placeholder="Enter 6-digit code"
          maxlength="6"
        />
      </div>

      <div v-if="error" class="error-message">{{ error }}</div>
      <div v-if="success" class="success-message">{{ success }}</div>

      <div class="form-actions">
        <button class="btn btn-primary" type="submit" :disabled="loading">
          {{ loading ? 'Verifying...' : 'Verify OTP' }}
        </button>
        <button class="btn btn-secondary" type="button" @click="resendOTP" :disabled="loading">
          Resend OTP
        </button>
      </div>
    </form>

    <!-- Register Mode -->
    <form v-else @submit.prevent="onSubmit">
      <div class="form-row" v-if="showName">
        <label>Name</label>
        <input v-model="form.name" type="text" required />
      </div>

      <div class="form-row">
        <label>Email</label>
        <input v-model="form.email" type="email" required />
      </div>

      <div class="form-row">
        <label>Password</label>
        <input v-model="form.password" type="password" required minlength="6" />
      </div>

      <div class="form-row" v-if="showRole">
        <label>Role</label>
        <select v-model="form.role" required>
          <option value="student">Student</option>
          <option value="counselor">Counselor</option>
        </select>
      </div>

      <div v-if="error" class="error-message">{{ error }}</div>

      <div class="form-actions">
        <button class="btn btn-primary" type="submit">{{ submitLabel }}</button>
        <router-link class="btn btn-secondary" to="/login">Login</router-link>
      </div>
    </form>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../store/userStore'
import api from '../utils/api'

const props = defineProps({
  mode: { type: String, default: 'login' } // 'login' or 'register'
})

const title = props.mode === 'login' ? 'Welcome back' : 'Create an account'
const submitLabel = props.mode === 'login' ? 'Login' : 'Register'
const showName = props.mode === 'register'
const showRole = props.mode === 'register'

const form = reactive({ name: '', email: '', password: '', role: 'student', otp: '' })
const error = ref(null)
const success = ref(null)
const loading = ref(false)
const otpSent = ref(false)

const router = useRouter()
const store = useUserStore()

// Handle email/password login - triggers OTP
async function handleLogin() {
  error.value = null
  loading.value = true

  try {
    const response = await api.post('/auth/login', {
      email: form.email,
      password: form.password
    })
    
    // OTP sent successfully
    otpSent.value = true
    success.value = response.data.message
  } catch (err) {
    error.value = err?.response?.data?.message || 'An error occurred'
  } finally {
    loading.value = false
  }
}

// Handle OTP verification
async function handleOTP() {
  error.value = null
  success.value = null
  loading.value = true

  try {
    const response = await api.post('/auth/verify-otp', {
      email: form.email,
      otp: form.otp
    })
    
    // OTP verified successfully, log in user
    const { token, user } = response.data
    store.setToken(token)
    store.setUser(user)
    router.push('/dashboard')
  } catch (err) {
    error.value = err?.response?.data?.message || 'An error occurred'
  } finally {
    loading.value = false
  }
}

// Resend OTP
async function resendOTP() {
  error.value = null
  success.value = null
  loading.value = true

  try {
    const response = await api.post('/auth/request-otp', {
      email: form.email
    })
    
    success.value = response.data.message
  } catch (err) {
    error.value = err?.response?.data?.message || 'An error occurred'
  } finally {
    loading.value = false
  }
}

// Handle registration
async function onSubmit(){
  error.value = null
  try{
    await store.register({ name: form.name, email: form.email, password: form.password, role: form.role })
    // Redirect to login page after successful registration
    router.push('/login')
  } catch (err){
    error.value = err?.response?.data?.message || 'An error occurred'
  }
}
</script>

<style scoped>
.form-card {
  max-width: 450px;
  margin: 2rem auto;
  padding: 2.5rem;
  background: #ffffff;
  border: 2px solid #8FBC8F;
  border-radius: 16px;
  box-shadow: 0 8px 20px rgba(143, 188, 143, 0.15);
}

.card-title {
  font-size: 1.7rem;
  font-weight: 600;
  color: #8FBC8F;
  margin-bottom: 1.5rem;
  text-align: center;
}

.form-row {
  display: flex;
  flex-direction: column;
  margin-bottom: 1.2rem;
}

.form-row label {
  font-size: 1rem;
  color: #374151;
  margin-bottom: 0.6rem;
  font-weight: 500;
}

.form-row input,
.form-row select {
  padding: 0.9rem;
  border-radius: 10px;
  border: 2px solid #D1D5DB;
  font-size: 1rem;
  background: #ffffff;
  color: #374151;
  transition: all 0.3s ease;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.05);
}

.form-row input:focus,
.form-row select:focus {
  outline: none;
  border-color: #8FBC8F;
  box-shadow: 0 0 0 3px rgba(143, 188, 143, 0.25);
}

.form-row input:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
  opacity: 0.7;
}

.form-actions {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  margin-top: 1.5rem;
}

.btn {
  flex: 1;
  padding: 0.85rem 1.6rem;
  border-radius: 10px;
  border: 2px solid #8FBC8F;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
  display: inline-block;
  text-align: center;
  box-shadow: 0 2px 5px rgba(143, 188, 143, 0.1);
}

.btn-primary {
  background: #8FBC8F;
  color: #ffffff;
}

.btn-primary:hover:not(:disabled) {
  background: #7AAE7A;
  border-color: #7AAE7A;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(143, 188, 143, 0.2);
}

.btn-secondary {
  background: #ffffff;
  color: #8FBC8F;
  border-color: #8FBC8F;
}

.btn-secondary:hover {
  background: #E0FFE0;
  transform: translateY(-2px);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error-message {
  color: #B91C1C;
  background: #FEF2F2;
  border: 2px solid #FECACA;
  padding: 1rem;
  border-radius: 10px;
  margin-top: 1rem;
  font-size: 0.95rem;
  text-align: center;
  box-shadow: 0 2px 8px rgba(185, 28, 28, 0.1);
}

.success-message {
  color: #8FBC8F;
  background: #F0FFF0;
  border: 2px solid #98FB98;
  padding: 1rem;
  border-radius: 10px;
  margin-top: 1rem;
  font-size: 0.95rem;
  text-align: center;
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(143, 188, 143, 0.1);
}
</style>