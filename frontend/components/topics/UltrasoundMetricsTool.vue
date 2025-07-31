<template>
  <div class="ultrasound-page">
    <!-- Exciting Pregnancy Header -->
    <div class="pregnancy-hero">
      <div class="hero-content">
        <div class="hero-animation">
          <div class="heartbeat-icon">
            <v-icon size="48" color="pink lighten-2">mdi-heart-pulse</v-icon>
          </div>
          <div class="pregnancy-glow"></div>
        </div>
        <h2 class="hero-title">
          <span class="gradient-text">{{ textContent.heroTitle }}</span>
          <v-icon class="sparkle-icon ml-2" color="yellow">mdi-star</v-icon>
        </h2>
        <p class="hero-subtitle">
          {{ textContent.heroSubtitle }}
        </p>
      </div>
      
    </div>

    <!-- Main Content Sections -->
    <div class="content-sections">
      <h1 class="main-title">{{ textContent.mainTitle }}</h1>
      
      <!-- Navigation Cards -->
      <div v-if="!currentSection" class="navigation-cards">
        <v-card 
          v-for="section in sections" 
          :key="section.id"
          class="section-card"
          @click="navigateToSection(section.id)"
          elevation="3"
          hover
        >
          <v-card-text class="section-content">
            <div class="section-header">
              <v-icon :color="section.color" size="32" class="section-icon">
                {{ section.icon }}
              </v-icon>
              <h3 class="section-title">{{ section.title }}</h3>
            </div>
            <p class="section-description">{{ section.description }}</p>
          </v-card-text>
        </v-card>
      </div>

      <!-- Dynamic Section Content -->
      <div v-if="currentSection" class="section-detail">
        <!-- Back Button -->
        <v-btn 
          @click="currentSection = null" 
          color="#6C90B9" 
          outlined 
          class="mb-4"
        >
          <v-icon left>mdi-arrow-left</v-icon>
          Back to Overview
        </v-btn>

        <!-- What is Ultrasound Section -->
        <div v-if="currentSection === 'what-is-ultrasound'" class="section-content-detail">
          <h2>{{ getSectionData('what-is-ultrasound').title }}</h2>
          <div class="content-blocks">
            <v-card class="mb-4 pa-4" elevation="2">
              <h4>What is Ultrasound?</h4>
              <p>{{ textContent.sections.whatIsUltrasound.content.definition }}</p>
            </v-card>
            <v-card class="mb-4 pa-4" elevation="2">
              <h4>What Can We Measure?</h4>
              <p>{{ textContent.sections.whatIsUltrasound.content.measurements }}</p>
            </v-card>
          </div>
        </div>

        <!-- Ultrasound Waveforms Section -->
        <div v-if="currentSection === 'waveforms'" class="section-content-detail">
          <h2>{{ getSectionData('waveforms').title }}</h2>
          <div class="content-blocks">
            <v-card class="mb-4 pa-4" elevation="2">
              <h4>Why Do We Measure Them?</h4>
              <p>{{ textContent.sections.waveforms.content.purpose }}</p>
            </v-card>
            <v-card class="mb-4 pa-4" elevation="2">
              <h4>What Do They Look Like?</h4>
              <p>{{ textContent.sections.waveforms.content.appearance }}</p>
            </v-card>
            <v-card class="mb-4 pa-4" elevation="2">
              <h4>What Does This Mean?</h4>
              <p>{{ textContent.sections.waveforms.content.interpretation }}</p>
            </v-card>
          </div>
        </div>

        <!-- Pregnancy Concerns Section -->
        <div v-if="currentSection === 'disorders'" class="section-content-detail">
          <h2>{{ getSectionData('disorders').title }}</h2>
          <div class="content-blocks">
            <v-card class="mb-4 pa-4" elevation="2">
              <h4>What are RI and PI?</h4>
              <p>{{ textContent.sections.disorders.content.riPiDefinition }}</p>
            </v-card>
            <v-card class="mb-4 pa-4" elevation="2">
              <h4>How Ultrasound Detects Concerns</h4>
              <p>{{ textContent.sections.disorders.content.detection }}</p>
            </v-card>
          </div>
        </div>

        <!-- Interactive Tool Section -->
        <div v-if="currentSection === 'interactive'" class="section-content-detail">
          <h2>{{ getSectionData('interactive').title }}</h2>
          
          <!-- Simple Metrics Form -->
          <v-card class="metrics-form pa-4 mb-4" elevation="2">
            <h4 class="mb-3">Enter Your Ultrasound Metrics</h4>
            
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model.number="metrics.umbilicalRI"
                  label="Umbilical Artery RI"
                  type="number"
                  step="0.01"
                  outlined
                  dense
                  @input="calculateResults"
                >
                  <template v-slot:append-outer>
                    <v-tooltip bottom>
                      <template v-slot:activator="{ on, attrs }">
                        <v-icon v-bind="attrs" v-on="on" small>mdi-information</v-icon>
                      </template>
                      <span>Normal range: 0.50-0.70</span>
                    </v-tooltip>
                  </template>
                </v-text-field>
              </v-col>
              
              <v-col cols="12" md="6">
                <v-text-field
                  v-model.number="metrics.uterineRI"
                  label="Uterine Artery RI"
                  type="number"
                  step="0.01"
                  outlined
                  dense
                  @input="calculateResults"
                >
                  <template v-slot:append-outer>
                    <v-tooltip bottom>
                      <template v-slot:activator="{ on, attrs }">
                        <v-icon v-bind="attrs" v-on="on" small>mdi-information</v-icon>
                      </template>
                      <span>Normal range: 0.35-0.65</span>
                    </v-tooltip>
                  </template>
                </v-text-field>
              </v-col>
            </v-row>
          </v-card>

          <!-- Results Display -->
          <v-card 
            v-if="hasResults" 
            class="results-panel pa-4" 
            elevation="3"
            :color="resultColor"
            dark
          >
            <h4 class="mb-3">
              <v-icon class="mr-2">{{ resultIcon }}</v-icon>
              Your Results
            </h4>
            
            <div class="results-content">
              <p class="results-summary mb-3">
                <strong>{{ resultSummary }}</strong>
              </p>
              
              <div v-if="resultFindings.length > 0" class="findings mb-3">
                <h5 class="mb-2">Measurements:</h5>
                <ul>
                  <li v-for="finding in resultFindings" :key="finding">
                    {{ finding }}
                  </li>
                </ul>
              </div>
            </div>
          </v-card>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'UltrasoundMetricsTool',
  
  data() {
    return {
      currentSection: null,
      
      // Simple metrics for interactive tool
      metrics: {
        umbilicalRI: null,
        uterineRI: null
      },
      
      // Results
      hasResults: false,
      resultSummary: '',
      resultFindings: [],
      resultColor: 'success',
      resultIcon: 'mdi-check-circle',
      
      // Text content data
      textContent: {
        heroTitle: 'Pregnancy is An Exciting Time!',
        heroSubtitle: '🌟 Embark on an extraordinary journey of discovery! Our revolutionary ultrasound analysis platform transforms complex medical data into beautiful, understandable insights about your pregnancy. ✨',
        mainTitle: 'What does my ultrasound scan mean?',
        
        sections: {
          whatIsUltrasound: {
            content: {
              definition: 'Ultrasound is a safe, non-invasive imaging technique that uses sound waves to create pictures of your baby and placenta. It allows healthcare providers to monitor your pregnancy and assess your baby\'s health and development.',
              measurements: 'Ultrasound can measure blood flow patterns, resistance in arteries, fetal size and growth, placental health, and fluid levels around your baby.'
            }
          },
          waveforms: {
            content: {
              purpose: 'We measure umbilical and uterine artery Doppler waveforms to assess blood flow between you and your baby. These measurements help evaluate placental function and detect potential complications early.',
              appearance: 'Normal waveforms show smooth, regular patterns with consistent blood flow. The patterns change throughout pregnancy as your baby grows and the placenta develops.',
              interpretation: 'The shape and measurements of these waveforms tell us about the health of blood vessels and whether your baby is receiving adequate nutrients and oxygen.'
            }
          },
          disorders: {
            content: {
              riPiDefinition: 'RI (Resistance Index) and PI (Pulsatility Index) are measurements that show how much resistance there is to blood flow in arteries. Higher numbers may indicate problems with placental function.',
              detection: 'Ultrasound can detect pregnancy disorders by measuring changes in blood flow patterns. Abnormal measurements may indicate conditions like preeclampsia, growth restriction, or placental insufficiency.'
            }
          }
        }
      },
      
      // Navigation sections
      sections: [
        {
          id: 'what-is-ultrasound',
          title: 'What is Ultrasound?',
          description: 'Learn about ultrasound technology and what it can measure during pregnancy.',
          icon: 'mdi-medical-bag',
          color: '#6C90B9'
        },
        {
          id: 'waveforms',
          title: 'Ultrasound Waveforms in Pregnancy',
          description: 'Understand umbilical and uterine artery Doppler measurements and their significance.',
          icon: 'mdi-chart-line',
          color: '#1F6683'
        },
        {
          id: 'disorders',
          title: 'Detecting Pregnancy Concerns',
          description: 'How ultrasound helps identify potential complications and what RI and PI mean.',
          icon: 'mdi-alert-circle-outline',
          color: '#DD3C51'
        },
        {
          id: 'interactive',
          title: 'Check Your Ultrasound Metrics!',
          description: 'Enter your ultrasound measurements and understand what they mean with model visualization.',
          icon: 'mdi-calculator-variant',
          color: '#313657'
        }
      ]
    }
  },
  
  methods: {
    navigateToSection(sectionId) {
      this.currentSection = sectionId;
    },
    
    getSectionData(sectionId) {
      return this.sections.find(section => section.id === sectionId);
    },
    
    calculateResults() {
      if (this.metrics.umbilicalRI === null && this.metrics.uterineRI === null) {
        this.hasResults = false;
        return;
      }
      
      this.hasResults = true;
      this.resultFindings = [];
      let abnormalCount = 0;
      
      // Analyze umbilical RI
      if (this.metrics.umbilicalRI !== null) {
        this.resultFindings.push(`Umbilical artery RI: ${this.metrics.umbilicalRI.toFixed(2)} (reference range: 0.50-0.70)`);
        if (this.metrics.umbilicalRI > 0.70 || this.metrics.umbilicalRI < 0.50) {
          abnormalCount++;
        }
      }
      
      // Analyze uterine RI
      if (this.metrics.uterineRI !== null) {
        this.resultFindings.push(`Uterine artery RI: ${this.metrics.uterineRI.toFixed(2)} (reference range: 0.35-0.65)`);
        if (this.metrics.uterineRI > 0.65 || this.metrics.uterineRI < 0.35) {
          abnormalCount++;
        }
      }
      
      // Set result status
      if (abnormalCount > 0) {
        this.resultColor = 'warning';
        this.resultIcon = 'mdi-alert';
        this.resultSummary = 'Some measurements outside reference ranges detected';
      } else {
        this.resultColor = 'success';
        this.resultIcon = 'mdi-check-circle';
        this.resultSummary = 'All measured parameters within reference ranges';
      }
      
      // Emit for model visualization
      this.$emit('metrics-updated', {
        metrics: this.metrics,
        results: {
          summary: this.resultSummary,
          findings: this.resultFindings,
          status: abnormalCount > 0 ? 'abnormal' : 'normal'
        }
      });
    }
  }
}
</script>

<style scoped lang="scss">
.ultrasound-page {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 16px;
}

// Exciting Pregnancy Hero Section with enhanced theme colors
.pregnancy-hero {
  position: relative;
  background: linear-gradient(135deg, #1F6683 0%, #313657 50%, #DD3C51 100%);
  border-radius: 20px;
  padding: 40px 30px;
  margin-bottom: 40px;
  overflow: hidden;
  box-shadow: 0 15px 40px rgba(221, 60, 81, 0.3);
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, rgba(255,255,255,0.1) 0%, transparent 100%);
    pointer-events: none;
  }
}

.hero-content {
  position: relative;
  z-index: 2;
  text-align: center;
  color: white;
}

.hero-animation {
  position: relative;
  display: inline-block;
  margin-bottom: 20px;
}

.heartbeat-icon {
  animation: heartbeat 2s ease-in-out infinite;
  position: relative;
  z-index: 3;
}

@keyframes heartbeat {
  0%, 100% { transform: scale(1); }
  25% { transform: scale(1.1); }
  50% { transform: scale(1.2); }
}

.pregnancy-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80px;
  height: 80px;
  background: radial-gradient(circle, rgba(255,192,203,0.4) 0%, transparent 70%);
  border-radius: 50%;
  animation: glow 3s ease-in-out infinite alternate;
}

@keyframes glow {
  from { 
    transform: translate(-50%, -50%) scale(0.8);
    opacity: 0.6;
  }
  to { 
    transform: translate(-50%, -50%) scale(1.2);
    opacity: 0.2;
  }
}

.hero-title {
  font-size: 2.2em;
  font-weight: 700;
  margin-bottom: 15px;
  text-shadow: 0 2px 10px rgba(0,0,0,0.3);
}

.gradient-text {
  background: linear-gradient(45deg, #D1C7B5 30%, #6C90B9 70%, #D1C7B5 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: 800;
  text-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.sparkle-icon {
  animation: sparkle 2s ease-in-out infinite;
}

@keyframes sparkle {
  0%, 100% { 
    transform: rotate(0deg) scale(1);
    opacity: 1;
  }
  50% { 
    transform: rotate(180deg) scale(1.2);
    opacity: 0.8;
  }
}

.hero-subtitle {
  font-size: 1.15em;
  line-height: 1.7;
  margin-bottom: 25px;
  opacity: 0.98;
  max-width: 650px;
  margin-left: auto;
  margin-right: auto;
  font-weight: 400;
  text-shadow: 0 2px 4px rgba(0,0,0,0.2);
  letter-spacing: 0.3px;
}


// Main Content
.content-sections {
  margin: 40px 0;
}

.main-title {
  text-align: center;
  color: #313657;
  font-size: 2.8em;
  font-weight: 800;
  margin-bottom: 50px;
  text-shadow: 0 2px 8px rgba(49, 54, 87, 0.1);
  letter-spacing: -0.5px;
  line-height: 1.2;
}

.navigation-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  margin-bottom: 40px;
}

.section-card {
  cursor: pointer;
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  border-left: 4px solid transparent;
  background: linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.95) 100%);
  backdrop-filter: blur(10px);
  
  &:hover {
    transform: translateY(-8px) scale(1.02);
    box-shadow: 0 12px 35px rgba(49, 54, 87, 0.15), 0 4px 15px rgba(221, 60, 81, 0.1);
    border-left-color: #DD3C51;
    background: linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,1) 100%);
  }
}

.section-content {
  padding: 24px;
}

.section-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.section-icon {
  margin-right: 16px;
}

.section-title {
  color: #313657;
  font-size: 1.35em;
  font-weight: 700;
  margin: 0;
  line-height: 1.3;
  letter-spacing: -0.2px;
}

.section-description {
  color: #1F6683;
  line-height: 1.6;
  margin: 0;
  font-weight: 400;
  font-size: 0.95em;
  opacity: 0.9;
}

// Section Details
.section-detail {
  margin-top: 40px;
}

.section-content-detail {
  h2 {
    color: #313657;
    font-size: 2em;
    margin-bottom: 24px;
  }
}

.content-blocks {
  display: flex;
  flex-direction: column;
  gap: 20px;
  
  .v-card {
    background: linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(209, 199, 181, 0.05) 100%);
    border: 1px solid rgba(31, 102, 131, 0.1);
  }
  
  h4 {
    color: #DD3C51;
    font-weight: 700;
    margin-bottom: 12px;
    font-size: 1.1em;
    letter-spacing: -0.1px;
  }
  
  p {
    line-height: 1.7;
    color: #313657;
    font-size: 1em;
    font-weight: 400;
    opacity: 0.95;
  }
}

// Interactive Tool Styles
.metrics-form {
  border-left: 5px solid #DD3C51;
  background: linear-gradient(135deg, rgba(209, 199, 181, 0.08) 0%, rgba(108, 144, 185, 0.05) 100%);
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(31, 102, 131, 0.1);
  
  h4 {
    color: #313657;
    font-weight: 700;
    font-size: 1.2em;
    margin-bottom: 16px;
  }
}

.results-panel {
  border-radius: 12px;
  box-shadow: 0 6px 25px rgba(0,0,0,0.15);
  border: 2px solid rgba(255,255,255,0.2);
  
  .results-content {
    .results-summary {
      font-size: 1.15em;
      font-weight: 600;
      line-height: 1.4;
    }
    
    .findings {
      ul {
        padding-left: 24px;
        
        li {
          margin-bottom: 8px;
          line-height: 1.5;
          font-weight: 400;
        }
      }
    }
    
    h4 {
      font-size: 1.3em;
      font-weight: 700;
    }
  }
}

// Enhanced Responsive Design
@media (max-width: 768px) {
  .ultrasound-page {
    padding: 0 12px;
  }
  
  .pregnancy-hero {
    padding: 30px 20px;
    margin-bottom: 30px;
    
    .hero-title {
      font-size: 1.8em;
    }
    
    .hero-subtitle {
      font-size: 1em;
      line-height: 1.6;
    }
  }
  
  .main-title {
    font-size: 2.2em;
    margin-bottom: 30px;
  }
  
  .navigation-cards {
    grid-template-columns: 1fr;
    gap: 18px;
  }
  
  .section-content {
    padding: 20px;
  }
  
  .content-blocks {
    gap: 16px;
    
    h4 {
      font-size: 1.05em;
    }
    
    p {
      font-size: 0.95em;
    }
  }
}

// Enhanced Typography
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

// Better contrast and readability
.v-card {
  &.elevation-2, &.elevation-3 {
    box-shadow: 0 3px 12px rgba(49, 54, 87, 0.12), 0 1px 6px rgba(31, 102, 131, 0.08) !important;
  }
}

// Input field styling
.v-text-field {
  .v-input__control .v-input__slot {
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(10px);
  }
  
  .v-label {
    color: #313657 !important;
    font-weight: 500;
  }
}

// Button styling improvements
.v-btn {
  text-transform: none !important;
  font-weight: 600 !important;
  letter-spacing: 0.2px !important;
  
  &:not(.v-btn--outlined) {
    box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
  }
}
</style>