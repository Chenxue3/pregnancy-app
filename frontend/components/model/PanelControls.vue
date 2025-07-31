<template>
  <div class="model-control">
    <!-- Collapse Toggle Button -->
    <div class="collapse-header" @click="toggleCollapse">
      <h3 class="panel-title">
        <v-icon left>mdi-cog-outline</v-icon>
        Model Controls
      </h3>
      <v-btn icon small class="collapse-btn">
        <v-icon>{{ isCollapsed ? 'mdi-chevron-down' : 'mdi-chevron-up' }}</v-icon>
      </v-btn>
    </div>

    <!-- Collapsible Content -->
    <div v-show="!isCollapsed" class="panel-content">
      <!-- Main Model Controls -->
      <div class="control-section">
        <h4 class="control-title">Vessel Models</h4>
        <div class="control-group">
          <v-btn 
            @click="$emit('reload-arterial')" 
            color="error" 
            block 
            class="mb-2"
            :disabled="isLoading"
            :loading="isLoading"
          >
            <v-icon left>mdi-arterial</v-icon>
            Arterial Tree
          </v-btn>
          <v-btn 
            @click="$emit('load-venous')" 
            color="primary" 
            block 
            class="mb-2"
            :disabled="isLoading"
            :loading="isLoading"
          >
            <v-icon left>mdi-heart-pulse</v-icon>
            Venous Tree
          </v-btn>
          <v-btn @click="$emit('load-combined')" color="success" block class="mb-2" :disabled="isLoading" :loading="isLoading">
            <v-icon left>mdi-network</v-icon>
            Combined Trees
          </v-btn>
          <div class="colored-models">
            Colored Models by: {{ coloredModelsBy }}
            <v-radio-group inline v-model="coloredModelsBy" @change="$emit('colored-models-by-changed', coloredModelsBy)">
              <v-radio label="Pressure" value="pressure"></v-radio>
              <v-radio label="Flux" value="flux"></v-radio>
              <v-radio label="Default" value="default"></v-radio>
            </v-radio-group>
          </div>
        </div>

      </div>

      <br />
      
      <!-- Pressure Color Bar -->
      <div class="control-section">
        <h4 class="control-title">Pressure Scale</h4>
        <div class="color-bar-container">
          <div class="color-bar">
            <div class="color-segment green-segment"></div>
            <div class="color-segment orange-segment"></div>
            <div class="color-segment red-segment"></div>
          </div>
          <div class="color-labels">
            <span class="label-left">Low</span>
            <span class="label-center">Normal</span>
            <span class="label-right">High</span>
          </div>
        </div>
      </div>

      <br />

      
    </div>
  </div>
</template>

<script>

export default {
  props: {
    // Model states passed from parent component
    useTubeRendering: {
      type: Boolean,
      default: true
    },
    currentPerformanceMode: {
      type: String,
      default: 'high'
    },
    
    isLoading: {
      type: Boolean,
      default: false
    },
    loadingComplete: {
      type: Boolean,
      default: false
    },
    waveform: { type: Array, default: () => [] }, // [{t, value}]
  },
  mounted() {
    this.coloredModelsBy = 'pressure';
  },

  data() {
    return {
      isCollapsed: true,
      currentVesselType: 'arterial', // 'arterial' or 'venous'
      currentQuality: 'standard',     // 'standard' or 'high'
      chart: null,
      playheadTimer: null,
      coloredModelsBy: 'pressure'
    };
  },

 
 


  methods: {
    // Toggle collapse state of the control panel
    toggleCollapse() {
      this.isCollapsed = !this.isCollapsed;
    },




    getPerformanceLabel(mode) {
      const labels = {
        'high': 'High Performance',
        'medium': 'Medium Performance',
        'low': 'Low Performance',
        'auto': 'Auto Adjust'
      };
      return labels[mode] || 'Unknown';
    }
  },

  // Events emitted to parent component:
  // - 'reload-arterial': load arterial tree
  // - 'load-venous': load venous tree
  // - 'load-combined': load combined arterial and venous trees


  beforeDestroy() {
    if (this.playheadTimer) cancelAnimationFrame(this.playheadTimer);
    if (this.chart) this.chart.dispose();
    // Component cleanup if needed
  }
}
</script>

<style scoped lang="scss">

.control-panel {
  position: relative;
  width: 100%;
  background: rgba(149, 63, 63, 0.85);
  border-radius: 12px;
  color: white;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

.collapse-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  cursor: pointer;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  transition: background-color 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
  }
}

.panel-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.95);
  display: flex;
  align-items: center;
}

.collapse-btn {
  transition: transform 0.2s ease;
}

.panel-content {
  padding: 20px;
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}



.controls-content {
  padding: 20px;
  padding-top: 50px; // Make room for collapse button
  color: white;
}

.control-row {
  margin-bottom: 16px;
  display: flex;
  justify-content: center;

  &:last-child {
    margin-bottom: 0;
  }
}

.pressure-color-section {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  border-left: 4px solid #7A3520;
}

.color-bar-title {
  color: rgba(255, 255, 255, 0.9);
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.color-bar-container {
  margin-bottom: 8px;
}

.color-bar {
  width: 100%;
  height: 20px;
  border-radius: 10px;
  display: flex;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.color-segment {
  flex: 1;
  height: 100%;
}

.color-bar-labels {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 8px;
  font-size: 10px;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 500;
  
}

.label-min, .label-max {
  font-family: 'Courier New', monospace;
  color: rgba(255, 255, 255, 0.8);
}

.label-mid {
  color: rgba(255, 255, 255, 0.6);
  font-style: italic;
}

.color-bar-description {
  text-align: center;
  margin-top: 8px;
  
  small {
    color: rgba(255, 255, 255, 0.6);
    font-size: 10px;
    font-style: italic;
  }
}

.color-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 12px;
  justify-content: center;
}

.legend-row {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
  flex: 1;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 2px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  flex-shrink: 0;
}

.legend-text {
  font-size: 9px;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.info-section {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 16px;
  margin-top: 16px;
  border-left: 4px solid #2F414B;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;

  &:last-child {
    margin-bottom: 0;
  }
}

.info-label {
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-value {
  color: rgba(255, 255, 255, 0.95);
  font-size: 12px;
  font-weight: 600;
  text-align: right;
  max-width: 60%;
  word-break: break-word;
}

// Pressure Color Bar Styles
.color-bar-container {
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.color-bar {
  display: flex;
  height: 20px;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.color-segment {
  flex: 1;
  transition: transform 0.2s ease;

  &:hover {
    transform: scaleY(1.1);
  }
}

.green-segment {
  background: linear-gradient(to right, #2B4B3C, #AA988A); 
}

.orange-segment {
  background: linear-gradient(to right, #AA988A, #B66A40); 
}

.red-segment {
  background: linear-gradient(to right, #B66A40, #7A3520); 
}

.color-labels {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
}

.label-left, .label-center, .label-right {
  flex: 1;
  text-align: center;
}

.label-left {
  text-align: left;
}

.label-right {
  text-align: right;
}

// Custom button styles
.v-btn {
  text-transform: none !important;
  font-weight: 500 !important;
}

.status-text {
  font-family: 'Courier New', monospace;
  font-weight: 600;
  font-size: 14px;
  letter-spacing: 2px;
}

// Custom button group styles
.v-btn-toggle {
  border-radius: 8px !important;
  
  .v-btn {
    text-transform: none !important;
    font-weight: 500 !important;
    min-width: 100px;
    
    &.v-btn--active {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3) !important;
    }
  }
}

// Animation for collapse/expand
.control-panel {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  .controls-content {
    transition: opacity 0.2s ease;
  }
  
  &.collapsed .controls-content {
    opacity: 0;
  }
}

.waveform-section {
  margin: 16px 0;
}
</style>
  