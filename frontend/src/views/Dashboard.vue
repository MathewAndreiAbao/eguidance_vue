<template>
  <div class="card p-4" style="border-radius: 16px; box-shadow: 0 6px 15px rgba(143, 188, 143, 0.1); border: 2px solid #8FBC8F;">
    <h3 style="color: #8FBC8F; font-weight: 600;">Dashboard</h3>
    <p v-if="user" style="color: #374151;">Welcome back, <strong>{{ user.name }}</strong> — you are signed in as <em>{{ user.role }}</em>.</p>
    <div v-else>
      <p style="color: #374151;">Please log in to view your dashboard.</p>
    </div>
    <div v-if="user" class="mt-4">
      <div class="row">
        <div class="col-md-4 mb-3">
          <div class="card p-3" style="border-radius: 12px; border: 1px solid #D1D5DB; background: #ffffff; transition: all 0.3s ease;">
            <h5 style="color: #8FBC8F;">Appointments</h5>
            <p class="mb-2" style="color: #6B7280;">Book or manage your counseling appointments.</p>
            <button class="btn btn-primary btn-sm" @click="go('/appointments')" style="border-radius: 8px;">Open</button>
          </div>
        </div>
        <div class="col-md-4 mb-3">
          <div class="card p-3" style="border-radius: 12px; border: 1px solid #D1D5DB; background: #ffffff; transition: all 0.3s ease;">
            <h5 style="color: #8FBC8F;">Announcements</h5>
            <p class="mb-2" style="color: #6B7280;">Read the latest announcements.</p>
            <button class="btn btn-primary btn-sm" @click="go('/announcements')" style="border-radius: 8px;">Open</button>
          </div>
        </div>
        <div class="col-md-4 mb-3">
          <div class="card p-3" style="border-radius: 12px; border: 1px solid #D1D5DB; background: #ffffff; transition: all 0.3s ease;">
            <h5 style="color: #8FBC8F;">Resources</h5>
            <p class="mb-2" style="color: #6B7280;">Access counseling resources and files.</p>
            <button class="btn btn-primary btn-sm" @click="go('/resources')" style="border-radius: 8px;">Open</button>
          </div>
        </div>
        <div v-if="user && user.role === 'counselor'" class="col-md-4 mb-3">
          <div class="card p-3" style="border-radius: 12px; border: 1px solid #D1D5DB; background: #ffffff; transition: all 0.3s ease;">
            <h5 style="color: #8FBC8F;">Reports</h5>
            <p class="mb-2" style="color: #6B7280;">View weekly and monthly student usage statistics.</p>
            <button class="btn btn-primary btn-sm" @click="go('/reports')" style="border-radius: 8px;">Open</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../store/userStore'

const router = useRouter()
const store = useUserStore()
const user = computed(() => store.user)

function go(path) {
  router.push(path)
}
</script>

<style scoped>
.card{max-width:720px;margin:1rem auto}
.card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 20px rgba(143, 188, 143, 0.15);
}
</style>
