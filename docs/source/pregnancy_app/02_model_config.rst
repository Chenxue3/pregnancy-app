Model Configuration
===================

The model configuration is handled in two main files: `VTKLoader.js` for rendering logic and `Model.vue` for model types.

Color Mapping
-------------

VTKLoader supports three color mapping types:

**Pressure-based Mapping**
- Green (0.23, 0.70, 0.27) → Orange (0.98, 0.93, 0.00) → Dark Red (0.56, 0.12, 0.00)
- Uses non-linear scaling with exponent 0.4 for enhanced sensitivity

**Flux-based Mapping** 
- Blue (reverse flow) → Cyan → Green → Yellow → Red (high flow)
- Logarithmic scaling for better low-value sensitivity

**Default Mapping**
- Arterial vessels: Red (0xff2222)
- Venous vessels: Blue (0x2222ff)

.. code-block:: javascript

   // Color mapping configuration in VTKLoader.js
   const COLOR_CONSTANTS = {
     COLOR_MAPPING: {
       NONLINEAR_EXPONENT: 0.4,
       NEUTRAL_VALUE: 0.5,
       LOW_TO_MID: {
         RED_START: 0.23, RED_RANGE: 0.75,
         GREEN_START: 0.70, GREEN_RANGE: 0.23,
         BLUE_START: 0.27, BLUE_RANGE: -0.27
       },
       MID_TO_HIGH: {
         RED_START: 0.98, RED_RANGE: -0.42,
         GREEN_START: 0.93, GREEN_RANGE: -0.81,
         BLUE_START: 0.00
       }
     }
   };

Model Types
-----------

Three model types are configured in `Model.vue`:

.. code-block:: javascript

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
   };

Rendering Configuration
---------------------

- **Geometry Type**: Cylinder geometry by default (`useCylinderGeometry: true`)
- **Material**: MeshPhongMaterial with lighting support
- **Performance**: Level of Detail (LoD) optimization enabled
- **Lighting**: Multi-point lighting system with ambient, main, fill, and rim lights 