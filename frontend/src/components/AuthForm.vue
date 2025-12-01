<template>
  <div class="card form-card">
    <h3 class="card-title">{{ title }}</h3>

    <!-- Step 1: Email/Password Login -->
    <form v-if="mode === 'login' && !showOTPScreen" @submit.prevent="handlePasswordSubmit">
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
          {{ loading ? 'Processing...' : 'Continue' }}
        </button>
        <router-link class="btn btn-secondary" to="/register">Register</router-link>
      </div>
    </form>

    <!-- Step 2: OTP Verification Screen -->
    <form v-else-if="mode === 'login' && showOTPScreen" @submit.prevent="handleOTPVerification">
      <div class="otp-header">
        <div class="icon-circle">
          <i class="fas fa-envelope"></i>
        </div>
        <h4>Verify Your Identity</h4>
        <p class="otp-instruction">We've sent a 6-digit OTP to</p>
        <p class="email-display">{{ form.email }}</p>
      </div>

      <!-- OTP Input Fields -->
      <div class="form-row">
        <label>Enter OTP Code</label>
        <div class="otp-input-group">
          <input 
            v-for="(digit, index) in otpDigits" 
            :key="index"
            :ref="el => otpInputs[index] = el"
            v-model="otpDigits[index]" 
            type="text" 
            maxlength="1"
            class="otp-digit-input"
            @input="handleOTPInput(index, $event)"
            @keydown="handleOTPKeydown(index, $event)"
            @paste="handleOTPPaste($event)"
            pattern="[0-9]"
            inputmode="numeric"
            autocomplete="off"
          />
        </div>
      </div>

      <!-- Timer and Resend -->
      <div class="otp-timer-section">
        <div v-if="canResend" class="resend-available">
          <button type="button" class="link-button" @click="resendOTP" :disabled="loading">
            <i class="fas fa-redo"></i> Resend OTP
          </button>
        </div>
        <div v-else class="timer-display">
          <i class="fas fa-clock"></i>
          Resend OTP in {{ formatTime(countdown) }}
        </div>
      </div>

      <div v-if="error" class="error-message">{{ error }}</div>
      <div v-if="successMessage" class="success-message">{{ successMessage }}</div>

      <div class="form-actions">
        <button class="btn btn-secondary" type="button" @click="goBackToLogin">
          <i class="fas fa-arrow-left"></i> Back
        </button>
        <button class="btn btn-primary" type="submit" :disabled="loading || !isOTPComplete">
          {{ loading ? 'Verifying...' : 'Verify OTP' }}
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
import { reactive, ref, computed, onUnmounted } from 'vue'
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

const form = reactive({ name: '', email: '', password: '', role: 'student' })
const error = ref(null)
const successMessage = ref(null)
const loading = ref(false)
const showOTPScreen = ref(false)
const otpDigits = ref(['', '', '', '', '', ''])
const otpInputs = ref([])
const countdown = ref(120) // 2 minutes countdown
const canResend = ref(false)
let countdownInterval = null

const router = useRouter()
const store = useUserStore()

// Computed property to check if all OTP digits are filled
const isOTPComplete = computed(() => {
  return otpDigits.value.every(digit => digit !== '' && /^[0-9]$/.test(digit))
})

// Format countdown time as MM:SS
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// Start countdown timer
function startCountdown() {
  countdown.value = 120
  canResend.value = false
  
  if (countdownInterval) {
    clearInterval(countdownInterval)
  }
  
  countdownInterval = setInterval(() => {
    countdown.value--
    
    if (countdown.value <= 0) {
      clearInterval(countdownInterval)
      canResend.value = true
    }
  }, 1000)
}

// Handle password submission (Step 1) - Send OTP immediately
async function handlePasswordSubmit() {
  error.value = null
  successMessage.value = null
  loading.value = true

  try {
    // Request OTP (validates credentials and sends OTP)
    const response = await api.post('/auth/request-otp', {
      email: form.email,
      password: form.password
    })
    
    successMessage.value = response.data.message
    showOTPScreen.value = true
    startCountdown()
    
    // Focus on first OTP input
    setTimeout(() => {
      if (otpInputs.value[0]) {
        otpInputs.value[0].focus()
      }
    }, 100)
  } catch (err) {
    error.value = err?.response?.data?.message || 'Invalid email or password'
  } finally {
    loading.value = false
  }
}

// Resend OTP
async function resendOTP() {
  error.value = null
  successMessage.value = null
  loading.value = true
  
  // Clear OTP inputs
  otpDigits.value = ['', '', '', '', '', '']
  
  try {
    const response = await api.post('/auth/request-otp', {
      email: form.email,
      password: form.password
    })
    successMessage.value = 'OTP resent successfully!'
    startCountdown()
    
    // Focus on first OTP input
    setTimeout(() => {
      if (otpInputs.value[0]) {
        otpInputs.value[0].focus()
      }
    }, 100)
  } catch (err) {
    error.value = err?.response?.data?.message || 'Failed to resend OTP'
  } finally {
    loading.value = false
  }
}

// Handle OTP input
function handleOTPInput(index, event) {
  const value = event.target.value
  
  // Only allow digits
  if (value && !/^[0-9]$/.test(value)) {
    otpDigits.value[index] = ''
    return
  }
  
  // Move to next input if digit is entered
  if (value && index < 5) {
    otpInputs.value[index + 1]?.focus()
  }
}

// Handle OTP keydown (backspace)
function handleOTPKeydown(index, event) {
  if (event.key === 'Backspace' && !otpDigits.value[index] && index > 0) {
    otpInputs.value[index - 1]?.focus()
  }
}

// Handle OTP paste
function handleOTPPaste(event) {
  event.preventDefault()
  const pastedData = event.clipboardData.getData('text').trim()
  
  // Check if pasted data is 6 digits
  if (/^[0-9]{6}$/.test(pastedData)) {
    const digits = pastedData.split('')
    otpDigits.value = digits
    
    // Focus on last input
    otpInputs.value[5]?.focus()
  }
}

// Handle OTP verification (Step 2)
async function handleOTPVerification() {
  error.value = null
  successMessage.value = null
  loading.value = true

  try {
    const otpCode = otpDigits.value.join('')
    
    const response = await api.post('/auth/verify-otp', {
      email: form.email,
      otp: otpCode
    })
    
    const { token, user } = response.data
    store.setToken(token)
    store.setUser(user)
    
    // Clear countdown
    if (countdownInterval) {
      clearInterval(countdownInterval)
    }
    
    router.push('/dashboard')
  } catch (err) {
    error.value = err?.response?.data?.message || 'Invalid or expired OTP'
    // Clear OTP inputs on error
    otpDigits.value = ['', '', '', '', '', '']
    otpInputs.value[0]?.focus()
  } finally {
    loading.value = false
  }
}

// Go back to login screen
function goBackToLogin() {
  showOTPScreen.value = false
  otpDigits.value = ['', '', '', '', '', '']
  error.value = null
  successMessage.value = null
  
  if (countdownInterval) {
    clearInterval(countdownInterval)
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

// Cleanup on unmount
onUnmounted(() => {
  if (countdownInterval) {
    clearInterval(countdownInterval)
  }
})
</script>

<style scoped>
.form-card {
  max-width: 450px;
  margin: 0 auto;
  padding: 2.5rem;
  background: rgba(255, 255, 255, 0.95);
  border-radius: var(--eg-radius-2xl);
  box-shadow: 0 8px 20px rgba(143, 188, 143, 0.1);
  border: 1px solid rgba(229, 231, 235, 0.8);
  /* Removed backdrop-filter for HD clarity */
}

.card-title {
  font-size: 1.8rem;
  font-weight: 700;
  color: #2D5D2C;
  margin-bottom: 1.8rem;
  text-align: center;
  letter-spacing: -0.3px;
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
  padding: 0.9rem 1.2rem;
  border-radius: var(--eg-radius-lg);
  border: 1px solid rgba(209, 213, 219, 0.8);
  font-size: 1rem;
  transition: all 0.2s ease;
  background: rgba(255, 255, 255, 0.95);
}

.form-row input:focus,
.form-row select:focus {
  outline: none;
  border-color: #8FBC8F;
  box-shadow: 0 0 0 2px rgba(143, 188, 143, 0.25);
  background: white;
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
}

.btn {
  flex: 1;
  padding: 0.9rem 1.2rem;
  border-radius: 10px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
  text-decoration: none;
  border: none;
}

.btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-primary {
  background: #8FBC8F;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #7aa97a;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(143, 188, 143, 0.25);
}

.btn-secondary {
  background: rgba(243, 244, 246, 0.8);
  color: #374151;
  border: 1px solid rgba(209, 213, 219, 0.8);
}

.btn-secondary:hover {
  background: #E5E7EB;
  transform: translateY(-2px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

.error-message {
  color: #EF4444;
  background: rgba(254, 242, 242, 0.95);
  padding: 0.85rem;
  border-radius: var(--eg-radius-lg);
  margin-bottom: 1.2rem;
  border: 1px solid rgba(254, 202, 202, 0.8);
  /* Removed backdrop-filter for HD clarity */
}

.success-message {
  color: #10B981;
  background: rgba(236, 253, 245, 0.95);
  padding: 0.85rem;
  border-radius: var(--eg-radius-lg);
  margin-bottom: 1.2rem;
  border: 1px solid rgba(167, 243, 208, 0.8);
  /* Removed backdrop-filter for HD clarity */
}

.form-help {
  color: #6B7280;
  font-size: 0.875rem;
  margin-top: 0.4rem;
  display: block;
}

.login-options {
  text-align: center;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(229, 231, 235, 0.6);
}

.link-button {
  background: none;
  border: none;
  color: #8FBC8F;
  font-size: 0.95rem;
  cursor: pointer;
  text-decoration: underline;
  transition: color 0.2s ease;
  padding: 0.5rem;
}

.link-button:hover {
  color: #7aa97a;
}

/* OTP Verification Screen Styles */
.otp-header {
  text-align: center;
  margin-bottom: 2rem;
}

.icon-circle {
  width: 80px;
  height: 80px;
  margin: 0 auto 1.5rem;
  background: linear-gradient(135deg, #8FBC8F 0%, #7aa97a 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 15px rgba(143, 188, 143, 0.3);
}

.icon-circle i {
  font-size: 2.5rem;
  color: white;
}

.otp-header h4 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #2D5D2C;
  margin-bottom: 0.5rem;
}

.otp-instruction {
  font-size: 0.95rem;
  color: #6B7280;
  margin: 0.5rem 0 0.3rem;
}

.email-display {
  font-size: 1rem;
  font-weight: 600;
  color: #8FBC8F;
  margin: 0;
}

.otp-input-group {
  display: flex;
  justify-content: center;
  gap: 0.8rem;
  margin-top: 1rem;
}

.otp-digit-input {
  width: 50px;
  height: 60px;
  text-align: center;
  font-size: 1.8rem;
  font-weight: 700;
  border: 2px solid rgba(209, 213, 219, 0.8);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.9);
  color: #2D5D2C;
  transition: all 0.2s ease;
  padding: 0;
}

.otp-digit-input:focus {
  outline: none;
  border-color: #8FBC8F;
  box-shadow: 0 0 0 3px rgba(143, 188, 143, 0.2);
  background: white;
  transform: scale(1.05);
}

.otp-digit-input:not(:placeholder-shown) {
  border-color: #8FBC8F;
  background: rgba(240, 253, 244, 0.5);
}

.otp-timer-section {
  text-align: center;
  margin: 1.5rem 0 1rem;
  min-height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.timer-display {
  color: #6B7280;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
}

.timer-display i {
  color: #8FBC8F;
}

.resend-available {
  display: flex;
  align-items: center;
  justify-content: center;
}

.resend-available .link-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
}

.resend-available .link-button i {
  font-size: 0.85rem;
}

/* Responsive Design */
@media (max-width: 640px) {
  .form-card {
    padding: 2rem 1.5rem;
    max-width: 100%;
  }
  
  .otp-digit-input {
    width: 45px;
    height: 55px;
    font-size: 1.5rem;
  }
  
  .otp-input-group {
    gap: 0.5rem;
  }
  
  .icon-circle {
    width: 70px;
    height: 70px;
  }
  
  .icon-circle i {
    font-size: 2rem;
  }
}
</style>