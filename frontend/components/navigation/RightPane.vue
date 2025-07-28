<template>
  <div class="responsive-container">
    <!-- Model Section -->
    <div class="model-section" :class="{ 'model-section-mobile': !mdAndUp }">
      <!-- Loading overlay for model -->
      <div v-if="isModelLoading" class="model-loading-overlay">
        <div class="model-loading-content">
          <loading-bar />
          <p class="model-loading-text">{{ loadingMessage }}</p>
        </div>
      </div>
      
      <model
        ref="modelComponent"
        :use-tube-rendering="modelStates.useTubeRendering"
        :current-performance-mode="modelStates.currentPerformanceMode"
        :model-name="modelStates.modelName"
        @model-state-updated="handleModelStateUpdate"
      />
    </div>

    <!-- Controls and Analytics Section -->
    <div class="controls-section" :class="{ 'controls-section-mobile': !mdAndUp }">
      <!-- Model Controls -->
      <div class="controls-panel">
        <!-- Loading Bar for Model Loading States -->
        <div v-if="isModelLoading" class="loading-container mb-3">
          <loading-bar />
          <p class="loading-text">{{ loadingMessage }}</p>
        </div>
        
        <PanelControls
          :use-tube-rendering="modelStates.useTubeRendering"
          :current-performance-mode="modelStates.currentPerformanceMode"
          :model-name="modelStates.modelName"
          :rendering-type="modelStates.renderingType"
          :pressure-color-mapping="modelStates.pressureColorMapping"
          @reload-arterial="handleReloadArterial"
          @load-venous="handleLoadVenous"
          @load-arterial-cylinders="handleLoadArterialCylinders"
          @load-venous-cylinders="handleLoadVenousCylinders"
        />
      </div>

      <!-- Conditions Panel -->
      <div class="conditions-panel">
        <ConditionSelector
          @conditions-changed="handleConditionsChanged"
          @trigger-visualization="handleConditionVisualization"
          @reset-to-normal="handleResetToNormal"
          @panel-expanded="handleConditionsPanelExpanded"
          @panel-collapsed="handleConditionsPanelCollapsed"
        />
      </div>

      <!-- Waveform Panel -->
      <div 
        class="waveform-panel"
        :class="{ 'waveform-pushed': isConditionsPanelExpanded }"
      >
        <div class="waveform-header">
          <h4>Blood Flow Analysis</h4>
        </div>
        <div class="waveform-content">
          <Waveform :waveform="waveformData" />
        </div>
      </div>

      <!-- Logo Section for Desktop -->
      <div v-if="mdAndUp" class="logo-section">
        <div class="logo-container">
          <logo />
        </div>
      </div>
    </div>
  </div>

  <!-- </div> -->
</template>

<script>
import PanelControls from "../model/PanelControls.vue";
import Waveform from "../model/Waveform.vue";
import ConditionSelector from "../model/ConditionSelector.vue";
export default {
  data() {
    return {
      clientMounted: false, // Track if component is mounted on client
      // Centralized model state management
      modelStates: {
        useTubeRendering: true,
        currentPerformanceMode: "high",
        modelName: "Loading...",
        renderingType: "3D Cylinders", // Default to 3D cylinder rendering
        pressureColorMapping: null, // Pressure color mapping for display
      },
      // TODO: get waveform data from model
      waveformData: {
        data: [],
        title: "Placental Blood Flow Waveform",
        isPlaying: true,
        speed: 1,
      },
      // Ultrasound tool integration properties
      ultrasoundToolRef: null,
      lastUltrasoundMetrics: null,
      lastConditionData: null,
      
      // Loading state properties
      isModelLoading: false,
      loadingMessage: 'Loading model...',
      
      // UI state properties
      isConditionsPanelExpanded: false,
    };
  },

  mounted() {
    this.clientMounted = true;
    $nuxt.$emit(
      "send-emitter-data",
      "data in RightPanel.vue send to Model.vue"
    );
    
    // Generate realistic waveform data
    this.waveformData.data = this.generateWaveformData(200);
    console.log('[RightPane] Generated waveform data:', this.waveformData.data.length, 'points');
    
    // Listen for ultrasound tool events from the layout
    this.$nuxt.$on('ultrasound-metrics-updated', this.handleUltrasoundMetricsUpdated);
    this.$nuxt.$on('trigger-model-visualization', this.handleTriggerModelVisualization);
    this.$nuxt.$on('ultrasound-tool-ready', this.handleUltrasoundToolReady);
    this.$nuxt.$on('conditions-updated', this.handleConditionsUpdated);
    this.$nuxt.$on('trigger-condition-visualization', this.handleTriggerConditionVisualization);
  },

  computed: {
    mdAndUp() {
      // Ensure consistent behavior between SSR and client
      if (!this.clientMounted) {
        return false; // Default to mobile layout during SSR
      }
      // Add comprehensive null checks for $vuetify
      try {
        return (
          this.$vuetify &&
          this.$vuetify.breakpoint &&
          this.$vuetify.breakpoint.mdAndUp
        );
      } catch (e) {
        console.warn("[RightPane] Error accessing vuetify breakpoint:", e);
        return false;
      }
    },
  },

  methods: {
    // Handle events from PanelControls and forward to Model component
    handleReloadArterial() {
      if (this.$refs.modelComponent && this.$refs.modelComponent.reloadModel) {
        this.startLoading('Loading arterial tree model...');
        this.$refs.modelComponent.reloadModel();
        this.modelStates.renderingType = "3D Cylinders";
      }
    },

    handleLoadVenous() {
      if (
        this.$refs.modelComponent &&
        this.$refs.modelComponent.loadVenousTree
      ) {
        this.startLoading('Loading venous tree model...');
        this.$refs.modelComponent.loadVenousTree();
        this.modelStates.renderingType = "3D Cylinders";
      }
    },

    handleLoadArterialCylinders() {
      if (
        this.$refs.modelComponent &&
        this.$refs.modelComponent.loadArterialTreeWithCylinders
      ) {
        this.startLoading('Loading high quality arterial model...');
        this.$refs.modelComponent.loadArterialTreeWithCylinders();
        this.modelStates.renderingType = "High Quality 3D";
      }
    },

    handleLoadVenousCylinders() {
      if (
        this.$refs.modelComponent &&
        this.$refs.modelComponent.loadVenousTreeWithCylinders
      ) {
        this.startLoading('Loading high quality venous model...');
        this.$refs.modelComponent.loadVenousTreeWithCylinders();
        this.modelStates.renderingType = "High Quality 3D";
      }
    },

    // Handle state updates from Model component
    handleModelStateUpdate(newStates) {
      Object.assign(this.modelStates, newStates);
      
      // Stop loading when model is ready (not showing "Loading..." in name)
      if (newStates.modelName && !newStates.modelName.includes('Loading')) {
        this.stopLoading();
      }
    },
    
    // Handle ultrasound metrics updates from the interactive tool
    handleUltrasoundMetricsUpdated(data) {
      console.log('[RightPane] Received ultrasound metrics:', data);
      
      // Store metrics for potential model integration
      this.lastUltrasoundMetrics = data;
      
      // Future implementation: update model visualization based on metrics
      if (this.$refs.modelComponent && this.modelStates.modelName !== 'Loading...') {
        // This will be expanded when model integration is implemented
        console.log('[RightPane] Model component ready for ultrasound visualization');
      }
    },
    
    // Handle model visualization requests from ultrasound tool
    handleTriggerModelVisualization(eventData) {
      console.log('[RightPane] Model visualization triggered:', eventData);
      
      if (eventData.type === 'ultrasound-metrics') {
        this.visualizeUltrasoundMetrics(eventData.data);
      } else if (eventData.type === 'pregnancy-conditions') {
        this.visualizeConditions(eventData.data);
      }
    },
    
    // Handle ultrasound tool ready event
    handleUltrasoundToolReady(toolComponent) {
      console.log('[RightPane] Ultrasound tool ready for model integration');
      this.ultrasoundToolRef = toolComponent;
      
      // If model is already loaded, notify the tool
      if (this.$refs.modelComponent && this.modelStates.modelName !== 'Loading...') {
        this.notifyUltrasoundToolOfModelState();
      }
    },
    
    // Future implementation: visualize ultrasound metrics in 3D model
    visualizeUltrasoundMetrics(metricsData) {
      console.log('[RightPane] Visualizing ultrasound metrics in model:', metricsData);
      
      // Placeholder for future model integration
      // This method will be expanded to:
      // 1. Analyze the metrics interpretation
      // 2. Adjust model visualization based on risk level
      // 3. Highlight relevant parts of the placental model
      // 4. Show color coding based on resistance/pulsatility indices
      
      const { metrics, interpretation } = metricsData;
      
      // Update model state to reflect ultrasound visualization mode
      this.modelStates.modelName = `Ultrasound Visualization - ${interpretation.riskLevel.toUpperCase()} Risk`;
      
      // Future: Trigger specific model loading/highlighting based on metrics
      if (interpretation.riskLevel === 'high') {
        // Load model with high-resistance visualization
        console.log('[RightPane] Future: Load high-resistance placental model');
      } else if (interpretation.riskLevel === 'moderate') {
        // Load model with moderate-resistance visualization  
        console.log('[RightPane] Future: Load moderate-resistance placental model');
      } else {
        // Load normal placental model
        console.log('[RightPane] Future: Load normal placental model');
      }
    },
    
    // Notify ultrasound tool of current model state
    notifyUltrasoundToolOfModelState() {
      if (this.ultrasoundToolRef && this.ultrasoundToolRef.updateModelVisualization) {
        const modelData = {
          modelComponent: this.$refs.modelComponent,
          modelStates: this.modelStates,
          ready: true
        };
        
        this.ultrasoundToolRef.updateModelVisualization(modelData);
      }
    },
    
    // Handle pregnancy condition updates from the interactive tool
    handleConditionsUpdated(data) {
      console.log('[RightPane] Received condition updates:', data);
      
      // Store condition data for potential model integration
      this.lastConditionData = data;
      
      // Future implementation: update model based on selected conditions
    },
    
    // Handle condition visualization requests specifically
    handleTriggerConditionVisualization(eventData) {
      console.log('[RightPane] Condition visualization specifically triggered:', eventData);
      
      if (eventData.type === 'pregnancy-conditions') {
        this.visualizeConditions(eventData.data);
      }
    },
    
    // Future implementation: visualize pregnancy conditions in 3D model
    visualizeConditions(conditionData) {
      console.log('[RightPane] Visualizing pregnancy conditions in model:', conditionData);
      
      // Placeholder for future model integration
      // This method will be expanded to:
      // 1. Analyze the selected conditions
      // 2. Load appropriate placental models based on conditions
      // 3. Adjust model size and appearance based on condition effects
      // 4. Show educational overlays explaining the changes
      
      const { selectedConditions, conditionDetails, combinedEffect } = conditionData;
      
      if (selectedConditions.length === 0) {
        this.modelStates.modelName = 'Normal Placental Model';
        return;
      }
      
      // Update model state to reflect condition visualization mode
      const conditionNames = conditionDetails.map(c => c.abbreviation).join(', ');
      this.modelStates.modelName = `Condition Visualization: ${conditionNames}`;
      
      // Future: Trigger specific model loading based on conditions
      const hasGrowthRestriction = selectedConditions.some(c => 
        ['sga', 'fgr', 'iugr'].includes(c)
      );
      const hasPreeclampsia = selectedConditions.some(c => 
        ['pe', 'sga_pe'].includes(c)
      );
      const hasDiabetes = selectedConditions.some(c => c === 'gdm');
      
      if (hasGrowthRestriction) {
        console.log('[RightPane] Future: Load smaller placental model with compromised vasculature');
      }
      if (hasPreeclampsia) {
        console.log('[RightPane] Future: Highlight increased resistance areas in model');
      }
      if (hasDiabetes) {
        console.log('[RightPane] Future: Load larger placental model');
      }
      
      // Future: Apply visual changes to the 3D model
      // - Model scaling based on condition effects
      // - Color coding for different risk levels
      // - Highlighting specific areas affected by conditions
    },
    
    // Loading state management methods
    startLoading(message = 'Loading model...') {
      this.isModelLoading = true;
      this.loadingMessage = message;
      console.log('[RightPane] Loading started:', message);
    },
    
    stopLoading() {
      this.isModelLoading = false;
      console.log('[RightPane] Loading completed');
    },
    
    // Condition selector event handlers
    handleConditionsChanged(data) {
      console.log('[RightPane] Conditions changed:', data);
      this.lastConditionData = data;
      
      // Update visualization status in model states if needed
      if (data.selectedConditions.length > 0) {
        const conditionNames = data.conditionDetails.map(c => c.abbreviation).join(', ');
        // Could update model state here if needed
      }
    },
    
    handleConditionVisualization(data) {
      console.log('[RightPane] Condition visualization from selector:', data);
      this.visualizeConditions(data);
    },
    
    handleResetToNormal() {
      console.log('[RightPane] Reset to normal placenta');
      this.modelStates.modelName = 'Normal Placental Model';
      this.lastConditionData = null;
      
      // Future: Reset model to normal state
      // Could trigger loading normal placental model here
    },
    
    // Handle conditions panel expand/collapse
    handleConditionsPanelExpanded() {
      this.isConditionsPanelExpanded = true;
    },
    
    handleConditionsPanelCollapsed() {
      this.isConditionsPanelExpanded = false;
    },
    
    // Generate realistic placental blood flow waveform data
    generateWaveformData(numPoints = 200) {
      const data = [];
      const baseFlow = 3000; // Base blood flow value
      const amplitude = 1500; // Amplitude of variation
      
      for (let i = 0; i < numPoints; i++) {
        // Create a realistic placental blood flow pattern
        // Combines multiple sine waves to simulate cardiac cycle and breathing
        const cardiacCycle = Math.sin((i / numPoints) * Math.PI * 20) * amplitude * 0.8; // Main cardiac rhythm
        const respiratoryCycle = Math.sin((i / numPoints) * Math.PI * 4) * amplitude * 0.3; // Respiratory variation
        const microVariation = Math.sin((i / numPoints) * Math.PI * 60) * amplitude * 0.1; // Small variations
        const randomNoise = (Math.random() - 0.5) * amplitude * 0.05; // Small random variation
        
        const flowValue = baseFlow + cardiacCycle + respiratoryCycle + microVariation + randomNoise;
        data.push(Math.round(Math.max(500, flowValue))); // Ensure minimum flow of 500
      }
      
      return data;
    },
  },
  
  beforeDestroy() {
    // Clean up event listeners
    this.$nuxt.$off('ultrasound-metrics-updated', this.handleUltrasoundMetricsUpdated);
    this.$nuxt.$off('trigger-model-visualization', this.handleTriggerModelVisualization);
    this.$nuxt.$off('ultrasound-tool-ready', this.handleUltrasoundToolReady);
    this.$nuxt.$off('conditions-updated', this.handleConditionsUpdated);
    this.$nuxt.$off('trigger-condition-visualization', this.handleTriggerConditionVisualization);
  },
  
  components: { PanelControls, Waveform, ConditionSelector },
};
</script>

<style scoped lang="scss">
.loading-container {
  background: rgba(49, 54, 87, 0.9);
  border-radius: 12px;
  padding: 16px;
  text-align: center;
  color: #D1C7B5;
  box-shadow: 0 4px 20px rgba(31, 102, 131, 0.3);
  border: 2px solid #1F6683;
  
  .loading-text {
    margin-top: 8px;
    font-size: 12px;
    color: #D1C7B5;
    font-weight: 500;
  }
}

.model-loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(49, 54, 87, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  border-radius: 8px;
  border: 2px solid #1F6683;
  
  .model-loading-content {
    text-align: center;
    color: #D1C7B5;
    
    .model-loading-text {
      margin-top: 16px;
      font-size: 14px;
      color: #D1C7B5;
      font-weight: 500;
    }
  }
}

// Responsive Container
.responsive-container {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: row;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
}

// Model Section
.model-section {
  flex: 1;
  position: relative;
  min-height: 60vh;
  
  &.model-section-mobile {
    min-height: 40vh;
    height: 40vh;
  }
}

// Controls Section
.controls-section {
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  right: 0;
  height: 100vh;
  width: 350px;
  max-width: 30vw;
  padding: 15px;
  overflow-y: auto;
  background: rgba(255, 255, 255, 0.02);
  backdrop-filter: blur(10px);
  border-left: 1px solid rgba(31, 102, 131, 0.2);
  
  &.controls-section-mobile {
    position: relative;
    width: 100%;
    max-width: 100%;
    height: auto;
    max-height: 60vh;
    overflow-y: auto;
    flex-direction: row;
    flex-wrap: wrap;
    padding: 10px;
    border-left: none;
    border-top: 1px solid rgba(31, 102, 131, 0.2);
  }
}

// Individual Panels
.controls-panel {
  margin-bottom: 15px;
  
  .controls-section-mobile & {
    flex: 1;
    min-width: 300px;
    margin-right: 15px;
    margin-bottom: 10px;
  }
}

.conditions-panel {
  margin-bottom: 15px;
  
  .controls-section-mobile & {
    flex: 1;
    min-width: 300px;
    margin-right: 15px;
    margin-bottom: 10px;
  }
}

.waveform-panel {
  flex: 1;
  min-height: 160px;
  background: rgba(49, 54, 87, 0.1);
  border-radius: 12px;
  padding: 15px;
  margin-bottom: 15px;
  border: 1px solid rgba(31, 102, 131, 0.3);
  transition: all 0.3s ease;
  
  &.waveform-pushed {
    margin-top: 20px;
    background: rgba(49, 54, 87, 0.15);
    border-color: rgba(31, 102, 131, 0.5);
  }
  
  .controls-section-mobile & {
    width: 100%;
    min-width: 100%;
    margin-right: 0;
    order: 3;
  }
}

.waveform-header {
  margin-bottom: 10px;
  
  h4 {
    color: #6C90B9;
    font-size: 14px;
    font-weight: 600;
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
}

.waveform-content {
  height: 120px;
  width: 100%;
}

.logo-section {
  margin-top: auto;
  padding: 20px 0;
  text-align: center;
}

.logo-container {
  max-width: 150px;
  margin: 0 auto;
  opacity: 0.8;
  
  &:hover {
    opacity: 1;
    transition: opacity 0.3s ease;
  }
}

// Legacy styles compatibility (remove after testing)
.model-panel {
  position: relative;
}
</style>
