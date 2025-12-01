<template>
  <div class="reports-container">
    <h2 class="page-title">Reports</h2>

    <div class="card reports-card">
      <div class="card-body">
        <div class="view-selector">
          <h5 class="card-title">Student Usage Statistics</h5>
          <div class="btn-group">
            <button 
              type="button" 
              class="btn" 
              :class="viewMode === 'weekly' ? 'btn-primary' : 'btn-outline-primary'"
              @click="switchView('weekly')"
            >
              Weekly
            </button>
            <button 
              type="button" 
              class="btn" 
              :class="viewMode === 'monthly' ? 'btn-primary' : 'btn-outline-primary'"
              @click="switchView('monthly')"
            >
              Monthly
            </button>
          </div>
        </div>

        <!-- Weekly View -->
        <div v-if="viewMode === 'weekly'" class="report-view">
          <div class="form-row">
            <div class="form-group">
              <label>Select Week Start Date</label>
              <input 
                type="date" 
                v-model="weekStartDate" 
                class="form-control" 
                @change="loadWeeklyStats"
              />
            </div>
            <div class="form-group">
              <button class="btn btn-primary" @click="loadWeeklyStats">
                <i class="bi bi-search"></i> Load Report
              </button>
            </div>
          </div>

          <div v-if="weeklyStats && weeklyStats.period" class="report-info">
            <div class="info-content">
              <div class="info-text">
                <strong>Period:</strong> {{ formatDate(weeklyStats.period.start) }} to {{ formatDate(weeklyStats.period.end) }} |
                <strong>Total Students:</strong> {{ weeklyStats.total_students }}
              </div>
              <div class="download-buttons">
                <button class="btn btn-sm btn-primary" @click="downloadWeeklyCSV">
                  <i class="bi bi-download"></i> Download CSV
                </button>
                <button class="btn btn-sm btn-primary" @click="downloadWeeklyPDF">
                  <i class="bi bi-download"></i> Download PDF
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Monthly View -->
        <div v-if="viewMode === 'monthly'" class="report-view">
          <div class="form-row">
            <div class="form-group">
              <label>Select Year</label>
              <select v-model="selectedYear" class="form-control" @change="loadMonthlyStats">
                <option v-for="year in years" :key="year" :value="year">{{ year }}</option>
              </select>
            </div>
            <div class="form-group">
              <label>Select Month</label>
              <select v-model="selectedMonth" class="form-control" @change="loadMonthlyStats">
                <option v-for="(month, idx) in months" :key="idx + 1" :value="idx + 1">
                  {{ month }}
                </option>
              </select>
            </div>
            <div class="form-group">
              <button class="btn btn-primary" @click="loadMonthlyStats">
                <i class="bi bi-search"></i> Load Report
              </button>
            </div>
          </div>

          <div v-if="monthlyStats && monthlyStats.period" class="report-info">
            <div class="info-content">
              <div class="info-text">
                <strong>Period:</strong> {{ months[monthlyStats.period.month - 1] }} {{ monthlyStats.period.year }} |
                <strong>Total Students:</strong> {{ monthlyStats.total_students }}
              </div>
              <div class="download-buttons">
                <button class="btn btn-sm btn-primary" @click="downloadMonthlyCSV">
                  <i class="bi bi-download"></i> Download CSV
                </button>
                <button class="btn btn-sm btn-primary" @click="downloadMonthlyPDF">
                  <i class="bi bi-download"></i> Download PDF
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="loading-container">
          <div class="spinner"></div>
          <p>Loading report data...</p>
        </div>

        <!-- Statistics Table -->
        <div v-else-if="(viewMode === 'weekly' && weeklyStats?.students) || (viewMode === 'monthly' && monthlyStats?.students)">
          <div class="table-responsive">
            <table class="reports-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Student Name</th>
                  <th>Email</th>
                  <th>Total Appointments</th>
                  <th>Approved</th>
                  <th>Successful</th>
                  <th v-if="viewMode === 'monthly'">First Appointment</th>
                  <th v-if="viewMode === 'monthly'">Last Appointment</th>
                </tr>
              </thead>
              <tbody>
                <tr 
                  v-for="(student, index) in paginatedStudents" 
                  :key="student.id"
                >
                  <td>{{ startIndex + index + 1 }}</td>
                  <td>{{ student.name }}</td>
                  <td>{{ student.email }}</td>
                  <td>
                    <span class="badge badge-primary">{{ student.appointment_count }}</span>
                  </td>
                  <td>
                    <span class="badge badge-info">{{ student.approved_count || 0 }}</span>
                  </td>
                  <td>
                    <span class="badge badge-success">{{ student.successful_count || 0 }}</span>
                  </td>
                  <td v-if="viewMode === 'monthly'">
                    {{ student.first_appointment ? formatDate(student.first_appointment) : '-' }}
                  </td>
                  <td v-if="viewMode === 'monthly'">
                    {{ student.last_appointment ? formatDate(student.last_appointment) : '-' }}
                  </td>
                </tr>
                <tr v-if="paginatedStudents.length === 0">
                  <td :colspan="viewMode === 'monthly' ? 8 : 6" class="no-data">
                    No students found for the selected period.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <!-- Pagination -->
          <Pagination 
            v-if="(currentStats?.students?.length || 0) > studentsPerPage"
            :current-page="currentPage"
            :total-pages="totalPages"
            :total-items="currentStats?.students?.length || 0"
            :items-per-page="studentsPerPage"
            @update:current-page="currentPage = $event"
          />
        </div>

        <!-- Empty State -->
        <div v-else class="no-report">
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
import Pagination from '../components/Pagination.vue'

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

// Pagination
const currentPage = ref(1)
const studentsPerPage = ref(10)

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

// Pagination computed properties
const paginatedStudents = computed(() => {
  if (!currentStats.value?.students) return []
  
  const start = (currentPage.value - 1) * studentsPerPage.value
  const end = start + studentsPerPage.value
  return currentStats.value.students.slice(start, end)
})

const totalPages = computed(() => {
  if (!currentStats.value?.students) return 0
  return Math.ceil(currentStats.value.students.length / studentsPerPage.value)
})

const startIndex = computed(() => {
  return (currentPage.value - 1) * studentsPerPage.value
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
    // Reset pagination when loading new data
    currentPage.value = 1
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
    // Reset pagination when loading new data
    currentPage.value = 1
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
.reports-container {
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

.reports-card {
  border-radius: 16px;
  box-shadow: 0 6px 15px rgba(143, 188, 143, 0.1);
  border: 2px solid #8FBC8F;
}

.card-body {
  padding: 30px;
}

.view-selector {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #E5E7EB;
}

.card-title {
  color: #8FBC8F;
  font-weight: 600;
  margin: 0;
}

.btn-group {
  display: flex;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.btn {
  padding: 10px 20px;
  border: none;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
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
  background-color: white;
  color: #8FBC8F;
  border: 1px solid #8FBC8F;
}

.btn-outline-primary:hover {
  background-color: #f0fff0;
}

.report-view {
  margin-bottom: 30px;
}

.form-row {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  margin-bottom: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-weight: 500;
  color: #374151;
}

.form-control {
  padding: 10px 15px;
  border: 1px solid #D1D5DB;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
}

.form-control:focus {
  outline: none;
  border-color: #8FBC8F;
  box-shadow: 0 0 0 3px rgba(143, 188, 143, 0.2);
}

.report-info {
  background-color: #E0FFE0;
  border: 1px solid #98FB98;
  color: #374151;
  border-radius: 10px;
  padding: 15px;
  margin-bottom: 20px;
}

.info-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 15px;
}

.info-text {
  flex: 1;
}

.download-buttons {
  display: flex;
  gap: 10px;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 0.875rem;
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

.table-responsive {
  border-radius: 10px;
  box-shadow: 0 4px 10px rgba(143, 188, 143, 0.1);
  overflow: hidden;
  margin-bottom: 20px;
}

.reports-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

.reports-table thead {
  background: #8FBC8F;
  color: white;
}

.reports-table th {
  padding: 15px 20px;
  text-align: left;
  font-weight: 600;
}

.reports-table th:first-child {
  border-top-left-radius: 10px;
}

.reports-table th:last-child {
  border-top-right-radius: 10px;
}

.reports-table tbody tr {
  transition: all 0.3s ease;
}

.reports-table tbody tr:hover {
  background-color: #f0fff0;
}

.reports-table td {
  padding: 15px 20px;
  border-bottom: 1px solid #E5E7EB;
}

.badge {
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
}

.badge-primary {
  background-color: #8FBC8F;
  color: white;
}

.badge-info {
  background-color: #98FB98;
  color: #374151;
}

.badge-success {
  background-color: #90EE90;
  color: #374151;
}

.no-data {
  text-align: center;
  color: #6B7280;
  padding: 30px;
}

.no-report {
  text-align: center;
  padding: 50px 20px;
  color: #6B7280;
}

@media (max-width: 768px) {
  .view-selector {
    flex-direction: column;
    align-items: stretch;
  }
  
  .form-row {
    flex-direction: column;
  }
  
  .info-content {
    flex-direction: column;
    align-items: stretch;
  }
  
  .download-buttons {
    justify-content: center;
  }
  
  .reports-table {
    font-size: 0.875rem;
  }
  
  .reports-table th,
  .reports-table td {
    padding: 10px 15px;
  }
}
</style>