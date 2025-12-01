<template>
  <div class="pagination-container">
    <div class="pagination-info">
      Showing {{ startIndex + 1 }} to {{ endIndex }} of {{ totalItems }} entries
    </div>
    <ul class="pagination">
      <li :class="['page-item', { disabled: currentPage === 1 }]">
        <a class="page-link" href="#" @click.prevent="prevPage">
          <i class="fas fa-chevron-left"></i> Previous
        </a>
      </li>
      
      <li 
        v-for="page in visiblePages" 
        :key="page"
        :class="['page-item', { active: page === currentPage, ellipsis: page === '...' }]"
      >
        <a 
          v-if="page !== '...'" 
          class="page-link" 
          href="#" 
          @click.prevent="goToPage(page)"
        >
          {{ page }}
        </a>
        <span v-else class="page-link ellipsis-link">...</span>
      </li>
      
      <li :class="['page-item', { disabled: currentPage === totalPages }]">
        <a class="page-link" href="#" @click.prevent="nextPage">
          Next <i class="fas fa-chevron-right"></i>
        </a>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  currentPage: {
    type: Number,
    required: true
  },
  totalPages: {
    type: Number,
    required: true
  },
  totalItems: {
    type: Number,
    required: true
  },
  itemsPerPage: {
    type: Number,
    default: 10
  }
})

const emit = defineEmits(['update:currentPage'])

const startIndex = computed(() => (props.currentPage - 1) * props.itemsPerPage)
const endIndex = computed(() => Math.min(props.currentPage * props.itemsPerPage, props.totalItems))

const visiblePages = computed(() => {
  const delta = 2
  const range = []
  const rangeWithDots = []
  let l

  for (let i = 1; i <= props.totalPages; i++) {
    if (i === 1 || i === props.totalPages || (i >= props.currentPage - delta && i <= props.currentPage + delta)) {
      range.push(i)
    }
  }

  for (let i of range) {
    if (l) {
      if (i - l === 2) {
        rangeWithDots.push(l + 1)
      } else if (i - l !== 1) {
        rangeWithDots.push('...')
      }
    }
    rangeWithDots.push(i)
    l = i
  }

  return rangeWithDots
})

function goToPage(page) {
  if (page !== '...' && page !== props.currentPage) {
    emit('update:currentPage', page)
  }
}

function prevPage() {
  if (props.currentPage > 1) {
    emit('update:currentPage', props.currentPage - 1)
  }
}

function nextPage() {
  if (props.currentPage < props.totalPages) {
    emit('update:currentPage', props.currentPage + 1)
  }
}
</script>

<style scoped>
.pagination-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  padding: 15px 0;
  border-top: 1px solid #e5e7eb;
}

.pagination-info {
  color: #6b7280;
  font-size: 0.875rem;
}

.pagination {
  display: flex;
  list-style: none;
  margin: 0;
  padding: 0;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.page-item {
  margin: 0;
}

.page-item:first-child .page-link {
  border-top-left-radius: 0.5rem;
  border-bottom-left-radius: 0.5rem;
}

.page-item:last-child .page-link {
  border-top-right-radius: 0.5rem;
  border-bottom-right-radius: 0.5rem;
}

.page-link {
  display: block;
  padding: 0.75rem 1rem;
  text-decoration: none;
  color: #8fbc8f;
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  transition: all 0.2s ease;
  font-weight: 500;
}

.page-link:hover:not(.ellipsis-link) {
  background-color: #f0fff0;
  color: #7aae7a;
}

.page-item.active .page-link {
  background-color: #8fbc8f;
  color: white;
  border-color: #8fbc8f;
}

.page-item.disabled .page-link {
  color: #d1d5db;
  pointer-events: none;
  background-color: #f9fafb;
}

.page-item.ellipsis .page-link {
  background-color: transparent;
  border: none;
  pointer-events: none;
}

@media (max-width: 768px) {
  .pagination-container {
    flex-direction: column;
    gap: 15px;
  }
  
  .pagination {
    flex-wrap: wrap;
    justify-content: center;
  }
  
  .page-link {
    padding: 0.5rem 0.75rem;
  }
}
</style>