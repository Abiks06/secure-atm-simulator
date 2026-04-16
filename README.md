# Secure ATM Interface Simulator

## 🎓 CS3231 Computer Graphics Project

This project is a complete, custom-built rendering engine and simulation for a Secure ATM Interface. It fulfills all the requirements of the CS3231 curriculum, integrating 3D graphics, 2D rasterization algorithms, and interactive multimedia into a unified React application.

### 🌟 Project Structure
The project is divided into several parts:

#### 1. Manual Graphics & Math Subsystem (`src/graphics/ManualMath.js`)
All core math is implemented from scratch (bypassing native Three.js helpers) to prove mathematical grasp:
- **Bresenham's Line & Circle Algorithms:** Used to render the 2D ATM interface directly to an HTML5 Canvas. Includes logic for lines, rects, and circles with pure integer arithmetic where applicable.
- **De Casteljau's & Bernstein Bezier Curves:** Both Quadratic and Cubic Bezier curves are implemented and mapped to generate complex shapes (like the Secure Bank Logo).
- **Custom 4x4 Matrix Transformations:** A complete column-major Mat4 class. Handles Translation, Scaling, Rotations (Rx, Ry, Rz), Perspective projection, and LookAt calculations to manipulate security icons and card insertion states.

#### 2. Vector Clipping System (`src/graphics/ClippingAlgorithm.js`)
- **Cohen-Sutherland Line Clipping:** Keeps the Bresenham UI isolated within the ATM screen bounds.
- **Sutherland-Hodgman Polygon Clipping:** Extended algorithm setup for planar clipping tasks.

#### 3. 3D Scene & Rendering Engine (`src/components/ATMScene.jsx`)
- Powered by React Three Fiber (R3F), this subsystem stages the ATM.
- **Custom Shaders (`src/graphics/ShaderLibrary.js`):** 
  - *Phong Shading (Per-Fragment):* Applied to the main ATM chassis for a sleek, metallic, realistic specular highlight.
  - *Gouraud Shading (Per-Vertex):* Applied to the interactive buttons for a softer, plastic-like diffusion pattern, showcasing the difference between per-vertex and per-fragment lighting.

#### 4. Multimedia & State Machine
- **State Machine (`src/state/ATMStateMachine.js`):** Handles the strict transaction flow (IDLE → CARD INSERT → PIN → AUTH → WITHDRAW → SUCCESS → EJECT).
- **Spatial Audio (`src/audio/SpatialAudio.js`):** Uses `howler.js` to provide 3D localized sound feedback (button presses, cash dispensing, card ejecting).
- **Keyframe Animations (`src/animations/KeyframeAnimations.js`):** Smooth, interpolative easing curves control 3D components like the cash tray and card slot reader.
- **Video Security Feed (`src/components/SecurityFeed.jsx`):** A looping HTML5 video texture streamed directly onto a planar surface representing a security camera overlay.

### 🚀 Execution Strategy & Setup

**Prerequisites:** Node.js (v18+)

1. **Install Dependencies:**
   \`\`\`bash
   npm install
   \`\`\`

2. **Run the Development Server:**
   \`\`\`bash
   npm run dev
   \`\`\`

3. **Interact:**
   - The application will be live at `http://localhost:5173/`.
   - Ensure you allow autoplay policies in your browser if audio/video seems paused.
   - Insert the card using the UI button, and try the default PIN `1234`.

### 📄 Documentation
For an in-depth mathematical breakdown, shader comparisons, and PIN logic flowcharts, please refer to the attached `Technical_Report.md`.
