<template>
  <div class="container py-4">
    <h2 style="color: #8FBC8F; font-weight: 600;">Reports</h2>

    <div class="card mb-4" style="border-radius: 16px; box-shadow: 0 6px 15px rgba(143, 188, 143, 0.1); border: 2px solid #8FBC8F;">
      <div class="card-body">
        <div class="row mb-4">
          <div class="col-md-6">
            <h5 class="card-title" style="color: #8FBC8F; font-weight: 600;">Student Usage Statistics</h5>
          </div>
          <div class="col-md-6 text-end">
            <div class="btn-group" role="group">
              <button 
                type="button" 
                class="btn" 
                :class="viewMode === 'weekly' ? 'btn-primary' : 'btn-outline-primary'"
                @click="switchView('weekly')"
                style="border-radius: 8px; padding: 0.6rem 1.2rem;"
              >
                Weekly
              </button>
              <button 
                type="button" 
                class="btn" 
                :class="viewMode === 'monthly' ? 'btn-primary' : 'btn-outline-primary'"
                @click="switchView('monthly')"
                style="border-radius: 8px; padding: 0.6rem 1.2rem;"
              >
                Monthly
              </button>
            </div>
          </div>
        </div>

        <!-- Weekly View -->
        <div v-if="viewMode === 'weekly'">
          <div class="row mb-3">
            <div class="col-md-4">
              <label class="form-label" style="color: #374151; font-weight: 500;">Select Week Start Date</label>
              <input 
                type="date" 
                v-model="weekStartDate" 
                class="form-control" 
                @change="loadWeeklyStats"
                style="border-radius: 10px; padding: 0.9rem; border: 2px solid #D1D5DB;"
              />
            </div>
            <div class="col-md-8 d-flex align-items-end">
              <button class="btn btn-primary" @click="loadWeeklyStats" style="border-radius: 10px; padding: 0.85rem 1.6rem;">
                <i class="bi bi-search"></i> Load Report
              </button>
            </div>
          </div>

          <div v-if="weeklyStats && weeklyStats.period" class="alert alert-info" style="border-radius: 10px; background: #E0FFE0; border: 1px solid #98FB98; color: #374151;">
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <strong>Period:</strong> {{ formatDate(weeklyStats.period.start) }} to {{ formatDate(weeklyStats.period.end) }} |
                <strong>Total Students:</strong> {{ weeklyStats.total_students }}
              </div>
              <div>
                <button class="btn btn-sm btn-primary me-2" @click="downloadWeeklyCSV" style="border-radius: 6px;">
                  <i class="bi bi-download"></i> Download CSV
                </button>
                <button class="btn btn-sm btn-primary" @click="downloadWeeklyPDF" style="border-radius: 6px;">
                  <i class="bi bi-download"></i> Download PDF
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Monthly View -->
        <div v-if="viewMode === 'monthly'">
          <div class="row mb-3">
            <div class="col-md-4">
              <label class="form-label" style="color: #374151; font-weight: 500;">Select Year</label>
              <select v-model="selectedYear" class="form-select" @change="loadMonthlyStats" style="border-radius: 10px; padding: 0.9rem; border: 2px solid #D1D5DB;">
                <option v-for="year in years" :key="year" :value="year">{{ year }}</option>
              </select>
            </div>
            <div class="col-md-4">
              <label class="form-label" style="color: #374151; font-weight: 500;">Select Month</label>
              <select v-model="selectedMonth" class="form-select" @change="loadMonthlyStats" style="border-radius: 10px; padding: 0.9rem; border: 2px solid #D1D5DB;">
                <option v-for="(month, idx) in months" :key="idx + 1" :value="idx + 1">
                  {{ month }}
                </option>
              </select>
            </div>
            <div class="col-md-4 d-flex align-items-end">
              <button class="btn btn-primary" @click="loadMonthlyStats" style="border-radius: 10px; padding: 0.85rem 1.6rem;">
                <i class="bi bi-search"></i> Load Report
              </button>
            </div>
          </div>

          <div v-if="monthlyStats && monthlyStats.period" class="alert alert-info" style="border-radius: 10px; background: #E0FFE0; border: 1px solid #98FB98; color: #374151;">
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <strong>Period:</strong> {{ months[monthlyStats.period.month - 1] }} {{ monthlyStats.period.year }} |
                <strong>Total Students:</strong> {{ monthlyStats.total_students }}
              </div>
              <div>
                <button class="btn btn-sm btn-primary me-2" @click="downloadMonthlyCSV" style="border-radius: 6px;">
                  <i class="bi bi-download"></i> Download CSV
                </button>
                <button class="btn btn-sm btn-primary" @click="downloadMonthlyPDF" style="border-radius: 6px;">
                  <i class="bi bi-download"></i> Download PDF
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="text-center py-5" style="color: #374151;">
          <div class="spinner-border text-primary" role="status" style="color: #8FBC8F;">
            <span class="visually-hidden">Loading...</span>
          </div>
        </div>

        <!-- Statistics Table -->
        <div v-else-if="(viewMode === 'weekly' && weeklyStats?.students) || (viewMode === 'monthly' && monthlyStats?.students)">
          <div class="table-responsive" style="border-radius: 10px; box-shadow: 0 4px 10px rgba(143, 188, 143, 0.1);">
            <table class="table table-striped table-hover" style="border-radius: 10px; overflow: hidden;">
              <thead>
                <tr style="background: #8FBC8F; color: white;">
                  <th style="border-top-left-radius: 10px;">#</th>
                  <th>Student Name</th>
                  <th>Email</th>
                  <th>Total Appointments</th>
                  <th>Approved</th>
                  <th>Successful</th>
                  <th v-if="viewMode === 'monthly'">First Appointment</th>
                  <th v-if="viewMode === 'monthly'" style="border-top-right-radius: 10px;">Last Appointment</th>
                </tr>
              </thead>
              <tbody>
                <tr 
                  v-for="(student, index) in currentStats.students" 
                  :key="student.id"
                  style="transition: all 0.3s ease;"
                >
                  <td style="color: #374151;">{{ index + 1 }}</td>
                  <td style="color: #374151;">{{ student.name }}</td>
                  <td style="color: #374151;">{{ student.email }}</td>
                  <td>
                    <span class="badge bg-primary" style="background: #8FBC8F !important;">{{ student.appointment_count }}</span>
                  </td>
                  <td>
                    <span class="badge bg-info" style="background: #98FB98 !important; color: #374151;">{{ student.approved_count || 0 }}</span>
                  </td>
                  <td>
                    <span class="badge bg-success" style="background: #90EE90 !important;">{{ student.successful_count || 0 }}</span>
                  </td>
                  <td v-if="viewMode === 'monthly'" style="color: #374151;">
                    {{ student.first_appointment ? formatDate(student.first_appointment) : '-' }}
                  </td>
                  <td v-if="viewMode === 'monthly'" style="color: #374151;">
                    {{ student.last_appointment ? formatDate(student.last_appointment) : '-' }}
                  </td>
                </tr>
                <tr v-if="currentStats.students.length === 0">
                  <td :colspan="viewMode === 'monthly' ? 8 : 6" class="text-center text-muted" style="color: #6B7280; padding: 2rem;">
                    No students found for the selected period.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="text-center py-5 text-muted" style="color: #6B7280;">
          <p>Select a period and click "Load Report" to view statistics.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../utils/api'
import axios from 'axios'

// Create axios instance for blob downloads with auth
const downloadApi = axios.create({
  baseURL: '/api',
  responseType: 'blob'
})

downloadApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

const viewMode = ref('weekly')
const loading = ref(false)
const weeklyStats = ref(null)
const monthlyStats = ref(null)
const weekStartDate = ref('')
const selectedYear = ref(new Date().getFullYear())
const selectedMonth = ref(new Date().getMonth() + 1)

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

const years = computed(() => {
  const currentYear = new Date().getFullYear()
  const yearsList = []
  for (let i = currentYear; i >= currentYear - 5; i--) {
    yearsList.push(i)
  }
  return yearsList
})

const currentStats = computed(() => {
  return viewMode.value === 'weekly' ? weeklyStats.value : monthlyStats.value
})

function formatDate(dateString) {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

async function loadWeeklyStats() {
  if (!weekStartDate.value) {
    // Default to current week if no date selected
    const today = new Date()
    const day = today.getDay()
    const diff = today.getDate() - day + (day === 0 ? -6 : 1)
    const monday = new Date(today.setDate(diff))
    weekStartDate.value = monday.toISOString().split('T')[0]
  }

  loading.value = true
  try {
    const res = await api.get('/reports/weekly', {
      params: { startDate: weekStartDate.value }
    })
    weeklyStats.value = res.data
  } catch (err) {
    console.error(err)
    alert(err.response?.data?.message || 'Error loading weekly statistics')
  } finally {
    loading.value = false
  }
}

async function loadMonthlyStats() {
  loading.value = true
  try {
    const res = await api.get('/reports/monthly', {
      params: { year: selectedYear.value, month: selectedMonth.value }
    })
    monthlyStats.value = res.data
  } catch (err) {
    console.error(err)
    alert(err.response?.data?.message || 'Error loading monthly statistics')
  } finally {
    loading.value = false
  }
}

function switchView(mode) {
  viewMode.value = mode
  if (mode === 'weekly' && weekStartDate.value) {
    loadWeeklyStats()
  } else if (mode === 'monthly' && selectedYear.value && selectedMonth.value) {
    loadMonthlyStats()
  }
}

async function downloadWeeklyCSV() {
  if (!weeklyStats.value || !weeklyStats.value.period) {
    alert('Please load a weekly report first')
    return
  }
  try {
    const response = await downloadApi.get('/reports/weekly/download/csv', {
      params: { startDate: weekStartDate.value }
    })
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const a = document.createElement('a')
    a.href = url
    a.download = `weekly-report-${weeklyStats.value.period.start}-to-${weeklyStats.value.period.end}.csv`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  } catch (err) {
    console.error(err)
    alert('Error downloading CSV file')
  }
}

async function downloadWeeklyPDF() {
  if (!weeklyStats.value || !weeklyStats.value.period) {
    alert('Please load a weekly report first')
    return
  }
  try {
    const response = await downloadApi.get('/reports/weekly/download/pdf', {
      params: { startDate: weekStartDate.value }
    })
    const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `weekly-report-${weeklyStats.value.period.start}-to-${weeklyStats.value.period.end}.pdf`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  } catch (err) {
    console.error(err)
    alert('Error downloading PDF file')
  }
}

async function downloadMonthlyCSV() {
  if (!monthlyStats.value || !monthlyStats.value.period) {
    alert('Please load a monthly report first')
    return
  }
  try {
    const response = await downloadApi.get('/reports/monthly/download/csv', {
      params: { 
        year: selectedYear.value,
        month: selectedMonth.value
      }
    })
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const a = document.createElement('a')
    a.href = url
    const monthName = months[monthlyStats.value.period.month - 1]
    a.download = `monthly-report-${monthName}-${monthlyStats.value.period.year}.csv`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  } catch (err) {
    console.error(err)
    alert('Error downloading CSV file')
  }
}

async function downloadMonthlyPDF() {
  if (!monthlyStats.value || !monthlyStats.value.period) {
    alert('Please load a monthly report first')
    return
  }
  try {
    const response = await downloadApi.get('/reports/monthly/download/pdf', {
      params: { 
        year: selectedYear.value,
        month: selectedMonth.value
      }
    })
    const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
    const a = document.createElement('a')
    a.href = url
    const monthName = months[monthlyStats.value.period.month - 1]
    a.download = `monthly-report-${monthName}-${monthlyStats.value.period.year}.pdf`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  } catch (err) {
    console.error(err)
    alert('Error downloading PDF file')
  }
}

onMounted(() => {
  // Set default week start to current week's Monday
  const today = new Date()
  const day = today.getDay()
  const diff = today.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(today.setDate(diff))
  weekStartDate.value = monday.toISOString().split('T')[0]
})
</script>

<style scoped>
.table {
  margin-top: 1rem;
}

.badge {
  font-size: 0.875rem;
  padding: 0.35em 0.65em;
}

.table-responsive:hover {
  box-shadow: 0 8px 15px rgba(143, 188, 143, 0.15);
}

tr:hover {
  background-color: #f0fff0;
}
</style>

