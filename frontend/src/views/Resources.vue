<template>
  <div class="container py-4">
    <h2 style="color: #8FBC8F; font-weight: 600;">Resources</h2>

    <div v-if="user && user.role === 'counselor'" class="card mb-4" style="border-radius: 16px; box-shadow: 0 6px 15px rgba(143, 188, 143, 0.1); border: 2px solid #8FBC8F;">
      <div class="card-body">
        <h5 class="card-title" style="color: #8FBC8F; font-weight: 600;">Add Resource</h5>
        <form @submit.prevent="createResource">
          <div class="mb-4">
            <input v-model="form.title" class="form-control" placeholder="Title" required style="border-radius: 10px; padding: 0.9rem; border: 2px solid #D1D5DB;" />
          </div>
          <div class="mb-4">
            <input v-model="form.file_url" class="form-control" placeholder="File URL (pdf, video link, etc)" required style="border-radius: 10px; padding: 0.9rem; border: 2px solid #D1D5DB;" />
          </div>
          <div class="mb-4">
            <textarea v-model="form.description" class="form-control" rows="3" placeholder="Description" style="border-radius: 10px; padding: 0.9rem; border: 2px solid #D1D5DB;"></textarea>
          </div>
          <button class="btn btn-primary" style="border-radius: 10px; padding: 0.85rem 1.6rem;">Add</button>
        </form>
      </div>
    </div>

    <div class="row">
      <div v-for="r in resources" :key="r.id" class="col-md-6 mb-4">
        <div class="card" style="border-radius: 12px; box-shadow: 0 4px 10px rgba(143, 188, 143, 0.1); border: 1px solid #D1D5DB; transition: all 0.3s ease;">
          <div class="card-body">
            <h5 class="card-title" style="color: #8FBC8F;">{{ r.title }}</h5>
            <h6 class="card-subtitle mb-2 text-muted" style="color: #6B7280;">By {{ r.uploader_name }} • {{ new Date(r.created_at).toLocaleString() }}</h6>
            <p class="card-text" style="color: #374151;">{{ r.description }}</p>
            <a :href="r.file_url" target="_blank" class="btn btn-sm btn-outline-primary" style="border-radius: 6px;">Open</a>
            <div v-if="user && user.role === 'counselor' && r.uploaded_by === user.id" class="mt-3 d-inline-block">
              <button class="btn btn-sm btn-outline-primary me-2" @click="editResource(r)" style="border-radius: 6px;">Edit</button>
              <button class="btn btn-sm btn-outline-danger" @click="deleteResource(r.id)" style="border-radius: 6px;">Delete</button>
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

const form = reactive({ title: '', description: '', file_url: '' })
const resources = ref([])

async function load() {
  try {
    const res = await api.get('/resources')
    resources.value = res.data
  } catch (err) {
    console.error(err)
  }
}

async function createResource() {
  try {
    await api.post('/resources', { title: form.title, description: form.description, file_url: form.file_url })
    form.title = ''
    form.description = ''
    form.file_url = ''
    await load()
  } catch (err) {
    console.error(err)
    alert(err.response?.data?.message || 'Error')
  }
}

function editResource(r) {
  const newTitle = prompt('Title', r.title)
  if (newTitle === null) return
  const newUrl = prompt('File URL', r.file_url)
  if (newUrl === null) return
  const newDesc = prompt('Description', r.description)
  if (newDesc === null) return
  api.put(`/resources/${r.id}`, { title: newTitle, file_url: newUrl, description: newDesc }).then(load).catch(e => { console.error(e); alert('Error') })
}

async function deleteResource(id) {
  if (!confirm('Delete resource?')) return
  try {
    await api.delete(`/resources/${id}`)
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
