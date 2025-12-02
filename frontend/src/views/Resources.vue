<template>
  <div class="resources-container">
    <div class="header-section">
      <h2 class="page-title">Resources</h2>
      <p class="page-description">Access helpful resources for your wellness journey</p>
    </div>

    <!-- Loading indicator -->
    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
      <p>Loading resources...</p>
    </div>

    <!-- Error message -->
    <div v-else-if="error" class="error-container">
      <div class="alert alert-danger">
        {{ error }}
        <button @click="loadResources" class="retry-button">Retry</button>
      </div>
    </div>

    <!-- Main content -->
    <div v-else class="content-section">
      <!-- Tabs for different sections -->
      <div class="tabs-container">
        <button 
          :class="['tab', { active: activeTab === 'resources' }]"
          @click="activeTab = 'resources'"
        >
          All Resources
        </button>
        
        <button 
          :class="['tab', { active: activeTab === 'create' }]"
          @click="activeTab = 'create'"
          v-if="user && user.role === 'counselor'"
        >
          Add Resource
        </button>
      </div>

      <!-- All Resources Tab -->
      <div v-if="activeTab === 'resources'" class="tab-content">
        <div v-if="paginatedResources.length === 0" class="no-data">
          <h4>No resources available</h4>
          <p v-if="user && user.role === 'counselor'">Add resources to help students with their wellness journey.</p>
          <p v-else>Check back later for new resources from your counselors.</p>
        </div>
        <div v-else>
          <div class="resources-grid">
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
                    <button class="btn btn-sm btn-outline-primary" @click="openEditModal(resource)">Edit</button>
                    <button class="btn btn-sm btn-outline-danger" @click="deleteResource(resource.id)">Delete</button>
                  </div>
                </div>
              </div>
            </div>
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
      </div>

      <!-- Add Resource Tab (Counselor) -->
      <div v-else-if="activeTab === 'create' && user && user.role === 'counselor'" class="tab-content">
        <div class="form-container">
          <h3>Add New Resource</h3>
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
            <div class="form-actions">
              <button type="submit" :disabled="creating" class="btn btn-primary">
                {{ creating ? 'Adding...' : 'Add Resource' }}
              </button>
            </div>
            <div v-if="createError" class="error-message">
              {{ createError }}
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Edit Resource Modal -->
    <EditModal 
      :is-visible="showEditModal" 
      :title="'Edit Resource'" 
      :saving="updating"
      @close="closeEditModal"
      @save="updateResource"
    >
      <form @submit.prevent="updateResource" class="modern-form">
        <div class="form-group">
          <label for="edit-title">Title</label>
          <input 
            id="edit-title" 
            v-model="editingResource.title" 
            class="form-control" 
            placeholder="Enter resource title" 
            required 
          />
        </div>
        <div class="form-group">
          <label for="edit-file_url">File URL</label>
          <input 
            id="edit-file_url" 
            v-model="editingResource.file_url" 
            class="form-control" 
            placeholder="Enter file URL (pdf, video link, etc)" 
            required 
          />
        </div>
        <div class="form-group">
          <label for="edit-description">Description</label>
          <textarea 
            id="edit-description" 
            v-model="editingResource.description" 
            class="form-control" 
            rows="3" 
            placeholder="Enter resource description"
          ></textarea>
        </div>
        <div v-if="updateError" class="error-message">
          {{ updateError }}
        </div>
      </form>
    </EditModal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import api from '../utils/api'
import { useUserStore } from '../store/userStore'
import Pagination from '../components/Pagination.vue'
import EditModal from '../components/EditModal.vue'

const userStore = useUserStore()
const user = computed(() => userStore.user)

// State variables
const activeTab = ref('resources')
const loading = ref(false)
const creating = ref(false)
const updating = ref(false)
const error = ref(null)
const createError = ref(null)
const updateError = ref(null)

const form = reactive({ title: '', description: '', file_url: '' })
const resources = ref([])
const currentPage = ref(1)
const resourcesPerPage = ref(6)

// Editing state
const showEditModal = ref(false)
const editingResource = reactive({ id: null, title: '', description: '', file_url: '' })

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

async function loadResources() {
  loading.value = true
  error.value = null
  
  try {
    const res = await api.get('/resources')
    resources.value = res.data
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to load resources'
    console.error(err)
  } finally {
    loading.value = false
  }
}

async function createResource() {
  creating.value = true
  createError.value = null
  
  try {
    await api.post('/resources', { title: form.title, description: form.description, file_url: form.file_url })
    form.title = ''
    form.description = ''
    form.file_url = ''
    await loadResources()
    activeTab.value = 'resources'
    alert('Resource added successfully!')
  } catch (err) {
    createError.value = err.response?.data?.message || 'Error adding resource'
    console.error(err)
  } finally {
    creating.value = false
  }
}

function openEditModal(resource) {
  editingResource.id = resource.id
  editingResource.title = resource.title
  editingResource.description = resource.description
  editingResource.file_url = resource.file_url
  showEditModal.value = true
}

function closeEditModal() {
  showEditModal.value = false
  updateError.value = null
}

async function updateResource() {
  updating.value = true
  updateError.value = null
  
  try {
    await api.put(`/resources/${editingResource.id}`, { 
      title: editingResource.title, 
      file_url: editingResource.file_url, 
      description: editingResource.description 
    })
    closeEditModal()
    await loadResources()
    alert('Resource updated successfully!')
  } catch (err) {
    updateError.value = err.response?.data?.message || 'Error updating resource'
    console.error(err)
  } finally {
    updating.value = false
  }
}

async function deleteResource(id) {
  if (!confirm('Delete resource?')) return
  try {
    await api.delete(`/resources/${id}`)
    await loadResources()
    alert('Resource deleted successfully!')
  } catch (err) {
    console.error(err)
    const errorMessage = err.response?.data?.message || err.message || 'Error deleting resource'
    alert('Error: ' + errorMessage)
  }
}

onMounted(loadResources)
</script>

<style scoped>
.resources-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.header-section {
  text-align: center;
  margin-bottom: 30px;
}

.page-title {
  color: #8FBC8F;
  font-weight: 600;
  margin-bottom: 10px;
}

.page-description {
  color: #6B7280;
  font-size: 1.1rem;
}

.loading-container, .error-container, .no-data {
  text-align: center;
  padding: 40px 20px;
}

.spinner {
  border: 4px solid rgba(143, 188, 143, 0.3);
  border-radius: 50%;
  border-top: 4px solid #8FBC8F;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.alert-danger {
  background-color: #f8d7da;
  color: #721c24;
  padding: 15px;
  border-radius: 8px;
  border: 1px solid #f5c6cb;
  display: inline-block;
  max-width: 500px;
}

.retry-button {
  background-color: #8FBC8F;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  margin-left: 10px;
}

.retry-button:hover {
  background-color: #7AAE7A;
}

.tabs-container {
  display: flex;
  border-bottom: 2px solid #E5E7EB;
  margin-bottom: 30px;
}

.tab {
  padding: 12px 24px;
  background: none;
  border: none;
  cursor: pointer;
  font-weight: 500;
  color: #6B7280;
  border-bottom: 3px solid transparent;
  transition: all 0.3s ease;
}

.tab:hover {
  color: #8FBC8F;
}

.tab.active {
  color: #8FBC8F;
  border-bottom: 3px solid #8FBC8F;
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

.form-container {
  max-width: 600px;
  margin: 0 auto;
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

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
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

.error-message {
  color: #EF4444;
  background-color: #FEF2F2;
  padding: 12px;
  border-radius: 8px;
  margin-top: 15px;
  border: 1px solid #FECACA;
}

.no-data h4 {
  color: #374151;
  margin-bottom: 10px;
}

.no-data p {
  color: #6B7280;
}
</style>