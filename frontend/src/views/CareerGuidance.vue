<template>
  <div class="career-guidance-container">
    <div class="page-header">
      <h1>Career Guidance</h1>
      <p>Explore career paths and guidance resources</p>
    </div>
    
    <div class="content-section">
      <div class="search-bar">
        <input 
          type="text" 
          placeholder="Search career resources..." 
          class="search-input"
          v-model="searchQuery"
        >
        <button class="search-button">
          <i class="fas fa-search"></i>
        </button>
      </div>
      
      <div class="resources-grid">
        <div class="resource-card" v-for="resource in paginatedResources" :key="resource.id">
          <div class="card-icon">
            <i :class="resource.icon"></i>
          </div>
          <div class="card-content">
            <h3>{{ resource.title }}</h3>
            <p>{{ resource.description }}</p>
            <button class="view-button">View Details</button>
          </div>
        </div>
      </div>
      
      <!-- Pagination -->
      <Pagination 
        v-if="filteredResources.length > resourcesPerPage"
        :current-page="currentPage"
        :total-pages="totalPages"
        :total-items="filteredResources.length"
        :items-per-page="resourcesPerPage"
        @update:current-page="currentPage = $event"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import Pagination from '../components/Pagination.vue'

const searchQuery = ref('')
const currentPage = ref(1)
const resourcesPerPage = ref(6)

// Mock data for career resources
const resources = [
  {
    id: 1,
    title: 'Career Assessment Test',
    description: 'Discover your strengths and interests to find the right career path.',
    icon: 'fas fa-clipboard-list'
  },
  {
    id: 2,
    title: 'Resume Builder',
    description: 'Create a professional resume with our easy-to-use templates.',
    icon: 'fas fa-file-alt'
  },
  {
    id: 3,
    title: 'Interview Preparation',
    description: 'Practice common interview questions and improve your skills.',
    icon: 'fas fa-comments'
  },
  {
    id: 4,
    title: 'Job Search Strategies',
    description: 'Learn effective techniques to find and apply for jobs.',
    icon: 'fas fa-search-location'
  },
  {
    id: 5,
    title: 'Networking Tips',
    description: 'Build professional relationships to advance your career.',
    icon: 'fas fa-network-wired'
  },
  {
    id: 6,
    title: 'Industry Insights',
    description: 'Stay updated with trends and opportunities in various fields.',
    icon: 'fas fa-chart-line'
  }
]

const filteredResources = computed(() => {
  if (!searchQuery.value) return resources
  const query = searchQuery.value.toLowerCase()
  return resources.filter(resource => 
    resource.title.toLowerCase().includes(query) ||
    resource.description.toLowerCase().includes(query)
  )
})

// Pagination computed properties
const paginatedResources = computed(() => {
  const start = (currentPage.value - 1) * resourcesPerPage.value
  const end = start + resourcesPerPage.value
  return filteredResources.value.slice(start, end)
})

const totalPages = computed(() => {
  return Math.ceil(filteredResources.value.length / resourcesPerPage.value)
})
</script>

<style scoped>
.career-guidance-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 30px;
}

.page-header h1 {
  color: #8FBC8F;
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 10px;
}

.page-header p {
  color: #6B7280;
  font-size: 1.1rem;
}

.content-section {
  background: white;
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid #E5E7EB;
}

.search-bar {
  display: flex;
  align-items: center;
  max-width: 500px;
  margin-bottom: 30px;
}

.search-input {
  flex: 1;
  padding: 14px 18px;
  border: 1px solid #D1D5DB;
  border-radius: 8px 0 0 8px;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.3s ease;
}

.search-input:focus {
  border-color: #8FBC8F;
  box-shadow: 0 0 0 3px rgba(143, 188, 143, 0.2);
}

.search-button {
  background: #8FBC8F;
  color: white;
  border: none;
  padding: 14px 20px;
  border-radius: 0 8px 8px 0;
  cursor: pointer;
  transition: background 0.3s ease;
  font-size: 1.1rem;
}

.search-button:hover {
  background: #7AAE7A;
}

.resources-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 25px;
  margin-bottom: 30px;
}

.resource-card {
  background: #F9FAFB;
  border-radius: 12px;
  padding: 25px;
  border: 1px solid #E5E7EB;
  transition: all 0.3s ease;
  display: flex;
  align-items: flex-start;
  gap: 20px;
}

.resource-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(143, 188, 143, 0.2);
  border-color: #8FBC8F;
}

.card-icon {
  background: #E0FFE0;
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.card-icon i {
  color: #8FBC8F;
  font-size: 1.8rem;
}

.card-content h3 {
  color: #374151;
  font-size: 1.4rem;
  font-weight: 600;
  margin-bottom: 12px;
}

.card-content p {
  color: #6B7280;
  font-size: 1rem;
  line-height: 1.6;
  margin-bottom: 20px;
}

.view-button {
  background: #8FBC8F;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.3s ease;
}

.view-button:hover {
  background: #7AAE7A;
}

@media (max-width: 768px) {
  .career-guidance-container {
    padding: 15px;
  }
  
  .page-header h1 {
    font-size: 2rem;
  }
  
  .resources-grid {
    grid-template-columns: 1fr;
  }
  
  .resource-card {
    flex-direction: column;
    text-align: center;
  }
  
  .card-icon {
    margin: 0 auto;
  }
}
</style>