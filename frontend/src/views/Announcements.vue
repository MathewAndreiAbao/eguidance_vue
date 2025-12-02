<template>
  <div class="announcements-container">
    <div class="header-section">
      <h2 class="page-title">Announcements</h2>
      <p class="page-description">Stay updated with the latest announcements from counselors</p>
    </div>

    <!-- Loading indicator -->
    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
      <p>Loading announcements...</p>
    </div>

    <!-- Error message -->
    <div v-else-if="error" class="error-container">
      <div class="alert alert-danger">
        {{ error }}
        <button @click="loadAnnouncements" class="retry-button">Retry</button>
      </div>
    </div>

    <!-- Main content -->
    <div v-else class="content-section">
      <!-- Tabs for different sections -->
      <div class="tabs-container">
        <button 
          :class="['tab', { active: activeTab === 'announcements' }]"
          @click="activeTab = 'announcements'"
        >
          All Announcements
        </button>
        
        <button 
          :class="['tab', { active: activeTab === 'create' }]"
          @click="activeTab = 'create'"
          v-if="user && user.role === 'counselor'"
        >
          Create Announcement
        </button>
      </div>

      <!-- All Announcements Tab -->
      <div v-if="activeTab === 'announcements'" class="tab-content">
        <div v-if="paginatedAnnouncements.length === 0" class="no-data">
          <h4>No announcements available</h4>
          <p v-if="user && user.role === 'counselor'">Create announcements to keep students informed.</p>
          <p v-else>Check back later for new announcements from your counselors.</p>
        </div>
        <div v-else>
          <div class="announcements-grid">
            <div 
              v-for="announcement in paginatedAnnouncements" 
              :key="announcement.id" 
              class="announcement-card"
            >
              <div class="card">
                <div class="card-body">
                  <h5 class="card-title">{{ announcement.title }}</h5>
                  <h6 class="card-subtitle">{{ announcement.author_name }} • {{ formatDate(announcement.created_at) }}</h6>
                  <p class="card-text">{{ announcement.content }}</p>
                  <div v-if="user && user.role === 'counselor' && announcement.created_by === user.id" class="announcement-actions">
                    <button class="btn btn-sm btn-outline-primary" @click="openEditModal(announcement)">Edit</button>
                    <button class="btn btn-sm btn-outline-danger" @click="deleteAnnouncement(announcement.id)">Delete</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Pagination -->
          <Pagination 
            v-if="announcements.length > announcementsPerPage"
            :current-page="currentPage"
            :total-pages="totalPages"
            :total-items="announcements.length"
            :items-per-page="announcementsPerPage"
            @update:current-page="currentPage = $event"
          />
        </div>
      </div>

      <!-- Create Announcement Tab (Counselor) -->
      <div v-else-if="activeTab === 'create' && user && user.role === 'counselor'" class="tab-content">
        <div class="form-container">
          <h3>Create New Announcement</h3>
          <form @submit.prevent="createAnnounce" class="modern-form">
            <div class="form-group">
              <label for="title">Title</label>
              <input 
                id="title" 
                v-model="form.title" 
                class="form-control" 
                placeholder="Enter announcement title" 
                required 
              />
            </div>
            <div class="form-group">
              <label for="content">Content</label>
              <textarea 
                id="content" 
                v-model="form.content" 
                class="form-control" 
                rows="4" 
                placeholder="Enter announcement content" 
                required
              ></textarea>
            </div>
            <div class="form-actions">
              <button type="submit" :disabled="creating" class="btn btn-primary">
                {{ creating ? 'Publishing...' : 'Publish Announcement' }}
              </button>
            </div>
            <div v-if="createError" class="error-message">
              {{ createError }}
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Edit Announcement Modal -->
    <EditModal 
      :is-visible="showEditModal" 
      :title="'Edit Announcement'" 
      :saving="updating"
      @close="closeEditModal"
      @save="updateAnnouncement"
    >
      <form @submit.prevent="updateAnnouncement" class="modern-form">
        <div class="form-group">
          <label for="edit-title">Title</label>
          <input 
            id="edit-title" 
            v-model="editingAnnouncement.title" 
            class="form-control" 
            placeholder="Enter announcement title" 
            required 
          />
        </div>
        <div class="form-group">
          <label for="edit-content">Content</label>
          <textarea 
            id="edit-content" 
            v-model="editingAnnouncement.content" 
            class="form-control" 
            rows="4" 
            placeholder="Enter announcement content" 
            required
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
const activeTab = ref('announcements')
const loading = ref(false)
const creating = ref(false)
const updating = ref(false)
const error = ref(null)
const createError = ref(null)
const updateError = ref(null)

const form = reactive({ title: '', content: '' })
const announcements = ref([])
const currentPage = ref(1)
const announcementsPerPage = ref(5)

// Editing state
const showEditModal = ref(false)
const editingAnnouncement = reactive({ id: null, title: '', content: '' })

const paginatedAnnouncements = computed(() => {
  const start = (currentPage.value - 1) * announcementsPerPage.value
  const end = start + announcementsPerPage.value
  return announcements.value.slice(start, end)
})

const totalPages = computed(() => {
  return Math.ceil(announcements.value.length / announcementsPerPage.value)
})

function formatDate(dateString) {
  return new Date(dateString).toLocaleString()
}

async function loadAnnouncements() {
  loading.value = true
  error.value = null
  
  try {
    const res = await api.get('/announcements')
    announcements.value = res.data
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to load announcements'
    console.error(err)
  } finally {
    loading.value = false
  }
}

async function createAnnounce() {
  creating.value = true
  createError.value = null
  
  try {
    await api.post('/announcements', { title: form.title, content: form.content })
    form.title = ''
    form.content = ''
    await loadAnnouncements()
    activeTab.value = 'announcements'
    alert('Announcement published successfully!')
  } catch (err) {
    createError.value = err.response?.data?.message || 'Error publishing announcement'
    console.error(err)
  } finally {
    creating.value = false
  }
}

function openEditModal(announcement) {
  editingAnnouncement.id = announcement.id
  editingAnnouncement.title = announcement.title
  editingAnnouncement.content = announcement.content
  showEditModal.value = true
}

function closeEditModal() {
  showEditModal.value = false
  updateError.value = null
}

async function updateAnnouncement() {
  updating.value = true
  updateError.value = null
  
  try {
    await api.put(`/announcements/${editingAnnouncement.id}`, { 
      title: editingAnnouncement.title, 
      content: editingAnnouncement.content 
    })
    closeEditModal()
    await loadAnnouncements()
    alert('Announcement updated successfully!')
  } catch (err) {
    updateError.value = err.response?.data?.message || 'Error updating announcement'
    console.error(err)
  } finally {
    updating.value = false
  }
}

async function deleteAnnouncement(id) {
  if (!confirm('Delete announcement?')) return
  try {
    await api.delete(`/announcements/${id}`)
    await loadAnnouncements()
    alert('Announcement deleted successfully!')
  } catch (err) {
    console.error(err)
    alert('Error deleting announcement')
  }
}

onMounted(loadAnnouncements)
</script>

<style scoped>
.announcements-container {
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

.announcements-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 25px;
  margin-bottom: 30px;
}

.announcement-card .card {
  border-radius: 12px;
  box-shadow: 0 4px 10px rgba(143, 188, 143, 0.1);
  border: 1px solid #D1D5DB;
  transition: all 0.3s ease;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.announcement-card .card:hover {
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

.announcement-actions {
  display: flex;
  gap: 10px;
  margin-top: auto;
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