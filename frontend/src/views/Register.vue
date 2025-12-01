<template>
  <div class="auth-container">
    <div class="auth-form-wrapper">
      <AuthForm mode="register" />
    </div>
  </div>
</template>

<script setup>
import AuthForm from '../components/AuthForm.vue'
</script>

<style scoped>
.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #f0fdf4 0%, #ffffff 50%, #f0fdf4 100%);
  padding: 20px;
}

.auth-form-wrapper {
  width: 100%;
  max-width: 450px;
}
</style>
