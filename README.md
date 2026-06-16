# Desktop Shredder

A browser-based physics sandbox for real-time destruction, fragmentation, and interactive rigid-body simulation using Matter.js and Canvas rendering.

Live Demo: https://desktop-shredder.vercel.app/

---

## Overview

Desktop Shredder is an interactive physics simulation environment that demonstrates real-time destruction and material-based fragmentation in the browser.

The project focuses on:
- Rigid-body physics behavior using Matter.js
- Texture-aware fragmentation and visual simulation
- Canvas-based rendering of dynamic physical interactions

It includes two distinct implementations within the same repository: a core physics sandbox and an extended image-based shattering system.

---

## Tech Stack

- Physics Engine: Matter.js v0.19.0 (CDN-based, unmodified)
- Rendering: HTML5 Canvas 2D API
- Frontend: Vanilla JavaScript (ES6), HTML5, CSS3
- Styling: Custom CSS with CSS variables and glassmorphism design system
- Architecture: Modular multi-file structure (inline + external JS separation)

---

## System Architecture

The project contains two separate implementations:

### Core Sandbox (index.html)
- Fully self-contained application
- Inline JavaScript and CSS
- Physics-driven objects interacting in a simulated environment
- Focus: rigid-body destruction and interaction systems

### Extended Shatter System (script.js)
- External JavaScript-based implementation
- Supports image upload and texture-based fragmentation
- Advanced interaction modes (vortex, pulse effects)
- Enhanced visual simulation of image breaking

---

## Rendering Pipeline

- Uses Canvas 2D API exclusively
- No WebGL or GPU acceleration
- Custom fragment rendering system:
  - Each fragment is individually transformed
  - Canvas state stack used for rotation and translation
  - Polygon-based clipping for realistic shard rendering
  - Texture mapping using drawImage per fragment

- Visual effects include:
  - Screen shake via canvas transform manipulation
  - Dynamic object rotation and velocity-based motion

---

## Physics Implementation

- Built entirely on Matter.js v0.19.0
- Uses default physics solver without modification
- Core APIs used:
  - Engine.create()
  - Bodies.rectangle / circle / polygon / fromVertices
  - Body.applyForce / setVelocity / setAngularVelocity
  - Composite.add / remove
  - Engine.update

- Physics configuration:
  - Gravity tuned per scene
  - Iteration values adjusted for stability (position & velocity iterations)

---

## Core Features

### Physics Sandbox
- Real-time rigid-body simulation
- Gravity-driven object interactions
- Collision-based destruction behavior

### Fragmentation System
- Procedural object breaking on impact
- Grid-based and radial shard generation
- Velocity-driven break intensity

### Interaction System
- Force-based tools (vortex, pulse, explosion)
- Mouse-driven physics interaction
- Real-time object manipulation

### Extended Image Shattering (script.js)
- Image upload and fragmentation
- Texture-mapped physics shards
- Interactive destruction of images in simulation space

---

## Code Structure

index.html - Core sandbox (self-contained implementation)  
script.js - Extended image-based shattering system  
style.css - UI styling system (glassmorphism + layout design)  

---

## Performance Notes

- Runs entirely on CPU (no GPU/WebGL usage)
- Performance depends on:
  - Number of active physics bodies
  - Fragment density during shattering
  - Canvas draw call frequency
- Optimized using:
  - Controlled physics iteration steps
  - Canvas state reuse
  - Selective rendering per frame

---

## Deployment

The project is deployed as a static web application.

Hosting:
- Vercel

---

## Contact

Developer: Abhi S Aji  
Email: abhisaji.dev@gmail.com  
Alternative Email: abhisajieden@gmail.com  
LinkedIn: https://www.linkedin.com/in/abhi-s-aji-008445267  

---

## License

MIT License