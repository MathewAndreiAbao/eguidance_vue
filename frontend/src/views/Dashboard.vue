<template>
  <div class="dashboard-container">
    <div class="dashboard-header">
      <h1 class="dashboard-title">eGuidance Dashboard</h1>
      <p class="welcome-message" v-if="user">
        Welcome back, <strong>{{ user.name }}</strong> — you are signed in as <em>{{ user.role }}</em>.
      </p>
      <p class="welcome-message" v-else>
        Please log in to view your dashboard.
      </p>
    </div>
    
    <div v-if="user" class="dashboard-content">
      <div class="cards-grid">
        <div class="dashboard-card" @click="go('/feedback')">
          <div class="card-icon">
            <i class="fas fa-comment"></i>
          </div>
          <div class="card-content">
            <h3 class="card-title">Feedback</h3>
            <p class="card-description">Provide or view feedback for counseling services.</p>
          </div>
        </div>
        
        <div class="dashboard-card" @click="go('/appointments')">
          <div class="card-icon">
            <i class="fas fa-calendar-check"></i>
          </div>
          <div class="card-content">
            <h3 class="card-title">Appointments</h3>
            <p class="card-description">Book or manage your counseling appointments.</p>
          </div>
        </div>
        
        <div class="dashboard-card" @click="go('/resources')">
          <div class="card-icon">
            <i class="fas fa-book"></i>
          </div>
          <div class="card-content">
            <h3 class="card-title">Resources</h3>
            <p class="card-description">Access counseling resources and files.</p>
          </div>
        </div>
        

        
        <div class="dashboard-card" @click="go('/wellness-forms')">
          <div class="card-icon">
            <i class="fas fa-heartbeat"></i>
          </div>
          <div class="card-content">
            <h3 class="card-title">Wellness Forms</h3>
            <p class="card-description">Complete wellness assessments and track your progress.</p>
          </div>
        </div>
        
        <div class="dashboard-card" @click="go('/announcements')">
          <div class="card-icon">
            <i class="fas fa-bullhorn"></i>
          </div>
          <div class="card-content">
            <h3 class="card-title">Announcements</h3>
            <p class="card-description">Read the latest announcements and updates.</p>
          </div>
        </div>
        
        
        
        <div class="dashboard-card" v-if="user && user.role === 'counselor'" @click="go('/reports')">
          <div class="card-icon">
            <i class="fas fa-chart-bar"></i>
          </div>
          <div class="card-content">
            <h3 class="card-title">Reports & Analytics</h3>
            <p class="card-description">View student usage statistics and insights.</p>
          </div>
        </div>
      </div>
      
      <div class="appointments-section" v-if="user && user.role === 'counselor'">
        <div class="section-header">
          <h2>Student Appointments</h2>
          <div class="search-container">
            <input 
              type="text" 
              placeholder="Search appointments..." 
              class="search-input"
              v-model="searchQuery"
            >
            <button class="search-button">
              <i class="fas fa-search"></i>
            </button>
          </div>
        </div>
        
        <div class="appointments-content">
          <div class="appointment-card" v-for="appointment in filteredAppointments" :key="appointment.id">
            <div class="appointment-info">
              <h4>{{ appointment.studentName }}</h4>
              <p class="appointment-date">{{ appointment.date }} at {{ appointment.time }}</p>
              <span class="appointment-status" :class="appointment.status">{{ appointment.status }}</span>
            </div>
          </div>
          
          <div class="no-appointments" v-if="filteredAppointments.length === 0">
            <p>No appointments found.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../store/userStore'

const router = useRouter()
const store = useUserStore()
const user = computed(() => store.user)

const searchQuery = ref('')

// Empty appointments array for students
const appointments = []

const filteredAppointments = computed(() => {
  if (!searchQuery.value) return appointments
  const query = searchQuery.value.toLowerCase()
  return appointments.filter(app => 
    app.studentName.toLowerCase().includes(query) ||
    app.status.toLowerCase().includes(query)
  )
})

function go(path) {
  router.push(path)
}
</script>

<style scoped>
.dashboard-container {
  padding: 0;
  width: 100%;
  margin: 0;
  min-height: 100vh;
}

.dashboard-header {
  margin-bottom: var(--eg-space-6);
  padding: var(--eg-space-6) var(--eg-space-8);
  background: transparent;
  border-radius: 0;
  box-shadow: none;
  border-bottom: 1px solid rgba(229, 231, 235, 0.7);
  backdrop-filter: none;
}

.dashboard-title {
  color: var(--eg-primary-dark);
  font-size: var(--eg-font-size-4xl);
  font-weight: var(--eg-font-weight-extrabold);
  margin-bottom: var(--eg-space-3);
  text-align: center;
  letter-spacing: -0.5px;
}

.welcome-message {
  color: var(--eg-text-secondary);
  font-size: var(--eg-font-size-lg);
  text-align: center;
  max-width: 700px;
  margin: 0 auto;
  line-height: 1.6;
  background: transparent;
  padding: var(--eg-space-4);
  border-radius: var(--eg-radius-lg);
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--eg-space-5);
  margin: 0 var(--eg-space-6) var(--eg-space-8);
  width: calc(100% - (var(--eg-space-6) * 2));
}

.dashboard-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: var(--eg-radius-2xl);
  padding: var(--eg-space-6);
  box-shadow: var(--eg-shadow-md);
  border: 1px solid rgba(229, 231, 235, 0.8);
  transition: all var(--eg-transition);
  cursor: pointer;
  display: flex;
  align-items: flex-start;
  gap: var(--eg-space-5);
  min-height: 170px;
  backdrop-filter: blur(5px);
  position: relative;
  overflow: hidden;
}

.dashboard-card:hover {
  transform: translateY(-5px);
  box-shadow: var(--eg-shadow-lg);
  border-color: var(--eg-primary);
}

.card-icon {
  background: linear-gradient(135deg, var(--eg-primary-light) 0%, #d1f5d1 100%);
  width: 60px;
  height: 60px;
  border-radius: var(--eg-radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: var(--eg-shadow-sm);
  transition: all var(--eg-transition);
}

.card-icon i {
  color: var(--eg-primary-dark);
  font-size: var(--eg-font-size-2xl);
}

.card-title {
  color: var(--eg-text);
  font-size: var(--eg-font-size-xl);
  font-weight: var(--eg-font-weight-bold);
  margin-bottom: var(--eg-space-2);
  letter-spacing: -0.3px;
}

.card-description {
  color: var(--eg-text-secondary);
  font-size: var(--eg-font-size-base);
  line-height: 1.6;
  margin: 0;
}

.appointments-section {
  background: rgba(255, 255, 255, 0.95);
  border-radius: var(--eg-radius-2xl);
  padding: var(--eg-space-6);
  box-shadow: var(--eg-shadow-md);
  border: 1px solid rgba(229, 231, 235, 0.8);
  margin: 0 var(--eg-space-6) var(--eg-space-8);
  backdrop-filter: blur(5px);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--eg-space-5);
  flex-wrap: wrap;
  gap: var(--eg-space-3);
}

.section-header h2 {
  color: var(--eg-text);
  font-size: var(--eg-font-size-2xl);
  font-weight: var(--eg-font-weight-bold);
  margin: 0;
  letter-spacing: -0.3px;
}

.search-container {
  display: flex;
  align-items: center;
  max-width: 380px;
  width: 100%;
  border-radius: var(--eg-radius-md);
  overflow: hidden;
}

.search-input {
  flex: 1;
  padding: var(--eg-space-3) var(--eg-space-4);
  border: 1px solid rgba(209, 213, 219, 0.8);
  border-radius: var(--eg-radius-md) 0 0 var(--eg-radius-md);
  font-size: var(--eg-font-size-base);
  outline: none;
  transition: all var(--eg-transition);
  background: rgba(255, 255, 255, 0.8);
}

.search-input:focus {
  border-color: var(--eg-primary);
  box-shadow: 0 0 0 2px rgba(143, 188, 143, 0.25);
  background: white;
}

.search-button {
  background: var(--eg-primary);
  color: white;
  border: none;
  padding: var(--eg-space-3) var(--eg-space-4);
  border-radius: 0 var(--eg-radius-md) var(--eg-radius-md) 0;
  cursor: pointer;
  transition: all var(--eg-transition);
  font-size: var(--eg-font-size-lg);
}

.search-button:hover {
  background: var(--eg-primary-dark);
  transform: translateY(-1px);
}

.appointment-card {
  padding: var(--eg-space-5);
  border-bottom: 1px solid rgba(229, 231, 235, 0.7);
  transition: background var(--eg-transition);
  border-radius: var(--eg-radius-lg);
  margin-bottom: var(--eg-space-3);
  background: rgba(249, 250, 251, 0.7);
  transition: all var(--eg-transition);
  box-shadow: var(--eg-shadow-sm);
}

.appointment-card:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.appointment-card:hover {
  background: rgba(243, 244, 246, 0.9);
  transform: translateX(5px);
  box-shadow: var(--eg-shadow);
}

.appointment-info h4 {
  color: var(--eg-text);
  font-size: var(--eg-font-size-xl);
  font-weight: var(--eg-font-weight-bold);
  margin-bottom: var(--eg-space-2);
}

.appointment-date {
  color: var(--eg-text-secondary);
  margin-bottom: var(--eg-space-2);
  font-size: var(--eg-font-size-base);
}

.appointment-status {
  padding: var(--eg-space-1) var(--eg-space-3);
  border-radius: var(--eg-radius-full);
  font-size: var(--eg-font-size-sm);
  font-weight: var(--eg-font-weight-medium);
}

.appointment-status.Confirmed {
  background: #D1FAE5;
  color: #047857;
}

.appointment-status.Pending {
  background: #FEF3C7;
  color: #D97706;
}

.no-appointments {
  text-align: center;
  padding: var(--eg-space-8);
  color: var(--eg-text-muted);
}

@media (max-width: 768px) {
  .dashboard-container {
    padding: 0;
  }
  
  .dashboard-header {
    padding: 20px;
  }
  
  .dashboard-title {
    font-size: 1.8rem;
  }
  
  .welcome-message {
    font-size: 1rem;
  }
  
  .cards-grid {
    grid-template-columns: 1fr;
    margin: 0 15px 30px;
    width: calc(100% - 30px);
    gap: 16px;
  }
  
  .dashboard-card {
    padding: 20px;
    min-height: 140px;
  }
  
  .card-icon {
    width: 50px;
    height: 50px;
  }
  
  .card-icon i {
    font-size: 1.5rem;
  }
  
  .card-title {
    font-size: 1.2rem;
  }
  
  .card-description {
    font-size: 0.9rem;
  }
  
  .appointments-section {
    margin: 0 15px 30px;
    padding: 20px;
  }
  
  .section-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .section-header h2 {
    font-size: 1.5rem;
  }
  
  .search-container {
    max-width: 100%;
  }
  
  .appointment-info h4 {
    font-size: 1.1rem;
  }
  
  .appointment-date {
    font-size: 0.9rem;
  }
}
</style>
