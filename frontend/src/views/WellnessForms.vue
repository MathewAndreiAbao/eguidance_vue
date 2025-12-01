<template>
  <div class="wellness-forms-container">
    <!-- Header -->
    <div class="header-section">
      <h2 class="page-title">Wellness Forms</h2>
      <p class="page-description">Complete wellness assessments to track your mental health progress</p>
    </div>

    <!-- Loading indicator -->
    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
      <p>Loading wellness forms...</p>
    </div>

    <!-- Error message -->
    <div v-else-if="error" class="error-container">
      <div class="alert alert-danger">
        {{ error }}
        <button @click="loadForms" class="retry-button">Retry</button>
      </div>
    </div>

    <!-- Main content -->
    <div v-else class="content-section">
      <!-- Tabs for different sections -->
      <div class="tabs-container">
        <button 
          :class="['tab', { active: activeTab === 'forms' }]"
          @click="activeTab = 'forms'"
        >
          Available Forms
        </button>
        <button 
          :class="['tab', { active: activeTab === 'my-responses' }]"
          @click="activeTab = 'my-responses'"
          v-if="user && user.role === 'student'"
        >
          My Responses
        </button>
        <button 
          :class="['tab', { active: activeTab === 'student-responses' }]"
          @click="activeTab = 'student-responses'"
          v-if="user && user.role === 'counselor'"
        >
          Student Responses
        </button>
        <button 
          :class="['tab', { active: activeTab === 'create-form' }]"
          @click="activeTab = 'create-form'"
          v-if="user && user.role === 'counselor'"
        >
          Create Form
        </button>
      </div>

      <!-- Available Forms Tab -->
      <div v-if="activeTab === 'forms'" class="tab-content">
        <div v-if="forms.length === 0" class="no-data">
          <h4>No wellness forms available</h4>
          <p>Check back later for new forms.</p>
        </div>
        <div v-else class="forms-grid">
          <div 
            v-for="form in forms" 
            :key="form.id" 
            class="form-card"
            @click="openForm(form)"
          >
            <div class="form-icon">
              <i :class="getFormIcon(form.form_type)"></i>
            </div>
            <div class="form-details">
              <h3 class="form-title">{{ form.title }}</h3>
              <p class="form-description">{{ form.description || 'No description available' }}</p>
              <div class="form-meta">
                <span class="form-type">{{ formatFormType(form.form_type) }}</span>
                <span class="form-date">{{ formatDate(form.created_at) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- My Responses Tab (Student) -->
      <div v-else-if="activeTab === 'my-responses'" class="tab-content">
        <div v-if="studentResponses.length === 0" class="no-data">
          <h4>No responses yet</h4>
          <p>Complete a wellness form to see your responses here.</p>
        </div>
        <div v-else class="responses-list">
          <div 
            v-for="response in studentResponses" 
            :key="response.id" 
            class="response-card"
            @click="viewResponse(response)"
          >
            <div class="response-header">
              <h3 class="response-title">{{ response.form_title }}</h3>
              <span class="response-score" v-if="response.score !== null">Score: {{ response.score }}</span>
            </div>
            <div class="response-meta">
              <span class="response-date">{{ formatDate(response.submitted_at) }}</span>
              <span class="response-type">{{ formatFormType(response.form_type) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Student Responses Tab (Counselor) -->
      <div v-else-if="activeTab === 'student-responses'" class="tab-content">
        <div v-if="counselorResponses.length === 0" class="no-data">
          <h4>No student responses</h4>
          <p>Students have not submitted any responses to your forms yet.</p>
        </div>
        <div v-else class="responses-list">
          <div 
            v-for="response in counselorResponses" 
            :key="response.id" 
            class="response-card counselor-response"
            @click="viewCounselorResponse(response)"
          >
            <div class="response-header">
              <h3 class="response-title">{{ response.form_title }}</h3>
              <span class="response-score" v-if="response.score !== null">Score: {{ response.score }}</span>
            </div>
            <div class="response-meta">
              <span class="student-info">{{ response.student_name }} ({{ response.student_email }})</span>
              <span class="response-date">{{ formatDate(response.submitted_at) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Create Form Tab (Counselor) -->
      <div v-else-if="activeTab === 'create-form'" class="tab-content">
        <div class="form-container">
          <h3>Create New Wellness Form</h3>
          <form @submit.prevent="createForm" class="create-form">
            <div class="form-group">
              <label for="title">Form Title</label>
              <input 
                type="text" 
                id="title" 
                v-model="newForm.title" 
                class="form-control" 
                required
                placeholder="Enter form title"
              >
            </div>
            
            <div class="form-group">
              <label for="description">Description</label>
              <textarea 
                id="description" 
                v-model="newForm.description" 
                class="form-control" 
                rows="3"
                placeholder="Enter form description"
              ></textarea>
            </div>
            
            <div class="form-group">
              <label for="form_type">Form Type</label>
              <select id="form_type" v-model="newForm.form_type" class="form-control" required>
                <option value="">Select form type</option>
                <option value="anxiety">Anxiety Assessment</option>
                <option value="depression">Depression Assessment</option>
                <option value="stress">Stress Assessment</option>
                <option value="general_wellness">General Wellness</option>
              </select>
            </div>
            
            <div class="form-actions">
              <button type="button" @click="resetForm" class="btn btn-secondary">Reset</button>
              <button type="submit" :disabled="creatingForm" class="btn btn-primary">
                {{ creatingForm ? 'Creating...' : 'Create Form' }}
              </button>
            </div>
            
            <div v-if="createFormError" class="error-message">
              {{ createFormError }}
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Form Modal -->
    <div v-if="showFormModal" class="modal-overlay" @click="closeFormModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ selectedForm.title }}</h3>
          <button @click="closeFormModal" class="close-button">&times;</button>
        </div>
        <div class="modal-body">
          <p class="form-description-modal">{{ selectedForm.description }}</p>
          
          <form @submit.prevent="submitForm" class="wellness-form">
            <div class="question-section" v-for="(question, index) in getFormQuestions(selectedForm.form_type)" :key="index">
              <h4>{{ question.text }}</h4>
              <div class="options">
                <label 
                  v-for="option in question.options" 
                  :key="option.value" 
                  class="option-label"
                >
                  <input 
                    type="radio" 
                    :name="'question-' + index" 
                    :value="option.value" 
                    v-model="formResponses[index]"
                    required
                  >
                  <span>{{ option.label }}</span>
                </label>
              </div>
            </div>
            
            <div class="form-actions">
              <button type="button" @click="closeFormModal" class="btn btn-secondary">Cancel</button>
              <button type="submit" :disabled="submittingForm" class="btn btn-primary">
                {{ submittingForm ? 'Submitting...' : 'Submit Form' }}
              </button>
            </div>
            
            <div v-if="submitFormError" class="error-message">
              {{ submitFormError }}
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Response Modal -->
    <div v-if="showResponseModal" class="modal-overlay" @click="closeResponseModal">
      <div class="modal-content response-modal" @click.stop>
        <div class="modal-header">
          <h3>{{ selectedResponse.form_title }} Response</h3>
          <button @click="closeResponseModal" class="close-button">&times;</button>
        </div>
        <div class="modal-body">
          <div class="response-details">
            <div class="response-info">
              <p><strong>Date:</strong> {{ formatDate(selectedResponse.submitted_at) }}</p>
              <p><strong>Type:</strong> {{ formatFormType(selectedResponse.form_type) }}</p>
              <p v-if="selectedResponse.score !== null"><strong>Score:</strong> {{ selectedResponse.score }}</p>
            </div>
            
            <div class="response-answers" v-if="selectedResponse.responses">
              <h4>Answers:</h4>
              <div 
                class="answer-item" 
                v-for="(answer, index) in getFormQuestions(selectedResponse.form_type)" 
                :key="index"
              >
                <p><strong>{{ answer.text }}</strong></p>
                <p>{{ getAnswerLabel(selectedResponse.form_type, index, selectedResponse.responses[index]) }}</p>
              </div>
            </div>
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

const store = useUserStore()
const user = computed(() => store.user)

// State variables
const activeTab = ref('forms')
const loading = ref(false)
const creatingForm = ref(false)
const submittingForm = ref(false)
const error = ref(null)
const createFormError = ref(null)
const submitFormError = ref(null)

// Data
const forms = ref([])
const studentResponses = ref([])
const counselorResponses = ref([])

// Form data
const newForm = reactive({
  title: '',
  description: '',
  form_type: ''
})

// Form interaction
const showFormModal = ref(false)
const selectedForm = ref({})
const formResponses = ref([])

const showResponseModal = ref(false)
const selectedResponse = ref({})

// Methods
function formatDate(dateString) {
  const options = { year: 'numeric', month: 'short', day: 'numeric' }
  return new Date(dateString).toLocaleDateString(undefined, options)
}

function formatFormType(type) {
  const typeMap = {
    'anxiety': 'Anxiety Assessment',
    'depression': 'Depression Assessment',
    'stress': 'Stress Assessment',
    'general_wellness': 'General Wellness'
  }
  return typeMap[type] || type
}

function getFormIcon(type) {
  const iconMap = {
    'anxiety': 'fas fa-brain',
    'depression': 'fas fa-cloud-sun',
    'stress': 'fas fa-heartbeat',
    'general_wellness': 'fas fa-leaf'
  }
  return iconMap[type] || 'fas fa-file-alt'
}

function getFormQuestions(formType) {
  // Sample questions for different form types
  const questions = {
    'anxiety': [
      {
        text: 'Feeling nervous, anxious, or on edge',
        options: [
          { value: 0, label: 'Not at all' },
          { value: 1, label: 'Several days' },
          { value: 2, label: 'More than half the days' },
          { value: 3, label: 'Nearly every day' }
        ]
      },
      {
        text: 'Not being able to stop or control worrying',
        options: [
          { value: 0, label: 'Not at all' },
          { value: 1, label: 'Several days' },
          { value: 2, label: 'More than half the days' },
          { value: 3, label: 'Nearly every day' }
        ]
      },
      {
        text: 'Worrying too much about different things',
        options: [
          { value: 0, label: 'Not at all' },
          { value: 1, label: 'Several days' },
          { value: 2, label: 'More than half the days' },
          { value: 3, label: 'Nearly every day' }
        ]
      }
    ],
    'depression': [
      {
        text: 'Little interest or pleasure in doing things',
        options: [
          { value: 0, label: 'Not at all' },
          { value: 1, label: 'Several days' },
          { value: 2, label: 'More than half the days' },
          { value: 3, label: 'Nearly every day' }
        ]
      },
      {
        text: 'Feeling down, depressed, or hopeless',
        options: [
          { value: 0, label: 'Not at all' },
          { value: 1, label: 'Several days' },
          { value: 2, label: 'More than half the days' },
          { value: 3, label: 'Nearly every day' }
        ]
      },
      {
        text: 'Trouble falling or staying asleep, or sleeping too much',
        options: [
          { value: 0, label: 'Not at all' },
          { value: 1, label: 'Several days' },
          { value: 2, label: 'More than half the days' },
          { value: 3, label: 'Nearly every day' }
        ]
      }
    ],
    'stress': [
      {
        text: 'In the last month, how often have you felt upset because of something that happened unexpectedly?',
        options: [
          { value: 0, label: 'Never' },
          { value: 1, label: 'Almost never' },
          { value: 2, label: 'Sometimes' },
          { value: 3, label: 'Fairly often' },
          { value: 4, label: 'Very often' }
        ]
      },
      {
        text: 'In the last month, how often have you felt that you were unable to control the important things in your life?',
        options: [
          { value: 0, label: 'Never' },
          { value: 1, label: 'Almost never' },
          { value: 2, label: 'Sometimes' },
          { value: 3, label: 'Fairly often' },
          { value: 4, label: 'Very often' }
        ]
      },
      {
        text: 'In the last month, how often have you felt confident about your ability to handle your personal problems?',
        options: [
          { value: 4, label: 'Very often' },
          { value: 3, label: 'Fairly often' },
          { value: 2, label: 'Sometimes' },
          { value: 1, label: 'Almost never' },
          { value: 0, label: 'Never' }
        ]
      }
    ],
    'general_wellness': [
      {
        text: 'Overall, how would you rate your physical health?',
        options: [
          { value: 1, label: 'Poor' },
          { value: 2, label: 'Fair' },
          { value: 3, label: 'Good' },
          { value: 4, label: 'Very good' },
          { value: 5, label: 'Excellent' }
        ]
      },
      {
        text: 'How satisfied are you with your life?',
        options: [
          { value: 1, label: 'Very dissatisfied' },
          { value: 2, label: 'Dissatisfied' },
          { value: 3, label: 'Neutral' },
          { value: 4, label: 'Satisfied' },
          { value: 5, label: 'Very satisfied' }
        ]
      },
      {
        text: 'How often do you engage in physical activity?',
        options: [
          { value: 1, label: 'Never' },
          { value: 2, label: 'Rarely' },
          { value: 3, label: 'Sometimes' },
          { value: 4, label: 'Often' },
          { value: 5, label: 'Very often' }
        ]
      }
    ]
  }
  
  return questions[formType] || []
}

function getAnswerLabel(formType, questionIndex, answerValue) {
  const questions = getFormQuestions(formType)
  if (questions[questionIndex] && questions[questionIndex].options) {
    const option = questions[questionIndex].options.find(opt => opt.value == answerValue)
    return option ? option.label : answerValue
  }
  return answerValue
}

async function loadForms() {
  loading.value = true
  error.value = null
  
  try {
    const response = await api.get('/wellness')
    forms.value = response.data
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to load wellness forms'
    console.error('Error loading forms:', err)
  } finally {
    loading.value = false
  }
}

async function loadStudentResponses() {
  try {
    const response = await api.get('/wellness/responses/student')
    studentResponses.value = response.data
  } catch (err) {
    console.error('Error loading student responses:', err)
  }
}

async function loadCounselorResponses() {
  try {
    const response = await api.get('/wellness/responses/counselor')
    counselorResponses.value = response.data
  } catch (err) {
    console.error('Error loading counselor responses:', err)
  }
}

function openForm(form) {
  selectedForm.value = form
  formResponses.value = []
  showFormModal.value = true
  
  // Initialize responses array with null values
  const questions = getFormQuestions(form.form_type)
  formResponses.value = Array(questions.length).fill(null)
}

function closeFormModal() {
  showFormModal.value = false
  selectedForm.value = {}
  formResponses.value = []
  submitFormError.value = null
}

async function submitForm() {
  submittingForm.value = true
  submitFormError.value = null
  
  try {
    // Create responses object
    const responses = {}
    formResponses.value.forEach((value, index) => {
      responses[index] = value
    })
    
    await api.post('/wellness/responses', {
      form_id: selectedForm.value.id,
      responses
    })
    
    closeFormModal()
    
    // Reload responses if needed
    if (activeTab.value === 'my-responses') {
      await loadStudentResponses()
    }
    
    // Show success message
    alert('Form submitted successfully!')
  } catch (err) {
    submitFormError.value = err.response?.data?.message || 'Failed to submit form'
    console.error('Error submitting form:', err)
  } finally {
    submittingForm.value = false
  }
}

function viewResponse(response) {
  selectedResponse.value = response
  showResponseModal.value = true
}

function viewCounselorResponse(response) {
  selectedResponse.value = response
  showResponseModal.value = true
}

function closeResponseModal() {
  showResponseModal.value = false
  selectedResponse.value = {}
}

async function createForm() {
  creatingForm.value = true
  createFormError.value = null
  
  try {
    await api.post('/wellness', newForm)
    resetForm()
    
    // Reload forms
    await loadForms()
    
    // Show success message
    alert('Form created successfully!')
  } catch (err) {
    createFormError.value = err.response?.data?.message || 'Failed to create form'
    console.error('Error creating form:', err)
  } finally {
    creatingForm.value = false
  }
}

function resetForm() {
  newForm.title = ''
  newForm.description = ''
  newForm.form_type = ''
  createFormError.value = null
}

// Lifecycle
onMounted(async () => {
  await loadForms()
  
  if (user.value.role === 'student') {
    await loadStudentResponses()
  } else if (user.value.role === 'counselor') {
    await loadCounselorResponses()
  }
})
</script>

<style scoped>
.wellness-forms-container {
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

.forms-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.form-card {
  border: 2px solid #E5E7EB;
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: white;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.form-card:hover {
  border-color: #8FBC8F;
  transform: translateY(-5px);
  box-shadow: 0 10px 15px rgba(143, 188, 143, 0.1);
}

.form-icon {
  font-size: 2rem;
  color: #8FBC8F;
  margin-bottom: 15px;
}

.form-title {
  color: #374151;
  margin: 0 0 10px 0;
  font-size: 1.25rem;
}

.form-description {
  color: #6B7280;
  margin: 0 0 15px 0;
  font-size: 0.95rem;
}

.form-meta {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
}

.form-type {
  background-color: #E0FFE0;
  color: #8FBC8F;
  padding: 4px 8px;
  border-radius: 20px;
}

.form-date {
  color: #9CA3AF;
}

.responses-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.response-card {
  border: 2px solid #E5E7EB;
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: white;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.response-card:hover {
  border-color: #8FBC8F;
  transform: translateY(-3px);
  box-shadow: 0 6px 10px rgba(143, 188, 143, 0.1);
}

.counselor-response {
  border-color: #D1D5DB;
}

.response-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.response-title {
  color: #374151;
  margin: 0;
  font-size: 1.1rem;
}

.response-score {
  background-color: #8FBC8F;
  color: white;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 500;
}

.response-meta {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  color: #9CA3AF;
}

.student-info {
  color: #374151;
  font-weight: 500;
}

.form-container {
  max-width: 600px;
  margin: 0 auto;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #374151;
}

.form-control {
  width: 100%;
  padding: 12px;
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

.error-message {
  color: #EF4444;
  background-color: #FEF2F2;
  padding: 12px;
  border-radius: 8px;
  margin-top: 15px;
  border: 1px solid #FECACA;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 16px;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #E5E7EB;
}

.modal-header h3 {
  margin: 0;
  color: #374151;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #9CA3AF;
}

.close-button:hover {
  color: #374151;
}

.modal-body {
  padding: 20px;
}

.form-description-modal {
  color: #6B7280;
  margin-bottom: 20px;
}

.question-section {
  margin-bottom: 25px;
}

.question-section h4 {
  color: #374151;
  margin-bottom: 15px;
}

.options {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.option-label {
  display: flex;
  align-items: center;
  padding: 12px;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.option-label:hover {
  border-color: #8FBC8F;
  background-color: #F0FFF0;
}

.option-label input {
  margin-right: 12px;
  transform: scale(1.2);
}

.response-modal .modal-body {
  padding: 0;
}

.response-details {
  padding: 20px;
}

.response-info {
  background-color: #F0FFF0;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.response-info p {
  margin: 8px 0;
}

.answer-item {
  padding: 15px 0;
  border-bottom: 1px solid #E5E7EB;
}

.answer-item:last-child {
  border-bottom: none;
}

.answer-item p:first-child {
  margin-top: 0;
}

.answer-item p:last-child {
  margin-bottom: 0;
  color: #374151;
  font-weight: 500;
}
</style>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>
</file>