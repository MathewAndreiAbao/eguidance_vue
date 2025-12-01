<template>
  <div class="card p-4" style="border-radius: 16px; box-shadow: 0 6px 15px rgba(143, 188, 143, 0.1); border: 2px solid #8FBC8F;">
    <h3 style="color: #8FBC8F; font-weight: 600;">Profile</h3>

    <div v-if="loading" style="color: #374151;">Loading...</div>

    <form v-else @submit.prevent="onSave">
      <div class="mb-4">
        <label class="form-label" style="color: #374151; font-weight: 500;">Name</label>
        <input v-model="form.name" class="form-control" required style="border-radius: 10px; padding: 0.9rem; border: 2px solid #D1D5DB;" />
      </div>
      <div class="mb-4">
        <label class="form-label" style="color: #374151; font-weight: 500;">Email</label>
        <input v-model="form.email" type="email" class="form-control" required style="border-radius: 10px; padding: 0.9rem; border: 2px solid #D1D5DB;" />
      </div>
      <div class="mb-4">
        <label class="form-label" style="color: #374151; font-weight: 500;">New Password (leave blank to keep)</label>
        <input v-model="form.password" type="password" class="form-control" minlength="6" style="border-radius: 10px; padding: 0.9rem; border: 2px solid #D1D5DB;" />
      </div>
      <div class="d-flex gap-3">
        <button class="btn btn-primary" type="submit" style="border-radius: 10px; padding: 0.85rem 1.6rem;">Save</button>
        <button class="btn btn-outline-primary" type="button" @click="onLogout" style="border-radius: 10px; padding: 0.85rem 1.6rem;">Logout</button>
      </div>
      <p v-if="error" style="color: #B91C1C; margin-top: 1rem;">{{ error }}</p>
      <p v-if="success" style="color: #8FBC8F; margin-top: 1rem;">{{ success }}</p>
    </form>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../store/userStore'

const router = useRouter()
const store = useUserStore()

const loading = ref(true)
const error = ref(null)
const success = ref(null)

const form = reactive({ name: '', email: '', password: '' })

onMounted(async () => {
  try {
    const data = await store.fetchProfile()
    form.name = data.name
    form.email = data.email
  } catch (err) {
    error.value = err?.response?.data?.message || 'Unable to load profile'
  } finally {
    loading.value = false
  }
})

async function onSave(){
  error.value = null
  success.value = null
  try{
    const payload = { name: form.name, email: form.email }
    if(form.password) payload.password = form.password
    await store.updateProfile(payload)
    success.value = 'Profile updated'
    form.password = ''
  } catch(err){
    error.value = err?.response?.data?.message || 'Update failed'
  }
}

function onLogout(){
  store.logout()
  router.push('/login')
}
</script>

<style scoped>
.card{max-width:720px;margin:1rem auto}
.card:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 20px rgba(143, 188, 143, 0.15);
}
</style>
