/**
 * ATMScene.jsx - 3D ATM Environment
 * CS3231 Computer Graphics - Secure ATM Interface Simulator
 * 
 * Builds a photorealistic 3D ATM using Three.js via @react-three/fiber.
 * - Phong-shaded chassis (custom shader)
 * - Gouraud-shaded buttons (custom shader)
 * - Animated card slot and cash tray
 * - Dynamic lighting
 */

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  phongVertexShader,
  phongFragmentShader,
  gouraudVertexShader,
  gouraudFragmentShader,
  createThreeUniforms,
  phongChassisUniforms,
  gouraudButtonUniforms,
} from '../graphics/ShaderLibrary.js';

// ============================================================================
// PHONG-SHADED ATM CHASSIS
// ============================================================================
function ATMChassis({ uiCanvas }) {
  const meshRef = useRef();

  const texture = useMemo(() => {
    if (!uiCanvas) return null;
    const tex = new THREE.CanvasTexture(uiCanvas);
    tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.minFilter = THREE.LinearFilter;
    return tex;
  }, [uiCanvas]);

  useFrame(() => {
    if (texture) texture.needsUpdate = true;
  });

  const uniforms = useMemo(() => createThreeUniforms(phongChassisUniforms, THREE), []);

  return (
    <group>
      {/* Main body */}
      <mesh ref={meshRef} position={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[3, 4.5, 1.5]} />
        <shaderMaterial
          vertexShader={phongVertexShader}
          fragmentShader={phongFragmentShader}
          uniforms={uniforms}
        />
      </mesh>

      {/* Top housing */}
      <mesh position={[0, 2.6, -0.1]} castShadow>
        <boxGeometry args={[3.2, 0.4, 1.7]} />
        <shaderMaterial
          vertexShader={phongVertexShader}
          fragmentShader={phongFragmentShader}
          uniforms={useMemo(() => createThreeUniforms({
            ...phongChassisUniforms,
            uDiffuseColor: { value: [0.2, 0.22, 0.28] },
          }, THREE), [])}
        />
      </mesh>

      {/* Bottom base */}
      <mesh position={[0, -2.55, 0.1]} castShadow>
        <boxGeometry args={[3.2, 0.4, 1.8]} />
        <shaderMaterial
          vertexShader={phongVertexShader}
          fragmentShader={phongFragmentShader}
          uniforms={useMemo(() => createThreeUniforms({
            ...phongChassisUniforms,
            uDiffuseColor: { value: [0.18, 0.2, 0.25] },
          }, THREE), [])}
        />
      </mesh>

      {/* Screen bezel */}
      <mesh position={[0, 0.8, 0.76]}>
        <boxGeometry args={[2.4, 1.7, 0.05]} />
        <meshStandardMaterial color="#0a0a10" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Screen glass / UI Display */}
      <mesh position={[0, 0.8, 0.79]}>
        <planeGeometry args={[2.2, 1.375]} /> {/* Adjusted aspect ratio for 1024x640 */}
        {texture ? (
          <meshBasicMaterial map={texture} transparent opacity={0.95} />
        ) : (
          <meshStandardMaterial
            color="#061820"
            emissive="#0a3020"
            emissiveIntensity={0.3}
            transparent
            opacity={0.9}
            metalness={0.1}
            roughness={0.05}
          />
        )}
      </mesh>
    </group>
  );
}

// ============================================================================
// GOURAUD-SHADED BUTTONS
// ============================================================================
function ATMButton({ position, label, color, onClick }) {
  const meshRef = useRef();
  const isHovered = useRef(false);

  const uniforms = useMemo(() => createThreeUniforms({
    ...gouraudButtonUniforms,
    uDiffuseColor: { value: color || [0.35, 0.38, 0.42] },
  }, THREE), [color]);

  useFrame(() => {
    if (meshRef.current) {
      const scale = isHovered.current ? 1.05 : 1.0;
      meshRef.current.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.1);
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={position}
      castShadow
      onClick={onClick}
      onPointerEnter={() => { isHovered.current = true; document.body.style.cursor = 'pointer'; }}
      onPointerLeave={() => { isHovered.current = false; document.body.style.cursor = 'default'; }}
    >
      <boxGeometry args={[0.35, 0.25, 0.08]} />
      <shaderMaterial
        vertexShader={gouraudVertexShader}
        fragmentShader={gouraudFragmentShader}
        uniforms={uniforms}
      />
    </mesh>
  );
}

function ATMKeypad({ onDigit, onEnter, onClear, onCancel }) {
  const digits = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['*', '0', '#'],
  ];

  const buttons = [];
  const startX = -0.45;
  const startY = -0.4;

  digits.forEach((row, ri) => {
    row.forEach((digit, ci) => {
      const x = startX + ci * 0.45;
      const y = startY - ri * 0.32;
      buttons.push(
        <ATMButton
          key={digit}
          position={[x, y, 0.78]}
          label={digit}
          color={[0.35, 0.38, 0.42]}
          onClick={() => {
            if (digit === '*') onClear?.();
            else if (digit === '#') onEnter?.();
            else onDigit?.(digit);
          }}
        />
      );
    });
  });

  // Side function buttons
  buttons.push(
    <ATMButton
      key="enter"
      position={[0.95, -0.4, 0.78]}
      color={[0.1, 0.5, 0.2]}
      onClick={onEnter}
    />,
    <ATMButton
      key="cancel"
      position={[0.95, -0.72, 0.78]}
      color={[0.6, 0.15, 0.1]}
      onClick={onCancel}
    />,
    <ATMButton
      key="clear"
      position={[0.95, -1.04, 0.78]}
      color={[0.5, 0.4, 0.1]}
      onClick={onClear}
    />
  );

  return <group position={[0, 0, 0]}>{buttons}</group>;
}

// ============================================================================
// CARD SLOT
// ============================================================================
function CardSlot({ cardProgress = 0 }) {
  const cardRef = useRef();

  useFrame(() => {
    if (cardRef.current) {
      cardRef.current.position.z = 0.78 + (1 - cardProgress) * 0.5;
    }
  });

  return (
    <group position={[-0.8, -1.6, 0]}>
      {/* Slot opening */}
      <mesh position={[0, 0, 0.76]}>
        <boxGeometry args={[0.8, 0.06, 0.04]} />
        <meshStandardMaterial color="#020204" metalness={0.8} roughness={0.3} />
      </mesh>
      {/* Card */}
      {cardProgress > 0 && (
        <mesh ref={cardRef} position={[0, 0, 0.78 + (1 - cardProgress) * 0.5]}>
          <boxGeometry args={[0.65, 0.04, 0.4]} />
          <meshStandardMaterial color="#e8d44d" metalness={0.6} roughness={0.2} />
        </mesh>
      )}
      {/* Slot light */}
      <mesh position={[0.5, 0, 0.76]}>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshStandardMaterial
          color={cardProgress > 0 ? '#00ff00' : '#ff6600'}
          emissive={cardProgress > 0 ? '#00ff00' : '#ff6600'}
          emissiveIntensity={2}
        />
      </mesh>
    </group>
  );
}

// ============================================================================
// CASH TRAY
// ============================================================================
function CashTray({ trayProgress = 0 }) {
  return (
    <group position={[0.5, -2.0, 0]}>
      {/* Tray opening */}
      <mesh position={[0, 0, 0.76]}>
        <boxGeometry args={[1.2, 0.08, 0.05]} />
        <meshStandardMaterial color="#010103" metalness={0.7} roughness={0.4} />
      </mesh>
      {/* Tray */}
      {trayProgress > 0 && (
        <mesh position={[0, -0.05, 0.76 + trayProgress * 0.6]}>
          <boxGeometry args={[1.0, 0.03, 0.5]} />
          <meshStandardMaterial color="#1a1a2e" metalness={0.5} roughness={0.5} />
        </mesh>
      )}
      {/* Cash bills */}
      {trayProgress > 0.5 && (
        <group position={[0, 0, 0.76 + trayProgress * 0.6]}>
          {[0, 1, 2, 3, 4].map((i) => (
            <mesh key={i} position={[0, 0.02 + i * 0.005, 0.05 * i]}>
              <boxGeometry args={[0.7, 0.002, 0.3]} />
              <meshStandardMaterial
                color={i % 2 === 0 ? '#2d5016' : '#3a6b1e'}
                metalness={0.1}
                roughness={0.8}
              />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
}

// ============================================================================
// RECEIPT SLOT
// ============================================================================
function ReceiptSlot() {
  return (
    <group position={[0.8, -1.6, 0]}>
      <mesh position={[0, 0, 0.76]}>
        <boxGeometry args={[0.5, 0.04, 0.04]} />
        <meshStandardMaterial color="#010103" metalness={0.8} roughness={0.3} />
      </mesh>
    </group>
  );
}

// ============================================================================
// ENVIRONMENT
// ============================================================================
function Environment() {
  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.8, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#1a1a28" metalness={0.3} roughness={0.7} />
      </mesh>

      {/* Back wall */}
      <mesh position={[0, 2, -1.5]} receiveShadow>
        <planeGeometry args={[20, 12]} />
        <meshStandardMaterial color="#12121e" metalness={0.2} roughness={0.8} />
      </mesh>

      {/* Ceiling light strip */}
      <mesh position={[0, 5, 1]}>
        <boxGeometry args={[4, 0.05, 0.3]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#ffffff"
          emissiveIntensity={0.5}
        />
      </mesh>
    </group>
  );
}

// ============================================================================
// MAIN ATM SCENE (exported)
// ============================================================================
function ATMScene({ onDigit, onEnter, onClear, onCancel, cardProgress, trayProgress, uiCanvas }) {
  const groupRef = useRef();

  // Gentle idle animation
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.1) * 0.02;
    }
  });

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.3} color="#8899bb" />
      <directionalLight
        position={[5, 8, 5]}
        intensity={1.2}
        color="#fff5e6"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <pointLight position={[0, 0.8, 2]} intensity={0.8} color="#00ff88" distance={5} decay={2} />
      <pointLight position={[-2, 3, 3]} intensity={0.4} color="#6688ff" distance={8} decay={2} />
      <spotLight
        position={[0, 4, 4]}
        angle={0.4}
        penumbra={0.5}
        intensity={1.0}
        color="#ffffff"
        castShadow
      />

      <Environment />

      <group ref={groupRef}>
        <ATMChassis uiCanvas={uiCanvas} />
        <ATMKeypad
          onDigit={onDigit}
          onEnter={onEnter}
          onClear={onClear}
          onCancel={onCancel}
        />
        <CardSlot cardProgress={cardProgress} />
        <CashTray trayProgress={trayProgress} />
        <ReceiptSlot />
      </group>
    </>
  );
}

export default ATMScene;
