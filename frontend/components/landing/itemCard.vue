<template>
  <div class="item-card w-full max-w-full m-0 cursor-pointer transition-transform duration-300 ease-in-out rounded-lg hover:-translate-y-0.5" @click="navigateTo">
    <div class="card-container flex overflow-hidden shadow-lg rounded-lg flex-col md:flex-row">
      <!-- Left side - Icon area -->
      <div class="icon-section bg-white flex items-center justify-center">
        <div class="icon-container w-full flex items-center justify-center rounded-lg bg-white">
          <img 
            :src="image" 
            :alt="title" 
            class="icon-image object-contain transition-all duration-300" 
            @error="onImageError"
            @load="onImageLoad"
          />
        </div>
      </div>
      
      <!-- Right side - Text content -->
      <div class="content-section flex items-center" :style="{ backgroundColor: backgroundColor }">
        <div class="content-wrapper w-full">
          <h2 class="card-title text-white font-semibold text-left leading-tight">{{ title }}</h2>
          <p class="card-description text-white text-left leading-relaxed m-0 opacity-95">{{ description }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ItemCard',
  
  props: {
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    image: {
      type: String,
      required: true
    },
    backgroundColor: {
      type: String,
      default: '#DD3C51'
    },
    link: {
      type: String,
      default: ''
    }
  },
  
  methods: {
    navigateTo() {
      if (this.link) {
        this.$router.push(this.link);
      }
    },
    
    onImageError(event) {
      console.error('Image failed to load:', this.image);
      // Hide the image instead of retrying
      event.target.style.display = 'none';
    },
    
    onImageLoad() {
      // Image loaded successfully, no action needed
    }
  }
}
</script>

<style scoped lang="scss">
.icon-section {
  width: 30%;
}

.icon-container {
  height: 120px;
}

.icon-image {
  max-width: 60px;
  max-height: 60px;
  filter: grayscale(0%);
}

.item-card:hover .icon-image {
  filter: brightness(1.2) saturate(1.8) contrast(1.2);
}

.content-section {
  width: 70%;
  padding: 10px;
}

.card-title {
  font-size: 2rem;
  margin: 0 0 15px 0;
  line-height: 1.3;
}

.card-description {
  font-size: 0.95rem;
  line-height: 1.5;
}

// Responsive design
@media (max-width: 768px) {
  .icon-section {
    width: 100%;
  }
  
  .content-section {
    width: 100%;
  }
  
  .card-title {
    font-size: 2rem;
  }
  
  .card-description {
    font-size: 0.9rem;
  }
}

@media (max-width: 480px) {
  .item-card {
    margin: 10px;
  }
  
  .icon-section {
    padding: 15px;
  }
  
  .content-section {
    padding: 15px;
  }
  
  .card-title {
    font-size: 1.2rem;
  }
  
  .card-description {
    font-size: 0.85rem;
  }
}
</style>