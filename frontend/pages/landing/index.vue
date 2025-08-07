<template>
  <v-app class="landing-page">
    <!-- Hamburger Menu Icon -->
    <div class="hamburger-menu fixed top-5 left-5 z-50">
      <Menu />
    </div>
    
    <!-- Three Column Layout -->
    <div class="landing-container">
      <div class="landing-row">
        
        <!-- Left Column - Title and Content -->
        <div class="column left-column">
          <div class="column-content">
            <h1 class="main-title">
              <span class="title-gradient">Pregnancy is an</span>
              <span class="title-highlight">exciting time!</span>
            </h1>
            <p class="intro-text">
              Nau mai, haere mai! Whether you're experiencing a smooth pregnancy or navigating unexpected challenges, 
              this app is here to support you and your whānau every step of the way. Designed especially for people 
              in Aotearoa New Zealand, we offer trusted information, helpful tools, and culturally respectful guidance 
              to help you understand your health and make confident decisions.
            </p>
          </div>
        </div>

        <!-- Middle Column - Three Cards -->
        <div class="column middle-column">
          <div class="column-content">
            <div class="cards-container">
              <div 
                v-for="item in middleItems" 
                :key="item.title"
                class="card-item"
                :style="{ backgroundColor: item.backgroundColor }"
                @click="navigateToPage(item.link)"
              >
                <div class="card-icon">
                  <img 
                    :src="item.image" 
                    :alt="item.title"
                    @error="onImageError"
                    @load="onImageLoad"
                  />
                </div>
                <div class="card-content">
                  <h3 class="card-title">{{ item.title }}</h3>
                  <p class="card-description">{{ item.description }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column - Two Cards -->
        <div class="column right-column">
          <div class="column-content">
            <div class="cards-container">
              <div 
                v-for="item in rightItems" 
                :key="item.title"
                class="card-item"
                :style="{ backgroundColor: item.backgroundColor }"
                @click="navigateToPage(item.link)"
              >
                <div class="card-icon">
                  <img 
                    :src="item.image" 
                    :alt="item.title"
                    @error="onImageError"
                    @load="onImageLoad"
                  />
                </div>
                <div class="card-content">
                  <h3 class="card-title">{{ item.title }}</h3>
                  <p class="card-description">{{ item.description }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </v-app>
</template>

<script>
import landingPageData from '@/assets/data/landingPageData';
import Menu from '@/components/landing/Menu.vue';

export default {
  layout: 'empty',
  components: {
    Menu
  },
  
  computed: {
    middleItems() {
      return landingPageData.items.filter(item => item.index <= 2).map(item => ({
        ...item,
        image: this.getImagePath(item.image)
      }));
    },
    rightItems() {
      return landingPageData.items.filter(item => item.index > 2).map(item => ({
        ...item,
        image: this.getImagePath(item.image)
      }));
    }
  },
  
  methods: {
    navigateToPage(link) {
      if (link) {
        this.$router.push(link);
      }
    },
    
    getImagePath(imagePath) {
      const basePath = this.$config.basePath || '';
      // Ensure we don't double-add the base path
      const cleanPath = imagePath.replace(/^\/pregnancy-app/, '');
      return basePath + cleanPath;
    },
    
    onImageError(event) {
      console.error('Image failed to load:', event.target.src);
      // Set a fallback or hide the image instead of retrying
      event.target.style.display = 'none';
    },
    
    onImageLoad(event) {
      // Image loaded successfully, no action needed
    }
  }
};
</script>

<style scoped lang="scss">
.landing-page {
  background: var(--v-background-base);
  min-height: 100vh;
}

.hamburger-menu {
  background: rgba(49, 54, 87, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(49, 54, 87, 0.2);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  padding: 8px;
  
  &:hover {
    background: var(--v-secondary-base);
    color: white;
    box-shadow: 0 6px 25px rgba(49, 54, 87, 0.3);
  }
}

.landing-container {
  min-height: 100vh;
  width: 100vw;
  display: flex;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
      radial-gradient(circle at 20% 80%, rgba(221, 60, 81, 0.08) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(108, 144, 185, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 40% 40%, rgba(31, 102, 131, 0.05) 0%, transparent 50%);
    z-index: 0;
  }
}

.landing-row {
  display: flex;
  width: 100%;
  height: 100%;
  position: relative;
  z-index: 1;
}

.column {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  
  &.left-column {
    flex: 0 0 25%;
    background: rgba(255, 255, 255, 0.02);
  }
  
  &.middle-column {
    flex: 0 0 42%;
    background: rgba(255, 255, 255, 0.01);
  }
  
  &.right-column {
    flex: 0 0 33%;
    background: rgba(255, 255, 255, 0.02);
  }
}

.column-content {
  padding: 40px 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

/* Left Column Styles */
.left-column .column-content {
  text-align: center;
  align-items: center;
}

.main-title {
  font-size: 2.5rem;
  font-weight: bold;
  margin-bottom: 30px;
  line-height: 1.2;
  
  .title-gradient {
    display: block;
    background: linear-gradient(135deg, var(--v-secondary-base) 0%, var(--v-info-base) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 10px;
  }
  
  .title-highlight {
    display: block;
    background: linear-gradient(135deg, var(--v-primary-base) 0%, var(--v-accent-base) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: glow 2s ease-in-out infinite alternate;
  }
}

.intro-text {
  font-size: 1rem;
  line-height: 1.6;
  color: var(--v-success-base);
  max-width: 400px;
}

@keyframes glow {
  from {
    filter: drop-shadow(0 0 5px var(--v-primary-lighten1));
  }
  to {
    filter: drop-shadow(0 0 15px var(--v-primary-base));
  }
}

/* Cards Styles */
.cards-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: 100%;
  justify-content: center;
}

.card-item {
  display: flex;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  min-height: 120px;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
  }
}

.card-icon {
  flex: 0 0 80px;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 15px;
  
  img {
    width: 50px;
    height: 50px;
    object-fit: contain;
  }
}

.card-content {
  flex: 1;
  padding: 15px 20px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.card-title {
  color: white;
  font-size: 1.3rem;
  font-weight: 600;
  margin-bottom: 8px;
  line-height: 1.3;
}

.card-description {
  color: rgba(255, 255, 255, 0.9);
  font-size: 1rem;
  line-height: 1.4;
  margin: 0;
}

/* Responsive Design */
@media (max-width: 1200px) {
  .main-title {
    font-size: 2rem;
  }
  
  .intro-text {
    font-size: 0.9rem;
  }
  
  .card-title {
    font-size: 1.2rem;
  }
  
  .card-description {
    font-size: 0.9rem;
  }
}

@media (max-width: 768px) {
  .landing-page {
    height: auto;
    overflow-y: auto;
  }
  
  .landing-container {
    height: auto;
    min-height: 100vh;
  }
  
  .landing-row {
    flex-direction: column;
    height: auto;
  }
  
  .column {
    flex: none !important;
    height: auto;
    min-height: auto;
    
    &.left-column {
      min-height: 50vh;
      display: flex;
      align-items: center;
    }
    
    &.middle-column {
      min-height: auto;
      margin-bottom: 30px;
    }
    
    &.right-column {
      min-height: auto;
      margin-top: -10%;
    }
  }
  
  .column-content {
    padding: 20px 15px;
    height: auto;
    min-height: auto;
  }
  
  .main-title {
    font-size: 1.8rem;
  }
  
  .intro-text {
    font-size: 0.85rem;
  }
  
  .cards-container {
    gap: 15px;
    justify-content: flex-start;
  }
  
  .card-item {
    min-height: 100px;
  }
  
  .card-icon {
    flex: 0 0 60px;
    
    img {
      width: 35px;
      height: 35px;
    }
  }
  
  .hamburger-menu {
    top: 10px;
    left: 10px;
  }
}
</style>