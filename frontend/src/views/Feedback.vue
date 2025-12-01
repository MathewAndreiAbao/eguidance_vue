<template>
  <div class="feedback-container">
    <div class="card feedback-card">
      <div class="card-body">
        <h2 class="page-title">Feedback System</h2>
        
        <!-- Tabs -->
        <div class="tabs">
          <button 
            :class="['tab', { active: activeTab === 'give-feedback' }]"
            @click="activeTab = 'give-feedback'"
            v-if="user && user.role === 'student'"
          >
            Give Feedback
          </button>
          <button 
            :class="['tab', { active: activeTab === 'my-feedback' }]"
            @click="activeTab = 'my-feedback'"
            v-if="user && user.role === 'student'"
          >
            My Feedback
          </button>
          <button 
            :class="['tab', { active: activeTab === 'received-feedback' }]"
            @click="activeTab = 'received-feedback'"
            v-if="user && user.role === 'counselor'"
          >
            Received Feedback
          </button>
        </div>

        <!-- Give Feedback Tab (Student) -->
        <div v-if="activeTab === 'give-feedback' && user && user.role === 'student'" class="tab-content">
          <h3>Give Feedback to a Counselor</h3>
          
          <form @submit.prevent="submitFeedback" class="modern-form">
            <div class="form-group">
              <label>Select Counselor</label>
              <select v-model="newFeedback.counselor_id" class="form-control" required>
                <option value="">Choose a counselor</option>
                <option v-for="counselor in counselors" :key="counselor.id" :value="counselor.id">
                  {{ counselor.name }}
                </option>
              </select>
            </div>
            
            <div class="form-group">
              <label>Rating</label>
              <div class="rating-stars">
                <span 
                  v-for="star in 5" 
                  :key="star" 
                  class="star"
                  :class="{ filled: star <= newFeedback.rating }"
                  @click="setRating(star)"
                >
                  ★
                </span>
              </div>
              <div class="rating-text">
                {{ getRatingText(newFeedback.rating) }}
              </div>
            </div>
            
            <div class="form-group">
              <label>Comment (Optional)</label>
              <textarea 
                v-model="newFeedback.comment" 
                class="form-control" 
                rows="4" 
                placeholder="Share your experience with this counselor..."
              ></textarea>
            </div>
            
            <div class="form-actions">
              <button 
                type="submit" 
                class="btn btn-primary" 
                :disabled="submittingFeedback"
              >
                {{ submittingFeedback ? 'Submitting...' : 'Submit Feedback' }}
              </button>
            </div>
            
            <div v-if="feedbackError" class="error-message">
              {{ feedbackError }}
            </div>
          </form>
        </div>

        <!-- My Feedback Tab (Student) -->
        <div v-else-if="activeTab === 'my-feedback' && user && user.role === 'student'" class="tab-content">
          <h3>My Feedback</h3>
          
          <div v-if="paginatedStudentFeedback.length === 0" class="no-data">
            <h4>You haven't given any feedback yet</h4>
            <p>Provide feedback to counselors you've had appointments with.</p>
          </div>
          
          <div v-else>
            <div class="feedback-list">
              <div 
                v-for="feedback in paginatedStudentFeedback" 
                :key="feedback.id" 
                class="feedback-card"
              >
                <div class="feedback-header">
                  <h4>{{ feedback.counselor_name }}</h4>
                  <div class="rating-display">
                    <span 
                      v-for="star in 5" 
                      :key="star" 
                      class="star"
                      :class="{ filled: star <= feedback.rating }"
                    >
                      ★
                    </span>
                    <span class="rating-value">({{ feedback.rating }}/5)</span>
                  </div>
                </div>
                <div class="feedback-date">
                  {{ formatDate(feedback.created_at) }}
                </div>
                <div v-if="feedback.comment" class="feedback-comment">
                  "{{ feedback.comment }}"
                </div>
                <div class="feedback-actions">
                  <button class="btn btn-sm btn-outline-primary" @click="editFeedback(feedback)">
                    Edit
                  </button>
                  <button class="btn btn-sm btn-outline-danger" @click="deleteFeedback(feedback.id)">
                    Delete
                  </button>
                </div>
              </div>
            </div>
            
            <!-- Pagination for student feedback -->
            <Pagination 
              v-if="studentFeedback.length > feedbacksPerPage"
              :current-page="currentStudentFeedbackPage"
              :total-pages="totalStudentFeedbackPages"
              :total-items="studentFeedback.length"
              :items-per-page="feedbacksPerPage"
              @update:current-page="currentStudentFeedbackPage = $event"
            />
          </div>
        </div>

        <!-- Received Feedback Tab (Counselor) -->
        <div v-else-if="activeTab === 'received-feedback' && user && user.role === 'counselor'" class="tab-content">
          <h3>Feedback Received</h3>
          
          <div v-if="paginatedCounselorFeedback.length === 0" class="no-data">
            <h4>No feedback received yet</h4>
            <p>Students who have had appointments with you can provide feedback.</p>
          </div>
          
          <div v-else>
            <div class="feedback-list">
              <div 
                v-for="feedback in paginatedCounselorFeedback" 
                :key="feedback.id" 
                class="feedback-card"
              >
                <div class="feedback-header">
                  <h4>{{ feedback.student_name }}</h4>
                  <div class="rating-display">
                    <span 
                      v-for="star in 5" 
                      :key="star" 
                      class="star"
                      :class="{ filled: star <= feedback.rating }"
                    >
                      ★
                    </span>
                    <span class="rating-value">({{ feedback.rating }}/5)</span>
                  </div>
                </div>
                <div class="feedback-date">
                  {{ formatDate(feedback.created_at) }}
                </div>
                <div class="student-email">
                  {{ feedback.student_email }}
                </div>
                <div v-if="feedback.comment" class="feedback-comment">
                  "{{ feedback.comment }}"
                </div>
              </div>
            </div>
            
            <!-- Pagination for counselor feedback -->
            <Pagination 
              v-if="counselorFeedback.length > feedbacksPerPage"
              :current-page="currentCounselorFeedbackPage"
              :total-pages="totalCounselorFeedbackPages"
              :total-items="counselorFeedback.length"
              :items-per-page="feedbacksPerPage"
              @update:current-page="currentCounselorFeedbackPage = $event"
            />
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
const activeTab = ref('give-feedback')
const loading = ref(false)
const submittingFeedback = ref(false)
const feedbackError = ref(null)

// Pagination
const currentStudentFeedbackPage = ref(1)
const currentCounselorFeedbackPage = ref(1)
const feedbacksPerPage = ref(5)

// Data
const counselors = ref([])
const studentFeedback = ref([])
const counselorFeedback = ref([])

// Form data
const newFeedback = reactive({
  counselor_id: '',
  rating: 0,
  comment: ''
})

// Computed properties for pagination
const paginatedStudentFeedback = computed(() => {
  const start = (currentStudentFeedbackPage.value - 1) * feedbacksPerPage.value
  const end = start + feedbacksPerPage.value
  return studentFeedback.value.slice(start, end)
})

const totalStudentFeedbackPages = computed(() => {
  return Math.ceil(studentFeedback.value.length / feedbacksPerPage.value)
})

const paginatedCounselorFeedback = computed(() => {
  const start = (currentCounselorFeedbackPage.value - 1) * feedbacksPerPage.value
  const end = start + feedbacksPerPage.value
  return counselorFeedback.value.slice(start, end)
})

const totalCounselorFeedbackPages = computed(() => {
  return Math.ceil(counselorFeedback.value.length / feedbacksPerPage.value)
})

// Methods
function formatDate(dateString) {
  const options = { year: 'numeric', month: 'short', day: 'numeric' }
  return new Date(dateString).toLocaleDateString(undefined, options)
}

function getRatingText(rating) {
  const texts = {
    1: 'Poor',
    2: 'Fair',
    3: 'Good',
    4: 'Very Good',
    5: 'Excellent'
  }
  return texts[rating] || 'Select rating'
}

function setRating(rating) {
  newFeedback.rating = rating
}

async function loadCounselors() {
  try {
    const response = await api.get('/users/counselors')
    counselors.value = response.data
  } catch (err) {
    console.error('Error loading counselors:', err)
  }
}

async function loadStudentFeedback() {
  try {
    const response = await api.get('/feedback/student')
    studentFeedback.value = response.data
  } catch (err) {
    console.error('Error loading student feedback:', err)
  }
}

async function loadCounselorFeedback() {
  try {
    const response = await api.get('/feedback/counselor')
    counselorFeedback.value = response.data
  } catch (err) {
    console.error('Error loading counselor feedback:', err)
  }
}

async function submitFeedback() {
  submittingFeedback.value = true
  feedbackError.value = null
  
  try {
    const response = await api.post('/feedback', {
      counselor_id: newFeedback.counselor_id,
      rating: newFeedback.rating,
      comment: newFeedback.comment
    })
    
    // Reset form
    newFeedback.counselor_id = ''
    newFeedback.rating = 0
    newFeedback.comment = ''
    
    // Show success message
    alert('Feedback submitted successfully!')
    
    // Reload student feedback
    await loadStudentFeedback()
  } catch (err) {
    feedbackError.value = err.response?.data?.message || 'Failed to submit feedback'
    console.error('Error submitting feedback:', err)
  } finally {
    submittingFeedback.value = false
  }
}

async function editFeedback(feedback) {
  // For simplicity, we'll just reset the form with the feedback data
  newFeedback.counselor_id = feedback.counselor_id
  newFeedback.rating = feedback.rating
  newFeedback.comment = feedback.comment || ''
  activeTab.value = 'give-feedback'
}

async function deleteFeedback(id) {
  if (!confirm('Are you sure you want to delete this feedback?')) return
  
  try {
    await api.delete(`/feedback/${id}`)
    alert('Feedback deleted successfully!')
    await loadStudentFeedback()
  } catch (err) {
    const errorMessage = err.response?.data?.message || 'Failed to delete feedback'
    alert(errorMessage)
    console.error('Error deleting feedback:', err)
  }
}

// Lifecycle
onMounted(async () => {
  if (user.value) {
    if (user.value.role === 'student') {
      await Promise.all([
        loadCounselors(),
        loadStudentFeedback()
      ])
    } else if (user.value.role === 'counselor') {
      await loadCounselorFeedback()
    }
  }
})
</script>

<style scoped>
.feedback-container {
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

.feedback-card {
  border-radius: 16px;
  box-shadow: 0 6px 15px rgba(143, 188, 143, 0.1);
  border: 2px solid #8FBC8F;
}

.card-body {
  padding: 30px;
}

.tabs {
  display: flex;
  border-bottom: 2px solid #E5E7EB;
  margin-bottom: 30px;
}

.tab {
  padding: 12px 20px;
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

.tab-content {
  padding: 20px 0;
}

.tab-content h3 {
  color: #374151;
  margin-bottom: 25px;
  text-align: center;
}

.modern-form .form-group {
  margin-bottom: 25px;
}

.modern-form .form-group label {
  display: block;
  margin-bottom: 10px;
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

.rating-stars {
  display: flex;
  justify-content: center;
  font-size: 2.5rem;
  margin: 20px 0;
}

.star {
  color: #D1D5DB;
  cursor: pointer;
  transition: color 0.2s ease;
}

.star.filled {
  color: #FBBF24;
}

.star:hover {
  color: #FCD34D;
}

.rating-text {
  text-align: center;
  font-size: 1.2rem;
  font-weight: 500;
  color: #374151;
  margin-top: 10px;
}

.form-actions {
  display: flex;
  justify-content: center;
  margin-top: 30px;
}

.btn {
  padding: 12px 25px;
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
  padding: 6px 12px;
  font-size: 0.875rem;
}

.error-message {
  color: #EF4444;
  background-color: #FEF2F2;
  padding: 15px;
  border-radius: 8px;
  margin-top: 20px;
  border: 1px solid #FECACA;
  text-align: center;
}

.no-data {
  text-align: center;
  padding: 50px 20px;
  color: #6B7280;
}

.no-data h4 {
  color: #374151;
  margin-bottom: 15px;
}

.feedback-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 25px;
  margin-bottom: 30px;
}

.feedback-card {
  border: 2px solid #E5E7EB;
  border-radius: 12px;
  padding: 20px;
  background: white;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.feedback-card:hover {
  border-color: #8FBC8F;
  transform: translateY(-3px);
  box-shadow: 0 6px 10px rgba(143, 188, 143, 0.1);
}

.feedback-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.feedback-header h4 {
  margin: 0;
  color: #374151;
}

.rating-display {
  display: flex;
  align-items: center;
}

.rating-display .star {
  font-size: 1.2rem;
  color: #D1D5DB;
}

.rating-display .star.filled {
  color: #FBBF24;
}

.rating-value {
  margin-left: 8px;
  font-weight: 500;
  color: #374151;
}

.feedback-date {
  color: #9CA3AF;
  font-size: 0.9rem;
  margin-bottom: 10px;
}

.student-email {
  color: #8FBC8F;
  font-size: 0.9rem;
  margin-bottom: 10px;
}

.feedback-comment {
  background-color: #F9FAFB;
  border-radius: 8px;
  padding: 15px;
  margin: 15px 0;
  font-style: italic;
  color: #374151;
}

.feedback-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

@media (max-width: 768px) {
  .feedback-list {
    grid-template-columns: 1fr;
  }
  
  .feedback-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .tabs {
    flex-wrap: wrap;
  }
  
  .tab {
    flex: 1 0 auto;
    text-align: center;
  }
}
</style>