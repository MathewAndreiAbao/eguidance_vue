<script setup>
import { onMounted } from 'vue'
import NavBar from './components/NavBar.vue'
import Toast from './components/Toast.vue'

onMounted(() => {})
</script>

<template>
  <div class="app-root bg-white min-vh-100">
    <NavBar />
    <div class="container py-4">
      <router-view />
    </div>
    <Toast />
  </div>
</template>

<style>
:root{
  --brand:#8FBC8F;
  --muted:#6B7280;
  --primary:#98FB98;
  --text:#374151;
  --bg:#ffffff;
}
body{
  background:#ffffff;
  color:#374151;
}
.app-root{
  color:#374151;
  background:#ffffff;
}
</style>
