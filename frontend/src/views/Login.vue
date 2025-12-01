<template>
  <div class="auth-container">
    <div class="auth-form-wrapper">
      <AuthForm mode="login" />
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
  background-image: url('https://th.bing.com/th/id/R.eff3b2516e16a1f20fc7f65fadfacaa9?rik=7gg%2f2GevnoVAqg&riu=http%3a%2f%2fminsu.edu.ph%2fslider%2fslides_1.jpg&ehk=dCB6q4P5Y6o9POR8nIlz4EYkhl0CCcNXDgBQMk%2fkBdk%3d&risl=&pid=ImgRaw&r=0');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-attachment: fixed;

  /* Optional overlay para visible pa rin ang form */
  position: relative;
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
