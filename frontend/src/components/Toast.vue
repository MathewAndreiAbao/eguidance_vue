<template>
  <div class="eg-toast" v-if="visible" :class="type">
    <div class="eg-toast-inner">
      <strong>{{ title }}</strong>
      <div class="eg-toast-message">{{ message }}</div>
    </div>
    <button class="eg-toast-close" @click="hide">×</button>
  </div>
</template>

<script setup>
import { ref } from 'vue';
const props = defineProps({ title: { type: String, default: 'Notice' }, message: { type: String, default: '' }, type: { type: String, default: 'info' }, duration: { type: Number, default: 4000 } });
const visible = ref(true);
const hide = () => { visible.value = false; };
setTimeout(() => hide(), props.duration);
defineEmits(['close']);
</script>

<style scoped>
.eg-toast { 
  position: fixed; 
  right: 18px; 
  top: 18px; 
  min-width: 280px; 
  border-radius: 12px; 
  box-shadow: 0 6px 15px rgba(143, 188, 143, 0.2); 
  padding: 16px 18px; 
  display: flex; 
  align-items: center; 
  gap: 14px; 
  z-index: 1100; 
  border: 2px solid #8FBC8F;
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.95);
}
.eg-toast.info { 
  background: rgba(255, 255, 255, 0.95); 
  color: #8FBC8F; 
  border-left: 4px solid #8FBC8F; 
}
.eg-toast.error { 
  background: rgba(255, 255, 255, 0.95); 
  color: #B91C1C; 
  border-left: 4px solid #B91C1C; 
}
.eg-toast.success { 
  background: rgba(255, 255, 255, 0.95); 
  color: #8FBC8F; 
  border-left: 4px solid #16a34a; 
}
.eg-toast-inner { flex: 1; }
.eg-toast-message { font-size: 1rem; margin-top: 2px; }
.eg-toast-close { 
  background: transparent; 
  border: none; 
  font-size: 1.3rem; 
  color: #8FBC8F; 
  cursor: pointer; 
  font-weight: bold;
  padding: 0;
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.3s ease;
}
.eg-toast-close:hover {
  background: #E0FFE0;
  border-radius: 6px;
}
</style>
