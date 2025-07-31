<template>
  <v-app ref="base_background" class="root">
    <div class="rightPanel">
      <div>
        <div class="pa-0 black">
          <Nuxt />
        </div>
      </div>
    </div>
    <div
      class="firefox"
      :class="mdAndUp ? 'outer-large' : 'outer-small'"
      ref="leftPanel"
    >
      <div class="pa-0">
        <v-row class="d-flex" no-gutters>
          <v-col>
            <div class="pa-0" :class="mdAndUp ? 'full-height' : 'auto-height'">
              <v-row class="d-flex flex-column" no-gutters>
                <v-col ref="panel" class="out-card">
                  <v-card
                    outlined
                    tile
                    class="pa-0 overflow-y-auto transparent"
                    :class="mdAndUp ? 'panel-height' + multiplier : ''"
                  >
                    <left-pane 
                      :panel-height="panelHeight"
                      @ultrasound-metrics-updated="handleUltrasoundMetricsUpdate"
                      @trigger-model-visualization="handleModelVisualization"
                      @ultrasound-tool-ready="handleUltrasoundToolReady"
                      @conditions-updated="handleConditionsUpdate"
                      @trigger-condition-visualization="handleConditionVisualization"
                    />
                  </v-card>
                </v-col>
                <v-col class="d-none d-md-block fix-it">
                  <navigation />
                </v-col>
              </v-row>
            </div>
          </v-col>
        </v-row>
        <div class="d-md-none fixed left-0 bottom-0">
          <navigation />
        </div>
      </div>
    </div>
  </v-app>
</template>

<script>
export default {
  name: "DefaultLayout",

  data: () => {
    return {
      multiplier: 1,
      panelHeight: 0,
      isVideo: true,
      ultrasoundToolComponent: null, // Reference to ultrasound tool component
    };
  },

  computed: {
    mdAndUp() {
      return this.$vuetify.breakpoint.mdAndUp;
    },
  },

  mounted() {
    // this.panelHeight = this.$refs.panel.clientHeight;
    const base_background = this.$refs.base_background.$el;
    const Copper = this.$Copper();

    const updateFullscreen = () => {
      setTimeout(() => {
        this.panelHeight = this.$refs.panel.clientHeight;
      }, 200);
    };

    document.addEventListener("fullscreenchange", () => {
      updateFullscreen();
    });

    document.addEventListener("keydown", (e) => {
      if (e.code === "KeyF") {
        Copper.fullScreenListenner(base_background);
      }
    });
  },

  watch: {
    panelHeight: (height) => {},
  },

  updated() {
    this.panelHeight = this.$refs.panel.clientHeight;
  },

  created() {
    console.log(
      "%cABI Generic Web App Template %cBeta:v0.0.1",
      "padding: 3px;color:white; background:#023047",
      "padding: 3px;color:white; background:#219EBC"
    );
    this.$nuxt.$on("menu-height-changed", (multiplier) => {
      this.multiplier = multiplier;
    });
  },

  methods: {
    // Handle ultrasound metrics updates from the tool
    handleUltrasoundMetricsUpdate(data) {
      console.log('[DefaultLayout] Ultrasound metrics updated:', data);
      
      // Emit global event for RightPane and other components to listen
      this.$nuxt.$emit('ultrasound-metrics-updated', data);
      
      // Store metrics data for potential future use
      this.lastUltrasoundMetrics = data;
    },
    
    // Handle model visualization requests
    handleModelVisualization(data) {
      console.log('[DefaultLayout] Model visualization requested:', data);
      
      // Emit global event for RightPane model component to handle
      this.$nuxt.$emit('trigger-model-visualization', data);
    },
    
    // Handle ultrasound tool ready event
    handleUltrasoundToolReady(toolComponent) {
      console.log('[DefaultLayout] Ultrasound tool ready');
      this.ultrasoundToolComponent = toolComponent;
      
      // Emit global event to notify other components that the tool is ready
      this.$nuxt.$emit('ultrasound-tool-ready', toolComponent);
    },
    
    // Handle pregnancy condition updates from the tool
    handleConditionsUpdate(data) {
      console.log('[DefaultLayout] Pregnancy conditions updated:', data);
      
      // Emit global event for RightPane and other components to listen
      this.$nuxt.$emit('conditions-updated', data);
      
      // Store condition data for potential future use
      this.lastConditionData = data;
    },
    
    // Handle condition visualization requests
    handleConditionVisualization(data) {
      console.log('[DefaultLayout] Condition visualization requested:', data);
      
      // Emit global event for RightPane model component to handle
      this.$nuxt.$emit('trigger-condition-visualization', data);
    },
  },

  beforeDestroy() {
    this.$nuxt.$off("menu-height-changed");
  },
};
</script>

<style scoped lang="scss">
.root {
  user-select: none;
}
.outer-large {
  min-width: 409px;
  width: 30vw;
  position: fixed;
  top: 0;
  left: 0;
}
.outer-small {
  width: 100vw;
}
.firefox {
  z-index: 1;
}
.fix-it {
  position: -webkit-sticky; /* Safari */
  position: sticky;
  bottom: 0;
}

.panel-height1 {
  height: calc(100vh - 56px);
}
.panel-height2 {
  height: calc(100vh - 112px);
}
.transparent {
  margin: 0;
  padding: 0;
  opacity: 0.8;
}
.out-card {
  border-left: 1px solid black;
  margin: 0;
  padding: 0;
}

.rightPanel {
  order: 2;
}
</style>
