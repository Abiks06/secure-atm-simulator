/**
 * App.jsx - Main Application Component
 * CS3231 Computer Graphics - Secure ATM Interface Simulator
 * 
 * Integrates all subsystems:
 * - 3D ATM Scene (Three.js via R3F)
 * - Bresenham Canvas Screen
 * - Security Feed
 * - State Machine
 * - Audio System
 * - Keyframe Animations
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import ATMScene from './components/ATMScene.jsx';
import BresenhamCanvas from './components/BresenhamCanvas.jsx';
import SecurityFeed from './components/SecurityFeed.jsx';
import { ATMStateMachine, ATM_STATES } from './state/ATMStateMachine.js';
import { ATMSounds } from './audio/SpatialAudio.js';
import {
  AnimationController,
  CardInsertAnimation,
  CardEjectAnimation,
  CashTrayAnimation,
  interpolateKeyframes,
} from './animations/KeyframeAnimations.js';
import './index.css';

function App() {
  const [atmData, setAtmData] = useState(null);
  const [atmState, setAtmState] = useState(ATM_STATES.IDLE);
  const [cardProgress, setCardProgress] = useState(0);
  const [trayProgress, setTrayProgress] = useState(0);
  const [showInfo, setShowInfo] = useState(false);

  const stateMachineRef = useRef(null);
  const animControllerRef = useRef(new AnimationController());

  // Initialize state machine
  useEffect(() => {
    const sm = new ATMStateMachine((data, prevState) => {
      setAtmData({ ...data });
      setAtmState(data.state);
    });
    stateMachineRef.current = sm;
    setAtmData(sm.getData());
  }, []);

  // Animation loop
  useEffect(() => {
    let running = true;
    const loop = () => {
      if (!running) return;
      animControllerRef.current.update();
      requestAnimationFrame(loop);
    };
    loop();
    return () => { running = false; };
  }, []);

  // Handle state change animations
  useEffect(() => {
    const ac = animControllerRef.current;

    switch (atmState) {
      case ATM_STATES.CARD_INSERTING:
        ATMSounds.cardInsert();
        ac.play('cardInsert', CardInsertAnimation,
          (val) => setCardProgress(1 - (val.z + 0.5)),
          () => {}
        );
        break;

      case ATM_STATES.AUTHENTICATING:
        ATMSounds.processing();
        break;

      case ATM_STATES.AUTH_FAILED:
        ATMSounds.error();
        break;

      case ATM_STATES.MENU:
        ATMSounds.success();
        break;

      case ATM_STATES.DISPENSING:
        ATMSounds.cashDispense();
        ac.play('cashTray', CashTrayAnimation,
          (val) => setTrayProgress((val.z + 0.8) / 1.2),
          () => {}
        );
        break;

      case ATM_STATES.SUCCESS:
        ATMSounds.success();
        break;

      case ATM_STATES.CARD_EJECTING:
        ATMSounds.cardEject();
        ac.play('cardEject', CardEjectAnimation,
          (val) => setCardProgress(Math.max(0, 1 - (val.z + 0.5))),
          () => {
            setCardProgress(0);
            setTrayProgress(0);
          }
        );
        break;

      default:
        break;
    }
  }, [atmState]);

  // Input handlers
  const handleDigit = useCallback((digit) => {
    const sm = stateMachineRef.current;
    if (!sm) return;
    ATMSounds.pinDigit();
    sm.addPinDigit(digit);
  }, []);

  const handleEnter = useCallback(() => {
    const sm = stateMachineRef.current;
    if (!sm) return;
    ATMSounds.buttonPress();
    const state = sm.getState();

    if (state === ATM_STATES.PIN_ENTRY && sm.pin.length === 4) {
      sm.dispatch('SUBMIT_PIN');
    } else if (state === ATM_STATES.AUTH_FAILED) {
      sm.dispatch('RETRY');
    }
  }, []);

  const handleClear = useCallback(() => {
    const sm = stateMachineRef.current;
    if (!sm) return;
    ATMSounds.buttonPress();
    sm.clearPin();
  }, []);

  const handleCancel = useCallback(() => {
    const sm = stateMachineRef.current;
    if (!sm) return;
    ATMSounds.buttonPress();
    sm.dispatch('CANCEL');
  }, []);

  const handleInsertCard = useCallback(() => {
    const sm = stateMachineRef.current;
    if (!sm) return;
    if (sm.getState() === ATM_STATES.IDLE) {
      sm.dispatch('INSERT_CARD');
    }
  }, []);

  const handleMenuSelect = useCallback((option) => {
    const sm = stateMachineRef.current;
    if (!sm) return;
    ATMSounds.buttonPress();
    const state = sm.getState();

    if (state === ATM_STATES.MENU) {
      switch (option) {
        case 1: sm.dispatch('SELECT_WITHDRAWAL'); break;
        case 2: sm.dispatch('SELECT_BALANCE'); break;
        case 3: sm.dispatch('CANCEL'); break;
      }
    } else if (state === ATM_STATES.BALANCE) {
      sm.dispatch('BACK');
    } else if (state === ATM_STATES.WITHDRAWAL) {
      sm.dispatch('BACK');
    } else if (state === ATM_STATES.SUCCESS) {
      switch (option) {
        case 1: sm.dispatch('CONTINUE'); break;
        case 2: sm.dispatch('FINISH'); break;
      }
    }
  }, []);

  const handleWithdraw = useCallback((amount) => {
    const sm = stateMachineRef.current;
    if (!sm) return;
    ATMSounds.buttonPress();
    if (sm.getState() === ATM_STATES.WITHDRAWAL) {
      sm.dispatch('CONFIRM_AMOUNT', { amount });
    }
  }, []);

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="header-left">
          <div className="logo-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <line x1="6" y1="12" x2="18" y2="12" />
              <line x1="6" y1="16" x2="18" y2="16" />
              <circle cx="12" cy="8" r="1.5" fill="currentColor" />
            </svg>
          </div>
          <div>
            <h1>Secure ATM Simulator</h1>
            <p className="subtitle">CS3231 Computer Graphics Project</p>
          </div>
        </div>
        <div className="header-right">
          <div className={`status-indicator ${atmState !== ATM_STATES.IDLE ? 'active' : ''}`}>
            <span className="status-dot"></span>
            <span>{atmState.replace(/_/g, ' ')}</span>
          </div>
          <button className="info-btn" onClick={() => setShowInfo(!showInfo)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          </button>
        </div>
      </header>

      {/* Info Panel */}
      {showInfo && (
        <div className="info-panel">
          <h3>System Information</h3>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Rendering</span>
              <span className="info-value">Three.js + WebGL</span>
            </div>
            <div className="info-item">
              <span className="info-label">Chassis Shader</span>
              <span className="info-value">Phong (Per-Fragment)</span>
            </div>
            <div className="info-item">
              <span className="info-label">Button Shader</span>
              <span className="info-value">Gouraud (Per-Vertex)</span>
            </div>
            <div className="info-item">
              <span className="info-label">Line Algorithm</span>
              <span className="info-value">Bresenham&apos;s</span>
            </div>
            <div className="info-item">
              <span className="info-label">Logo Curves</span>
              <span className="info-value">Cubic Bezier</span>
            </div>
            <div className="info-item">
              <span className="info-label">Clipping</span>
              <span className="info-value">Cohen-Sutherland</span>
            </div>
            <div className="info-item">
              <span className="info-label">Transforms</span>
              <span className="info-value">Manual 4×4 Matrices</span>
            </div>
            <div className="info-item">
              <span className="info-label">Default PIN</span>
              <span className="info-value">1234</span>
            </div>
          </div>
          <button className="close-info" onClick={() => setShowInfo(false)}>Close</button>
        </div>
      )}

      {/* Main Content */}
      <div className="main-content">
        {/* 3D Scene */}
        <div className="scene-container" id="atm-3d-scene">
          <Canvas
            shadows
            camera={{ position: [0, 0.5, 5.5], fov: 45 }}
            gl={{ antialias: true, alpha: false }}
            onCreated={({ gl }) => {
              gl.setClearColor('#0a0a14');
              gl.shadowMap.enabled = true;
              gl.shadowMap.type = 2; // PCFSoftShadowMap
            }}
          >
            <ATMScene
              onDigit={handleDigit}
              onEnter={handleEnter}
              onClear={handleClear}
              onCancel={handleCancel}
              cardProgress={cardProgress}
              trayProgress={trayProgress}
            />
            <OrbitControls
              enablePan={false}
              minDistance={3}
              maxDistance={8}
              minPolarAngle={Math.PI / 4}
              maxPolarAngle={Math.PI / 1.8}
              target={[0, 0, 0]}
            />
          </Canvas>
        </div>

        {/* Right Panel */}
        <div className="right-panel">
          {/* ATM Screen - Bresenham rendered */}
          <div className="screen-section">
            <div className="section-header">
              <span className="section-icon">📺</span>
              <span>ATM Display <span className="badge">Bresenham</span></span>
            </div>
            <div className="atm-screen-wrapper">
              <BresenhamCanvas atmState={atmState} atmData={atmData} />
            </div>
          </div>

          {/* Controls */}
          <div className="controls-section">
            <div className="section-header">
              <span className="section-icon">🎮</span>
              <span>Controls</span>
            </div>
            <div className="control-buttons">
              {atmState === ATM_STATES.IDLE && (
                <button className="atm-btn primary" id="btn-insert-card" onClick={handleInsertCard}>
                  💳 Insert Card
                </button>
              )}
              {atmState === ATM_STATES.PIN_ENTRY && (
                <div className="pin-controls">
                  <div className="pin-display">
                    {[0, 1, 2, 3].map(i => (
                      <div key={i} className={`pin-dot ${atmData && i < atmData.pin.length ? 'filled' : ''}`}>
                        {atmData && i < atmData.pin.length ? '●' : '○'}
                      </div>
                    ))}
                  </div>
                  <div className="numpad">
                    {['1','2','3','4','5','6','7','8','9','C','0','↵'].map(key => (
                      <button
                        key={key}
                        className={`numpad-key ${key === 'C' ? 'clear' : ''} ${key === '↵' ? 'enter' : ''}`}
                        id={`numpad-${key}`}
                        onClick={() => {
                          if (key === 'C') handleClear();
                          else if (key === '↵') handleEnter();
                          else handleDigit(key);
                        }}
                      >
                        {key}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {atmState === ATM_STATES.AUTH_FAILED && (
                <div className="failed-controls">
                  <p className="error-text">❌ Incorrect PIN</p>
                  <button className="atm-btn warning" onClick={handleEnter}>🔄 Retry</button>
                  <button className="atm-btn danger" onClick={handleCancel}>✖ Cancel</button>
                </div>
              )}
              {atmState === ATM_STATES.MENU && (
                <div className="menu-controls">
                  <button className="atm-btn primary" id="btn-withdraw" onClick={() => handleMenuSelect(1)}>💰 Withdrawal</button>
                  <button className="atm-btn secondary" id="btn-balance" onClick={() => handleMenuSelect(2)}>📊 Check Balance</button>
                  <button className="atm-btn danger" id="btn-exit" onClick={() => handleMenuSelect(3)}>🚪 Exit</button>
                </div>
              )}
              {atmState === ATM_STATES.BALANCE && (
                <div className="balance-display">
                  <p className="balance-amount">${atmData?.balance?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                  <button className="atm-btn secondary" onClick={() => handleMenuSelect(1)}>↩ Back to Menu</button>
                </div>
              )}
              {atmState === ATM_STATES.WITHDRAWAL && (
                <div className="withdrawal-controls">
                  {[100, 200, 500, 1000].map(amount => (
                    <button
                      key={amount}
                      className="atm-btn amount"
                      id={`btn-withdraw-${amount}`}
                      onClick={() => handleWithdraw(amount)}
                    >
                      ${amount}
                    </button>
                  ))}
                  <button className="atm-btn secondary" onClick={() => handleMenuSelect(0)}>↩ Back</button>
                </div>
              )}
              {(atmState === ATM_STATES.AUTHENTICATING || atmState === ATM_STATES.PROCESSING) && (
                <div className="loading-indicator">
                  <div className="spinner"></div>
                  <p>{atmState === ATM_STATES.AUTHENTICATING ? 'Verifying PIN...' : 'Processing...'}</p>
                </div>
              )}
              {atmState === ATM_STATES.DISPENSING && (
                <div className="dispensing-indicator">
                  <p className="dispense-text">💵 Dispensing Cash...</p>
                </div>
              )}
              {atmState === ATM_STATES.SUCCESS && (
                <div className="success-controls">
                  <p className="success-text">✅ Transaction Complete</p>
                  <button className="atm-btn primary" onClick={() => handleMenuSelect(1)}>🔄 Another Transaction</button>
                  <button className="atm-btn danger" onClick={() => handleMenuSelect(2)}>🏁 Finish</button>
                </div>
              )}
              {atmState === ATM_STATES.CARD_EJECTING && (
                <div className="ejecting-indicator">
                  <p>📤 Please take your card...</p>
                </div>
              )}
            </div>
          </div>

          {/* Security Feed */}
          <div className="security-section">
            <div className="section-header">
              <span className="section-icon">📹</span>
              <span>Security Feed <span className="badge live">LIVE</span></span>
            </div>
            <SecurityFeed width={320} height={180} />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="app-footer">
        <span>CS3231 Computer Graphics • Secure ATM Interface Simulator</span>
        <span>Bresenham • Bezier • Phong • Gouraud • Cohen-Sutherland</span>
      </footer>
    </div>
  );
}

export default App;
