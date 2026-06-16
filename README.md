# Desktop Shredder

A browser-based physics simulation system for real-time rigid-body interaction, material-based destruction, and interactive force-driven dynamics using Matter.js and Canvas rendering.

Live Demo: https://desktop-shredder.vercel.app/

---

## Overview

Desktop Shredder is an interactive physics sandbox that simulates real-time object dynamics, collision-based destruction, and material-dependent behavior in the browser.

The system focuses on:
- Real-time rigid-body physics simulation
- Material-based object properties and destruction rules
- User-driven interaction using force and tool-based controls
- Visual feedback through collision, stress, and impact effects

It is built as a performance-focused physics environment powered by Matter.js and HTML5 Canvas.

---

## Tech Stack

- Physics Engine: Matter.js v0.19.0 (CDN, unmodified)
- Rendering: HTML5 Canvas 2D API
- Frontend: Vanilla JavaScript (ES6), HTML5, CSS3
- UI Styling: Custom CSS (glassmorphism + dark UI system)
- Architecture: Multi-file structure with embedded core logic

---

## System Architecture

The project consists of the following components:

### index.html
- Main entry point of the application
- Contains embedded JavaScript for physics engine, scene management, UI system, and interaction logic
- Initializes Matter.js world and simulation lifecycle

### script.js
- Secondary implementation file
- Implements extended physics-based interaction system
- Includes alternative simulation logic and tool behaviors

### style.css
- Defines UI layout and visual styling system
- Implements dark theme with glass-style interface components

---

## Core Features

### Physics Simulation
- Real-time rigid-body dynamics using Matter.js
- Gravity system with directional control (up, down, off)
- Collision detection with impact-based responses

### Material System
- Four material types: Metal, Glass, Rubber, Stone
- Each material has:
  - Density
  - Restitution
  - Friction
  - Damage threshold
- Damage accumulation leads to object shattering into fragments

### Interaction Tools
- Drag: Mouse-based object manipulation using constraints
- Spawn: Create objects at cursor position
- Pull: Vortex-style force toward cursor
- Wind: Directional force field interaction
- Explode: Radial impulse force application
- Grav: Gravity direction toggle system

### Spawn Modes
- Single object spawn
- Burst spawn (multiple objects at once)
- Rain mode (continuous spawning)

### Visual Effects
- Screen shake on high-impact collisions
- Slow-motion effect on strong impacts
- Glass surface crack rendering
- Object stress visualization before breaking

---

## Rendering System

- Built entirely using Canvas 2D API
- No WebGL or GPU acceleration
- Render loop driven by Matter.js runner system

Rendering behavior:
- Physics bodies rendered using Matter.js renderer
- Canvas transforms used for motion and rotation
- Custom overlay effects for cracks, stress, and impact visualization

---

## Physics Implementation

- Matter.js v0.19.0 used without modification
- Default physics solver and collision system

Core APIs used:
- Engine.create
- Engine.update
- Bodies.rectangle / circle / polygon / fromVertices
- Body.applyForce / setVelocity / setAngularVelocity
- Composite.add / remove
- MouseConstraint system
- Events system for collision handling

Physics configuration:
- Adjustable gravity system
- Tuned iteration values for stability
- Time scaling support (pause, slow motion, normal)

---

## Performance Behavior

Optimizations implemented:
- Automatic removal of off-screen objects
- Shard limit system (max ~380 dynamic bodies)
- Event throttling for telemetry updates
- Resize event debouncing
- Collision cooldown to reduce repeated calculations
- Idle damping when system is inactive

Limitations:
- No spatial partitioning system
- Full O(n) iteration for force-based tools
- CPU-only simulation (no GPU acceleration)

---

## Features Summary

- Real-time physics sandbox environment
- Material-based destruction system
- Multi-tool interaction system (6 tools)
- Spawn system with multiple modes
- Collision-driven visual feedback system
- Glass surface destruction mechanics
- Performance-aware object lifecycle management
- Telemetry dashboard (FPS, body count, energy, impacts)

---

## Deployment

This project is deployed as a static web application.

Platform:
- Vercel

---

## Contact

Developer: Abhi S Aji  
Website: https://desktop-shredder.vercel.app/  
Email: abhisaji.dev@gmail.com  
Alternative Email: abhisajieden@gmail.com  
LinkedIn: https://www.linkedin.com/in/abhi-s-aji-008445267  

---

## License

MIT License