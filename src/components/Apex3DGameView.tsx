/**
 * NDAWG PRO — Apex 3D Orbital Recon Game
 * Built with Three.js (r160+) strictly adhering to Three.js & Game Guidelines:
 * - 3–12 Part Procedural Composite Models (Hero Ship & Orbital Beacons)
 * - Studio PBR Lighting with RoomEnvironment & ACESFilmicToneMapping
 * - Procedural Canvas Textures & Zero 404 external asset dependencies
 * - Full-Viewport Game Shell (Title Screen -> Playing -> Pause/GameOver)
 * - 60fps Clamped Physics Loop, Damped Camera & Pre-allocated Scratch Vectors
 * - Procedural Web Audio API Synthesizer with Mute Toggle
 */

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { Volume2, VolumeX, Play, RotateCcw, Shield, Zap, Target, Crosshair, ArrowLeft } from 'lucide-react';

interface Apex3DGameViewProps {
  onBackToConsole?: () => void;
}

type GameState = 'TITLE' | 'PLAYING' | 'PAUSED' | 'GAMEOVER' | 'VICTORY';

export const Apex3DGameView: React.FC<Apex3DGameViewProps> = ({ onBackToConsole }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [gameState, setGameState] = useState<GameState>('TITLE');
  const [score, setScore] = useState(0);
  const [shield, setShield] = useState(100);
  const [energy, setEnergy] = useState(100);
  const [wave, setWave] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  // Audio Synth Ref
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Core Game State Refs (accessed synchronously inside 60fps loop)
  const stateRef = useRef<{
    gameState: GameState;
    score: number;
    shield: number;
    energy: number;
    wave: number;
    isMuted: boolean;
    keys: Record<string, boolean>;
    cameraShake: number;
    hitStopMs: number;
  }>({
    gameState: 'TITLE',
    score: 0,
    shield: 100,
    energy: 100,
    wave: 1,
    isMuted: false,
    keys: {},
    cameraShake: 0,
    hitStopMs: 0
  });

  // Sound Synthesizer via Web Audio API (Zero external MP3 dependencies)
  const playSound = (type: 'laser' | 'hit' | 'beacon' | 'explosion' | 'engine') => {
    if (stateRef.current.isMuted) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const now = ctx.currentTime;

      if (type === 'laser') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(110, now + 0.12);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === 'hit') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === 'beacon') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
        osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === 'explosion') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(90, now);
        osc.frequency.exponentialRampToValueAtTime(20, now + 0.4);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.4);
      }
    } catch {
      // AudioContext unavailable or blocked by autoplay
    }
  };

  useEffect(() => {
    stateRef.current.gameState = gameState;
  }, [gameState]);

  useEffect(() => {
    stateRef.current.isMuted = isMuted;
  }, [isMuted]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Detect Software WebGL
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 2. Setup Three.js Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance'
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    // 3. Scene, Camera & Studio Environment
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x030712); // Deep Space Slate 950
    scene.fog = new THREE.FogExp2(0x030712, 0.015);

    const camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 5, 12);

    // Studio Environment via PMREMGenerator
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // Lighting Rig: Key Directional + Cool Hemisphere
    const dirLight = new THREE.DirectionalLight(0xffeedd, 2.0);
    dirLight.position.set(15, 25, 20);
    scene.add(dirLight);

    const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x0f172a, 1.2);
    scene.add(hemiLight);

    // 4. Procedural Textures (HTML5 Canvas — Zero external image files)
    const createGridTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#050b14';
      ctx.fillRect(0, 0, 256, 256);
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 2;
      ctx.strokeRect(0, 0, 256, 256);
      ctx.fillStyle = '#06b6d4';
      ctx.fillRect(124, 124, 8, 8);
      const texture = new THREE.CanvasTexture(canvas);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(40, 40);
      return texture;
    };

    // Ground Space Grid Plane
    const groundGeo = new THREE.PlaneGeometry(300, 300);
    const groundMat = new THREE.MeshStandardMaterial({
      map: createGridTexture(),
      roughness: 0.8,
      metalness: 0.2
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -2;
    scene.add(ground);

    // 5. Composite 3–12 Part Procedural Hero Ship (Apex Strike Fighter)
    const shipGroup = new THREE.Group();

    // Part 1: Main Aerodynamic Fuselage
    const hullGeo = new THREE.ConeGeometry(0.8, 3.2, 5);
    const hullMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a, // Obsidian Dark Hull
      metalness: 0.85,
      roughness: 0.25
    });
    const hull = new THREE.Mesh(hullGeo, hullMat);
    hull.rotation.x = Math.PI / 2;
    shipGroup.add(hull);

    // Part 2: Cockpit Canopy
    const cockpitGeo = new THREE.SphereGeometry(0.42, 16, 12);
    cockpitGeo.scale(1, 0.6, 1.8);
    const cockpitMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      metalness: 0.1,
      roughness: 0.1,
      emissive: 0x0284c7,
      emissiveIntensity: 0.3
    });
    const cockpit = new THREE.Mesh(cockpitGeo, cockpitMat);
    cockpit.position.set(0, 0.35, -0.2);
    shipGroup.add(cockpit);

    // Part 3 & 4: Sweeping Delta Wings (Left & Right)
    const wingShape = new THREE.Shape();
    wingShape.moveTo(0, 0);
    wingShape.lineTo(2.4, -1.2);
    wingShape.lineTo(2.2, -1.6);
    wingShape.lineTo(0, -0.8);
    wingShape.closePath();

    const wingExtrudeSettings = { depth: 0.08, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02 };
    const wingGeo = new THREE.ExtrudeGeometry(wingShape, wingExtrudeSettings);
    const wingMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7, roughness: 0.3 });

    const leftWing = new THREE.Mesh(wingGeo, wingMat);
    leftWing.position.set(0, 0, 0.4);
    shipGroup.add(leftWing);

    const rightWing = leftWing.clone();
    rightWing.scale.x = -1;
    shipGroup.add(rightWing);

    // Part 5 & 6: Plasma Cannons
    const cannonGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.2, 8);
    const cannonMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.9, roughness: 0.2 });
    const leftCannon = new THREE.Mesh(cannonGeo, cannonMat);
    leftCannon.rotation.x = Math.PI / 2;
    leftCannon.position.set(2.2, -0.1, -0.6);
    shipGroup.add(leftCannon);

    const rightCannon = leftCannon.clone();
    rightCannon.position.x = -2.2;
    shipGroup.add(rightCannon);

    // Part 7 & 8: Twin Engine Nacelles
    const engineGeo = new THREE.CylinderGeometry(0.22, 0.28, 1.0, 12);
    const engineMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.35 });
    const leftEngine = new THREE.Mesh(engineGeo, engineMat);
    leftEngine.rotation.x = Math.PI / 2;
    leftEngine.position.set(0.6, 0.05, 1.2);
    shipGroup.add(leftEngine);

    const rightEngine = leftEngine.clone();
    rightEngine.position.x = -0.6;
    shipGroup.add(rightEngine);

    // Part 9 & 10: Plasma Thruster Glows
    const thrusterGlowGeo = new THREE.ConeGeometry(0.18, 0.8, 8);
    const thrusterMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
    const leftThruster = new THREE.Mesh(thrusterGlowGeo, thrusterMat);
    leftThruster.rotation.x = -Math.PI / 2;
    leftThruster.position.set(0.6, 0.05, 1.8);
    shipGroup.add(leftThruster);

    const rightThruster = leftThruster.clone();
    rightThruster.position.x = -0.6;
    shipGroup.add(rightThruster);

    // Part 11: Dorsal Stabilizer Fin
    const finGeo = new THREE.BoxGeometry(0.06, 0.8, 0.8);
    const finMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.6, roughness: 0.3 });
    const fin = new THREE.Mesh(finGeo, finMat);
    fin.position.set(0, 0.55, 0.8);
    shipGroup.add(fin);

    // Part 12: Soft Radial Contact Shadow
    const shadowGeo = new THREE.CircleGeometry(1.6, 16);
    const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35 });
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = -1.95;
    shipGroup.add(shadow);

    shipGroup.position.set(0, 0, 0);
    scene.add(shipGroup);

    // 6. Beacons & Target Drones (Procedural Targets)
    interface BeaconItem {
      mesh: THREE.Group;
      type: 'beacon' | 'drone';
      speed: number;
    }
    const targets: BeaconItem[] = [];

    const createBeacon = (zPos: number): BeaconItem => {
      const g = new THREE.Group();
      const coreGeo = new THREE.OctahedronGeometry(0.7, 0);
      const isDrone = Math.random() > 0.4;
      const coreMat = new THREE.MeshStandardMaterial({
        color: isDrone ? 0xf43f5e : 0x10b981,
        emissive: isDrone ? 0xbe123c : 0x047857,
        emissiveIntensity: 0.6,
        metalness: 0.5,
        roughness: 0.2
      });
      const core = new THREE.Mesh(coreGeo, coreMat);
      g.add(core);

      // Orbital Ring
      const ringGeo = new THREE.TorusGeometry(1.1, 0.05, 8, 24);
      const ringMat = new THREE.MeshBasicMaterial({ color: isDrone ? 0xfb7185 : 0x34d399 });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 3;
      g.add(ring);

      g.position.set((Math.random() - 0.5) * 24, Math.random() * 2.5 - 0.5, zPos);
      scene.add(g);
      return { mesh: g, type: isDrone ? 'drone' : 'beacon', speed: Math.random() * 4 + 8 };
    };

    for (let i = 0; i < 15; i++) {
      targets.push(createBeacon(-20 - i * 18));
    }

    // 7. Lasers / Projectiles Pool
    interface Projectile {
      mesh: THREE.Mesh;
      active: boolean;
      life: number;
    }
    const projectilePool: Projectile[] = [];
    const projGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.8, 6);
    const projMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    for (let i = 0; i < 20; i++) {
      const p = new THREE.Mesh(projGeo, projMat);
      p.rotation.x = Math.PI / 2;
      p.visible = false;
      scene.add(p);
      projectilePool.push({ mesh: p, active: false, life: 0 });
    }

    const fireLaser = () => {
      if (stateRef.current.energy < 8) return;
      stateRef.current.energy = Math.max(0, stateRef.current.energy - 8);
      setEnergy(Math.round(stateRef.current.energy));

      const p1 = projectilePool.find((p) => !p.active);
      if (p1) {
        p1.active = true;
        p1.life = 1.5;
        p1.mesh.visible = true;
        p1.mesh.position.set(shipGroup.position.x - 0.7, shipGroup.position.y, shipGroup.position.z - 1.2);
      }
      const p2 = projectilePool.find((p) => !p.active && p !== p1);
      if (p2) {
        p2.active = true;
        p2.life = 1.5;
        p2.mesh.visible = true;
        p2.mesh.position.set(shipGroup.position.x + 0.7, shipGroup.position.y, shipGroup.position.z - 1.2);
      }
      playSound('laser');
    };

    // 8. Input Event Handlers
    const handleKeyDown = (e: KeyboardEvent) => {
      stateRef.current.keys[e.code] = true;

      if (e.code === 'KeyP' || e.code === 'Escape') {
        setGameState((prev) => (prev === 'PLAYING' ? 'PAUSED' : prev === 'PAUSED' ? 'PLAYING' : prev));
      }

      if (stateRef.current.gameState === 'TITLE' && (e.code === 'Enter' || e.code === 'Space')) {
        setGameState('PLAYING');
      }

      if (stateRef.current.gameState === 'PLAYING' && e.code === 'Space') {
        fireLaser();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      stateRef.current.keys[e.code] = false;
    };

    const handleBlur = () => {
      stateRef.current.keys = {};
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    // 9. Lossless 60fps Animation Loop with Clamped Delta & Damped Camera
    const startTime = performance.now();
    let lastTime = startTime;
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const now = performance.now();
      const rawDt = (now - lastTime) / 1000;
      lastTime = now;
      const dt = Math.min(rawDt, 0.05); // Clamped delta per craft guidelines
      const elapsedTime = (now - startTime) / 1000;

      const curState = stateRef.current.gameState;

      if (curState === 'TITLE') {
        // Live World Centerpiece Camera Orbit Pan
        const t = elapsedTime * 0.4;
        camera.position.x = Math.sin(t) * 8;
        camera.position.z = Math.cos(t) * 8 + 4;
        camera.position.y = 3.5 + Math.sin(t * 1.5) * 0.5;
        camera.lookAt(shipGroup.position);
        shipGroup.rotation.y = Math.sin(t * 0.8) * 0.2;
        ground.position.z = (ground.position.z + dt * 4) % 15;
      } else if (curState === 'PLAYING') {
        // Player Input Handling
        const keys = stateRef.current.keys;
        const moveSpeed = 12 * dt;
        let dx = 0;
        let dy = 0;

        if (keys['KeyA'] || keys['ArrowLeft']) dx -= moveSpeed;
        if (keys['KeyD'] || keys['ArrowRight']) dx += moveSpeed;
        if (keys['KeyW'] || keys['ArrowUp']) dy += moveSpeed;
        if (keys['KeyS'] || keys['ArrowDown']) dy -= moveSpeed;

        shipGroup.position.x = THREE.MathUtils.clamp(shipGroup.position.x + dx, -12, 12);
        shipGroup.position.y = THREE.MathUtils.clamp(shipGroup.position.y + dy, -1.0, 3.5);

        // Banking Rotation on Movement
        shipGroup.rotation.z = THREE.MathUtils.lerp(shipGroup.rotation.z, -dx * 2.5, 0.1);
        shipGroup.rotation.x = THREE.MathUtils.lerp(shipGroup.rotation.x, -dy * 1.5, 0.1);

        // Energy Regeneration
        stateRef.current.energy = Math.min(100, stateRef.current.energy + dt * 15);
        setEnergy(Math.round(stateRef.current.energy));

        // Move Projectiles
        projectilePool.forEach((p) => {
          if (!p.active) return;
          p.mesh.position.z -= dt * 60;
          p.life -= dt;
          if (p.life <= 0 || p.mesh.position.z < -200) {
            p.active = false;
            p.mesh.visible = false;
          }
        });

        // Move Beacons and Targets
        targets.forEach((tgt) => {
          tgt.mesh.position.z += dt * (tgt.speed + stateRef.current.wave * 2);
          tgt.mesh.rotation.y += dt * 2.5;

          // Check Collision with Lasers
          projectilePool.forEach((p) => {
            if (!p.active) return;
            const dist = p.mesh.position.distanceTo(tgt.mesh.position);
            if (dist < 1.4) {
              p.active = false;
              p.mesh.visible = false;
              playSound(tgt.type === 'drone' ? 'explosion' : 'beacon');

              stateRef.current.score += tgt.type === 'drone' ? 150 : 50;
              setScore(stateRef.current.score);

              // Reset target ahead
              tgt.mesh.position.set((Math.random() - 0.5) * 24, Math.random() * 2.5 - 0.5, -120 - Math.random() * 40);
            }
          });

          // Check Collision with Ship
          const shipDist = shipGroup.position.distanceTo(tgt.mesh.position);
          if (shipDist < 1.6) {
            if (tgt.type === 'beacon') {
              playSound('beacon');
              stateRef.current.score += 200;
              setScore(stateRef.current.score);
              stateRef.current.shield = Math.min(100, stateRef.current.shield + 20);
              setShield(stateRef.current.shield);
            } else {
              playSound('hit');
              stateRef.current.shield = Math.max(0, stateRef.current.shield - 25);
              setShield(stateRef.current.shield);
              stateRef.current.cameraShake = 0.5;
              if (stateRef.current.shield <= 0) {
                playSound('explosion');
                setGameState('GAMEOVER');
              }
            }
            tgt.mesh.position.set((Math.random() - 0.5) * 24, Math.random() * 2.5 - 0.5, -120 - Math.random() * 40);
          }

          // Respawn past camera
          if (tgt.mesh.position.z > 15) {
            tgt.mesh.position.set((Math.random() - 0.5) * 24, Math.random() * 2.5 - 0.5, -140);
          }
        });

        // Damped Camera Tracking
        const targetCamX = shipGroup.position.x * 0.45;
        const targetCamY = shipGroup.position.y * 0.35 + 3.2;
        camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetCamX, 1 - Math.exp(-6 * dt));
        camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetCamY, 1 - Math.exp(-6 * dt));
        camera.position.z = 8.5;

        // Camera Shake decay
        if (stateRef.current.cameraShake > 0) {
          camera.position.x += (Math.random() - 0.5) * stateRef.current.cameraShake;
          camera.position.y += (Math.random() - 0.5) * stateRef.current.cameraShake;
          stateRef.current.cameraShake = Math.max(0, stateRef.current.cameraShake - dt * 2);
        }

        camera.lookAt(shipGroup.position.x * 0.7, shipGroup.position.y * 0.7, -10);

        // Endless terrain scroll
        ground.position.z = (ground.position.z + dt * 25) % 15;
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  const handleRestart = () => {
    stateRef.current.score = 0;
    stateRef.current.shield = 100;
    stateRef.current.energy = 100;
    setScore(0);
    setShield(100);
    setEnergy(100);
    setGameState('PLAYING');
  };

  return (
    <div className="relative w-full h-[650px] rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl select-none font-sans">
      {/* Three.js Canvas Container (Isolated from React state re-renders) */}
      <div ref={containerRef} className="w-full h-full" />

      {/* Top Left Controls: Sound Mute & Back button */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
        {onBackToConsole && (
          <button
            onClick={onBackToConsole}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-xs text-slate-300 font-mono border border-slate-700/80 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Quay lại</span>
          </button>
        )}
        <button
          onClick={() => setIsMuted(!isMuted)}
          className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-700/80 transition-colors cursor-pointer"
          title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
        </button>
      </div>

      {/* Low-Occlusion HUD Overlay (<15% viewport footprint, pointer-events: none) */}
      {gameState === 'PLAYING' && (
        <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between">
          {/* Top Status Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 bg-slate-950/80 px-4 py-2 rounded-2xl border border-slate-800/90 text-xs font-mono">
              <div className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-slate-400">GIÁP:</span>
                <span className="font-bold tabular-nums text-emerald-300">{shield}%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-slate-400">NĂNG LƯỢNG:</span>
                <span className="font-bold tabular-nums text-cyan-300">{energy}%</span>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-slate-950/80 px-4 py-2 rounded-2xl border border-slate-800/90 text-xs font-mono">
              <div className="flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-slate-400">ĐIỂM SỐ:</span>
                <span className="font-bold tabular-nums text-amber-300">{score}</span>
              </div>
            </div>
          </div>

          {/* Bottom Center Crosshair and Controls Hint */}
          <div className="text-center text-[11px] font-mono text-slate-400 bg-slate-950/70 py-1.5 px-4 rounded-full max-w-sm mx-auto border border-slate-800/70">
            <span>WASD / Phím Mũi Tên: Điều Khiển • SPACE: Bắn Laser • P / ESC: Tạm Dừng</span>
          </div>
        </div>
      )}

      {/* TITLE SCREEN MODAL */}
      {gameState === 'TITLE' && (
        <div className="absolute inset-0 z-30 bg-slate-950/75 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center space-y-6">
          <div className="space-y-3 max-w-md">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-800/80 text-[11px] font-mono text-cyan-300">
              <span>Three.js 3D Simulation • PBR Studio Craft</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white uppercase">
              APEX ORBITAL RECON 3D
            </h1>
            <p className="text-xs text-slate-400 font-sans leading-relaxed">
              Trải nghiệm chiến hạm không gian 3D được lắp ráp thủ công từ 12 chi tiết độc lập. Thu thập Energy Beacons xanh lá và tiêu diệt Drone cảnh giới đỏ.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              onClick={() => setGameState('PLAYING')}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-cyan-500/20 active:scale-95 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>BẮT ĐẦU CHƠI (SPACE / ENTER)</span>
            </button>
          </div>

          <div className="text-[11px] font-mono text-slate-400">
            <span>WASD / Mũi tên: Di chuyển • SPACE: Bắn • P: Tạm dừng</span>
          </div>
        </div>
      )}

      {/* PAUSE MODAL */}
      {gameState === 'PAUSED' && (
        <div className="absolute inset-0 z-30 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center space-y-4">
          <h2 className="text-2xl font-bold text-white tracking-tight">TRÒ CHƠI ĐANG TẠM DỪNG</h2>
          <p className="text-xs text-slate-400 font-mono">Điểm hiện tại: {score}</p>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setGameState('PLAYING')}
              className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs"
            >
              Tiếp tục
            </button>
            <button
              onClick={handleRestart}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs"
            >
              Chơi lại
            </button>
          </div>
        </div>
      )}

      {/* GAME OVER MODAL */}
      {gameState === 'GAMEOVER' && (
        <div className="absolute inset-0 z-30 bg-rose-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div className="p-3 rounded-2xl bg-rose-900/60 border border-rose-700 text-rose-300">
            <Crosshair className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight uppercase">CHIẾN HẠM BỊ PHÁ HỦY</h2>
          <p className="text-xs text-rose-200 font-mono">
            Bạn đã đạt được: <span className="font-bold text-white text-sm">{score}</span> điểm
          </p>
          <div className="pt-2">
            <button
              onClick={handleRestart}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Chơi lại trận mới</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
