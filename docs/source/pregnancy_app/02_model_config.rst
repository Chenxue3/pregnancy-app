Model Configuration
===================

Now let's talk about how to configure the model in VTKLoader.js.

Color
-----

In our model, the color is defined by the value of pressure. To change the color mapping, in VTKLoader.js, we can change the ``COLOR_CONSTANTS`` object. The renderer uses a sophisticated 3-color gradient based on pressure values:

- **Green (0.23, 0.70, 0.27)**: Low pressure
- **Orange (0.98, 0.93, 0.00)**: Medium pressure
- **Dark Red (0.56, 0.12, 0.00)**: High pressure

.. code-block:: javascript

   // Color mapping constants (automatically applied)
   const COLOR_CONSTANTS = {
     COLOR_MAPPING: {
       NONLINEAR_EXPONENT: 0.4,     // Non-linear scaling for more red colors
       NEUTRAL_VALUE: 0.5,          // Midpoint for color transitions
       
       LOW_TO_MID: {
         RED_START: 0.23,   RED_RANGE: 0.75,
         GREEN_START: 0.70, GREEN_RANGE: 0.23,
         BLUE_START: 0.27,  BLUE_RANGE: -0.27
       },
       
       MID_TO_HIGH: {
         RED_START: 0.98,   RED_RANGE: -0.42,
         GREEN_START: 0.93, GREEN_RANGE: -0.81,
         BLUE_CONSTANT: 0.00
       }
     }
   };

Mesh Type
---------

Now we used the `meshPhongMaterial <https://threejs.org/docs/#api/en/materials/MeshPhongMaterial>`_ to render the model.

.. code-block:: javascript

   const material = new this.THREE.PointsMaterial({
     color: config.color,
     size: config.pointSize,
     transparent: true,
     opacity: config.opacity,
     sizeAttenuation: true // Points get smaller with distance
   });

Cylinder configuration
---------------------

In VTKLoader, ``useCylinderGeometry`` is set to true by default, which means the model will be rendered as cylinders. After parsing the ``SCALARS radius`` section in VTK file, the radius of the cylinder will be set accordingly.

.. code-block:: javascript

   useCylinderGeometry: true, 