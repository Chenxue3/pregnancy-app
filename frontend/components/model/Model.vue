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
      clientMounted: false // Track if component is mounted on client
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
      
      // Load default placental arterial tree model using utility with 3D cylinders
      const vtkPath = this.getAssetPath('/model/healthy_gen_np3ns1_flux_250_arterial_tree.vtk');
      const result = await this.vtkLoader.loadVTKFile(vtkPath, {
        displayName: 'Placental Arterial Tree',
        color: 0xff2222,
        opacity:1.0,
        modelSize: 420,
        useCylinderGeometry: true, // Default to 3D cylinder rendering
        cylinderSegments: 10, // Good balance of quality and performance
        onProgress: (message, progress) => {
          const progressMessage = `${message} (${Math.round(progress)}%)`;
          this.$emit('model-state-updated', { modelName: progressMessage });
        },
          onComplete: (mesh, isPointCloud, radiusData, pressureData) => {   
          let newModelName = 'Placental Arterial Tree';
          
          // Emit state update to parent
          this.$emit('model-state-updated', { modelName: newModelName });
          
          // Load camera view
          const viewPath = this.getAssetPath('modelView/noInfarct_view.json');
          this.scene.loadViewUrl(viewPath);
          this.scene.onWindowResize();
        }
      });
      
      if (!result.success) {
        this.$emit('model-state-updated', { modelName: `Error: ${result.error.message}` });
      }
    },

    /**
     * Manual reload function - triggered by user button click
     * Uses 3D cylinder geometry by default
     */
    async reloadModel() {
      console.log("User requested VTK model reload...");
      
      const vtkPath = this.getAssetPath('/model/healthy_gen_np3ns1_flux_250_arterial_tree.vtk');
      const result = await this.vtkLoader.loadVTKFile(vtkPath, {
        displayName: 'Placental Arterial Tree',
        color: 0xff3333,
        opacity: 1,
        modelSize: 420,
        useCylinderGeometry: true, // Default to 3D cylinder rendering
        cylinderSegments: 10,
        onProgress: (message, progress) => {
          const progressMessage = `${message} (${Math.round(progress)}%)`;
          this.$emit('model-state-updated', { modelName: progressMessage });
        },
        onComplete: (mesh, isPointCloud) => {
          let newModelName = 'Placental Arterial Tree';
          
          // Emit state update to parent
          this.$emit('model-state-updated', { modelName: newModelName });
          
          const viewPath = this.getAssetPath('modelView/noInfarct_view.json');
          this.scene.loadViewUrl(viewPath);
        }
      });
      
      if (!result.success) {
        this.$emit('model-state-updated', { modelName: `Error: ${result.error.message}` });
      }
    },

    /**
     * Load arterial tree with cylinder geometry using radius data
     */
    async loadArterialTreeWithCylinders() {
      console.log("Loading arterial tree with cylinder geometry...");
      
      const vtkPath = this.getAssetPath('/model/healthy_gen_np3ns1_flux_250_arterial_tree.vtk');
      const result = await this.vtkLoader.loadVTKFile(vtkPath, {
        displayName: 'Placental Arterial Tree (Cylinders)',
        color: 0xff2222,
        opacity: 1,
        modelSize: 420,
        useCylinderGeometry: true, // Enable cylinder geometry with radius data
        cylinderSegments: 12, // Higher quality cylinders
        onProgress: (message, progress) => {
          const progressMessage = `${message} (${Math.round(progress)}%)`;
          this.$emit('model-state-updated', { modelName: progressMessage });
        },
        onComplete: (mesh, isPointCloud) => {
          let newModelName = 'Placental Arterial Tree';
          
          // Emit state update to parent
          this.$emit('model-state-updated', { modelName: newModelName });
          
          const viewPath = this.getAssetPath('modelView/noInfarct_view.json');
          this.scene.loadViewUrl(viewPath);
        }
      });
      
      if (!result.success) {
        this.$emit('model-state-updated', { modelName: `Error: ${result.error.message}` });
      }
    },

    /**
     * Load venous tree 
     */
    async loadVenousTree() {
      const vtkPath = this.getAssetPath('/model/healthy_gen_np3ns1_flux_250_venous_tree.vtk');
      const result = await this.vtkLoader.loadVTKFile(vtkPath, {
        displayName: 'Placental Venous Tree',
        color: 0x2222ff,
        opacity: 1,
        modelSize: 420,
        useCylinderGeometry: true, // Default to 3D cylinder rendering
        cylinderSegments: 10, // Good balance of quality and performance
        onProgress: (message, progress) => {
          const progressMessage = `${message} (${Math.round(progress)}%)`;
          this.$emit('model-state-updated', { modelName: progressMessage });
        },
        onComplete: (mesh, isPointCloud) => {
          let newModelName = 'Placental Venous Tree';
          
          // Emit state update to parent
          this.$emit('model-state-updated', { modelName: newModelName });
          
          const viewPath = this.getAssetPath('modelView/noInfarct_view.json');
          this.scene.loadViewUrl(viewPath);
        }
      });
      
      if (!result.success) {
        this.$emit('model-state-updated', { modelName: `Error: ${result.error.message}` });
      }
    },



    // Toggle between line rendering modes (simplified for basic VTK loader)
    toggleRenderMode() {
      console.log('[Model] Toggle render mode called - reloading model');
      
      // Emit state changes to parent
      this.$emit('model-state-updated', { 
        modelName: "Reloading model..."
      });
      
      // Reload current model
      this.start(); // Reload the default arterial model
    },

    // Cycle through performance modes (simplified for basic VTK loader)
    cyclePerformanceMode() {
      const modes = ['high', 'medium', 'low', 'auto'];
      const currentIndex = modes.indexOf(this.currentPerformanceMode);
      const nextIndex = (currentIndex + 1) % modes.length;
      const newPerformanceMode = modes[nextIndex];
      
      console.log('[Model] Performance mode set to:', newPerformanceMode);
      
      // Emit state changes to parent
      this.$emit('model-state-updated', { 
        currentPerformanceMode: newPerformanceMode
      });
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



// Loading placeholder styles
.loading-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100vh;
  background: linear-gradient(135deg, #1a1a1a, #2d2d2d);
  
  .loading-text {
    color: #fff;
    font-size: 18px;
    font-weight: 300;
    text-align: center;
    opacity: 0.8;
  }
}

// Responsive adjustments for mobile
@media (max-width: 768px) {
  .loading-placeholder {
    height: 100vw;
  }
}
</style> 