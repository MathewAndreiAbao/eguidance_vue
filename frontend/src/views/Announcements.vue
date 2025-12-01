<template>
  <div class="container py-4">
    <h2 style="color: #8FBC8F; font-weight: 600;">Announcements</h2>

    <div v-if="user && user.role === 'counselor'" class="card mb-4" style="border-radius: 16px; box-shadow: 0 6px 15px rgba(143, 188, 143, 0.1); border: 2px solid #8FBC8F;">
      <div class="card-body">
        <h5 class="card-title" style="color: #8FBC8F; font-weight: 600;">Create Announcement</h5>
        <form @submit.prevent="createAnnounce">
          <div class="mb-4">
            <input v-model="form.title" class="form-control" placeholder="Title" required style="border-radius: 10px; padding: 0.9rem; border: 2px solid #D1D5DB;" />
          </div>
          <div class="mb-4">
            <textarea v-model="form.content" class="form-control" rows="4" placeholder="Content" required style="border-radius: 10px; padding: 0.9rem; border: 2px solid #D1D5DB;"></textarea>
          </div>
          <button class="btn btn-primary" style="border-radius: 10px; padding: 0.85rem 1.6rem;">Publish</button>
        </form>
      </div>
    </div>

    <div class="row">
      <div v-for="a in announcements" :key="a.id" class="col-md-6 mb-4">
        <div class="card" style="border-radius: 12px; box-shadow: 0 4px 10px rgba(143, 188, 143, 0.1); border: 1px solid #D1D5DB; transition: all 0.3s ease;">
          <div class="card-body">
            <h5 class="card-title" style="color: #8FBC8F;">{{ a.title }}</h5>
            <h6 class="card-subtitle mb-2 text-muted" style="color: #6B7280;">By {{ a.author_name }} • {{ new Date(a.created_at).toLocaleString() }}</h6>
            <p class="card-text" style="color: #374151;">{{ a.content }}</p>
            <div v-if="user && user.role === 'counselor' && a.created_by === user.id" class="mt-3">
              <button class="btn btn-sm btn-outline-primary me-2" @click="editAnnouncement(a)" style="border-radius: 6px;">Edit</button>
              <button class="btn btn-sm btn-outline-danger" @click="deleteAnnouncement(a.id)" style="border-radius: 6px;">Delete</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import api from '../utils/api'
import { useUserStore } from '../store/userStore'

const userStore = useUserStore()
const user = userStore.user

const form = reactive({ title: '', content: '' })
const announcements = ref([])

async function load() {
  try {
    const res = await api.get('/announcements')
    announcements.value = res.data
  } catch (err) {
    console.error(err)
  }
}

async function createAnnounce() {
  try {
    await api.post('/announcements', { title: form.title, content: form.content })
    form.title = ''
    form.content = ''
    await load()
  } catch (err) {
    console.error(err)
    alert(err.response?.data?.message || 'Error')
  }
}

function editAnnouncement(a) {
  const newTitle = prompt('Title', a.title)
  if (newTitle === null) return
  const newContent = prompt('Content', a.content)
  if (newContent === null) return
  api.put(`/announcements/${a.id}`, { title: newTitle, content: newContent }).then(load).catch(e => { console.error(e); alert('Error') })
}

async function deleteAnnouncement(id) {
  if (!confirm('Delete announcement?')) return
  try {
    await api.delete(`/announcements/${id}`)
    await load()
  } catch (err) {
    console.error(err)
    alert('Error')
  }
}

onMounted(load)
</script>

<style scoped>
.card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 15px rgba(143, 188, 143, 0.15);
}
</style>
