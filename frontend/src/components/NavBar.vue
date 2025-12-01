<template>
  <header class="nav">
    <div class="container nav-inner">
      <div class="brand" @click="goHome">eGuidance</div>
      <nav class="actions">
        <div class="nav-links">
          <router-link v-if="isAuthenticated" to="/dashboard" class="nav-link">Dashboard</router-link>
          <router-link v-if="isAuthenticated" to="/appointments" class="nav-link">Appointments</router-link>
          <router-link v-if="isAuthenticated" to="/wellness-forms" class="nav-link">Wellness Forms</router-link>
          <router-link v-if="isAuthenticated" to="/announcements" class="nav-link">Announcements</router-link>
          <router-link v-if="isAuthenticated" to="/resources" class="nav-link">Resources</router-link>
          <router-link v-if="isAuthenticated && store.user?.role === 'counselor'" to="/reports" class="nav-link">Reports</router-link>
        </div>
        <div v-if="isAuthenticated" class="user-area">
          <span class="user">{{ userName }}</span>
          <button class="btn ghost" @click="goProfile">Profile</button>
          <button class="btn danger" @click="logout">Logout</button>
        </div>
      </nav>
    </div>
  </header>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { computed } from 'vue'
import { useUserStore } from '../store/userStore'

const router = useRouter()
const store = useUserStore()

const isAuthenticated = computed(() => !!store.token)
const userName = computed(() => store.user?.name || 'User')

function goLogin() { router.push('/login') }
function goRegister() { router.push('/register') }
function goHome() { router.push('/dashboard') }
function goProfile() { router.push('/profile') }

function logout(){ store.logout(); router.push('/login') }
</script>

<style scoped>
.nav{
  background:#ffffff;
  border-bottom:2px solid #8FBC8F;
  box-shadow: 0 2px 10px rgba(143, 188, 143, 0.1);
}
.nav-inner{
  display:flex;
  align-items:center;
  justify-content:space-between;
  padding:1rem 1.5rem;
}
.brand{
  font-weight:600;
  font-size:1.4rem;
  cursor:pointer;
  color:#8FBC8F;
  transition: all 0.3s ease;
}
.brand:hover {
  color: #7AAE7A;
  transform: scale(1.02);
}
.actions{
  display:flex;
  gap:1rem;
  align-items:center;
  justify-content: flex-end;
  flex: 1;
}
.nav-links {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-right: auto;
}
.nav-link{
  color:#8FBC8F;
  text-decoration:none;
  font-weight:500;
  padding:0.5rem 1rem;
  border-radius:8px;
  transition:all 0.3s ease;
  white-space: nowrap;
}
.nav-link:hover{
  background:#E0FFE0;
  text-decoration:none;
  transform: translateY(-2px);
}
.btn{
  padding:0.6rem 1.2rem;
  border-radius:8px;
  border:2px solid #8FBC8F;
  background:#8FBC8F;
  color:#ffffff;
  cursor:pointer;
  font-weight:500;
  transition:all 0.3s ease;
  box-shadow: 0 2px 5px rgba(143, 188, 143, 0.1);
  white-space: nowrap;
}
.btn:hover{
  background:#7AAE7A;
  border-color:#7AAE7A;
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(143, 188, 143, 0.2);
}
.btn.ghost{
  background:transparent;
  border:2px solid #8FBC8F;
  color:#8FBC8F;
}
.btn.ghost:hover{
  background:#8FBC8F;
  color:#ffffff;
}
.btn.danger{
  background:#FECACA;
  border-color:#FECACA;
  color: #B91C1C;
}
.btn.danger:hover{
  background:#B91C1C;
  border-color:#B91C1C;
  color: #ffffff;
}
.user{
  margin-right:0.75rem;
  font-weight:500;
  color:#8FBC8F;
  white-space: nowrap;
}
.user-area {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
</style>
