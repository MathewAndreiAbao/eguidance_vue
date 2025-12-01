<template>
  <div class="appointments-container">
    <div class="card appointments-card">
      <div class="card-header">
        <div class="header-content">
          <h3 class="page-title">Appointments</h3>
          <button 
            v-if="user && user.role === 'student'" 
            class="btn btn-primary" 
            @click="openCreateModal"
          >
            Book Appointment
          </button>
        </div>
      </div>

      <div class="card-body">
        <!-- Loading indicator -->
        <div v-if="loading" class="loading-container">
          <div class="spinner"></div>
          <p>Loading appointments...</p>
        </div>

        <!-- Error message -->
        <div v-else-if="error" class="error-container">
          <div class="alert alert-danger">
            {{ error }}
          </div>
        </div>

        <!-- Search for appointments -->
        <div v-else>
          <div v-if="user && user.role === 'counselor'" class="search-section">
            <div class="search-input-group">
              <input 
                type="text" 
                class="form-control search-input"
                :class="{ 'loading': loading }"
                placeholder="Search students by name or email..." 
                v-model="searchQuery"
                :disabled="loading"
              >
              <button 
                v-if="searchQuery && !loading" 
                class="btn btn-outline-danger clear-btn"
                type="button" 
                @click="clearSearch"
                title="Clear search"
              >
                <i class="bi bi-x"></i> Reset
              </button>
              <button 
                class="btn btn-primary search-btn"
                type="button" 
                @click="performSearch"
                :disabled="loading"
              >
                <i class="bi bi-search"></i> Search
              </button>
            </div>
            <div v-if="searchQuery" class="search-info">
              <span v-if="!loading && paginatedAppointments.length > 0">
                Found {{ filteredAppointments.length }} result{{ filteredAppointments.length !== 1 ? 's' : '' }}
              </span>
              <span v-else-if="!loading && paginatedAppointments.length === 0">
                No results found
              </span>
            </div>
          </div>

          <!-- No appointments message -->
          <div v-if="!loading && allAppointments.length === 0" class="no-appointments">
            <h5>No appointments found</h5>
            <p>You don't have any appointments yet.</p>
            <button 
              v-if="user && user.role === 'student'" 
              class="btn btn-primary" 
              @click="openCreateModal"
            >
              Book Your First Appointment
            </button>
          </div>
          
          <!-- Appointments table -->
          <div v-else-if="paginatedAppointments.length > 0">
            <div class="table-responsive">
              <table class="appointments-table">
                <thead>
                  <tr>
                    <th @click="sortAppointments('date')" class="sortable">
                      Date & Time
                      <span v-if="currentSort.column === 'date'">
                        <i :class="currentSort.order === 'asc' ? 'bi bi-arrow-up' : 'bi bi-arrow-down'"></i>
                      </span>
                    </th>
                    <th 
                      v-if="user && user.role === 'counselor'" 
                      @click="sortAppointments('student_name')" 
                      class="sortable"
                    >
                      Student
                      <span v-if="currentSort.column === 'student_name'">
                        <i :class="currentSort.order === 'asc' ? 'bi bi-arrow-up' : 'bi bi-arrow-down'"></i>
                      </span>
                    </th>
                    <th v-else>Counselor</th>
                    <th @click="sortAppointments('status')" class="sortable">
                      Status
                      <span v-if="currentSort.column === 'status'">
                        <i :class="currentSort.order === 'asc' ? 'bi bi-arrow-up' : 'bi bi-arrow-down'"></i>
                      </span>
                    </th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr 
                    v-for="appointment in paginatedAppointments" 
                    :key="appointment.id"
                  >
                    <td>
                      <div class="date-info">
                        <span class="date">{{ formatDate(appointment.date) }}</span>
                        <span class="time">{{ formatTime(appointment.time) }}</span>
                      </div>
                    </td>
                    <td v-if="user && user.role === 'counselor'">
                      <div class="student-info">
                        <span class="name">{{ appointment.student_name }}</span>
                        <span class="email">{{ appointment.student_email }}</span>
                      </div>
                    </td>
                    <td v-else>
                      <span class="counselor-name">{{ appointment.counselor_name }}</span>
                    </td>
                    <td>
                      <span 
                        class="status-badge" 
                        :class="getStatusClass(appointment.status)"
                      >
                        {{ formatStatus(appointment.status) }}
                      </span>
                    </td>
                    <td>
                      <div class="action-buttons">
                        <!-- Student actions -->
                        <template v-if="user && user.role === 'student'">
                          <button 
                            v-if="appointment.status === 'pending'" 
                            class="btn btn-sm btn-warning"
                            @click="cancelAppointment(appointment.id)"
                          >
                            Cancel
                          </button>
                          <button 
                            v-else-if="canReschedule(appointment)" 
                            class="btn btn-sm btn-primary"
                            @click="openRescheduleModal(appointment)"
                          >
                            Reschedule
                          </button>
                        </template>

                        <!-- Counselor actions -->
                        <template v-else-if="user && user.role === 'counselor'">
                          <button 
                            v-if="appointment.status === 'pending'" 
                            class="btn btn-sm btn-success"
                            @click="updateStatus(appointment.id, 'approved')"
                          >
                            Approve
                          </button>
                          <button 
                            v-if="appointment.status === 'pending'" 
                            class="btn btn-sm btn-secondary"
                            @click="openEditModal(appointment)"
                          >
                            Edit
                          </button>
                          <button 
                            v-if="appointment.status === 'pending'" 
                            class="btn btn-sm btn-danger"
                            @click="deleteAppointment(appointment.id)"
                          >
                            Delete
                          </button>
                          
                          <button 
                            v-if="appointment.status === 'approved'" 
                            class="btn btn-sm btn-success"
                            @click="updateStatus(appointment.id, 'successful')"
                          >
                            Successful
                          </button>
                          <button 
                            v-if="appointment.status === 'approved'" 
                            class="btn btn-sm btn-warning"
                            @click="updateStatus(appointment.id, 'not_successful')"
                          >
                            Not Successful
                          </button>
                          <button 
                            v-if="appointment.status === 'approved'" 
                            class="btn btn-sm btn-secondary"
                            @click="openEditModal(appointment)"
                          >
                            Edit
                          </button>
                          <button 
                            v-if="appointment.status === 'approved'" 
                            class="btn btn-sm btn-danger"
                            @click="deleteAppointment(appointment.id)"
                          >
                            Delete
                          </button>
                          
                          <button 
                            v-if="['successful', 'not_successful'].includes(appointment.status)" 
                            class="btn btn-sm btn-secondary"
                            @click="openEditModal(appointment)"
                            disabled
                          >
                            Edit
                          </button>
                          <button 
                            v-if="['successful', 'not_successful'].includes(appointment.status)" 
                            class="btn btn-sm btn-danger"
                            @click="deleteAppointment(appointment.id)"
                          >
                            Delete
                          </button>
                        </template>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <!-- Pagination -->
            <Pagination 
              v-if="filteredAppointments.length > appointmentsPerPage"
              :current-page="currentPage"
              :total-pages="totalPages"
              :total-items="filteredAppointments.length"
              :items-per-page="appointmentsPerPage"
              @update:current-page="currentPage = $event"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Create Appointment Modal -->
    <div 
      class="modal" 
      :class="{ 'show': showCreateModal }" 
      :style="{ display: showCreateModal ? 'block' : 'none' }" 
      v-if="showCreateModal"
    >
      <div v-if="showCreateModal" class="modal-backdrop"></div>
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Book Appointment</h5>
            <button type="button" class="btn-close" @click="closeCreateModal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="createAppointment" class="modern-form">
              <div class="form-group">
                <label>Select Counselor</label>
                <select 
                  v-model="newAppointment.counselor_id" 
                  class="form-control" 
                  required
                >
                  <option value="">Choose a counselor</option>
                  <option v-for="counselor in counselors" :key="counselor.id" :value="counselor.id">
                    {{ counselor.name }} ({{ counselor.email }})
                  </option>
                </select>
              </div>

              <div class="form-group">
                <label>Date</label>
                <input 
                  type="date" 
                  v-model="newAppointment.date" 
                  class="form-control" 
                  :min="today"
                  required
                  @change="loadAvailableTimes"
                >
              </div>

              <div class="form-group">
                <label>Time</label>
                <select 
                  v-model="newAppointment.time" 
                  class="form-control" 
                  required
                >
                  <option value="">Select a time slot</option>
                  <option v-for="timeSlot in availableTimes" :key="timeSlot" :value="timeSlot">
                    {{ formatTime(timeSlot) }}
                  </option>
                  <option v-if="availableTimes.length === 0 && newAppointment.date" disabled>
                    No available time slots for this date
                  </option>
                </select>
                <div v-if="bookedTimes.length > 0" class="form-text">
                  <small>Unavailable times: {{ bookedTimes.map(formatTime).join(', ') }}</small>
                </div>
              </div>

              <div v-if="createError" class="error-message">
                {{ createError }}
              </div>
              
              <div class="form-actions">
                <button type="button" class="btn btn-secondary" @click="closeCreateModal">Cancel</button>
                <button 
                  type="submit" 
                  class="btn btn-primary" 
                  :disabled="creating"
                >
                  {{ creating ? 'Booking...' : 'Book Appointment' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit/Reschedule Appointment Modal -->
    <div 
      class="modal" 
      :class="{ 'show': showEditModal }" 
      :style="{ display: showEditModal ? 'block' : 'none' }" 
      v-if="showEditModal"
    >
      <div v-if="showEditModal" class="modal-backdrop"></div>
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ isRescheduling ? 'Reschedule Appointment' : 'Edit Appointment' }}</h5>
            <button type="button" class="btn-close" @click="closeEditModal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="saveEditedAppointment" class="modern-form">
              <div class="form-group">
                <label>Date</label>
                <input 
                  type="date" 
                  v-model="editingAppointment.date" 
                  class="form-control" 
                  :min="today"
                  required
                  @change="loadAvailableTimesForEdit"
                >
              </div>

              <div class="form-group">
                <label>Time</label>
                <select 
                  v-model="editingAppointment.time" 
                  class="form-control" 
                  required
                >
                  <option value="">Select a time slot</option>
                  <option v-for="timeSlot in availableTimesEdit" :key="timeSlot" :value="timeSlot">
                    {{ formatTime(timeSlot) }}
                  </option>
                  <option v-if="availableTimesEdit.length === 0 && editingAppointment.date" disabled>
                    No available time slots for this date
                  </option>
                </select>
                <div v-if="bookedTimesEdit.length > 0" class="form-text">
                  <small>Unavailable times: {{ bookedTimesEdit.map(formatTime).join(', ') }}</small>
                </div>
              </div>

              <div v-if="editError" class="error-message">
                {{ editError }}
              </div>
              
              <div class="form-actions">
                <button type="button" class="btn btn-secondary" @click="closeEditModal">Cancel</button>
                <button 
                  type="submit" 
                  class="btn btn-primary" 
                  :disabled="saving"
                >
                  {{ saving ? 'Saving...' : 'Save Changes' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import api from '../utils/api'
import { useUserStore } from '../store/userStore'
import Pagination from '../components/Pagination.vue'

const store = useUserStore()
const user = computed(() => store.user)

// State variables
const allAppointments = ref([])
const counselors = ref([])
const loading = ref(false)
const creating = ref(false)
const saving = ref(false)
const error = ref(null)
const createError = ref(null)
const editError = ref(null)
const showCreateModal = ref(false)
const showEditModal = ref(false)
const isRescheduling = ref(false)
const searchQuery = ref('')
const searchTimeout = ref(null)
const searchActive = ref(false)
const counselorSearchQuery = ref('')

// Pagination
const currentPage = ref(1)
const appointmentsPerPage = ref(5)

// Sorting state
const currentSort = ref({
  column: 'date',
  order: 'asc'
})

// Form data
const newAppointment = reactive({
  counselor_id: '',
  date: '',
  time: ''
})

const editingAppointment = reactive({
  id: null,
  date: '',
  time: ''
})

// Available times
const availableTimes = ref([])
const bookedTimes = ref([])
const availableTimesEdit = ref([])
const bookedTimesEdit = ref([])

// Computed
const today = computed(() => {
  const today = new Date()
  return today.toISOString().split('T')[0]
})

// Filtered appointments based on search
const filteredAppointments = computed(() => {
  // Since we're now retrieving filtered data from the database, 
  // we can simply return all appointments
  return allAppointments.value
})

// Paginated appointments
const paginatedAppointments = computed(() => {
  const start = (currentPage.value - 1) * appointmentsPerPage.value
  const end = start + appointmentsPerPage.value
  return filteredAppointments.value.slice(start, end)
})

const totalPages = computed(() => {
  return Math.ceil(filteredAppointments.value.length / appointmentsPerPage.value)
})

// Methods
function formatDate(dateString) {
  const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }
  return new Date(dateString).toLocaleDateString(undefined, options)
}

function formatTime(timeString) {
  if (!timeString) return ''
  // Convert HH:MM:SS to HH:MM AM/PM
  const [hours, minutes] = timeString.split(':')
  const hour = parseInt(hours)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const formattedHour = hour % 12 || 12
  return `${formattedHour}:${minutes} ${ampm}`
}

function formatStatus(status) {
  const statusMap = {
    'pending': 'Pending',
    'approved': 'Approved',
    'successful': 'Successful',
    'not_successful': 'Not Successful',
    'cancelled': 'Cancelled'
  }
  return statusMap[status] || status
}

function getStatusClass(status) {
  const classMap = {
    'pending': 'status-pending',
    'approved': 'status-approved',
    'successful': 'status-successful',
    'not_successful': 'status-not-successful',
    'cancelled': 'status-cancelled'
  }
  return classMap[status] || 'status-default'
}

function canReschedule(appointment) {
  // Allow rescheduling for approved appointments that haven't happened yet
  if (appointment.status !== 'approved') return false
  
  const appointmentDate = new Date(`${appointment.date}T${appointment.time}`)
  const now = new Date()
  
  // Allow rescheduling if appointment is in the future
  return appointmentDate > now
}

async function loadAppointments() {
  loading.value = true
  error.value = null
  
  try {
    const params = {}
    // Add search parameter only when search is active
    if (searchActive.value && searchQuery.value.trim()) {
      params.search = searchQuery.value.trim()
    }
    
    // Add sorting parameters
    if (user.value.role === 'counselor') {
      params.sortBy = currentSort.value.column
      params.sortOrder = currentSort.value.order
    }
    
    const response = await api.get('/appointments', { params })
    allAppointments.value = response.data
    
    // Reset pagination when loading new data
    currentPage.value = 1
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to load appointments'
    console.error('Error loading appointments:', err)
  } finally {
    loading.value = false
  }
}

async function loadCounselors() {
  try {
    const params = {}
    if (counselorSearchQuery.value.trim()) {
      params.search = counselorSearchQuery.value.trim()
    }
    
    const response = await api.get('/users/counselors', { params })
    counselors.value = response.data
  } catch (err) {
    console.error('Error loading counselors:', err)
  }
}

async function loadAvailableTimes() {
  if (!newAppointment.counselor_id || !newAppointment.date) {
    availableTimes.value = []
    bookedTimes.value = []
    return
  }
  
  try {
    const response = await api.get('/appointments/available-times', {
      params: {
        counselor_id: newAppointment.counselor_id,
        date: newAppointment.date
      }
    })
    
    availableTimes.value = response.data.available
    bookedTimes.value = response.data.booked
  } catch (err) {
    console.error('Error loading available times:', err)
  }
}

async function loadAvailableTimesForEdit() {
  if (!editingAppointment.id || !editingAppointment.date) {
    availableTimesEdit.value = []
    bookedTimesEdit.value = []
    return
  }
  
  try {
    // Get the counselor ID for this appointment
    const appointment = allAppointments.value.find(a => a.id === editingAppointment.id)
    if (!appointment) return
    
    const response = await api.get('/appointments/available-times', {
      params: {
        counselor_id: appointment.counselor_id,
        date: editingAppointment.date
      }
    })
    
    availableTimesEdit.value = response.data.available
    bookedTimesEdit.value = response.data.booked
  } catch (err) {
    console.error('Error loading available times for edit:', err)
  }
}

async function createAppointment() {
  creating.value = true
  createError.value = null
  
  try {
    // Create a copy of the appointment data
    const payload = { ...newAppointment }
    
    // For students, ensure we don't send student_id as it's inferred from the token
    if (user.value.role === 'student') {
      delete payload.student_id
    }
    
    console.log('Sending appointment payload:', payload)
    
    await api.post('/appointments', payload)
    closeCreateModal()
    await loadAppointments()
  } catch (err) {
    const errorMessage = err.response?.data?.message || 'Failed to create appointment'
    createError.value = errorMessage
    console.error('Error creating appointment:', err)
    console.error('Error response:', err.response)
  } finally {
    creating.value = false
  }
}

async function updateStatus(id, status) {
  try {
    await api.put(`/appointments/${id}/status`, { status })
    await loadAppointments()
  } catch (err) {
    const errorMessage = err.response?.data?.message || 'Failed to update appointment status'
    alert(errorMessage)
    console.error('Error updating appointment status:', err)
  }
}

async function saveEditedAppointment() {
  saving.value = true
  editError.value = null
  
  try {
    await api.put(`/appointments/${editingAppointment.id}`, {
      date: editingAppointment.date,
      time: editingAppointment.time
    })
    closeEditModal()
    await loadAppointments()
  } catch (err) {
    editError.value = err.response?.data?.message || 'Failed to update appointment'
    console.error('Error updating appointment:', err)
  } finally {
    saving.value = false
  }
}

async function cancelAppointment(id) {
  if (!confirm('Are you sure you want to cancel this appointment?')) return
  
  try {
    await api.put(`/appointments/${id}/status`, { status: 'cancelled' })
    await loadAppointments()
  } catch (err) {
    const errorMessage = err.response?.data?.message || 'Failed to cancel appointment'
    alert(errorMessage)
    console.error('Error cancelling appointment:', err)
  }
}

async function deleteAppointment(id) {
  if (!confirm('Are you sure you want to delete this appointment?')) return
  
  try {
    await api.delete(`/appointments/${id}`)
    await loadAppointments()
  } catch (err) {
    const errorMessage = err.response?.data?.message || 'Failed to delete appointment'
    alert(errorMessage)
    console.error('Error deleting appointment:', err)
  }
}

function openRescheduleModal(appointment) {
  isRescheduling.value = true
  editingAppointment.id = appointment.id
  editingAppointment.date = appointment.date
  editingAppointment.time = appointment.time
  showEditModal.value = true
  
  // Load available times for this date
  setTimeout(() => {
    loadAvailableTimesForEdit()
  }, 100)
}

function openEditModal(appointment) {
  isRescheduling.value = false
  editingAppointment.id = appointment.id
  editingAppointment.date = appointment.date
  editingAppointment.time = appointment.time
  showEditModal.value = true
  
  // Load available times for this date
  setTimeout(() => {
    loadAvailableTimesForEdit()
  }, 100)
}

async function closeCreateModal() {
  showCreateModal.value = false
  newAppointment.counselor_id = ''
  newAppointment.date = ''
  newAppointment.time = ''
  createError.value = null
  availableTimes.value = []
  bookedTimes.value = []
}

async function openCreateModal() {
  showCreateModal.value = true
  // Load counselors when opening the modal
  await loadCounselors()
}

function closeEditModal() {
  showEditModal.value = false
  editingAppointment.id = null
  editingAppointment.date = ''
  editingAppointment.time = ''
  editError.value = null
  availableTimesEdit.value = []
  bookedTimesEdit.value = []
}

function debounceSearch() {
  // Trigger reactivity for filteredAppointments
  // This will automatically update the UI based on the search query
  filteredAppointments.value;
}

function performSearch() {
  // Set search as active and load appointments from the database
  searchActive.value = true;
  loadAppointments();
}

function clearSearch() {
  searchQuery.value = ''
  searchActive.value = false;
  loadAppointments()
}

function sortAppointments(column) {
  // If clicking the same column, toggle order
  if (currentSort.value.column === column) {
    currentSort.value.order = currentSort.value.order === 'asc' ? 'desc' : 'asc'
  } else {
    // If clicking a different column, sort ascending by default
    currentSort.value.column = column
    currentSort.value.order = 'asc'
  }
  
  // Reload appointments with new sort order
  loadAppointments()
}

// Lifecycle
onMounted(async () => {
  await loadAppointments()
  if (user.value.role === 'student') {
    await loadCounselors()
  }
})
</script>

<style scoped>
.appointments-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.appointments-card {
  border-radius: 16px;
  box-shadow: 0 6px 15px rgba(143, 188, 143, 0.1);
  border: 2px solid #8FBC8F;
}

.card-header {
  padding: 20px;
  border-bottom: 1px solid #E5E7EB;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 15px;
}

.page-title {
  color: #8FBC8F;
  font-weight: 600;
  margin: 0;
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
  gap: 5px;
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

.btn-secondary {
  background-color: #E5E7EB;
  color: #374151;
}

.btn-secondary:hover {
  background-color: #D1D5DB;
}

.btn-warning {
  background-color: #FBBF24;
  color: #374151;
}

.btn-warning:hover {
  background-color: #F59E0B;
}

.btn-success {
  background-color: #10B981;
  color: white;
}

.btn-success:hover {
  background-color: #059669;
}

.btn-danger {
  background-color: #EF4444;
  color: white;
}

.btn-danger:hover {
  background-color: #DC2626;
}

.btn-outline-danger {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.btn-outline-danger:hover {
  background-color: #dc3545 !important;
  color: white !important;
}

.btn-sm {
  padding: 5px 10px;
  font-size: 0.875rem;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #9CA3AF;
}

.btn-close:hover {
  color: #374151;
}

.loading-container {
  text-align: center;
  padding: 40px 20px;
  color: #374151;
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
}

.search-section {
  margin-bottom: 25px;
}

.search-input-group {
  display: flex;
  max-width: 500px;
}

.search-input {
  border-radius: 8px 0 0 8px;
  border: 1px solid #D1D5DB;
  padding: 10px 15px;
  flex: 1;
}

.search-input:focus {
  outline: none;
  border-color: #8FBC8F;
  box-shadow: 0 0 0 3px rgba(143, 188, 143, 0.2);
}

.clear-btn {
  border-radius: 0;
  border-top: 1px solid #D1D5DB;
  border-bottom: 1px solid #D1D5DB;
  border-left: none;
  border-right: none;
  padding: 10px 15px;
}

.search-btn {
  border-radius: 0 8px 8px 0;
  border: 1px solid #8FBC8F;
  padding: 10px 15px;
}

.search-info {
  margin-top: 10px;
  color: #6B7280;
  font-size: 0.875rem;
}

.no-appointments {
  text-align: center;
  padding: 50px 20px;
  color: #6B7280;
}

.no-appointments h5 {
  color: #374151;
  margin-bottom: 10px;
}

.table-responsive {
  border-radius: 10px;
  box-shadow: 0 4px 10px rgba(143, 188, 143, 0.1);
  overflow: hidden;
  margin-bottom: 20px;
}

.appointments-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

.appointments-table thead {
  background: #8FBC8F;
  color: white;
}

.appointments-table th {
  padding: 15px 20px;
  text-align: left;
  font-weight: 600;
}

.appointments-table th:first-child {
  border-top-left-radius: 10px;
}

.appointments-table th:last-child {
  border-top-right-radius: 10px;
}

.appointments-table th.sortable {
  cursor: pointer;
  user-select: none;
}

.appointments-table th.sortable:hover {
  background-color: #7AAE7A;
}

.appointments-table tbody tr {
  transition: all 0.3s ease;
}

.appointments-table tbody tr:hover {
  background-color: #f0fff0;
}

.appointments-table td {
  padding: 15px 20px;
  border-bottom: 1px solid #E5E7EB;
}

.date-info .date {
  display: block;
  font-weight: 500;
  color: #374151;
}

.date-info .time {
  display: block;
  font-size: 0.875rem;
  color: #6B7280;
}

.student-info .name {
  display: block;
  font-weight: 500;
  color: #374151;
}

.student-info .email {
  display: block;
  font-size: 0.875rem;
  color: #6B7280;
}

.counselor-name {
  color: #374151;
}

.status-badge {
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
}

.status-pending {
  background-color: #FEF3C7;
  color: #92400E;
}

.status-approved {
  background-color: #DBEAFE;
  color: #1E40AF;
}

.status-successful {
  background-color: #D1FAE5;
  color: #065F46;
}

.status-not-successful {
  background-color: #FEE2E2;
  color: #991B1B;
}

.status-cancelled {
  background-color: #E5E7EB;
  color: #374151;
}

.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1050;
  overflow: hidden;
  outline: 0;
}

.modal.show {
  display: block;
}

.modal-dialog {
  position: relative;
  width: auto;
  margin: 0.5rem;
  pointer-events: auto;
  display: flex;
  align-items: center;
  min-height: calc(100% - 1rem);
}

@media (min-width: 576px) {
  .modal-dialog {
    max-width: 500px;
    margin: 1.75rem auto;
    min-height: calc(100% - 3.5rem);
  }
}

.modal-content {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  pointer-events: auto;
  background-color: #fff;
  background-clip: padding-box;
  border: 2px solid #8FBC8F;
  border-radius: 16px;
  outline: 0;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  border-bottom: 1px solid #E5E7EB;
}

.modal-title {
  margin: 0;
  color: #8FBC8F;
  font-weight: 600;
}

.modal-body {
  position: relative;
  flex: 1 1 auto;
  padding: 20px;
}

.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1040;
  width: 100vw;
  height: 100vh;
  background-color: #000;
  opacity: 0.5;
}

.modal-content {
  z-index: 1050;
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

.form-text {
  margin-top: 5px;
  color: #6B7280;
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

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}
</style>