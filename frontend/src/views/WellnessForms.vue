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
        <div v-if="paginatedForms.length === 0" class="no-data">
          <h4>No wellness forms available</h4>
          <p>Check back later for new forms.</p>
        </div>
        <div v-else>
          <div class="forms-grid">
            <div 
              v-for="form in paginatedForms" 
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
          
          <!-- Pagination for forms -->
          <Pagination 
            v-if="forms.length > formsPerPage"
            :current-page="currentFormPage"
            :total-pages="totalFormPages"
            :total-items="forms.length"
            :items-per-page="formsPerPage"
            @update:current-page="currentFormPage = $event"
          />
        </div>
      </div>

      <!-- My Responses Tab (Student) -->
      <div v-else-if="activeTab === 'my-responses'" class="tab-content">
        <div v-if="paginatedStudentResponses.length === 0" class="no-data">
          <h4>No responses yet</h4>
          <p>Complete a wellness form to see your responses here.</p>
        </div>
        <div v-else>
          <div class="responses-list">
            <div 
              v-for="response in paginatedStudentResponses" 
              :key="response.id" 
              class="response-card"
            >
              <div class="response-header">
                <h3 class="response-title">{{ response.form_title }}</h3>
                <span class="response-score" v-if="response.score !== null">Score: {{ response.score }}</span>
              </div>
              <div class="response-meta">
                <span class="response-date">{{ formatDate(response.submitted_at) }}</span>
                <span class="response-type">{{ formatFormType(response.form_type) }}</span>
              </div>
              <div class="response-actions">
                <button class="btn btn-sm btn-outline-primary" @click="viewResponse(response)">
                  View
                </button>
                <button class="btn btn-sm btn-outline-secondary" @click="editResponse(response)">
                  Edit
                </button>
              </div>
            </div>
          </div>
          
          <!-- Pagination for student responses -->
          <Pagination 
            v-if="studentResponses.length > responsesPerPage"
            :current-page="currentStudentResponsePage"
            :total-pages="totalStudentResponsePages"
            :total-items="studentResponses.length"
            :items-per-page="responsesPerPage"
            @update:current-page="currentStudentResponsePage = $event"
          />
        </div>
      </div>

      <!-- Student Responses Tab (Counselor) -->
      <div v-else-if="activeTab === 'student-responses'" class="tab-content">
        <div v-if="paginatedCounselorResponses.length === 0" class="no-data">
          <h4>No student responses</h4>
          <p>Students have not submitted any responses to your forms yet.</p>
        </div>
        <div v-else>
          <div class="responses-list">
            <div 
              v-for="response in paginatedCounselorResponses" 
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
          
          <!-- Pagination for counselor responses -->
          <Pagination 
            v-if="counselorResponses.length > responsesPerPage"
            :current-page="currentCounselorResponsePage"
            :total-pages="totalCounselorResponsePages"
            :total-items="counselorResponses.length"
            :items-per-page="responsesPerPage"
            @update:current-page="currentCounselorResponsePage = $event"
          />
        </div>
      </div>

      <!-- Create Form Tab (Counselor) -->
      <div v-else-if="activeTab === 'create-form'" class="tab-content">
        <div class="form-container">
          <h3>Create New Wellness Form</h3>
          <form @submit.prevent="createForm" class="modern-form">
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
            
            <!-- Dynamic Questions Section -->
            <div class="form-group">
              <label>Questions</label>
              <div class="questions-container">
                <div 
                  v-for="(question, index) in newForm.questions" 
                  :key="index" 
                  class="question-item"
                >
                  <div class="question-header">
                    <span>Question {{ index + 1 }}</span>
                    <button 
                      type="button" 
                      class="btn btn-sm btn-danger" 
                      @click="removeQuestion(index)"
                      v-if="newForm.questions.length > 1"
                    >
                      Remove
                    </button>
                  </div>
                  <div class="question-content">
                    <textarea 
                      v-model="question.question_text" 
                      class="form-control" 
                      rows="2"
                      placeholder="Enter your question"
                      required
                    ></textarea>
                    <div class="question-type">
                      <label>Answer Type:</label>
                      <select v-model="question.question_type" class="form-control" @change="onQuestionTypeChange(question)">
                        <option value="text">Open Text</option>
                        <option value="rating">Numeric Rating (1-10)</option>
                        <option value="multiple_choice">Multiple Choice</option>
                        <option value="yes_no">Yes/No</option>
                        <option value="scale_1_5">Scale (1-5)</option>
                      </select>
                    </div>
                    <!-- Options for multiple choice questions -->
                    <div v-if="question.question_type === 'multiple_choice'" class="options-section">
                      <label>Options:</label>
                      <div class="options-container">
                        <div v-for="(option, optIndex) in question.options" :key="optIndex" class="option-item">
                          <input 
                            type="text" 
                            v-model="question.options[optIndex]" 
                            class="form-control option-input" 
                            placeholder="Option text"
                          >
                          <button 
                            type="button" 
                            class="btn btn-sm btn-danger" 
                            @click="removeOption(question, optIndex)"
                            v-if="question.options.length > 2"
                          >
                            Remove
                          </button>
                        </div>
                        <button type="button" class="btn btn-secondary" @click="addOption(question)">
                          Add Option
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <button type="button" class="btn btn-secondary" @click="addQuestion">
                  Add Question
                </button>
              </div>
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
          <h3>{{ editingResponseId ? 'Edit Response: ' + selectedForm.title : selectedForm.title }}</h3>
          <button @click="closeFormModal" class="close-button">&times;</button>
        </div>
        <div class="modal-body">
          <p class="form-description-modal">{{ selectedForm.description }}</p>
          
          <form @submit.prevent="submitForm" class="wellness-form modern-form">
            <div class="question-section" v-for="(question, index) in selectedForm.questions" :key="question.id">
              <h4>{{ question.question_text }}</h4>
              <div class="question-input">
                <textarea 
                  v-if="question.question_type === 'text'"
                  v-model="formResponses[index]" 
                  class="form-control" 
                  rows="3"
                  :placeholder="'Enter your response...'"></textarea>
                <input 
                  v-else-if="question.question_type === 'rating'"
                  type="number" 
                  v-model.number="formResponses[index]" 
                  class="form-control" 
                  min="1" 
                  max="10"
                  :placeholder="'Enter a number between 1-10...'">
                <select 
                  v-else-if="question.question_type === 'multiple_choice'"
                  v-model="formResponses[index]" 
                  class="form-control">
                  <option value="">Select an option</option>
                  <option 
                    v-for="(option, optIndex) in question.options" 
                    :key="optIndex" 
                    :value="option">
                    {{ option }}
                  </option>
                </select>
                <select 
                  v-else-if="question.question_type === 'yes_no'"
                  v-model="formResponses[index]" 
                  class="form-control">
                  <option value="">Select Yes or No</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
                <select 
                  v-else-if="question.question_type === 'scale_1_5'"
                  v-model="formResponses[index]" 
                  class="form-control">
                  <option value="">Select a rating</option>
                  <option value="1">1 - Very Low</option>
                  <option value="2">2 - Low</option>
                  <option value="3">3 - Neutral</option>
                  <option value="4">4 - High</option>
                  <option value="5">5 - Very High</option>
                </select>
                <div v-else>
                  <p>Unsupported question type: {{ question.question_type }}</p>
                </div>
              </div>
            </div>
            
            <div class="form-actions">
              <button type="button" @click="closeFormModal" class="btn btn-secondary">Close</button>
              <button 
                v-if="user && user.role === 'student'"
                type="submit" 
                :disabled="submittingForm" 
                class="btn btn-primary">
                {{ submittingForm ? (editingResponseId ? 'Updating...' : 'Submitting...') : (editingResponseId ? 'Update Response' : 'Submit Form') }}
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
            
            <div class="response-answers" v-if="selectedResponse.responses && selectedResponse.form_questions">
              <h4>Answers:</h4>
              <div 
                class="answer-item" 
                v-for="(question, index) in selectedResponse.form_questions" 
                :key="index"
              >
                <p><strong>{{ question.question_text }}</strong></p>
                <div class="selected-answer">
                  <span class="answer-label">Response:</span>
                  <span class="answer-value">{{ getResponseValue(question.question_type, selectedResponse.responses[index]) }}</span>
                </div>
              </div>
            </div>
            
            <!-- Counselor Notes Section -->
            <div class="counselor-notes-section" v-if="user && user.role === 'counselor'">
              <h4>Counselor Notes</h4>
              <div v-if="!editingNotes">
                <div v-if="selectedResponse.counselor_notes" class="notes-content">
                  {{ selectedResponse.counselor_notes }}
                </div>
                <div v-else class="no-notes">
                  No notes added yet.
                </div>
                <button @click="startEditingNotes" class="btn btn-primary mt-2">{{ selectedResponse.counselor_notes ? 'Edit Notes' : 'Add Notes' }}</button>
              </div>
              <div v-else>
                <textarea 
                  v-model="counselorNotes" 
                  class="form-control" 
                  rows="4" 
                  placeholder="Add your notes about this response..."
                ></textarea>
                <div class="notes-actions mt-2">
                  <button @click="saveCounselorNotes" class="btn btn-primary" :disabled="savingNotes">{{ savingNotes ? 'Saving...' : 'Save Notes' }}</button>
                  <button @click="cancelEditingNotes" class="btn btn-secondary ms-2">Cancel</button>
                </div>
                <div v-if="notesError" class="error-message mt-2">{{ notesError }}</div>
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
import Pagination from '../components/Pagination.vue'

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
const editingResponseId = ref(null)

// Pagination
const currentFormPage = ref(1)
const currentStudentResponsePage = ref(1)
const currentCounselorResponsePage = ref(1)
const formsPerPage = ref(6)
const responsesPerPage = ref(5)

// Data
const forms = ref([])
const studentResponses = ref([])
const counselorResponses = ref([])

// Form data
const newForm = reactive({
  title: '',
  description: '',
  questions: [
    {
      question_text: '',
      question_type: 'text',
      options: []
    }
  ]
})

// Form interaction
const showFormModal = ref(false)
const selectedForm = ref({})
const formResponses = ref([])

const showResponseModal = ref(false)
const selectedResponse = ref({})

// Counselor notes
const editingNotes = ref(false)
const counselorNotes = ref('')
const savingNotes = ref(false)
const notesError = ref(null)

// Computed properties for pagination
const paginatedForms = computed(() => {
  const start = (currentFormPage.value - 1) * formsPerPage.value
  const end = start + formsPerPage.value
  return forms.value.slice(start, end)
})

const totalFormPages = computed(() => {
  return Math.ceil(forms.value.length / formsPerPage.value)
})

const paginatedStudentResponses = computed(() => {
  const start = (currentStudentResponsePage.value - 1) * responsesPerPage.value
  const end = start + responsesPerPage.value
  return studentResponses.value.slice(start, end)
})

const totalStudentResponsePages = computed(() => {
  return Math.ceil(studentResponses.value.length / responsesPerPage.value)
})

const paginatedCounselorResponses = computed(() => {
  const start = (currentCounselorResponsePage.value - 1) * responsesPerPage.value
  const end = start + responsesPerPage.value
  return counselorResponses.value.slice(start, end)
})

const totalCounselorResponsePages = computed(() => {
  return Math.ceil(counselorResponses.value.length / responsesPerPage.value)
})

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





// Get response value for display
function getResponseValue(questionType, responseValue) {
  if (responseValue === null || responseValue === undefined || responseValue === '') {
    return 'No response';
  }
  
  // Handle different question types for display
  switch (questionType) {
    case 'yes_no':
      return responseValue === 'Yes' ? 'Yes ✅' : 'No ❌';
    case 'scale_1_5':
      const scaleLabels = {
        '1': '1 - Very Low',
        '2': '2 - Low',
        '3': '3 - Neutral',
        '4': '4 - High',
        '5': '5 - Very High'
      };
      return scaleLabels[responseValue] || responseValue;
    case 'rating':
      return `${responseValue}/10`;
    case 'multiple_choice':
      return responseValue;
    case 'text':
      return responseValue;
    default:
      return responseValue;
  }
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
  // Fetch the full form details to get the questions
  api.get(`/wellness/${form.id}`)
    .then(formResponse => {
      const detailedForm = formResponse.data;
      
      // Ensure options are properly set for multiple choice questions
      if (detailedForm.questions) {
        detailedForm.questions.forEach(question => {
          if (question.question_type === 'multiple_choice' && !question.options && question.question_options) {
            // Parse options from question_options if needed
            try {
              question.options = JSON.parse(question.question_options);
            } catch (e) {
              question.options = [];
            }
          }
        });
      }
      
      selectedForm.value = detailedForm;
      formResponses.value = [];
      showFormModal.value = true;
      
      // Initialize responses array with null values
      formResponses.value = Array(detailedForm.questions.length).fill(null);
    })
    .catch(err => {
      console.error('Error fetching form:', err);
      alert('Failed to load form details');
    });
}

function closeFormModal() {
  showFormModal.value = false
  selectedForm.value = {}
  formResponses.value = []
  submitFormError.value = null
  editingResponseId.value = null
}

async function submitForm() {
  submittingForm.value = true
  submitFormError.value = null
  
  // Validate that all required questions have responses
  let hasMissingResponse = false;
  for (let i = 0; i < selectedForm.value.questions.length; i++) {
    const question = selectedForm.value.questions[i];
    const response = formResponses.value[i];
    
    // Check if response is missing
    if (response === null || response === undefined || response === '') {
      hasMissingResponse = true;
      break;
    }
    
    // For select inputs, also check if it's the default empty value
    if ((question.question_type === 'multiple_choice' || 
         question.question_type === 'yes_no' || 
         question.question_type === 'scale_1_5') && 
        response === '') {
      hasMissingResponse = true;
      break;
    }
  }
  
  if (hasMissingResponse) {
    submitFormError.value = 'Please answer all questions';
    submittingForm.value = false;
    return;
  }
  
  try {
    // Create responses object
    const responses = {}
    formResponses.value.forEach((value, index) => {
      responses[index] = value
    })
    
    // If we're editing an existing response, update it; otherwise create new
    if (editingResponseId.value) {
      await api.put(`/wellness/responses/${editingResponseId.value}`, {
        responses
      })
    } else {
      await api.post('/wellness/responses', {
        form_id: selectedForm.value.id,
        responses
      })
    }
    
    // Store the editing state for the success message
    const wasEditing = editingResponseId.value;
    
    closeFormModal()
    
    // Reload responses if needed
    if (activeTab.value === 'my-responses') {
      await loadStudentResponses()
    }
    
    // Show success message
    alert(wasEditing ? 'Form response updated successfully!' : 'Form submitted successfully!')
    
    // Reset editing state
    editingResponseId.value = null
  } catch (err) {
    submitFormError.value = err.response?.data?.message || 'Failed to submit form'
    console.error('Error submitting form:', err)
  } finally {
    submittingForm.value = false
  }
}

function viewResponse(response) {
  // Fetch the full form details to get the questions
  api.get(`/wellness/${response.form_id}`)
    .then(formResponse => {
      const form = formResponse.data;

      // Ensure options are properly set for multiple choice questions
      if (form.questions) {
        form.questions.forEach(question => {
          if (question.question_type === 'multiple_choice' && !question.options && question.question_options) {
            // Parse options from question_options if needed
            try {
              question.options = JSON.parse(question.question_options);
            } catch (e) {
              question.options = [];
            }
          }
        });
      }

      // Parse responses
      const parsedResponses = typeof response.responses === 'string' ? JSON.parse(response.responses) : response.responses;

      // Add form questions to the response for display
      const responseWithQuestions = {
        ...response,
        responses: parsedResponses,
        form_questions: form.questions
      };

      selectedResponse.value = responseWithQuestions;
      showResponseModal.value = true;
    })
    .catch(err => {
      console.error('Error fetching form:', err);
      // Fallback to showing response without questions
      selectedResponse.value = response;
      showResponseModal.value = true;
    });
}

function editResponse(response) {
  // First, fetch the full form details to get the questions
  api.get(`/wellness/${response.form_id}`)
    .then(formResponse => {
      const form = formResponse.data;
      
      // Set the form with the response data and store the response ID for updating
      selectedForm.value = form;
      
      // Parse responses and populate form
      const parsedResponses = typeof response.responses === 'string' ? JSON.parse(response.responses) : response.responses;
      formResponses.value = Array(form.questions.length).fill(null);
      
      // Populate responses
      for (let i = 0; i < form.questions.length; i++) {
        formResponses.value[i] = parsedResponses[i] !== undefined ? parsedResponses[i] : null;
      }
      
      // Set editing ID
      editingResponseId.value = response.id;
      
      // Open form modal
      showFormModal.value = true;
    })
    .catch(err => {
      console.error('Error fetching form:', err);
      alert('Failed to load form details');
    });
}

function viewCounselorResponse(response) {
  selectedResponse.value = response
  showResponseModal.value = true
  editingNotes.value = false
  counselorNotes.value = response.counselor_notes || ''
}

function closeResponseModal() {
  showResponseModal.value = false
  selectedResponse.value = {}
  editingNotes.value = false
  counselorNotes.value = ''
  notesError.value = null
}

function startEditingNotes() {
  editingNotes.value = true
  counselorNotes.value = selectedResponse.value.counselor_notes || ''
}

function cancelEditingNotes() {
  editingNotes.value = false
  counselorNotes.value = selectedResponse.value.counselor_notes || ''
  notesError.value = null
}

async function saveCounselorNotes() {
  savingNotes.value = true
  notesError.value = null
  
  try {
    await api.put(`/wellness/responses/counselor/${selectedResponse.value.id}/notes`, {
      notes: counselorNotes.value
    })
    
    // Update the response with the new notes
    selectedResponse.value.counselor_notes = counselorNotes.value
    editingNotes.value = false
    
    // Also update in the counselorResponses list
    const index = counselorResponses.value.findIndex(r => r.id === selectedResponse.value.id)
    if (index !== -1) {
      counselorResponses.value[index].counselor_notes = counselorNotes.value
    }
    
    alert('Notes saved successfully!')
  } catch (err) {
    notesError.value = err.response?.data?.message || 'Failed to save notes'
    console.error('Error saving notes:', err)
  } finally {
    savingNotes.value = false
  }
}

async function createForm() {
  creatingForm.value = true
  createFormError.value = null
  
  // Validate that all questions have text
  const hasEmptyQuestion = newForm.questions.some(q => !q.question_text.trim());
  if (hasEmptyQuestion) {
    createFormError.value = 'All questions must have text';
    creatingForm.value = false;
    return;
  }
  
  try {
    // Prepare questions data for submission
    const questionsData = newForm.questions.map(question => {
      const q = {
        question_text: question.question_text,
        question_type: question.question_type
      }
      
      // Include options only for multiple choice questions
      if (question.question_type === 'multiple_choice' && question.options) {
        q.options = question.options.filter(option => option.trim() !== '')
      }
      
      return q
    })
    
    await api.post('/wellness', {
      title: newForm.title,
      description: newForm.description,
      questions: questionsData
    })
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

function addQuestion() {
  newForm.questions.push({
    question_text: '',
    question_type: 'text',
    options: []
  })
}

function onQuestionTypeChange(question) {
  // Initialize options array for multiple choice questions
  if (question.question_type === 'multiple_choice' && (!question.options || question.options.length === 0)) {
    question.options = ['', '']
  }
  // Clear options for other question types
  else if (question.question_type !== 'multiple_choice') {
    question.options = []
  }
}

function addOption(question) {
  if (!question.options) {
    question.options = []
  }
  question.options.push('')
}

function removeOption(question, index) {
  if (question.options && question.options.length > 2) {
    question.options.splice(index, 1)
  }
}

function removeQuestion(index) {
  newForm.questions.splice(index, 1)
}

function resetForm() {
  newForm.title = ''
  newForm.description = ''
  newForm.questions = [
    {
      question_text: '',
      question_type: 'text',
      options: []
    }
  ]
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
  margin-bottom: 20px;
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
  margin-bottom: 20px;
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

.mt-2 {
  margin-top: 1rem;
}

.ms-2 {
  margin-left: 0.5rem;
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

.response-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 15px;
}

.student-info {
  color: #374151;
  font-weight: 500;
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

.btn-outline-primary {
  background-color: transparent;
  color: #8FBC8F;
  border: 1px solid #8FBC8F;
}

.btn-outline-primary:hover {
  background-color: #8FBC8F;
  color: white;
}

.btn-outline-secondary {
  background-color: transparent;
  color: #6B7280;
  border: 1px solid #6B7280;
}

.btn-outline-secondary:hover {
  background-color: #6B7280;
  color: white;
}

.btn-sm {
  padding: 6px 12px;
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

.question-input {
  margin-top: 10px;
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

.questions-container {
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  padding: 15px;
  background-color: #F9FAFB;
}

.question-item {
  margin-bottom: 20px;
  padding: 15px;
  background-color: white;
  border-radius: 8px;
  border: 1px solid #E5E7EB;
}

.question-item:last-child {
  margin-bottom: 10px;
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.question-content {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.question-type {
  display: flex;
  align-items: center;
  gap: 10px;
}

.question-type label {
  margin: 0;
  font-weight: 500;
}

.question-type select {
  width: auto;
  min-width: 150px;
}

.btn-danger {
  background-color: #EF4444;
  color: white;
}

.btn-danger:hover {
  background-color: #DC2626;
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

.selected-answer {
  background-color: #F0FFF0;
  border-left: 4px solid #8FBC8F;
  padding: 10px 15px;
  border-radius: 0 8px 8px 0;
  margin-top: 10px;
}

.answer-label {
  font-weight: 600;
  color: #374151;
  margin-right: 8px;
}

.answer-value {
  color: #8FBC8F;
  font-weight: 500;
}

.counselor-notes-section {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #E5E7EB;
}

.counselor-notes-section h4 {
  color: #374151;
  margin-bottom: 15px;
}

.notes-content {
  background-color: #F9FAFB;
  border-radius: 8px;
  padding: 15px;
  white-space: pre-wrap;
  color: #374151;
}

.no-notes {
  color: #9CA3AF;
  font-style: italic;
  padding: 15px 0;
}

.notes-actions {
  display: flex;
  gap: 10px;
}
</style>