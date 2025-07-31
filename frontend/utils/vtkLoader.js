/**
 * VTK File Loader Utility
 * Provides reusable functions for loading and processing VTK files in Three.js
 * 
 * Usage:
 * import VTKLoader from '@/utils/vtkLoader'
 * const loader = new VTKLoader(THREE, scene)
 * await loader.loadVTKFile('/path/to/file.vtk', options)
 */


// Color and Rendering Constants
const COLOR_CONSTANTS = {
  // Default color values
  DEFAULT_COLOR: 0xff2222,
  DEFAULT_OPACITY: 0.9,
  DEFAULT_RADIUS_FALLBACK: 0.1,
  
  // Color mapping parameters
  COLOR_MAPPING: {
    NONLINEAR_EXPONENT: 0.4,
    NEUTRAL_VALUE: 0.5,
    
    // Low to medium pressure (green to orange)
    LOW_TO_MID: {
      RED_START: 0.23,
      RED_RANGE: 0.75,
      GREEN_START: 0.70,
      GREEN_RANGE: 0.23,
      BLUE_START: 0.27,
      BLUE_RANGE: -0.27
    },
    
    // Medium to high pressure (orange to dark red)
    MID_TO_HIGH: {
      RED_START: 0.98,
      RED_RANGE: -0.42,
      GREEN_START: 0.93,
      GREEN_RANGE: -0.81,
      BLUE_START: 0.00
    }
  },
  
  // Lighting configuration
  LIGHTING: {
    AMBIENT_COLOR: 0x664444,
    AMBIENT_INTENSITY: 0.6,
    MAIN_LIGHT_COLOR: 0xffffff,
    MAIN_LIGHT_INTENSITY: 0.8,
    FILL_LIGHT_COLOR: 0xffeedd,
    FILL_LIGHT_INTENSITY: 0.4,
    RIM_LIGHT_COLOR: 0xaaffff,
    RIM_LIGHT_INTENSITY: 0.3,
    INTERNAL_LIGHT1_COLOR: 0xff6666,
    INTERNAL_LIGHT1_INTENSITY: 0.5,
    INTERNAL_LIGHT1_DISTANCE: 100,
    INTERNAL_LIGHT2_COLOR: 0x6666ff,
    INTERNAL_LIGHT2_INTENSITY: 0.3,
    INTERNAL_LIGHT2_DISTANCE: 80
  }
};

export default class VTKLoader {
  /**
   * Initialize VTK Loader
   * @param {Object} THREE - Three.js library instance
   * @param {Object} scene - Three.js scene object
   */
  constructor(THREE, scene) {
    this.THREE = THREE;
    this.scene = scene;
    this.currentVTKMesh = null;
    this.wireframeMesh = null;
    this.lightingInitialized = false;
    this.performanceMode = 'high'; // Default performance mode
    this.allVTKMeshes = []; // Track all loaded VTK meshes for proper cleanup
    this.enableLoD = true; // Enable Level of Detail optimization
    this.lodCache = new Map(); // Cache for different LoD levels
  }

  /**
   * Generic VTK file loader - can load any VTK file with custom settings
   * @param {string} vtkFilePath - Path to VTK file
   * @param {Object} options - Configuration options
   * @param {string} options.displayName - Display name for user (default: 'VTK Model')
   * @param {number} options.color - Hex color for the model (default: 0xff2222)
   * @param {number} options.opacity - Opacity value 0-1 (default: 0.9)
   * @param {number} options.lineWidth - Line width for line segments (auto-calculated if not provided)
   * @param {number} options.pointSize - Point size for point cloud (auto-calculated if not provided)
   * @param {number} options.modelSize - Target model size in units (default: 420)
   * @param {boolean} options.enableWireframe - Enable wireframe overlay (default: true)
   * @param {boolean} options.useCylinderGeometry - Use cylinder geometry with radius data (default: true)
   * @param {number} options.cylinderSegments - Number of radial segments for cylinders (default: 8)
   * @param {boolean} options.enablePressureMapping - Enable pressure-based color mapping (default: true)
   * @param {boolean} options.clearScene - Clear existing meshes before adding new one (default: true)
   * @param {boolean} options.useLoD - Use Level of Detail optimization for faster loading (default: true)
   * @param {Function} options.onProgress - Progress callback function
   * @param {Function} options.onComplete - Completion callback function
   * @returns {Promise<Object>} - {success: boolean, mesh: THREE.Object3D, error?: Error}
   */
  async loadVTKFile(vtkFilePath, options = {}) {
    // Set default options with auto-scaling based on model size
    const modelSize = options.modelSize || 420; // Default target size
    const config = {
      displayName: 'placental model',
      color: COLOR_CONSTANTS.DEFAULT_COLOR,
      opacity: COLOR_CONSTANTS.DEFAULT_OPACITY,
      modelSize: modelSize,
      // Auto-calculate line width and point size based on model size if not provided
      lineWidth: options.lineWidth || Math.max(2, Math.round(modelSize / 70)), // Scale: 420→6, 280→4, 140→2
      pointSize: options.pointSize || Math.max(8, Math.round(modelSize / 17)), // Scale: 420→25, 280→16, 140→8
      enableWireframe: true,
      useCylinderGeometry: true, 
      cylinderSegments: 10, // Number of radial segments for cylinders
      enablePressureMapping: true, // Enable pressure mapping by default
      clearScene: true, // Clear scene by default
      useLoD: true, // Enable LoD by default
      onProgress: null,
      onComplete: null,
      ...options
    };

    // Call progress callback - Initializing
    if (config.onProgress) {
      config.onProgress(`Initializing ${config.displayName}`, 0);
    }

    try {
      // Check if LoD is enabled and use fast loading for initial display
      if (config.useLoD && this.enableLoD) {
        return await this.loadWithLoD(vtkFilePath, config);
      } else {
        // Standard loading
        return await this.loadStandard(vtkFilePath, config);
      }
    } catch (error) {
      console.error(`[VTKLoader] Failed to load VTK file ${vtkFilePath}:`, error);
      return { success: false, error };
    }
  }

  /**
   * Fetch VTK file from server
   * @param {string} vtkFilePath - Path to VTK file
   * @param {Function} onProgress - Progress callback
   * @returns {Promise<string>} - VTK file content as text
   */
  async fetchVTKFile(vtkFilePath, onProgress = null) {
    if (onProgress) {
      onProgress("Downloading model data", 20);
    }

    const response = await fetch(vtkFilePath);
    
    // Check if file was found
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    // Read VTK file content as text
    const vtkData = await response.text();
    
    if (onProgress) {
      onProgress("Processing model data", 40);
    }
    
    return vtkData;
  }

  /**
   * Parse VTK file format and convert to Three.js geometry
   * @param {string} vtkData - VTK file content
   * @param {Function} onProgress - Progress callback
   * @param {number} modelSize - Target model size in units (default: 420)
   * @param {boolean} useCylinderGeometry - Whether to create cylinder geometry
   * @param {Object} config - Configuration options
   * @returns {Object} - {geometry: THREE.BufferGeometry, isPointCloud: boolean, radiusData: Array, pressureData: Array}
   */
  parseVTKData(vtkData, onProgress = null, modelSize, useCylinderGeometry = true, config = {}) {
    if (onProgress) {
      onProgress("Building model geometry", 60);
    }
    
    // Split file content into lines for processing
    const lines = vtkData.split('\n');
    const vertices = [];        // Final array of vertex coordinates for Three.js
    let isReadingPoints = false; // Flag: currently reading point coordinates
    let isReadingCells = false;  // Flag: currently reading cell connectivity
    let isReadingRadius = false;  // Flag: currently reading radius scalar data
    let isReadingPressure = false; // Flag: currently reading pressure scalar data
    let points = [];            // Temporary storage for all point coordinates
    let radiusData = [];        // Array to store radius values for each point
    let pressureData = [];      // Array to store pressure values for each point
    let pointCount = 0;         // Total number of points in file
    let cellConnections = [];   // Store cell connectivity information

    // Process each line of the VTK file
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Update progress periodically
      if (onProgress && i % 1000 === 0) {
        const progress = 60 + (i / lines.length) * 20; // 60-80% progress
        onProgress("Building model geometry", progress);
      }
      
      // Detect POINTS section - contains 3D coordinates
      if (line.startsWith('POINTS')) {
        const parts = line.split(' ');
        pointCount = parseInt(parts[1]); // Extract number of points
        isReadingPoints = true;
        isReadingCells = false;
        isReadingRadius = false;
        isReadingPressure = false;
        continue;
      }
      
      // Detect CELLS/POLYGONS/LINES section - contains connectivity information
      if (line.startsWith('CELLS') || line.startsWith('POLYGONS') || line.startsWith('LINES')) {
        isReadingPoints = false;
        isReadingCells = true;
        isReadingRadius = false;
        isReadingPressure = false;
        continue;
      }
      
      // Detect POINT_DATA section - contains scalar data
      if (line.startsWith('POINT_DATA')) {
        isReadingPoints = false;
        isReadingCells = false;
        isReadingRadius = false;
        isReadingPressure = false;
        continue;
      }
      
      // Detect SCALARS section - check if it's radius or pressure data
      if (line.startsWith('SCALARS')) {
        const parts = line.split(' ');
        if (parts.length > 1) {
          const scalarName = parts[1].toLowerCase();
          if (scalarName === 'radius') {
            isReadingRadius = true;
            isReadingPressure = false;
          } else if (scalarName === 'pressure') {
            isReadingRadius = false;
            isReadingPressure = true;
          } else {
            isReadingRadius = false;
            isReadingPressure = false;
          }
        }
        isReadingPoints = false;
        isReadingCells = false;
        continue;
      }
      
      // Skip LOOKUP_TABLE line
      if (line.startsWith('LOOKUP_TABLE')) {
        continue;
      }
      
      // Read point coordinates (x, y, z values)
      if (isReadingPoints && points.length < pointCount * 3) {
        // Split line into numbers, filter empty strings, convert to float
        const coords = line.split(' ').filter(x => x !== '').map(parseFloat);
        points.push(...coords); // Add all coordinates to points array
      }
      
      // Read radius scalar data
      if (isReadingRadius && radiusData.length < pointCount) {
        const radii = line.split(' ').filter(x => x !== '').map(parseFloat);
        radiusData.push(...radii);
      }
      
      // Read pressure scalar data
      if (isReadingPressure && pressureData.length < pointCount) {
        const pressures = line.split(' ').filter(x => x !== '').map(parseFloat);
        pressureData.push(...pressures);
      }
      
      // Read cell connectivity data
      if (isReadingCells && line.trim() !== '' && 
          !line.startsWith('CELL_TYPES') && 
          !line.startsWith('POINT_DATA') && 
          !line.startsWith('SCALARS') &&
          !line.startsWith('LOOKUP_TABLE')) {
        
        // Parse indices that define how points connect to form lines/polygons
        const parts = line.split(' ').filter(x => x !== '');
        const indices = parts.map(x => parseInt(x)).filter(x => !isNaN(x)); // Filter out NaN values
        
        if (indices.length > 1) {
          const cellSize = indices[0]; // First number = how many points in this cell
          
          // Store cell connection for later processing
          if (indices.length === cellSize + 1) {
            cellConnections.push(indices);
            
            // For non-cylinder geometry, create line segments immediately
            if (!useCylinderGeometry) {
            // For VTK lines/polylines, connect consecutive points in sequence
            for (let j = 1; j < cellSize; j++) {
              const idx1 = indices[j];     // Current point index
              const idx2 = indices[j + 1]; // Next point index
              
              // Check if we have a valid next point (not the last point in cell)
              if (idx2 !== undefined && !isNaN(idx1) && !isNaN(idx2)) {
                // Ensure indices are valid (within bounds of points array)
                if (idx1 * 3 + 2 < points.length && idx2 * 3 + 2 < points.length) {
                  // Add line segment: 6 coordinates (x1,y1,z1,x2,y2,z2)
                  vertices.push(
                    points[idx1 * 3], points[idx1 * 3 + 1], points[idx1 * 3 + 2], // First point
                    points[idx2 * 3], points[idx2 * 3 + 1], points[idx2 * 3 + 2]  // Second point
                  );
                  }
                }
              }
            }
          }
        }
      }
      
      // Stop reading cells if we encounter other sections
      if (line.startsWith('CELL_TYPES') || line.startsWith('POINT_DATA')) {
        isReadingCells = false;
        
      }
    }

    
    // Create Three.js BufferGeometry from parsed data
    const geometry = new this.THREE.BufferGeometry();
    
    // If cylinder geometry is requested and we have radius data, create cylinders
    if (useCylinderGeometry && radiusData.length > 0 && cellConnections.length > 0) {
      const cylinderGeometry = this.createCylinderGeometry(points, radiusData, pressureData, cellConnections, modelSize, config.enablePressureMapping || true);
      return { geometry: cylinderGeometry, isPointCloud: false, radiusData, pressureData };
    }
    
    // Debug: if no vertices created, there might be an issue with cell parsing
    if (vertices.length === 0) {
      console.warn("[VTKLoader] No line segments created! Using point cloud fallback.");
    }
    
    // If no line segments were created, create a point cloud as fallback
    if (vertices.length === 0 && points.length > 0) {
      // Use original points for point cloud
      geometry.setAttribute('position', new this.THREE.Float32BufferAttribute(points, 3));
      
      // Add radius and pressure data as attributes if available
      if (radiusData.length > 0) {
        geometry.setAttribute('radius', new this.THREE.Float32BufferAttribute(radiusData, 1));
      }
      if (pressureData.length > 0) {
        geometry.setAttribute('pressure', new this.THREE.Float32BufferAttribute(pressureData, 1));
      }
      
      return { geometry, isPointCloud: true, radiusData, pressureData }; 
    } else {
      // Set vertex positions for line segments (each vertex has 3 coordinates: x, y, z)
      geometry.setAttribute('position', new this.THREE.Float32BufferAttribute(vertices, 3));
    }
    
    // Calculate bounding box for centering and scaling
    geometry.computeBoundingBox();
    const center = geometry.boundingBox.getCenter(new this.THREE.Vector3()); // Center point
    const size = geometry.boundingBox.getSize(new this.THREE.Vector3());     // Dimensions
    const maxDim = Math.max(size.x, size.y, size.z);                        // Largest dimension
    const scale = modelSize / maxDim; // Use configurable model size 
    
    // Transform geometry: center at origin and scale to appropriate size
    geometry.translate(-center.x, -center.y, -center.z); // Move to center
    geometry.scale(scale, scale, scale);                  // Scale uniformly
    
    return { geometry, isPointCloud: false, radiusData, pressureData };
  }

  /**
   * Create cylinder geometry from VTK data with radius and pressure information
   * @param {Array} points - Array of point coordinates
   * @param {Array} radiusData - Array of radius values for each point
   * @param {Array} pressureData - Array of pressure values for each point
   * @param {Array} cellConnections - Array of cell connectivity data
   * @param {number} modelSize - Target model size for scaling
   * @param {boolean} enablePressureMapping - Whether to apply pressure-based color mapping
   * @returns {THREE.BufferGeometry} - Combined cylinder geometry with color mapping
   */
  createCylinderGeometry(points, radiusData, pressureData, cellConnections, modelSize, enablePressureMapping = true) {
    const combinedGeometry = new this.THREE.BufferGeometry();
    const vertices = [];
    const normals = [];
    const colors = [];  // Add color array for pressure mapping
    const indices = [];
    let indexOffset = 0;
    
    // Number of radial segments for each cylinder
    const radialSegments = 8;
    
    // Calculate pressure range for color mapping
    let minPressure = Infinity;
    let maxPressure = -Infinity;
    if (pressureData.length > 0) {
      minPressure = Math.min(...pressureData);
      maxPressure = Math.max(...pressureData);
    }
    
    // First, detect branching points for smooth junction creation
    const branchingPoints = this.detectBranchingPoints(cellConnections, points.length / 3);
    
    // Process each cell connection
    for (const connection of cellConnections) {
      const cellSize = connection[0];
      
      // Create cylinders for each segment in the cell
      for (let i = 1; i < cellSize; i++) {
        const idx1 = connection[i];
        const idx2 = connection[i + 1];
        
        if (idx2 !== undefined && idx1 < points.length / 3 && idx2 < points.length / 3) {
          // Get point coordinates
          const p1 = new this.THREE.Vector3(
            points[idx1 * 3], 
            points[idx1 * 3 + 1], 
            points[idx1 * 3 + 2]
          );
          const p2 = new this.THREE.Vector3(
            points[idx2 * 3], 
            points[idx2 * 3 + 1], 
            points[idx2 * 3 + 2]
          );
          
          // Get radius values
          let radius1 = radiusData[idx1] || COLOR_CONSTANTS.DEFAULT_RADIUS_FALLBACK;
          let radius2 = radiusData[idx2] || COLOR_CONSTANTS.DEFAULT_RADIUS_FALLBACK;
          
          // Get pressure values and map to colors
          let pressure1 = pressureData[idx1] || 0;
          let pressure2 = pressureData[idx2] || 0;
          
          // Map pressure to color based on enablePressureMapping setting
          let color1, color2;
          if (enablePressureMapping && pressureData.length > 0) {
            // Use pressure-based color mapping
            color1 = this.pressureToColor(pressure1, minPressure, maxPressure);
            color2 = this.pressureToColor(pressure2, minPressure, maxPressure);
          } else {
            // Use default solid color (white for vertex colors)
            color1 = new this.THREE.Color(1, 1, 1);
            color2 = new this.THREE.Color(1, 1, 1);
          }
          
          // Check if endpoints are branching points for seamless connection
          const isBranchPoint1 = branchingPoints.has(idx1);
          const isBranchPoint2 = branchingPoints.has(idx2);
          
          // Create tapered cylinder segment with extended ends for seamless blending
          const cylinderSegment = this.createTaperedCylinder(
            p1, p2, radius1, radius2, radialSegments, color1, color2,
            isBranchPoint1, isBranchPoint2
          );
          
          // Add vertices, normals, colors, and indices to combined geometry
          const segmentVertices = cylinderSegment.vertices;
          const segmentNormals = cylinderSegment.normals;
          const segmentColors = cylinderSegment.colors;
          const segmentIndices = cylinderSegment.indices;
          
          // Add vertices, normals, and colors
          vertices.push(...segmentVertices);
          normals.push(...segmentNormals);
          colors.push(...segmentColors);
          
          // Add indices with offset
          for (const index of segmentIndices) {
            indices.push(index + indexOffset);
          }
          
          // Update index offset
          indexOffset += segmentVertices.length / 3;
        }
      }
    }
    
    // Create smooth junction geometry at branching points
    this.createBranchingJunctions(branchingPoints, points, radiusData, pressureData, minPressure, maxPressure, vertices, normals, colors, indices, indexOffset, enablePressureMapping);
    
    // Set geometry attributes
    combinedGeometry.setAttribute('position', new this.THREE.Float32BufferAttribute(vertices, 3));
    combinedGeometry.setAttribute('normal', new this.THREE.Float32BufferAttribute(normals, 3));
    combinedGeometry.setAttribute('color', new this.THREE.Float32BufferAttribute(colors, 3));
    combinedGeometry.setIndex(indices);
    
    // Calculate bounding box and apply scaling
    combinedGeometry.computeBoundingBox();
    const center = combinedGeometry.boundingBox.getCenter(new this.THREE.Vector3());
    const size = combinedGeometry.boundingBox.getSize(new this.THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = modelSize / maxDim;
    
    // Transform geometry: center at origin and scale to appropriate size
    combinedGeometry.translate(-center.x, -center.y, -center.z);
    combinedGeometry.scale(scale, scale, scale);
    
    return combinedGeometry;
  }

  /**
   * Map pressure value to color using simplified blood pressure color scheme
   * 3-color gradient: Green (low) → Orange (medium) → Red (high)
   * @param {number} pressure - Pressure value
   * @param {number} minPressure - Minimum pressure in dataset
   * @param {number} maxPressure - Maximum pressure in dataset
   * @returns {THREE.Color} - Color object
   */
  pressureToColor(pressure, minPressure, maxPressure) {
    // Normalize and apply non-linear mapping
    const linear = maxPressure > minPressure ? 
      (pressure - minPressure) / (maxPressure - minPressure) : COLOR_CONSTANTS.COLOR_MAPPING.NEUTRAL_VALUE;
    const t = Math.pow(linear, COLOR_CONSTANTS.COLOR_MAPPING.NONLINEAR_EXPONENT);
    
    const color = new this.THREE.Color();
    
    if (t < COLOR_CONSTANTS.COLOR_MAPPING.NEUTRAL_VALUE) {
      // Green to Orange (low to medium pressure)
      const factor = t * 2; // 0 to 1
      const lowToMid = COLOR_CONSTANTS.COLOR_MAPPING.LOW_TO_MID;
      color.setRGB(
        lowToMid.RED_START + factor * lowToMid.RED_RANGE,
        lowToMid.GREEN_START + factor * lowToMid.GREEN_RANGE,
        lowToMid.BLUE_START + factor * lowToMid.BLUE_RANGE
      );
    } else {
      // Orange to Dark Red (medium to high pressure)
      const factor = (t - COLOR_CONSTANTS.COLOR_MAPPING.NEUTRAL_VALUE) * 2; // 0 to 1
      const midToHigh = COLOR_CONSTANTS.COLOR_MAPPING.MID_TO_HIGH;
      color.setRGB(
        midToHigh.RED_START + factor * midToHigh.RED_RANGE,
        midToHigh.GREEN_START + factor * midToHigh.GREEN_RANGE,
midToHigh.BLUE_START
      );
    }
    
    return color;
  }

 
  /**
   * Create a tapered cylinder between two points with different radii and colors
   * Enhanced for seamless junction blending
   * @param {THREE.Vector3} p1 - Start point
   * @param {THREE.Vector3} p2 - End point
   * @param {number} radius1 - Radius at start point
   * @param {number} radius2 - Radius at end point
   * @param {number} radialSegments - Number of radial segments
   * @param {THREE.Color} color1 - Color at start point
   * @param {THREE.Color} color2 - Color at end point
   * @param {boolean} isBranchPoint1 - Whether start point is a branch point
   * @param {boolean} isBranchPoint2 - Whether end point is a branch point
   * @returns {Object} - {vertices: Array, normals: Array, colors: Array, indices: Array}
   */
  createTaperedCylinder(p1, p2, radius1, radius2, radialSegments, color1, color2, isBranchPoint1 = false, isBranchPoint2 = false) {
    const vertices = [];
    const normals = [];
    const colors = [];
    const indices = [];
    
    // Calculate cylinder direction and perpendicular vectors
    const direction = new this.THREE.Vector3().subVectors(p2, p1).normalize();
    
    // Extend cylinder ends slightly into branch points to eliminate gaps
    let adjustedP1 = p1.clone();
    let adjustedP2 = p2.clone();
    let adjustedRadius1 = radius1;
    let adjustedRadius2 = radius2;
    
    if (isBranchPoint1) {
      // Minimal extension for natural connection
      const extension = Math.max(radius1 * 0.08, 0.005);
      adjustedP1.add(direction.clone().multiplyScalar(-extension));
      adjustedRadius1 = radius1 * 1.02; // Very slight radius increase
    }
    
    if (isBranchPoint2) {
      // Minimal extension for natural connection
      const extension = Math.max(radius2 * 0.08, 0.005);
      adjustedP2.add(direction.clone().multiplyScalar(extension));
      adjustedRadius2 = radius2 * 1.02; // Very slight radius increase
    }
    
    // Create perpendicular vectors for cylinder cross-section
    const up = new this.THREE.Vector3(0, 1, 0);
    const right = new this.THREE.Vector3().crossVectors(direction, up).normalize();
    if (right.lengthSq() < 0.1) {
      // Direction is parallel to up vector, use different reference
      right.crossVectors(direction, new this.THREE.Vector3(1, 0, 0)).normalize();
    }
    const forward = new this.THREE.Vector3().crossVectors(right, direction).normalize();
    
    // Generate vertices for cylinder caps
    for (let ring = 0; ring <= 1; ring++) {
      const t = ring; // 0 for start, 1 for end
      const currentPos = new this.THREE.Vector3().lerpVectors(adjustedP1, adjustedP2, t);
      const currentRadius = adjustedRadius1 + (adjustedRadius2 - adjustedRadius1) * t;
      const currentColor = new this.THREE.Color().lerpColors(color1, color2, t);
      
      for (let segment = 0; segment < radialSegments; segment++) {
        const angle = (segment / radialSegments) * Math.PI * 2;
        const x = Math.cos(angle) * currentRadius;
        const y = Math.sin(angle) * currentRadius;
        
        // Calculate vertex position
        const vertexPos = new this.THREE.Vector3()
          .copy(currentPos)
          .add(right.clone().multiplyScalar(x))
          .add(forward.clone().multiplyScalar(y));
        
        vertices.push(vertexPos.x, vertexPos.y, vertexPos.z);
        
        // Calculate normal (pointing outward from cylinder axis)
        const normal = new this.THREE.Vector3()
          .copy(right.clone().multiplyScalar(x))
          .add(forward.clone().multiplyScalar(y))
          .normalize();
        
        normals.push(normal.x, normal.y, normal.z);
        
        // Add color
        colors.push(currentColor.r, currentColor.g, currentColor.b);
      }
    }
    
    // Generate indices for cylinder walls
    for (let ring = 0; ring < 1; ring++) {
      for (let segment = 0; segment < radialSegments; segment++) {
        const current = ring * radialSegments + segment;
        const next = ring * radialSegments + ((segment + 1) % radialSegments);
        const currentNext = (ring + 1) * radialSegments + segment;
        const nextNext = (ring + 1) * radialSegments + ((segment + 1) % radialSegments);
        
        // Two triangles per quad
        indices.push(current, next, currentNext);
        indices.push(currentNext, next, nextNext);
      }
    }
    
    return { vertices, normals, colors, indices };
  }

  /**
   * Create appropriate mesh from geometry based on type
   * @param {THREE.BufferGeometry} geometry - Parsed geometry
   * @param {boolean} isPointCloud - Whether to create point cloud or line segments
   * @param {Object} config - Configuration options
   * @param {Array} radiusData - Radius data for points (optional)
   * @param {Array} pressureData - Pressure data for points (optional)
   * @returns {THREE.Object3D} - Created mesh
   */
  createVTKMesh(geometry, isPointCloud, config, radiusData = null, pressureData = null) {
    let vtkMesh;
    
    if (isPointCloud) {
      // Create enhanced point cloud material
      const material = new this.THREE.PointsMaterial({
        color: config.color,
        size: config.pointSize,
        transparent: true,
        opacity: config.opacity,
        sizeAttenuation: true // Points get smaller with distance
      });
      vtkMesh = new this.THREE.Points(geometry, material);
      
    } else if (config.useCylinderGeometry && radiusData && radiusData.length > 0) {
      // Create cylinder mesh with proper material for 3D rendering
      
      // Use vertex colors if pressure mapping is enabled and pressure data is available
      const material = new this.THREE.MeshMatcapMaterial
      ({
        color: config.enablePressureMapping && pressureData && pressureData.length > 0 ? 0xffffff : config.color,
        transparent: true,
        opacity: config.opacity,
        vertexColors: config.enablePressureMapping && pressureData && pressureData.length > 0 // Enable vertex colors for pressure mapping
      });
      
      vtkMesh = new this.THREE.Mesh(geometry, material);
      
    } else {
      // Create line segment visualization
      
      // Main vessel material
      const vesselMaterial = new this.THREE.LineBasicMaterial({
        color: config.color,
        linewidth: config.lineWidth,
        transparent: true,
        opacity: config.opacity
      });
      
      vtkMesh = new this.THREE.LineSegments(geometry, vesselMaterial);
      
      // Add wireframe overlay for enhanced detail if enabled
      if (config.enableWireframe) {
        const wireframeMaterial = new this.THREE.LineBasicMaterial({
          color: (config.color & 0xffffff) | 0x888888, // Lighter version of main color
          linewidth: Math.max(1, config.lineWidth - 2),
          transparent: true,
          opacity: config.opacity * 0.3
        });
        
        const wireframeMesh = new this.THREE.LineSegments(geometry, wireframeMaterial);
        wireframeMesh.position.copy(vtkMesh.position);
        wireframeMesh.scale.copy(vtkMesh.scale);
        wireframeMesh.scale.multiplyScalar(1.005); // Very slightly larger for wireframe effect (reduced from 1.01)
        
        this.wireframeMesh = wireframeMesh;
      }
    }
    
    return vtkMesh;
  }

  /**
   * Add mesh to scene with enhanced lighting
   * @param {THREE.Object3D} mesh - Mesh to add
   * @param {Object} config - Configuration options
   */
  addToScene(mesh, config = {}) {
    // Clear existing meshes only if clearScene is true (default)
    if (config.clearScene !== false) {
      // Remove all previously loaded VTK meshes
      this.allVTKMeshes.forEach(oldMesh => {
        this.scene.remove(oldMesh);
      });
      this.allVTKMeshes = []; // Clear the tracking array
      
      if (this.wireframeMesh) {
        this.scene.remove(this.wireframeMesh);
      }
    }
    
    // Setup enhanced lighting (only once)
    this.setupSceneLighting();
    
    // Add mesh to scene and track it
    this.scene.add(mesh);
    this.allVTKMeshes.push(mesh); // Track this mesh for future cleanup
    
    // Store current mesh reference
    this.currentVTKMesh = mesh;
    
    // Add wireframe overlay if it exists
    if (this.wireframeMesh) {
      this.scene.add(this.wireframeMesh);
    }
  }

  /**
   * Setup enhanced lighting for biological visualization
   */
  setupSceneLighting() {
    // Only add lights if they haven't been initialized yet
    if (this.lightingInitialized) {
      return;
    }
    
    const lighting = COLOR_CONSTANTS.LIGHTING;
    
    // Warm ambient light to simulate biological environment
    const ambientLight = new this.THREE.AmbientLight(lighting.AMBIENT_COLOR, lighting.AMBIENT_INTENSITY);
    this.scene.add(ambientLight);
    
    // Main directional light (simulating medical examination light)
    const mainLight = new this.THREE.DirectionalLight(lighting.MAIN_LIGHT_COLOR, lighting.MAIN_LIGHT_INTENSITY);
    mainLight.position.set(10, 10, 5);
    mainLight.castShadow = true;
    this.scene.add(mainLight);
    
    // Secondary light from different angle for better depth perception
    const fillLight = new this.THREE.DirectionalLight(lighting.FILL_LIGHT_COLOR, lighting.FILL_LIGHT_INTENSITY);
    fillLight.position.set(-5, 3, -1);
    this.scene.add(fillLight);
    
    // Rim light for edge definition
    const rimLight = new this.THREE.DirectionalLight(lighting.RIM_LIGHT_COLOR, lighting.RIM_LIGHT_INTENSITY);
    rimLight.position.set(0, -5, 10);
    this.scene.add(rimLight);
    
    // Add subtle point lights for internal illumination effect
    const internalLight1 = new this.THREE.PointLight(
      lighting.INTERNAL_LIGHT1_COLOR, 
      lighting.INTERNAL_LIGHT1_INTENSITY, 
      lighting.INTERNAL_LIGHT1_DISTANCE
    );
    internalLight1.position.set(0, 0, 0);
    this.scene.add(internalLight1);
    
    const internalLight2 = new this.THREE.PointLight(
      lighting.INTERNAL_LIGHT2_COLOR, 
      lighting.INTERNAL_LIGHT2_INTENSITY, 
      lighting.INTERNAL_LIGHT2_DISTANCE
    );
    internalLight2.position.set(20, -10, 15);
    this.scene.add(internalLight2);
    
    this.lightingInitialized = true;
  }



  /**
   * Set reference to copper scene for camera control
   * @param {Object} copperScene - Copper3d scene object
   */
  setCopperScene(copperScene) {
    this.copperScene = copperScene;
  }

  /**
   * Set performance mode for rendering optimization
   * @param {string} mode - Performance mode: 'high', 'medium', 'low', 'auto'
   */
  setPerformanceMode(mode) {
    this.performanceMode = mode;
    console.log(`[VTKLoader] Performance mode set to: ${mode}`);
  }




  /**
   * Detect branching points where multiple tubes connect
   * @param {Array} cellConnections - Array of cell connectivity data
   * @param {number} totalPoints - Total number of points
   * @returns {Map} - Map of point indices to their connected points
   */
  detectBranchingPoints(cellConnections, totalPoints) {
    const pointConnections = new Map();
    
    // Build connectivity graph
    for (const connection of cellConnections) {
      const cellSize = connection[0];
      
      for (let i = 1; i < cellSize; i++) {
        const idx1 = connection[i];
        const idx2 = connection[i + 1];
        
        if (idx2 !== undefined && idx1 < totalPoints && idx2 < totalPoints) {
          // Add bidirectional connections
          if (!pointConnections.has(idx1)) {
            pointConnections.set(idx1, new Set());
          }
          if (!pointConnections.has(idx2)) {
            pointConnections.set(idx2, new Set());
          }
          
          pointConnections.get(idx1).add(idx2);
          pointConnections.get(idx2).add(idx1);
        }
      }
    }
    
    // Filter to only branching points (more than 2 connections)
    const branchingPoints = new Map();
    for (const [pointIdx, connections] of pointConnections) {
      if (connections.size > 2) {
        branchingPoints.set(pointIdx, Array.from(connections));
      }
    }
    
    return branchingPoints;
  }

  /**
   * Create smooth junction geometry at branching points
   * @param {Map} branchingPoints - Map of branching points and their connections
   * @param {Array} points - Array of point coordinates
   * @param {Array} radiusData - Array of radius values
   * @param {Array} pressureData - Array of pressure values
   * @param {number} minPressure - Minimum pressure for color mapping
   * @param {number} maxPressure - Maximum pressure for color mapping
   * @param {Array} vertices - Vertices array to append to
   * @param {Array} normals - Normals array to append to
   * @param {Array} colors - Colors array to append to
   * @param {Array} indices - Indices array to append to
   * @param {number} indexOffset - Current index offset
   * @param {boolean} enablePressureMapping - Whether to apply pressure-based color mapping
   */
  createBranchingJunctions(branchingPoints, points, radiusData, pressureData, minPressure, maxPressure, vertices, normals, colors, indices, indexOffset, enablePressureMapping = true) {
    for (const [branchPointIdx, connectedPoints] of branchingPoints) {
      // Get branch point data
      const branchPos = new this.THREE.Vector3(
        points[branchPointIdx * 3],
        points[branchPointIdx * 3 + 1],
        points[branchPointIdx * 3 + 2]
      );
      const branchRadius = radiusData[branchPointIdx] || COLOR_CONSTANTS.DEFAULT_RADIUS_FALLBACK;
      const branchPressure = pressureData[branchPointIdx] || 0;
      const branchColor = enablePressureMapping && pressureData.length > 0 ? 
        this.pressureToColor(branchPressure, minPressure, maxPressure) : 
        new this.THREE.Color(1, 1, 1);
      
      // Create seamless junction geometry
      const junctionGeometry = this.createSeamlessJunction(
        branchPos, 
        branchRadius, 
        branchColor, 
        connectedPoints, 
        points, 
        radiusData
      );
      
      // Add junction geometry to combined mesh
      vertices.push(...junctionGeometry.vertices);
      normals.push(...junctionGeometry.normals);
      colors.push(...junctionGeometry.colors);
      
      // Add indices with offset
      for (const index of junctionGeometry.indices) {
        indices.push(index + indexOffset);
      }
      
      indexOffset += junctionGeometry.vertices.length / 3;
    }
  }

  /**
   * Create seamless junction geometry that blends naturally with tubes
   * Uses smooth interpolation surfaces instead of spherical geometry
   * @param {THREE.Vector3} centerPos - Center position of junction
   * @param {number} radius - Base radius of junction
   * @param {THREE.Color} color - Color of junction
   * @param {Array} connectedPoints - Array of connected point indices
   * @param {Array} points - All point coordinates
   * @param {Array} radiusData - Radius data for all points
   * @returns {Object} - {vertices: Array, normals: Array, colors: Array, indices: Array}
   */
  createSeamlessJunction(centerPos, radius, color, connectedPoints, points, radiusData) {
    const vertices = [];
    const normals = [];
    const colors = [];
    const indices = [];
    
    // Calculate connection directions and properties
    const connections = [];
    let maxConnectedRadius = radius;
    
    if (connectedPoints && points && radiusData) {
      for (const pointIdx of connectedPoints) {
        if (pointIdx * 3 + 2 < points.length) {
          const connectedPos = new this.THREE.Vector3(
            points[pointIdx * 3],
            points[pointIdx * 3 + 1],
            points[pointIdx * 3 + 2]
          );
          const direction = new this.THREE.Vector3().subVectors(connectedPos, centerPos).normalize();
          const connectedRadius = radiusData[pointIdx] || radius;
          
          // Track the largest connected radius to ensure no gaps
          maxConnectedRadius = Math.max(maxConnectedRadius, connectedRadius);
          
          connections.push({ 
            direction, 
            radius: connectedRadius,
            distance: centerPos.distanceTo(connectedPos)
          });
        }
      }
    }
    
    // If less than 3 connections, create minimal geometry
    if (connections.length < 3) {
      return { vertices: [], normals: [], colors: [], indices: [] };
    }
    
    // Create smooth interpolation surface with natural size
    const resolution = 6; // Lower resolution for more natural appearance
    // Use a smaller base radius for more natural connections
    const baseRadius = maxConnectedRadius * 0.95; // Slightly smaller for natural look
    
    // Generate vertices using smooth field interpolation
    for (let i = 0; i <= resolution; i++) {
      const theta = (i / resolution) * Math.PI;
      const sinTheta = Math.sin(theta);
      const cosTheta = Math.cos(theta);
      
      for (let j = 0; j <= resolution; j++) {
        const phi = (j / resolution) * Math.PI * 2;
        const sinPhi = Math.sin(phi);
        const cosPhi = Math.cos(phi);
        
        // Base spherical direction
        const sphereDirection = new this.THREE.Vector3(
          sinTheta * cosPhi,
          cosTheta,
          sinTheta * sinPhi
        );
        
        // Calculate smooth radius with directional influence
        let smoothRadius = baseRadius;
        let totalInfluence = 0;
        let maxDirectionalRadius = baseRadius;
        
        for (const conn of connections) {
          // Calculate influence of each connection
          const dot = Math.max(0, sphereDirection.dot(conn.direction));
          const influence = Math.pow(dot, 3.0); // Smooth falloff, not too sharp
          
          // Calculate radius in this direction ensuring coverage
          const directionalRadius = Math.max(baseRadius, conn.radius * 1.2);
          const radiusContribution = directionalRadius * influence * 0.3;
          
          smoothRadius += radiusContribution;
          totalInfluence += influence;
          
          // Ensure we always cover the connected tube radius
          if (influence > 0.1) {
            maxDirectionalRadius = Math.max(maxDirectionalRadius, conn.radius * 1.25);
          }
        }
        
        // Apply smooth scaling with minimum radius guarantee
        const scaleFactor = 1.0 + totalInfluence * 0.2;
        smoothRadius = Math.max(smoothRadius * scaleFactor, maxDirectionalRadius);
        
        // Ensure minimum radius to prevent gaps
        smoothRadius = Math.max(smoothRadius, baseRadius * 0.9);
        
        // Calculate final vertex position
        const vertexPos = new this.THREE.Vector3()
          .copy(sphereDirection)
          .multiplyScalar(smoothRadius)
          .add(centerPos);
        
        vertices.push(vertexPos.x, vertexPos.y, vertexPos.z);
        
        // Calculate smooth normal
        const normal = this.calculateSmoothNormal(vertexPos, centerPos, connections);
        normals.push(normal.x, normal.y, normal.z);
        
        // Use junction color
        colors.push(color.r, color.g, color.b);
      }
    }
    
    // Generate indices for smooth triangulation
    for (let i = 0; i < resolution; i++) {
      for (let j = 0; j < resolution; j++) {
        const first = i * (resolution + 1) + j;
        const second = first + resolution + 1;
        
        // Create triangles with consistent winding
        indices.push(first, second, first + 1);
        indices.push(second, second + 1, first + 1);
      }
    }
    
    return { vertices, normals, colors, indices };
  }
  
  /**
   * Calculate smooth normal for seamless junction surface
   * Enhanced for ultra-smooth transitions
   * @param {THREE.Vector3} position - Current vertex position
   * @param {THREE.Vector3} center - Junction center
   * @param {Array} connections - Connection data
   * @returns {THREE.Vector3} - Smooth normal vector
   */
  calculateSmoothNormal(position, center, connections) {
    const direction = new this.THREE.Vector3().subVectors(position, center).normalize();
    
    // Start with radial direction
    let normal = direction.clone();
    
    // Calculate weighted influence from all connections
    let totalWeight = 0;
    const influences = [];
    
    for (const conn of connections) {
      const dot = Math.max(0, direction.dot(conn.direction));
      const influence = Math.pow(dot, 2.5); // Moderate smoothness
      const weight = influence * conn.radius; // Weight by tube size
      
      influences.push({ direction: conn.direction, weight });
      totalWeight += weight;
    }
    
    // Apply weighted blending for smoother surface
    if (totalWeight > 0) {
      let blendedDirection = new this.THREE.Vector3();
      
      for (const inf of influences) {
        const normalizedWeight = inf.weight / totalWeight;
        blendedDirection.add(
          inf.direction.clone().multiplyScalar(normalizedWeight * 0.12) // Gentle blending
        );
      }
      
      // Lerp between radial normal and blended direction
      normal.add(blendedDirection);
    }
    
    return normal.normalize();
  }

  /**
   * Clear temporary data and overlays
   */
  clearTemporaryData() {
    // This method can be extended to clear any temporary visualizations
    // For now, it's a placeholder for future functionality
    console.log('[VTKLoader] Cleared temporary data');
  }

  /**
   * Load with Level of Detail optimization
   * First loads a low-detail version quickly, then progressively enhances
   * @param {string} vtkFilePath - Path to VTK file
   * @param {Object} config - Configuration options
   * @returns {Promise<Object>} - Loading result
   */
  async loadWithLoD(vtkFilePath, config) {
    const cacheKey = `${vtkFilePath}_${config.enablePressureMapping}`;
    
    // Check if we have cached data
    if (this.lodCache.has(cacheKey)) {
      const cachedData = this.lodCache.get(cacheKey);
      const mesh = this.createVTKMesh(cachedData.geometry, cachedData.isPointCloud, config, cachedData.radiusData, cachedData.pressureData);
      this.addToScene(mesh, config);
      
      if (config.onComplete) {
        config.onComplete(mesh, cachedData.isPointCloud, cachedData.radiusData, cachedData.pressureData);
      }
      
      return { success: true, mesh, isPointCloud: cachedData.isPointCloud, radiusData: cachedData.radiusData, pressureData: cachedData.pressureData };
    }

    // Phase 1: Quick loading with reduced detail
    if (config.onProgress) {
      config.onProgress(`Loading ${config.displayName}`, 5);
    }

    const vtkData = await this.fetchVTKFile(vtkFilePath, config.onProgress);
    
    // Create low-detail version first (reduced segments, simpler geometry)
    const lowDetailConfig = {
      ...config,
      cylinderSegments: Math.max(4, Math.floor(config.cylinderSegments / 2)), // Reduce segments
      useCylinderGeometry: false, // Use lines first for speed
      enableWireframe: false // Disable wireframe for speed
    };
    
    const lowDetailResult = this.parseVTKData(vtkData, config.onProgress, config.modelSize, false, lowDetailConfig);
    const lowDetailMesh = this.createVTKMesh(lowDetailResult.geometry, lowDetailResult.isPointCloud, lowDetailConfig, lowDetailResult.radiusData, lowDetailResult.pressureData);
    
    // Add low-detail mesh first
    this.addToScene(lowDetailMesh, config);
    
    // Model loaded and displayed, no need to show progress percentage

    // Call completion callback for quick preview
    if (config.onComplete) {
      config.onComplete(lowDetailMesh, lowDetailResult.isPointCloud, lowDetailResult.radiusData, lowDetailResult.pressureData);
    }

    // Phase 2: Load high-detail version in background
    setTimeout(async () => {
      try {
        

        const highDetailResult = this.parseVTKData(vtkData, null, config.modelSize, config.useCylinderGeometry, config);
        const highDetailMesh = this.createVTKMesh(highDetailResult.geometry, highDetailResult.isPointCloud, config, highDetailResult.radiusData, highDetailResult.pressureData);
        
        // Cache the high-detail version
        this.lodCache.set(cacheKey, {
          geometry: highDetailResult.geometry,
          isPointCloud: highDetailResult.isPointCloud,
          radiusData: highDetailResult.radiusData,
          pressureData: highDetailResult.pressureData
        });

        // Replace low-detail with high-detail
        this.scene.remove(lowDetailMesh);
        this.addToScene(highDetailMesh, { ...config, clearScene: false });
        
        // Don't show progress when enhancement is complete, model is already displayed

        // Update the current mesh reference
        this.currentVTKMesh = highDetailMesh;
        
      } catch (error) {
        console.warn('[VTKLoader] Failed to load high-detail version, keeping low-detail:', error);
      }
    }, 100); // Small delay to allow UI update

    return { success: true, mesh: lowDetailMesh, isPointCloud: lowDetailResult.isPointCloud, radiusData: lowDetailResult.radiusData, pressureData: lowDetailResult.pressureData };
  }

  /**
   * Standard loading without LoD optimization
   * @param {string} vtkFilePath - Path to VTK file
   * @param {Object} config - Configuration options
   * @returns {Promise<Object>} - Loading result
   */
  async loadStandard(vtkFilePath, config) {
    // Fetch and parse VTK file
    const vtkData = await this.fetchVTKFile(vtkFilePath, config.onProgress);
    const parseResult = this.parseVTKData(vtkData, config.onProgress, config.modelSize, config.useCylinderGeometry, config);
    const { geometry, isPointCloud, radiusData, pressureData } = parseResult;
    
    // Create appropriate mesh with custom settings
    const mesh = this.createVTKMesh(geometry, isPointCloud, config, radiusData, pressureData);
    
    // Add to scene with enhanced lighting
    this.addToScene(mesh, config);
    
    // Call completion callback
    if (config.onComplete) {
      config.onComplete(mesh, isPointCloud, radiusData, pressureData);
    }
    
    return { success: true, mesh, isPointCloud, radiusData, pressureData };
  }

  /**
   * Clear LoD cache
   */
  clearCache() {
    this.lodCache.clear();
    console.log('[VTKLoader] LoD cache cleared');
  }

  /**
   * Clean up resources
   */
  dispose() {
    // Remove all tracked VTK meshes
    this.allVTKMeshes.forEach(mesh => {
      this.scene.remove(mesh);
    });
    this.allVTKMeshes = [];
    
    if (this.currentVTKMesh) {
      this.scene.remove(this.currentVTKMesh);
      this.currentVTKMesh = null;
    }
    
    if (this.wireframeMesh) {
      this.scene.remove(this.wireframeMesh);
      this.wireframeMesh = null;
    }
    
    // Clear cache
    this.lodCache.clear();
    
    this.copperScene = null;
  }
} 