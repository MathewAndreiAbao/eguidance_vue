<template>
  <div class="announcements-container">
    <h2 class="page-title">Announcements</h2>

    <div v-if="user && user.role === 'counselor'" class="card create-announcement-card">
      <div class="card-body">
        <h5 class="card-title">Create Announcement</h5>
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
          <button type="submit" class="btn btn-primary">Publish Announcement</button>
        </form>
      </div>
    </div>

    <div v-if="paginatedAnnouncements.length > 0" class="announcements-grid">
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
              <button class="btn btn-sm btn-outline-primary" @click="editAnnouncement(announcement)">Edit</button>
              <button class="btn btn-sm btn-outline-danger" @click="deleteAnnouncement(announcement.id)">Delete</button>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div v-else class="no-announcements">
      <h4>No announcements available</h4>
      <p v-if="user && user.role === 'counselor'">Create announcements to keep students informed.</p>
      <p v-else>Check back later for new announcements from your counselors.</p>
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
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import api from '../utils/api'
import { useUserStore } from '../store/userStore'
import Pagination from '../components/Pagination.vue'

const userStore = useUserStore()
const user = userStore.user

const form = reactive({ title: '', content: '' })
const announcements = ref([])
const currentPage = ref(1)
const announcementsPerPage = ref(5)

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

function editAnnouncement(announcement) {
  const newTitle = prompt('Title', announcement.title)
  if (newTitle === null) return
  const newContent = prompt('Content', announcement.content)
  if (newContent === null) return
  api.put(`/announcements/${announcement.id}`, { title: newTitle, content: newContent }).then(load).catch(e => { console.error(e); alert('Error') })
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
.announcements-container {
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

.create-announcement-card {
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

.no-announcements {
  text-align: center;
  padding: 50px 20px;
  color: #6B7280;
}

.no-announcements h4 {
  color: #374151;
  margin-bottom: 10px;
}
</style>