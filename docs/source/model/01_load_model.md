# How to add the model to the web app
This is a guide on how to load the model into the app. 

## Model Files Location

All 3D model files are stored in the `/static/model/` directory, for example:
```
static/
└── model/
    ├── healthy_gen_np3ns1_flux_250_arterial_tree.vtk  # Arterial vessel tree
    ├── healthy_gen_np3ns1_flux_250_venous_tree.vtk    # Venous vessel tree
    └── healthy_gen_np3ns1_flux_250_term.vtk           # Complete placental model
```



## Loading the model
For overall 3D model loading, please refer to the [display model](../implementation_structure/09_display_model.rst). In this document, we will focus on the VTKLoader and how to load the VTK models.

### Initialization the VTKLoader
1. Create the scene, for more details, please refer to the [three.js scene](https://threejs.org/docs/#manual/en/introduction/Creating-a-scene)
```js
this.scene = this.baseRenderer.getSceneByName('placental-scene');
  if (this.scene === undefined) {
    this.scene = this.baseRenderer.createScene('placental-scene');
    this.baseRenderer.setCurrentScene(this.scene);
  }
```
2. Initialize the VTKLoader, add the scene to the VTKLoader
```js
this.vtkLoader = new VTKLoader(this.THREE, this.scene.scene);
```
3. Initialize the Copper3D scene, which is used to control the camera
```js
this.vtkLoader.setCopperScene(this.scene);
```
Camera positions and orientations are stored in `/static/modelView/`:

```
static/
└── modelView/
    ├── noInfarct_view.json          # Standard placental view
    ├── arrythmiaActivity_view.json  # Alternative cardiac view
    └── noInfarct_view_setmodel.json # Model-specific view settings
```

**Example camera configuration** (`noInfarct_view.json`):

```json
{
  "farPlane": 1000,
  "targetPosition": [0, 0, 0],
  "nearPlane": 0.01,
  "upVector": [0, -1, 0],
  "eyePosition": [0, 0, -600]
}
```

4. For better user experience, we can set performance mode to `high` or `medium` to improve the loading speed.
```js
this.vtkLoader.setPerformanceMode(this.currentPerformanceMode);
```

### Call the VTKLoader to load the model
1. In the `frontend/components/model/Model.vue` file, we can call the `loadVTKFile` function to load the model.
```js
this.vtkLoader.loadVTKFile(vtkPath, {
  displayName: 'Custom Model Name', // the name of the model
  color: 0xff00ff, // the color of the model
  opacity: 0.9, // the opacity of the model
  modelSize: 420, // the size of the model
  useCylinderGeometry: true,
  onProgress: (message, progress) => {
    // update the progress of the model loading
  },
  onComplete: (mesh) => {
    // update the model loading complete, this is used to update the model loading complete in the UI
  }
```
