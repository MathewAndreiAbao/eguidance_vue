<template>
  <div class="card p-4" style="border-radius: 16px; box-shadow: 0 6px 15px rgba(143, 188, 143, 0.1); border: 2px solid #8FBC8F;">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h3 style="color: #8FBC8F; font-weight: 600;">Appointments</h3>
      <button v-if="user && user.role === 'student'" class="btn btn-primary" @click="showCreateModal = true" style="border-radius: 8px;">
        Book Appointment
      </button>
    </div>

    <!-- Loading indicator -->
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status" style="color: #8FBC8F !important;">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>

    <!-- Error message -->
    <div v-else-if="error" class="alert alert-danger" style="border-radius: 10px;">
      {{ error }}
    </div>

    <!-- No appointments message -->
    <div v-else-if="appointments.length === 0" class="text-center py-5" style="color: #6B7280;">
      <h5>No appointments found</h5>
      <p class="mt-2">You don't have any appointments yet.</p>
      <button v-if="user && user.role === 'student'" class="btn btn-primary mt-3" @click="showCreateModal = true" style="border-radius: 8px;">
        Book Your First Appointment
      </button>
    </div>

    <!-- Appointments list -->
    <div v-else>
      <!-- Search for counselors -->
      <div v-if="user && user.role === 'counselor'" class="mb-4">
        <div class="input-group" style="max-width: 450px;">
          <input 
            type="text" 
            class="form-control" 
            :class="{ 'loading': loading }"
            placeholder="Search students by name or email..." 
            v-model="searchQuery"
            @input="debounceSearch"
            @keyup.enter="loadAppointments"
            style="border-radius: 8px 0 0 8px; border: 1px solid #D1D5DB;"
            :disabled="loading"
          >
          <button 
            v-if="searchQuery && !loading" 
            class="btn btn-outline-danger" 
            type="button" 
            @click="clearSearch"
            style="border-top: 1px solid #D1D5DB; border-bottom: 1px solid #D1D5DB; border-left: none; border-right: none; padding: 0.375rem 0.75rem; background-color: #f8d7da; color: #721c24;"
            title="Clear search"
          >
            <i class="bi bi-x"></i>
          </button>
          <button 
            class="btn btn-outline-secondary" 
            type="button" 
            @click="loadAppointments"
            :disabled="loading"
            style="border-radius: 0 8px 8px 0; border: 1px solid #D1D5DB; padding: 0.375rem 0.75rem;"
          >
            <i v-if="loading" class="bi bi-arrow-repeat" style="animation: spin 1s linear infinite;"></i>
            <i v-else class="bi bi-search"></i>
          </button>
        </div>
        <div v-if="searchQuery" class="mt-2 text-muted d-flex align-items-center" style="font-size: 0.875rem;">
          <span v-if="!loading && appointments.length > 0" class="me-2">
            Found {{ appointments.length }} result{{ appointments.length !== 1 ? 's' : '' }}
          </span>
          <span v-else-if="!loading && appointments.length === 0" class="me-2">
            No results found
          </span>
          <span v-else class="me-2">
            Searching...
          </span>
          <button 
            v-if="searchQuery && !loading && appointments.length === 0" 
            class="btn btn-sm btn-outline-danger" 
            type="button" 
            @click="clearSearch"
            style="padding: 0.25rem 0.5rem; font-size: 0.75rem;"
            title="Exit search and show all appointments"
          >
            <i class="bi bi-x"></i> Exit Search
          </button>
        </div>
      </div>
      
      <!-- Search for students -->
      <div v-else-if="user && user.role === 'student'" class="mb-4">
        <div class="input-group" style="max-width: 450px;">
          <input 
            type="text" 
            class="form-control" 
            :class="{ 'loading': loading }"
            placeholder="Search counselors by name..." 
            v-model="searchQuery"
            @input="debounceSearch"
            @keyup.enter="loadAppointments"
            style="border-radius: 8px 0 0 8px; border: 1px solid #D1D5DB;"
            :disabled="loading"
          >
          <button 
            v-if="searchQuery && !loading" 
            class="btn btn-outline-danger" 
            type="button" 
            @click="clearSearch"
            style="border-top: 1px solid #D1D5DB; border-bottom: 1px solid #D1D5DB; border-left: none; border-right: none; padding: 0.375rem 0.75rem; background-color: #f8d7da; color: #721c24;"
            title="Clear search"
          >
            <i class="bi bi-x"></i>
          </button>
          <button 
            class="btn btn-outline-secondary" 
            type="button" 
            @click="loadAppointments"
            :disabled="loading"
            style="border-radius: 0 8px 8px 0; border: 1px solid #D1D5DB; padding: 0.375rem 0.75rem;"
          >
            <i v-if="loading" class="bi bi-arrow-repeat" style="animation: spin 1s linear infinite;"></i>
            <i v-else class="bi bi-search"></i>
          </button>
        </div>
        <div v-if="searchQuery" class="mt-2 text-muted d-flex align-items-center" style="font-size: 0.875rem;">
          <span v-if="!loading && appointments.length > 0" class="me-2">
            Found {{ appointments.length }} result{{ appointments.length !== 1 ? 's' : '' }}
          </span>
          <span v-else-if="!loading && appointments.length === 0" class="me-2">
            No results found
          </span>
          <span v-else class="me-2">
            Searching...
          </span>
          <button 
            v-if="searchQuery && !loading && appointments.length === 0" 
            class="btn btn-sm btn-outline-danger" 
            type="button" 
            @click="clearSearch"
            style="padding: 0.25rem 0.5rem; font-size: 0.75rem;"
            title="Exit search and show all appointments"
          >
            <i class="bi bi-x"></i> Exit Search
          </button>
        </div>
      </div>

      <!-- Appointments table -->
      <div class="table-responsive" style="border-radius: 10px; box-shadow: 0 4px 10px rgba(143, 188, 143, 0.1);">
        <table class="table table-striped table-hover" style="border-radius: 10px; overflow: hidden; margin-bottom: 0;">
          <thead>
            <tr style="background: #8FBC8F; color: white;">
              <th style="border-top-left-radius: 10px; cursor: pointer;" @click="sortAppointments('date')">
                Date & Time
                <span v-if="currentSort.column === 'date'">
                  <i :class="currentSort.order === 'asc' ? 'bi bi-arrow-up' : 'bi bi-arrow-down'"></i>
                </span>
              </th>
              <th v-if="user && user.role === 'counselor'" style="cursor: pointer;" @click="sortAppointments('student_name')">
                Student
                <span v-if="currentSort.column === 'student_name'">
                  <i :class="currentSort.order === 'asc' ? 'bi bi-arrow-up' : 'bi bi-arrow-down'"></i>
                </span>
              </th>
              <th v-else>Counselor</th>
              <th style="cursor: pointer;" @click="sortAppointments('status')">
                Status
                <span v-if="currentSort.column === 'status'">
                  <i :class="currentSort.order === 'asc' ? 'bi bi-arrow-up' : 'bi bi-arrow-down'"></i>
                </span>
              </th>
              <th style="border-top-right-radius: 10px;">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="appointment in appointments" 
              :key="appointment.id"
              style="transition: all 0.3s ease;"
            >
              <td style="color: #374151;">
                {{ formatDate(appointment.date) }}<br>
                <small>{{ formatTime(appointment.time) }}</small>
              </td>
              <td style="color: #374151;" v-if="user && user.role === 'counselor'">
                {{ appointment.student_name }}<br>
                <small>{{ appointment.student_email }}</small>
              </td>
              <td style="color: #374151;" v-else>
                {{ appointment.counselor_name }}
              </td>
              <td>
                <span 
                  class="badge" 
                  :class="getStatusClass(appointment.status)"
                  style="padding: 0.5em 0.75em;"
                >
                  {{ formatStatus(appointment.status) }}
                </span>
              </td>
              <td>
                <div class="btn-group" role="group">
                  <!-- Student actions -->
                  <template v-if="user && user.role === 'student'">
                    <button 
                      v-if="appointment.status === 'pending'" 
                      class="btn btn-sm btn-warning me-1" 
                      @click="cancelAppointment(appointment.id)"
                      style="border-radius: 6px;"
                    >
                      Cancel
                    </button>
                    <button 
                      v-else-if="canReschedule(appointment)" 
                      class="btn btn-sm btn-primary me-1" 
                      @click="openRescheduleModal(appointment)"
                      style="border-radius: 6px;"
                    >
                      Reschedule
                    </button>
                  </template>

                  <!-- Counselor actions -->
                  <template v-else-if="user && user.role === 'counselor'">
                    <button 
                      v-if="appointment.status === 'pending'" 
                      class="btn btn-sm btn-success me-1" 
                      @click="updateStatus(appointment.id, 'approved')"
                      style="border-radius: 6px;"
                    >
                      Approve
                    </button>
                    <button 
                      v-if="appointment.status === 'pending'" 
                      class="btn btn-sm btn-secondary me-1" 
                      @click="openEditModal(appointment)"
                      style="border-radius: 6px;"
                    >
                      Edit
                    </button>
                    <button 
                      v-if="appointment.status === 'pending'" 
                      class="btn btn-sm btn-danger me-1" 
                      @click="deleteAppointment(appointment.id)"
                      style="border-radius: 6px;"
                    >
                      Delete
                    </button>
                    
                    <button 
                      v-if="appointment.status === 'approved'" 
                      class="btn btn-sm btn-success me-1" 
                      @click="updateStatus(appointment.id, 'successful')"
                      style="border-radius: 6px;"
                    >
                      Successful
                    </button>
                    <button 
                      v-if="appointment.status === 'approved'" 
                      class="btn btn-sm btn-warning me-1" 
                      @click="updateStatus(appointment.id, 'not_successful')"
                      style="border-radius: 6px;"
                    >
                      Not Successful
                    </button>
                    <button 
                      v-if="appointment.status === 'approved'" 
                      class="btn btn-sm btn-secondary me-1" 
                      @click="openEditModal(appointment)"
                      style="border-radius: 6px;"
                    >
                      Edit
                    </button>
                    <button 
                      v-if="appointment.status === 'approved'" 
                      class="btn btn-sm btn-danger me-1" 
                      @click="deleteAppointment(appointment.id)"
                      style="border-radius: 6px;"
                    >
                      Delete
                    </button>
                    
                    <button 
                      v-if="['successful', 'not_successful'].includes(appointment.status)" 
                      class="btn btn-sm btn-secondary me-1" 
                      @click="openEditModal(appointment)"
                      style="border-radius: 6px;"
                      disabled
                    >
                      Edit
                    </button>
                    <button 
                      v-if="['successful', 'not_successful'].includes(appointment.status)" 
                      class="btn btn-sm btn-danger me-1" 
                      @click="deleteAppointment(appointment.id)"
                      style="border-radius: 6px;"
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
    </div>
  </div>

  <!-- Create Appointment Modal -->
  <div class="modal fade" :class="{ 'show': showCreateModal }" :style="{ display: showCreateModal ? 'block' : 'none' }" id="createAppointmentModal" tabindex="-1" aria-modal="true" role="dialog" aria-labelledby="createAppointmentModalLabel" aria-hidden="true" v-if="showCreateModal">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content" style="border-radius: 16px; border: 2px solid #8FBC8F;">
        <div class="modal-header" style="border-bottom: 1px solid #D1D5DB;">
          <h5 class="modal-title" id="createAppointmentModalLabel" style="color: #8FBC8F;">Book Appointment</h5>
          <button type="button" class="btn-close" @click="closeCreateModal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="createAppointment">
            <div class="mb-3">
              <label class="form-label" style="color: #374151;">Select Counselor</label>
              <select v-model="newAppointment.counselor_id" class="form-select" required style="border-radius: 8px; border: 1px solid #D1D5DB;">
                <option value="">Choose a counselor</option>
                <option v-for="counselor in counselors" :key="counselor.id" :value="counselor.id">
                  {{ counselor.name }} ({{ counselor.email }})
                </option>
              </select>
            </div>

            <div class="mb-3">
              <label class="form-label" style="color: #374151;">Date</label>
              <input 
                type="date" 
                v-model="newAppointment.date" 
                class="form-control" 
                :min="today"
                required
                style="border-radius: 8px; border: 1px solid #D1D5DB;"
                @change="loadAvailableTimes"
              >
            </div>

            <div class="mb-3">
              <label class="form-label" style="color: #374151;">Time</label>
              <select v-model="newAppointment.time" class="form-select" required style="border-radius: 8px; border: 1px solid #D1D5DB;">
                <option value="">Select a time slot</option>
                <option v-for="timeSlot in availableTimes" :key="timeSlot" :value="timeSlot">
                  {{ formatTime(timeSlot) }}
                </option>
                <option v-if="availableTimes.length === 0 && newAppointment.date" disabled>
                  No available time slots for this date
                </option>
              </select>
              <div v-if="bookedTimes.length > 0" class="form-text" style="color: #6B7280;">
                <small>Unavailable times: {{ bookedTimes.map(formatTime).join(', ') }}</small>
              </div>
            </div>

            <div v-if="createError" class="alert alert-danger mt-3" style="border-radius: 8px;">
              {{ createError }}
            </div>
          </form>
        </div>
        <div class="modal-footer" style="border-top: 1px solid #D1D5DB;">
          <button type="button" class="btn btn-secondary" @click="closeCreateModal" style="border-radius: 8px;">Cancel</button>
          <button type="button" class="btn btn-primary" @click="createAppointment" :disabled="creating" style="border-radius: 8px;">
            {{ creating ? 'Booking...' : 'Book Appointment' }}
          </button>
        </div>
      </div>
    </div>
  </div>
  <div v-if="showCreateModal" class="modal-backdrop fade show"></div>

  <!-- Edit/Reschedule Appointment Modal -->
  <div class="modal fade" :class="{ 'show': showEditModal }" :style="{ display: showEditModal ? 'block' : 'none' }" id="editAppointmentModal" tabindex="-1" aria-modal="true" role="dialog" aria-labelledby="editAppointmentModalLabel" aria-hidden="true" v-if="showEditModal">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content" style="border-radius: 16px; border: 2px solid #8FBC8F;">
        <div class="modal-header" style="border-bottom: 1px solid #D1D5DB;">
          <h5 class="modal-title" id="editAppointmentModalLabel" style="color: #8FBC8F;">{{ isRescheduling ? 'Reschedule Appointment' : 'Edit Appointment' }}</h5>
          <button type="button" class="btn-close" @click="closeEditModal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="saveEditedAppointment">
            <div class="mb-3">
              <label class="form-label" style="color: #374151;">Date</label>
              <input 
                type="date" 
                v-model="editingAppointment.date" 
                class="form-control" 
                :min="today"
                required
                style="border-radius: 8px; border: 1px solid #D1D5DB;"
                @change="loadAvailableTimesForEdit"
              >
            </div>

            <div class="mb-3">
              <label class="form-label" style="color: #374151;">Time</label>
              <select v-model="editingAppointment.time" class="form-select" required style="border-radius: 8px; border: 1px solid #D1D5DB;">
                <option value="">Select a time slot</option>
                <option v-for="timeSlot in availableTimesEdit" :key="timeSlot" :value="timeSlot">
                  {{ formatTime(timeSlot) }}
                </option>
                <option v-if="availableTimesEdit.length === 0 && editingAppointment.date" disabled>
                  No available time slots for this date
                </option>
              </select>
              <div v-if="bookedTimesEdit.length > 0" class="form-text" style="color: #6B7280;">
                <small>Unavailable times: {{ bookedTimesEdit.map(formatTime).join(', ') }}</small>
              </div>
            </div>

            <div v-if="editError" class="alert alert-danger mt-3" style="border-radius: 8px;">
              {{ editError }}
            </div>
          </form>
        </div>
        <div class="modal-footer" style="border-top: 1px solid #D1D5DB;">
          <button type="button" class="btn btn-secondary" @click="closeEditModal" style="border-radius: 8px;">Cancel</button>
          <button type="button" class="btn btn-primary" @click="saveEditedAppointment" :disabled="saving" style="border-radius: 8px;">
            {{ saving ? 'Saving...' : 'Save Changes' }}
          </button>
        </div>
      </div>
    </div>
  </div>
  <div v-if="showEditModal" class="modal-backdrop fade show"></div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import api from '../utils/api'
import { useUserStore } from '../store/userStore'

const store = useUserStore()
const user = computed(() => store.user)

// State variables
const appointments = ref([])
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
    'pending': 'bg-warning text-dark',
    'approved': 'bg-info text-dark',
    'successful': 'bg-success',
    'not_successful': 'bg-danger',
    'cancelled': 'bg-secondary'
  }
  return classMap[status] || 'bg-secondary'
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
    // Add search parameter for both counselors and students
    if (searchQuery.value.trim()) {
      params.search = searchQuery.value.trim()
    }
    
    // Add sorting parameters
    if (user.value.role === 'counselor') {
      params.sortBy = currentSort.value.column
      params.sortOrder = currentSort.value.order
    }
    
    const response = await api.get('/appointments', { params })
    appointments.value = response.data
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to load appointments'
    console.error('Error loading appointments:', err)
  } finally {
    loading.value = false
  }
}

async function loadCounselors() {
  try {
    const response = await api.get('/users/counselors')
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
    const appointment = appointments.value.find(a => a.id === editingAppointment.id)
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
    const payload = { ...newAppointment }
    if (user.value.role === 'student') {
      // For students, we don't need to send student_id as it's inferred from the token
      delete payload.student_id
    }
    
    await api.post('/appointments', payload)
    closeCreateModal()
    await loadAppointments()
  } catch (err) {
    createError.value = err.response?.data?.message || 'Failed to create appointment'
    console.error('Error creating appointment:', err)
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

function closeCreateModal() {
  showCreateModal.value = false
  newAppointment.counselor_id = ''
  newAppointment.date = ''
  newAppointment.time = ''
  createError.value = null
  availableTimes.value = []
  bookedTimes.value = []
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
  clearTimeout(searchTimeout.value)
  searchTimeout.value = setTimeout(() => {
    loadAppointments()
  }, 300)
}

function clearSearch() {
  searchQuery.value = ''
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
.badge {
  font-size: 0.75em;
}
.table th {
  font-weight: 600;
}
.btn-group .btn {
  margin-right: 0.25rem;
}
.btn-group .btn:last-child {
  margin-right: 0;
}
.modal-content {
  border: 2px solid #8FBC8F;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.form-control.loading {
  background-color: #f8f9fa;
}

.btn.btn-outline-danger:hover {
  background-color: #dc3545 !important;
  color: white !important;
}
</style>