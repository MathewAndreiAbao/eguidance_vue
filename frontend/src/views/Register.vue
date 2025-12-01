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

  /* HD Background Image */
  background-image: url('https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1920&q=80');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-attachment: fixed;

  /* Optional overlay para visible pa rin ang form */
  position: relative;
  padding: 20px;
}

.auth-container::before {
  content: "";
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.25); /* Reduced darkness for better visibility */
  /* Removed blur effect for HD clarity */
}

.auth-form-wrapper {
  width: 100%;
  max-width: 450px;
  position: relative; /* para hindi maapektuhan ng overlay */
  z-index: 2;
  /* Added subtle shadow for better form visibility */
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  border-radius: var(--eg-radius-xl);
}
</style>