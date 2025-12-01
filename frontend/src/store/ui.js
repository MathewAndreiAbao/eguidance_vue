import { defineStore } from 'pinia';

export const useUIStore = defineStore('ui', {
  state: () => ({
    toast: { title: '', message: '', type: 'info' },
    toastKey: 0
  }),
  actions: {
    showToast(title, message, type = 'info') {
      this.toast = { title, message, type };
      this.toastKey = Date.now();
    }
  }
});
