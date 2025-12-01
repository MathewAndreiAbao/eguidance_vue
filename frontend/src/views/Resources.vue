<template>
  <div class="resources-container">
    <h2 class="page-title">Resources</h2>

    <div v-if="user && user.role === 'counselor'" class="card create-resource-card">
      <div class="card-body">
        <h5 class="card-title">Add Resource</h5>
        <form @submit.prevent="createResource" class="modern-form">
          <div class="form-group">
            <label for="title">Title</label>
            <input 
              id="title" 
              v-model="form.title" 
              class="form-control" 
              placeholder="Enter resource title" 
              required 
            />
          </div>
          <div class="form-group">
            <label for="file_url">File URL</label>
            <input 
              id="file_url" 
              v-model="form.file_url" 
              class="form-control" 
              placeholder="Enter file URL (pdf, video link, etc)" 
              required 
            />
          </div>
          <div class="form-group">
            <label for="description">Description</label>
            <textarea 
              id="description" 
              v-model="form.description" 
              class="form-control" 
              rows="3" 
              placeholder="Enter resource description"
            ></textarea>
          </div>
          <button type="submit" class="btn btn-primary">Add Resource</button>
        </form>
      </div>
    </div>

    <div v-if="paginatedResources.length > 0" class="resources-grid">
      <div 
        v-for="resource in paginatedResources" 
        :key="resource.id" 
        class="resource-card"
      >
        <div class="card">
          <div class="card-body">
            <h5 class="card-title">{{ resource.title }}</h5>
            <h6 class="card-subtitle">{{ resource.uploader_name }} • {{ formatDate(resource.created_at) }}</h6>
            <p class="card-text">{{ resource.description }}</p>
            <a :href="resource.file_url" target="_blank" class="btn btn-outline-primary open-btn">Open</a>
            <div v-if="user && user.role === 'counselor' && resource.uploaded_by === user.id" class="resource-actions">
              <button class="btn btn-sm btn-outline-primary" @click="editResource(resource)">Edit</button>
              <button class="btn btn-sm btn-outline-danger" @click="deleteResource(resource.id)">Delete</button>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div v-else class="no-resources">
      <h4>No resources available</h4>
      <p v-if="user && user.role === 'counselor'">Add resources to help students with their wellness journey.</p>
      <p v-else>Check back later for new resources from your counselors.</p>
    </div>

    <!-- Pagination -->
    <Pagination 
      v-if="resources.length > resourcesPerPage"
      :current-page="currentPage"
      :total-pages="totalPages"
      :total-items="resources.length"
      :items-per-page="resourcesPerPage"
      @update:current-page="currentPage = $event"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import api from '../utils/api'
import { useUserStore } from '../store/userStore'
import Pagination from '../components/Pagination.vue'

const userStore = useUserStore()
const user = userStore.user

const form = reactive({ title: '', description: '', file_url: '' })
const resources = ref([])
const currentPage = ref(1)
const resourcesPerPage = ref(6)

const paginatedResources = computed(() => {
  const start = (currentPage.value - 1) * resourcesPerPage.value
  const end = start + resourcesPerPage.value
  return resources.value.slice(start, end)
})

const totalPages = computed(() => {
  return Math.ceil(resources.value.length / resourcesPerPage.value)
})

function formatDate(dateString) {
  return new Date(dateString).toLocaleString()
}

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
    const errorMessage = err.response?.data?.message || err.message || 'Error creating resource';
    alert('Error: ' + errorMessage);
  }
}

function editResource(resource) {
  const newTitle = prompt('Title', resource.title)
  if (newTitle === null) return
  const newUrl = prompt('File URL', resource.file_url)
  if (newUrl === null) return
  const newDesc = prompt('Description', resource.description)
  if (newDesc === null) return
  api.put(`/resources/${resource.id}`, { title: newTitle, file_url: newUrl, description: newDesc }).then(load).catch(e => { 
    console.error(e);
    const errorMessage = e.response?.data?.message || e.message || 'Error updating resource';
    alert('Error: ' + errorMessage);
  })
}

async function deleteResource(id) {
  if (!confirm('Delete resource?')) return
  try {
    await api.delete(`/resources/${id}`)
    await load()
  } catch (err) {
    console.error(err)
    const errorMessage = err.response?.data?.message || err.message || 'Error deleting resource';
    alert('Error: ' + errorMessage);
  }
}

onMounted(load)
</script>

<style scoped>
.resources-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.page-title {
  color: #8FBC8F;
  font-weight: 600;
  margin-bottom: 30px;
  text-align: center;
}

.create-resource-card {
  border-radius: 16px;
  box-shadow: 0 6px 15px rgba(143, 188, 143, 0.1);
  border: 2px solid #8FBC8F;
  margin-bottom: 30px;
}

.card-title {
  color: #8FBC8F;
  font-weight: 600;
  margin-bottom: 20px;
}

.modern-form .form-group {
  margin-bottom: 20px;
}

.modern-form .form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #374151;
}

.modern-form .form-control {
  width: 100%;
  padding: 12px;
  border: 1px solid #D1D5DB;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
}

.modern-form .form-control:focus {
  outline: none;
  border-color: #8FBC8F;
  box-shadow: 0 0 0 3px rgba(143, 188, 143, 0.2);
}

.btn {
  padding: 10px 20px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background-color: #8FBC8F;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #7AAE7A;
}

.btn-outline-primary {
  background-color: transparent;
  color: #8FBC8F;
  border: 1px solid #8FBC8F;
}

.btn-outline-primary:hover {
  background-color: #8FBC8F;
  color: white;
}

.btn-outline-danger {
  background-color: transparent;
  color: #EF4444;
  border: 1px solid #EF4444;
}

.btn-outline-danger:hover {
  background-color: #EF4444;
  color: white;
}

.btn-sm {
  padding: 5px 10px;
  font-size: 0.875rem;
}

.resources-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 25px;
  margin-bottom: 30px;
}

.resource-card .card {
  border-radius: 12px;
  box-shadow: 0 4px 10px rgba(143, 188, 143, 0.1);
  border: 1px solid #D1D5DB;
  transition: all 0.3s ease;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.resource-card .card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 15px rgba(143, 188, 143, 0.15);
}

.card-body {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.card-title {
  color: #8FBC8F;
  margin-bottom: 10px;
}

.card-subtitle {
  color: #6B7280;
  font-size: 0.875rem;
  margin-bottom: 15px;
}

.card-text {
  color: #374151;
  margin-bottom: 20px;
  flex: 1;
}

.open-btn {
  margin-top: auto;
  align-self: flex-start;
}

.resource-actions {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}

.no-resources {
  text-align: center;
  padding: 50px 20px;
  color: #6B7280;
}

.no-resources h4 {
  color: #374151;
  margin-bottom: 10px;
}
</style>