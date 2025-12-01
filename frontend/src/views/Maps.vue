<template>
  <div class="maps-container">
    <div class="page-header">
      <h1>Campus Maps</h1>
      <p>Find locations and navigate the campus</p>
    </div>
    
    <div class="content-section">
      <div class="search-bar">
        <input 
          type="text" 
          placeholder="Search locations..." 
          class="search-input"
          v-model="searchQuery"
        >
        <button class="search-button">
          <i class="fas fa-search"></i>
        </button>
      </div>
      
      <div class="map-content">
        <div class="map-placeholder">
          <i class="fas fa-map-marked-alt map-icon"></i>
          <h3>Interactive Campus Map</h3>
          <p>Click on locations to view details</p>
        </div>
        
        <div class="locations-list">
          <h3>Popular Locations</h3>
          <div class="location-item" v-for="location in paginatedLocations" :key="location.id">
            <div class="location-icon">
              <i :class="location.icon"></i>
            </div>
            <div class="location-details">
              <h4>{{ location.name }}</h4>
              <p>{{ location.description }}</p>
            </div>
          </div>
          
          <!-- Pagination -->
          <Pagination 
            v-if="filteredLocations.length > locationsPerPage"
            :current-page="currentPage"
            :total-pages="totalPages"
            :total-items="filteredLocations.length"
            :items-per-page="locationsPerPage"
            @update:current-page="currentPage = $event"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import Pagination from '../components/Pagination.vue'

const searchQuery = ref('')
const currentPage = ref(1)
const locationsPerPage = ref(5)

// Mock data for campus locations
const locations = [
  {
    id: 1,
    name: 'Main Building',
    description: 'Administrative offices and main entrance',
    icon: 'fas fa-building'
  },
  {
    id: 2,
    name: 'Library',
    description: 'Study spaces, books, and research resources',
    icon: 'fas fa-book'
  },
  {
    id: 3,
    name: 'Counseling Center',
    description: 'Student counseling and mental health services',
    icon: 'fas fa-heartbeat'
  },
  {
    id: 4,
    name: 'Career Services',
    description: 'Career guidance and job placement assistance',
    icon: 'fas fa-briefcase'
  },
  {
    id: 5,
    name: 'Student Lounge',
    description: 'Relaxation area with seating and refreshments',
    icon: 'fas fa-couch'
  },
  {
    id: 6,
    name: 'Parking Lot A',
    description: 'Main visitor parking area',
    icon: 'fas fa-parking'
  }
]

const filteredLocations = computed(() => {
  if (!searchQuery.value) return locations
  const query = searchQuery.value.toLowerCase()
  return locations.filter(location => 
    location.name.toLowerCase().includes(query) ||
    location.description.toLowerCase().includes(query)
  )
})

// Pagination computed properties
const paginatedLocations = computed(() => {
  const start = (currentPage.value - 1) * locationsPerPage.value
  const end = start + locationsPerPage.value
  return filteredLocations.value.slice(start, end)
})

const totalPages = computed(() => {
  return Math.ceil(filteredLocations.value.length / locationsPerPage.value)
})
</script>

<style scoped>
.maps-container {
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

.map-content {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 30px;
}

.map-placeholder {
  background: #F0FDF4;
  border-radius: 12px;
  padding: 50px 30px;
  text-align: center;
  border: 2px dashed #8FBC8F;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.map-icon {
  font-size: 5rem;
  color: #8FBC8F;
  margin-bottom: 20px;
}

.map-placeholder h3 {
  color: #374151;
  font-size: 1.8rem;
  font-weight: 600;
  margin-bottom: 15px;
}

.map-placeholder p {
  color: #6B7280;
  font-size: 1.1rem;
}

.locations-list h3 {
  color: #374151;
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #E5E7EB;
}

.location-item {
  display: flex;
  align-items: flex-start;
  gap: 15px;
  padding: 15px 0;
  border-bottom: 1px solid #E5E7EB;
}

.location-item:last-child {
  border-bottom: none;
}

.location-icon {
  background: #E0FFE0;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.location-icon i {
  color: #8FBC8F;
  font-size: 1.2rem;
}

.location-details h4 {
  color: #374151;
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 5px;
}

.location-details p {
  color: #6B7280;
  font-size: 0.95rem;
  margin: 0;
  line-height: 1.5;
}

@media (max-width: 768px) {
  .maps-container {
    padding: 15px;
  }
  
  .page-header h1 {
    font-size: 2rem;
  }
  
  .map-content {
    grid-template-columns: 1fr;
  }
}
</style>