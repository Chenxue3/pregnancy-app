<template>
  <div class="model">
    <!-- Only render in client-side to avoid SSR mismatch -->
     <header class="model-info">{{modelName}}</header>
    <client-only>
      <!-- 3D model container div, responsive sizing based on screen size -->
      <div
          ref="baseDomObject"
          :class="mdAndUp ? 'baseDom-md' : 'baseDom-sm'"
          style="width: 100%; height: 100%;"
        />

        <div
        ref="threeDControls"
        class="baseModelControl"
        :class="mdAndUp ? 'baseModelControl-md' : 'baseModelControl-sm'"
      >
        <div class="baseModelCB" :class="mdAndUp ? 'baseModelCB-md' : ''">
         
          <img
            src="~/assets/images/gestures-icons.png"
            class="h-full w-full md:object-contain"
            @click="handleGestureIconClick"
          />
          
        </div>
      </div>
      
      <!-- Fallback template for SSR -->
      <template #fallback>
        <div class="loading-placeholder">
          <div class="loading-text">Loading 3D Engine...</div>
        </div>
      </template>
    </client-only>
  </div>
</template>

<script>
import VTKLoader from '@/utils/vtkLoader'

export default {
  props: {
    // Model control states from parent component
    useTubeRendering: {
      type: Boolean,
      default: true
    },
    currentPerformanceMode: {
      type: String,
      default: 'high'
    },
    modelName: {
      type: String,
      default: 'Loading...'
    }
  },
  
  // Component data - stores all reactive properties
  data() {
    return {
      Copper: null,        // Copper3D library instance for 3D rendering
      THREE: null,         // Three.js library instance for 3D geometry
      baseRenderer: null,  // Main renderer for managing 3D scenes
      container: null,     // DOM container for 3D canvas
      vtkLoader: null,     // VTK loader utility instance
      _resizeHandler: null, // Store resize handler for cleanup
      clientMounted: false, // Track if component is mounted on client
      currentModelType: 'arterial', // Track currently loaded model type
      
      // Model configuration for different tree types
      modelConfig: {
        arterial: {
          path: '/model/healthy_gen_np3ns1_flux_250_arterial_tree.vtk',
          displayName: 'Placental Arterial Tree',
          color: 0xff2222,
          opacity: 1.0,
          modelSize: 420,
          useCylinderGeometry: true,
          cylinderSegments: 10
        },
        venous: {
          path: '/model/healthy_gen_np3ns1_flux_250_venous_tree.vtk',
          displayName: 'Placental Venous Tree',
          color: 0x2222ff,
          opacity: 1.0,
          modelSize: 420,
          useCylinderGeometry: true,
          cylinderSegments: 10
        },
        combined: {
          displayName: 'Placental Vascular Network',
          models: ['arterial', 'venous']
        }
      }
    };
  },

  computed: {
    mdAndUp() {
      // Ensure consistent behavior between SSR and client
      if (!this.clientMounted) {
        return false; // Default to mobile layout during SSR
      }
      // Add comprehensive null checks for $vuetify
      try {
        return this.$vuetify && 
               this.$vuetify.breakpoint && 
               this.$vuetify.breakpoint.mdAndUp;
      } catch (e) {
        console.warn("[Model] Error accessing vuetify breakpoint:", e);
        return false;
      }
    },
  },

  // Component mounted lifecycle - initializes 3D environment
  mounted() {
    // Mark component as client-side mounted
    this.clientMounted = true;
    
    // Only initialize if we're on client-side
    if (process.client) {
      // Use nextTick to ensure DOM is fully rendered after client-only activation
      this.$nextTick(() => {
        // Wait for plugins to be ready before initializing
        this.waitForPluginsAndInitialize();
      });
    }
  },

  methods: {
    // Get correct path for static assets based on deployment environment
    getAssetPath(relativePath) {
      let basePath = '';
      
      // Check if we're in GitHub Pages environment using multiple methods
      if (process.client) {
        // Check current URL to determine if we're on GitHub Pages
        const isGitHubPages = window.location.pathname.startsWith('/pregnancy-app/') || 
                            window.location.hostname.includes('github.io');
        basePath = isGitHubPages ? '/pregnancy-app' : '';
      } else {
        // Server-side: use environment variable
        const isGitHubPages = process.env.DEPLOY_ENV === 'GH_PAGES';
        basePath = isGitHubPages ? '/pregnancy-app' : '';
      }
      
      // Ensure the path starts with / if not already
      const cleanPath = relativePath.startsWith('/') ? relativePath : '/' + relativePath;
      
      console.log(`[Model] Asset path: ${relativePath} -> ${basePath + cleanPath}`);
      return basePath + cleanPath;
    },

    // Wait for plugins to be available and then initialize
    async waitForPluginsAndInitialize(retryCount = 0) {
      const maxRetries = 10;
      const delay = 200; // 200ms delay between retries
      
      // Check if required plugins are available
      if (this.checkPluginsAvailability()) {
        console.log("[Model] Plugins ready, initializing 3D engine...");
        this.initializeCopper3D();
      } else if (retryCount < maxRetries) {
        console.log(`[Model] Plugins not ready, retrying... (${retryCount + 1}/${maxRetries})`);
        this.$emit('model-state-updated', { modelName: `Loading 3D Engine... (${retryCount + 1}/${maxRetries})` });
        
        setTimeout(() => {
          this.waitForPluginsAndInitialize(retryCount + 1);
        }, delay);
      } else {
        console.error("[Model] Failed to initialize plugins after maximum retries");
        this.$emit('model-state-updated', { modelName: "Error: 3D engine initialization timed out" });
      }
    },

    // Check if all required plugins are available
    checkPluginsAvailability() {
      try {
        return this.$Copper && 
               this.$three && 
               this.$baseRenderer && 
               this.$baseContainer &&
               typeof this.$Copper === 'function' &&
               typeof this.$three === 'function' &&
               typeof this.$baseRenderer === 'function' &&
               typeof this.$baseContainer === 'function';
      } catch (e) {
        return false;
      }
    },

    // Initialize Copper3D engine
    initializeCopper3D() {
      // Wait for DOM elements to be available in client-only context
      this.waitForDOMAndInitialize();
    },

    // Wait for DOM elements to be available and then initialize
    async waitForDOMAndInitialize(retryCount = 0) {
      const maxRetries = 20;
      const delay = 100;

      // Check if DOM container is available
      this.container = this.$refs.baseDomObject;
      
      if (this.container) {
        console.log("[Model] DOM container found, initializing 3D engine...");
        this.initialize3DEngine();
      } else if (retryCount < maxRetries) {
        console.log(`[Model] DOM container not ready, retrying... (${retryCount + 1}/${maxRetries})`);
        this.$emit('model-state-updated', { modelName: `Preparing 3D Container... (${retryCount + 1}/${maxRetries})` });
        
        setTimeout(() => {
          this.waitForDOMAndInitialize(retryCount + 1);
        }, delay);
      } else {
        console.error("[Model] Failed to find DOM container after maximum retries");
        this.$emit('model-state-updated', { modelName: "Error: DOM container not found" });
      }
    },

    // Initialize 3D engine after DOM is ready
    initialize3DEngine() {
      try {
        this.Copper = this.$Copper();           // Get Copper3D instance
        this.THREE = this.$three();             // Get Three.js instance  
        this.baseRenderer = this.$baseRenderer(); // Get main renderer
        const baseContainer = this.$baseContainer(); // Get 3D container

        // Verify all components are properly initialized
        if (!this.baseRenderer || !baseContainer || !this.container) {
          console.error("[Model] 3D components not properly initialized");
          this.$emit('model-state-updated', { modelName: "Error: 3D components missing" });
          return;
        }
      
        // Setup container with slight delay to ensure DOM is ready
        setTimeout(() => {
          // Set responsive height based on screen size with null checks
          if (baseContainer && this.container) {
            this.mdAndUp
              ? (baseContainer.style.height = "100vh")  // Full height on desktop
              : (baseContainer.style.height = "100vw"); // Square on mobile
            
            this.container.appendChild(baseContainer);
          }
          
          // Initialize VTK loader and start loading models
          this.initializeVTKLoader();
          this.start();
        }, 100);

        // Setup resize listener
        this.setupResizeListener(baseContainer);
        
      } catch (error) {
        console.error("[Model] Error initializing 3D components:", error);
        this.$emit('model-state-updated', { modelName: "Error: Failed to initialize 3D engine" });
      }
    },

    // Setup window resize listener
    setupResizeListener(baseContainer) {
      const resizeHandler = () => {
        setTimeout(() => {
          if (baseContainer) {
            this.mdAndUp
              ? (baseContainer.style.height = "100vh")
              : (baseContainer.style.height = "100vw");
          }
          if (this.scene) {
            this.scene.onWindowResize();
          }
        }, 500);
      };

      window.addEventListener("resize", resizeHandler);
      
      // Store reference for cleanup
      this._resizeHandler = resizeHandler;
    },

    // Initialize VTK loader utility
    initializeVTKLoader() {
      try {
        if (!this.baseRenderer) {
          console.error("[Model] Base renderer not available");
          return;
        }
        
        // Initialize scene first
        this.scene = this.baseRenderer.getSceneByName('placental-scene');
        if (this.scene === undefined) {
          this.scene = this.baseRenderer.createScene('placental-scene');
          this.baseRenderer.setCurrentScene(this.scene);
        }
        
        // Create VTK loader instance
        this.vtkLoader = new VTKLoader(this.THREE, this.scene.scene);
        
        // Set copper scene reference for camera control
        this.vtkLoader.setCopperScene(this.scene);
        
        // Set initial performance mode
        this.vtkLoader.setPerformanceMode(this.currentPerformanceMode);
        
        console.log("VTK Loader initialized with camera control and performance mode:", this.currentPerformanceMode);
      } catch (error) {
        console.error("[Model] Error initializing VTK loader:", error);
        this.$emit('model-state-updated', { modelName: "Error: VTK loader initialization failed" });
      }
    },

    // Main initialization method - called after component is mounted
    async start(){
      console.log("Loading default placental model...");
      
      // Use unified loadTree function for default arterial model
      await this.loadTree('arterial');
    },

    async reciveColoringType(colorModelBy){
      console.log('[Model] Coloring type received:', colorModelBy);
      
      if (!this.vtkLoader) {
        console.warn('[Model] VTK loader not initialized');
        return;
      }
      
      // Map the received coloring type to our colorMappingType values
      let colorMappingType = 'pressure'; // default
      
      if (colorModelBy === 'flux' || colorModelBy === 'flow') {
        colorMappingType = 'flux';
      } else if (colorModelBy === 'default' || colorModelBy === 'vessel-type') {
        colorMappingType = 'default';
      } else if (colorModelBy === 'pressure') {
        colorMappingType = 'pressure';
      }
      
      console.log('[Model] Mapped to colorMappingType:', colorMappingType);
      
      // Reload the current model with new color mapping
      try {
        this.$emit('model-state-updated', { modelName: 'Updating color mapping...' });
        
        await this.loadTree(this.currentModelType, {
          colorMappingType: colorMappingType,
          clearScene: true // Clear existing model first
        });
        
        console.log('[Model] Model reloaded with new color mapping:', colorMappingType);
        
      } catch (error) {
        console.error('[Model] Error updating color mapping:', error);
        this.$emit('model-state-updated', { modelName: 'Error updating color mapping' });
      }
    },

    /**
     * Universal tree loading function - replaces all duplicated load methods
     * @param {string} modelType - 'arterial', 'venous', or 'combined'
     * @param {Object} options - Override default options
     */
    async loadTree(modelType, options = {}) {
      console.log(`[Model] Loading ${modelType} model...`);
      
      // Get base configuration for this model type
      const baseConfig = this.modelConfig[modelType];
      if (!baseConfig) {
        console.error(`[Model] Unknown model type: ${modelType}`);
        this.$emit('model-state-updated', { modelName: `Error: Unknown model type ${modelType}` });
        return;
      }

      // Handle combined models (load multiple models)
      if (modelType === 'combined') {
        this.currentModelType = modelType;
        return await this.loadCombinedModels(baseConfig, options);
      }
      
      // Track the current model type
      this.currentModelType = modelType;

      // Merge base config with provided options
      const config = {
        ...baseConfig,
        ...options,
        // Handle high quality option
        cylinderSegments: options.highQuality ? 12 : (options.cylinderSegments || baseConfig.cylinderSegments),
        // Force useCylinderGeometry to true to avoid line rendering first
        useCylinderGeometry: true
      };

      const vtkPath = this.getAssetPath(config.path);
      const result = await this.vtkLoader.loadVTKFile(vtkPath, {
        displayName: config.displayName,
        color: config.color,
        opacity: config.opacity,
        modelSize: config.modelSize,
        useCylinderGeometry: config.useCylinderGeometry,
        cylinderSegments: config.cylinderSegments,
        colorMappingType: config.colorMappingType || 'pressure', // Pass color mapping type
        clearPrevious: options.clearScene !== false, // Only clear if not explicitly set to false
        // Disable LoD to avoid showing lines first
        useLoD: false,
        onProgress: (message, progress) => {
          const progressMessage = `${message}`;
          this.$emit('model-state-updated', { modelName: progressMessage });
        },
        onComplete: (mesh, isPointCloud, radiusData, pressureData) => {
          // Emit state update to parent
          this.$emit('model-state-updated', { modelName: config.displayName });
          
          // Load camera view and resize
          const viewPath = this.getAssetPath('modelView/noInfarct_view.json');
          this.scene.loadViewUrl(viewPath);
          this.scene.onWindowResize();
        }
      });
      
      if (!result.success) {
        this.$emit('model-state-updated', { modelName: `Error: ${result.error.message}` });
      }
      
      return result;
    },

    /**
     * Load combined models (multiple trees)
     * @param {Object} baseConfig - Base configuration for combined model
     * @param {Object} options - Override options
     */
    async loadCombinedModels(baseConfig, options = {}) {
      const modelTypes = options.models || baseConfig.models;
      
      try {
        // Load each model in sequence, don't clear scene for subsequent models
        for (let i = 0; i < modelTypes.length; i++) {
          const modelType = modelTypes[i];
          
          await this.loadTree(modelType, {
            ...options,
            clearScene: i === 0 // Only clear scene for first model
          });
        }
        
        // Update final name
        this.$emit('model-state-updated', { modelName: baseConfig.displayName });
        
      } catch (error) {
        console.error('[Model] Error loading combined models:', error);
        this.$emit('model-state-updated', { modelName: 'Loading Error' });
      }
    },

    /**
     * Manual reload function - triggered by user button click
     */
    async reloadModel() {
      console.log("User requested VTK model reload...");
      
      // Use unified loadTree function for reload
      await this.loadTree('arterial', {
        color: 0xff3333, // Slightly different color for reload
        displayName: 'Placental Arterial Tree (Reloaded)'
      });
    },

    /**
     * Load venous tree 
     */
    async loadVenousTree() {
      console.log("Loading venous tree...");
      await this.loadTree('venous');
    },

    /**
     * Load combined arterial and venous trees
     */
    async loadCombinedTrees() {
      console.log("Loading combined vascular network...");
      await this.loadTree('combined');
    },


    // Handle click on gesture icons area
    handleGestureIconClick(event) {
      const rect = event.target.getBoundingClientRect();
      const clickX = event.clientX - rect.left;
      const imageWidth = rect.width;
      
      // Check if click is in the first quarter (first 25% from left)
      if (clickX <= imageWidth / 4) {
        console.log('[Model] Reset gesture clicked - resetting model to default position');
        this.resetModelToDefault();
      }
    },

    // Reset model to default position, zoom, and remove any effects
    resetModelToDefault() {
      if (!this.scene) {
        console.warn('[Model] Scene not available for reset');
        return;
      }

      try {
        // Reset camera to default view
        const viewPath = this.getAssetPath('modelView/noInfarct_view.json');
        this.scene.loadViewUrl(viewPath);
        
        // Trigger window resize to ensure proper rendering
        this.scene.onWindowResize();
        
        // Clear any zoom/pan transformations and reset to initial state 
        if (this.vtkLoader) {
          // Remove any overlaid data or effects
          this.vtkLoader.clearTemporaryData();
        }
        
        console.log('[Model] Model reset to default position completed');
        
        // Emit state update to parent
        this.$emit('model-state-updated', { 
          modelName: this.modelName || 'Placental Arterial Tree',
          resetTriggered: true
        });
        
      } catch (error) {
        console.error('[Model] Error resetting model to default:', error);
      }
    },


  },


  beforeDestroy() {
    // Clean up VTK loader resources
    if (this.vtkLoader) {
      this.vtkLoader.dispose();
      this.vtkLoader = null;
    }
    
    // Clean up resize listener
    if (this._resizeHandler) {
      window.removeEventListener("resize", this._resizeHandler);
      this._resizeHandler = null;
    }
  }
};
</script>

<style scoped lang="scss">

.baseModelControl {
  width: 100vw;
  height: 120px;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-content: center;
  .baseModelCB {
    width: 240px;
    height: 70px;
    position: relative;
  }
  .baseModelCB-md {
    width: 280px;
    height: 100px;
  }
}

.baseModelControl-md {
  position: fixed;
  bottom: 10px;
  padding-left: 100px;
}
.baseModelControl-sm {
  order: -1; // Move to the top of the stack
  height: 60px;
}

.model-info{
  font-size: 1.2em;
  left:50%;
  transform: translateX(-50%);
  top:1%;
  position: absolute;
  color: #fff;
  z-index: 1000;
}
.model {
  position: relative;
  width: 100%;
  height: 100%;
}

.baseDom-md {
  width: 100%;
  height: 100vh;
}

.baseDom-sm {
  width: 100%;
  height: 100vw;
}

// Responsive adjustments for mobile
@media (max-width: 768px) {
  // Mobile responsive adjustments
}
</style> 