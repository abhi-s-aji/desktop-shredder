# Desktop Shredder

Desktop Shredder is a high-performance physics sandbox application designed for rigid-body simulation and interactive fragmentation. It transforms the browser viewport into a destructible environment, focusing on real-time stress propagation and material-based collision dynamics.

## Application Access
- **Live Version:** [https://desktop-shredder.vercel.app/](https://desktop-shredder.vercel.app/)
- **LinkedIn Profile:** [Abhi S Aji](https://www.linkedin.com/in/abhi-s-aji-008445267)

## Technical Overview
The project is built upon the Matter.js physics engine, utilizing custom HTML5 Canvas rendering to manage high-density fragmentation scenarios. The architecture is a self-contained, single-file implementation, prioritizing minimal footprint and high execution efficiency.

### Core Specifications
- **Physics Engine:** Matter.js 0.19.0 (Rigid-body dynamics, collision detection)
- **Renderer:** HTML5 Canvas 2D API (Per-fragment texture mapping)
- **Input Handling:** PointerEvents (Unified mouse, trackpad, and touch support)
- **Architecture:** Monolithic single-file (Inline HTML, CSS, and ES6 JavaScript)
- **Performance:** Optimized for 60 FPS under standard load conditions

## Key Engineering Features
- **Material-Based Physics:** Implementation of distinct physical properties for Metal, Glass, Rubber, and Stone, each with unique density, restitution, and damage thresholds.
- **Dynamic Fragmentation:** Procedural generation of grid-based and radial shards upon impact, utilizing rigid rotation and velocity vectors.
- **Interaction Systems:**
    - **Gravity Manipulation:** Real-time toggling of gravitational fields.
    - **Force Fields:** Vector-based Wind, Gravity Vortices, and Radial Explosions.
    - **Tooling:** Modal interaction system allowing for variable object spawn modes (Single, Burst, Rain).
- **VFX Integration:** Implementation of screen shake, high-velocity collision slow-motion, and animated crack propagation.

## Compatibility and Performance
Desktop Shredder is engineered as a high-fidelity physics sandbox. While the application is fully responsive and supports touch-based interactions on mobile devices, the physics simulation is computationally intensive.

- **Desktop Experience:** Recommended for the optimal experience. Desktop browsers provide the processing power required to maintain 60 FPS during high-density fragment events and complex collision calculations.
- **Mobile Experience:** Fully supported. The interface scales to mobile viewports, and interaction logic utilizes pointer events for touchscreen compatibility. Note that performance may vary depending on device hardware limitations and active shard counts.

## Development and Deployment
No external build dependencies, npm packages, or compilers are required for deployment.

### Local Setup
1. Clone this repository.
2. Serve the directory using a standard HTTP server (e.g., Python: `python -m http.server 8000` or Node.js: `npx http-server`).
3. Access the application via `http://localhost:8000`.

## Contact Information
For professional inquiries or project documentation queries, please contact the author via the following channels:

- **Professional Email:** abhisaji.dev@gmail.com
- **Secondary/Alternative Email:** abhisajieden@gmail.com
- **LinkedIn:** [Abhi S Aji](https://www.linkedin.com/in/abhi-s-aji-008445267)

## License
MIT License.