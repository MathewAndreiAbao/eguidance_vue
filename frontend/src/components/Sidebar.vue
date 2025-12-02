<template>
  <div class="sidebar">
    <div class="sidebar-header">
      <h2 class="logo">eGuidance</h2>
    </div>
    
    <nav class="sidebar-nav">
      <ul class="nav-list">
        <li class="nav-item" v-for="item in menuItems" :key="item.name">
          <router-link 
            :to="item.path" 
            class="nav-link"
            :class="{ active: isActive(item.path) }"
            v-if="item.visible"
          >
            <i :class="item.icon"></i>
            <span class="nav-text">{{ item.name }}</span>
          </router-link>
        </li>
      </ul>
    </nav>
    
    <div class="sidebar-footer">
      <button class="logout-btn" @click="logout">
        <i class="fas fa-sign-out-alt"></i>
        <span class="nav-text">Logout</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '../store/userStore'

const route = useRoute()
const router = useRouter()
const store = useUserStore()

const user = computed(() => store.user)

const menuItems = computed(() => [
  {
    name: 'Dashboard',
    path: '/dashboard',
    icon: 'fas fa-home',
    visible: true
  },
  {
    name: 'Appointments',
    path: '/appointments',
    icon: 'fas fa-calendar-check',
    visible: true
  },
  {
    name: 'Resources',
    path: '/resources',
    icon: 'fas fa-book',
    visible: true
  },

  {
    name: 'Feedback',
    path: '/feedback',
    icon: 'fas fa-comment',
    visible: true
  },
  {
    name: 'Wellness Forms',
    path: '/wellness-forms',
    icon: 'fas fa-heartbeat',
    visible: true
  },
  {
    name: 'Announcements',
    path: '/announcements',
    icon: 'fas fa-bullhorn',
    visible: true
  },

  {
    name: 'Reports & Analytics',
    path: '/reports',
    icon: 'fas fa-chart-bar',
    visible: user.value?.role === 'counselor'
  },
  {
    name: 'Profile',
    path: '/profile',
    icon: 'fas fa-user',
    visible: true
  }
])

function isActive(path) {
  return route.path === path
}

function logout() {
  store.logout()
  router.push('/login')
}
</script>

<style scoped>
.sidebar {
  width: 260px;
  height: 100vh;
  background: linear-gradient(160deg, var(--eg-primary) 0%, var(--eg-primary-dark) 100%);
  color: white;
  position: fixed;
  top: 0;
  left: 0;
  z-index: var(--eg-z-fixed);
  display: flex;
  flex-direction: column;
  box-shadow: var(--eg-shadow-lg);
  transition: all var(--eg-transition);
  border-right: 1px solid rgba(255, 255, 255, 0.15);
  overflow: hidden;
}

.sidebar-header {
  padding: var(--eg-space-6) var(--eg-space-5);
  border-bottom: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(0, 0, 0, 0.05);
  text-align: center;
}

.logo {
  color: white;
  font-size: var(--eg-font-size-3xl);
  font-weight: var(--eg-font-weight-extrabold);
  margin: 0;
  text-align: center;
  letter-spacing: -0.5px;
  transition: all var(--eg-transition);
}

.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  padding: var(--eg-space-6) 0;
}

.nav-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.nav-item {
  margin-bottom: var(--eg-space-1);
}

.nav-link {
  display: flex;
  align-items: center;
  padding: var(--eg-space-3) var(--eg-space-5);
  color: rgba(255, 255, 255, 0.9);
  text-decoration: none;
  font-size: var(--eg-font-size-sm);
  font-weight: var(--eg-font-weight-medium);
  transition: all var(--eg-transition);
  border-left: 3px solid transparent;
  margin: 0 var(--eg-space-2);
  border-radius: var(--eg-radius-md);
  transition: all var(--eg-transition);
}

.nav-link:hover {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  transform: translateX(4px);
  box-shadow: var(--eg-shadow-sm);
}

.nav-link.active {
  background: rgba(255, 255, 255, 0.3);
  color: white;
  border-left: 3px solid white;
  font-weight: var(--eg-font-weight-semibold);
  box-shadow: var(--eg-shadow);
}

.nav-link i {
  font-size: var(--eg-font-size-lg);
  margin-right: var(--eg-space-4);
  width: 22px;
  text-align: center;
  opacity: 0.9;
}

.nav-text {
  transition: opacity 0.3s ease;
}

.sidebar-footer {
  padding: var(--eg-space-5);
  border-top: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(0, 0, 0, 0.05);
}

.logout-btn {
  width: 100%;
  background: rgba(0, 0, 0, 0.15);
  border: none;
  color: rgba(255, 255, 255, 0.95);
  padding: var(--eg-space-3);
  border-radius: var(--eg-radius-md);
  cursor: pointer;
  display: flex;
  align-items: center;
  font-size: var(--eg-font-size-sm);
  font-weight: var(--eg-font-weight-medium);
  transition: all var(--eg-transition);
}

.logout-btn:hover {
  background: rgba(0, 0, 0, 0.25);
  color: white;
  transform: translateY(-2px);
  box-shadow: var(--eg-shadow);
}

.logout-btn i {
  font-size: var(--eg-font-size-lg);
  margin-right: var(--eg-space-3);
  width: 24px;
  text-align: center;
}
</style>