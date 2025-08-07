<template>
    <img 
      :src="iconPath" 
      :class="iconClass"
      :alt="alt"
      :style="iconStyle"
    />
  </template>
  
  <script>
  export default {
    props: {
      icon: {
        type: String,
        required: true
      },
      size: {
        type: Number,
        default: 24
      },
      color: {
        type: String,
        default: null
      },
      alt: {
        type: String,
        default: ''
      }
    },
    computed: {
      iconPath() {
        const basePath = this.$config.basePath || '';
        
        // If it's an SVG path, use it directly
        if (this.icon.startsWith('/')) {
          return basePath + this.icon;
        }
        // Otherwise use default icon
        return basePath + '/img/landing/pregnancy-icon.svg';
      },
      
      iconClass() {
        return [
          'svg-icon',
          { 'primary': this.color === 'primary' }
        ];
      },
      
      iconStyle() {
        return {
          width: this.size + 'px',
          height: this.size + 'px'
        };
      }
    }
  }
  </script>
  
  <style scoped>
  .svg-icon {
    filter: brightness(0) invert(1);
  }
  
  
  </style> 