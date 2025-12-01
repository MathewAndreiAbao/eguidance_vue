<script setup>
import { onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import Sidebar from './components/Sidebar.vue'
import Toast from './components/Toast.vue'

const route = useRoute()

const showSidebar = computed(() => {
  const authRoutes = ['/login', '/register']
  return !authRoutes.includes(route.path)
})

onMounted(() => {})
</script>

<template>
  <div class="app-layout">
    <Sidebar v-if="showSidebar" />
    <div :class="showSidebar ? 'main-content' : 'auth-content'">
      <router-view />
    </div>
    <Toast />
  </div>
</template>

<style>
:root{
  --brand: #8FBC8F;
  --muted: #6B7280;
  --primary: #98FB98;
  --text: #374151;
  --bg: #ffffff;
  --soft-green-light: #f0fdf4;
  --soft-green-medium: #dcfce7;
  --soft-green-dark: #8FBC8F;
}

body{
  background: linear-gradient(135deg, var(--soft-green-light) 0%, #ffffff 50%, var(--soft-green-light) 100%);
  color: var(--text);
  margin: 0;
  padding: 0;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  background-attachment: fixed;
  min-height: 100vh;
}

.app-layout {
  display: flex;
  min-height: 100vh;
  width: 100%;
}

.main-content {
  flex: 1;
  margin-left: 260px;
  padding: 0;
  min-height: 100vh;
  background: transparent;
}

.auth-content {
  flex: 1;
  padding: 0;
  min-height: 100vh;
  width: 100%;
  background: transparent;
}
</style>
