<template>
  <div class="row" style="margin-top: 3rem;">
    <div class="col-md-6 offset-md-3">
      <AuthForm mode="register" />
    </div>
  </div>
</template>

<script setup>
import AuthForm from '../components/AuthForm.vue'
</script>

<style scoped>
.row{margin-top:3rem}
</style>
