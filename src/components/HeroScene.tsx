import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface HeroSceneProps {
  className?: string;
}

export const HeroScene: React.FC<HeroSceneProps> = ({ className = '' }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [hasWebGL, setHasWebGL] = useState(true);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Check WebGL availability
    try {
      const testCanvas = document.createElement('canvas');
      const gl = testCanvas.getContext('webgl2') || testCanvas.getContext('webgl');
      if (!gl) {
        setHasWebGL(false);
        return;
      }
    } catch {
      setHasWebGL(false);
      return;
    }

    let animationFrameId: number;
    let width = container.clientWidth || window.innerWidth;
    let height = container.clientHeight || 700;

    // Three.js Scene Setup
    const scene = new THREE.Scene();

    // Camera
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 0.25, 5.4);

    // Renderer
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch {
      setHasWebGL(false);
      return;
    }

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.appendChild(renderer.domElement);

    // ==========================================
    // LIGHTING SYSTEM (Metallic Gold & Deep Navy)
    // ==========================================
    const ambientLight = new THREE.AmbientLight(0x0a101d, 2.2);
    scene.add(ambientLight);

    // Key Light - Warm Champagne Gold Highlight
    const keyLight = new THREE.DirectionalLight(0xF3D27A, 4.2);
    keyLight.position.set(3.5, 4.5, 5.0);
    scene.add(keyLight);

    // Fill Light - Subtle Metallic Gold
    const fillLight = new THREE.DirectionalLight(0xC9A45C, 2.4);
    fillLight.position.set(-4.0, -2.0, 3.0);
    scene.add(fillLight);

    // Rim/Back Light - Specular Edge Light
    const rimLight = new THREE.DirectionalLight(0xD4AF37, 3.0);
    rimLight.position.set(0.0, 3.0, -4.0);
    scene.add(rimLight);

    // Point Light for Emblem Core Glint
    const corePointLight = new THREE.PointLight(0xF3D27A, 1.8, 8);
    corePointLight.position.set(0, 0.35, 1.8);
    scene.add(corePointLight);

    // Master Group for All Interactive 3D Elements
    const masterGroup = new THREE.Group();
    masterGroup.position.set(0, 0.3, 0);
    scene.add(masterGroup);

    // ==========================================================
    // 1. PREMIUM BRANIFY 3D CENTERPIECE (Black Glass + Metal B)
    // ==========================================================
    const emblemGroup = new THREE.Group();
    masterGroup.add(emblemGroup);

    // A. Obsidian Glass Beveled Plaque
    const plateWidth = 1.38;
    const plateHeight = 1.68;
    const plateRadius = 0.24;
    const plateShape = new THREE.Shape();
    plateShape.moveTo(-plateWidth / 2 + plateRadius, -plateHeight / 2);
    plateShape.lineTo(plateWidth / 2 - plateRadius, -plateHeight / 2);
    plateShape.quadraticCurveTo(plateWidth / 2, -plateHeight / 2, plateWidth / 2, -plateHeight / 2 + plateRadius);
    plateShape.lineTo(plateWidth / 2, plateHeight / 2 - plateRadius);
    plateShape.quadraticCurveTo(plateWidth / 2, plateHeight / 2, plateWidth / 2 - plateRadius, plateHeight / 2);
    plateShape.lineTo(-plateWidth / 2 + plateRadius, plateHeight / 2);
    plateShape.quadraticCurveTo(-plateWidth / 2, plateHeight / 2, -plateWidth / 2, plateHeight / 2 - plateRadius);
    plateShape.lineTo(-plateWidth / 2, -plateHeight / 2 + plateRadius);
    plateShape.quadraticCurveTo(-plateWidth / 2, -plateHeight / 2, -plateWidth / 2 + plateRadius, -plateHeight / 2);

    const plateGeo = new THREE.ExtrudeGeometry(plateShape, {
      depth: 0.09,
      bevelEnabled: true,
      bevelThickness: 0.025,
      bevelSize: 0.02,
      bevelSegments: 4,
    });
    plateGeo.center();

    // Black Smoked Glass Material with High Specular Sheen
    const plateMat = new THREE.MeshPhysicalMaterial({
      color: 0x05070B,
      metalness: 0.15,
      roughness: 0.12,
      transmission: 0.75,
      thickness: 0.6,
      ior: 1.54,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      reflectivity: 0.95,
      transparent: true,
      opacity: 0.94,
    });
    const plateMesh = new THREE.Mesh(plateGeo, plateMat);
    emblemGroup.add(plateMesh);

    // B. Champagne Gold Bezel Edge Framing the Plaque
    const frameGeo = new THREE.BoxGeometry(plateWidth + 0.06, plateHeight + 0.06, 0.02);
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0xC9A45C,
      metalness: 0.95,
      roughness: 0.28,
    });
    const frameMesh = new THREE.Mesh(frameGeo, frameMat);
    frameMesh.position.z = -0.055;
    emblemGroup.add(frameMesh);

    // C. 3D Extruded Brushed Gold BRANIFY "B" Monogram
    const bShape = new THREE.Shape();
    const bLeft = -0.32;
    const bRight = 0.32;
    const bTop = 0.46;
    const bBottom = -0.46;
    const bMidY = 0.02;

    // Outer contour of 'B'
    bShape.moveTo(bLeft, bBottom);
    bShape.lineTo(bLeft, bTop);
    bShape.lineTo(0.04, bTop);
    bShape.bezierCurveTo(bRight, bTop, bRight, bMidY, 0.05, bMidY);
    bShape.bezierCurveTo(bRight + 0.04, bMidY, bRight + 0.04, bBottom, 0.04, bBottom);
    bShape.lineTo(bLeft, bBottom);

    // Top cutout hole of 'B'
    const topHole = new THREE.Path();
    topHole.moveTo(-0.13, bMidY + 0.08);
    topHole.lineTo(-0.13, bTop - 0.10);
    topHole.lineTo(0.04, bTop - 0.10);
    topHole.bezierCurveTo(0.18, bTop - 0.10, 0.18, bMidY + 0.08, 0.04, bMidY + 0.08);
    topHole.lineTo(-0.13, bMidY + 0.08);
    bShape.holes.push(topHole);

    // Bottom cutout hole of 'B'
    const bottomHole = new THREE.Path();
    bottomHole.moveTo(-0.13, bBottom + 0.10);
    bottomHole.lineTo(-0.13, bMidY - 0.06);
    bottomHole.lineTo(0.05, bMidY - 0.06);
    bottomHole.bezierCurveTo(0.20, bMidY - 0.06, 0.20, bBottom + 0.10, 0.05, bBottom + 0.10);
    bottomHole.lineTo(-0.13, bBottom + 0.10);
    bShape.holes.push(bottomHole);

    const bGeometry = new THREE.ExtrudeGeometry(bShape, {
      depth: 0.12,
      bevelEnabled: true,
      bevelThickness: 0.025,
      bevelSize: 0.02,
      bevelSegments: 4,
    });
    bGeometry.center();

    // Metallic Champagne Gold Material
    const bMaterial = new THREE.MeshStandardMaterial({
      color: 0xF3D27A, // Champagne Gold
      metalness: 0.94,
      roughness: 0.20,
      emissive: 0x241a06,
      emissiveIntensity: 0.25,
    });
    const bMesh = new THREE.Mesh(bGeometry, bMaterial);
    bMesh.position.z = 0.085;
    emblemGroup.add(bMesh);

    // D. Delicate Orbital Gimbal Rings (Luxury Horology & Technology)
    const ring1Geo = new THREE.TorusGeometry(1.68, 0.009, 16, 120);
    const ring1Mat = new THREE.MeshStandardMaterial({
      color: 0xD4AF37,
      metalness: 0.96,
      roughness: 0.25,
      transparent: true,
      opacity: 0.85,
    });
    const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
    ring1.rotation.x = Math.PI * 0.38;
    ring1.rotation.y = Math.PI * 0.15;
    masterGroup.add(ring1);

    const ring2Geo = new THREE.TorusGeometry(1.92, 0.006, 16, 120);
    const ring2Mat = new THREE.MeshStandardMaterial({
      color: 0xC9A45C,
      metalness: 0.95,
      roughness: 0.35,
      transparent: true,
      opacity: 0.55,
    });
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2.rotation.x = -Math.PI * 0.32;
    ring2.rotation.y = -Math.PI * 0.22;
    masterGroup.add(ring2);

    // ==========================================================
    // 2. CELESTIAL PARTICLE DOME (Refined Metallic Gold Palette)
    // ==========================================================
    const particleCount = 2200;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const originalPositions = new Float32Array(particleCount * 3);

    // Strictly Metallic Gold + Deep Celestial Navy Palette
    const goldPalette = [
      new THREE.Color('#C9A45C'), // Premium metallic gold
      new THREE.Color('#D4AF37'), // Classical studio gold
      new THREE.Color('#F3D27A'), // Radiant champagne gold highlight
      new THREE.Color('#E6C687'), // Pale gold shimmer
      new THREE.Color('#A88438'), // Deep antique gold
      new THREE.Color('#FFF5DC'), // Platinum gold pearl
      new THREE.Color('#1B263B'), // Deep cosmic navy spark
    ];

    const domeRadius = 2.15;

    for (let i = 0; i < particleCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(1.0 - v * 1.05);

      const rOffset = (Math.random() - 0.5) * 0.22;
      const currentRadius = domeRadius + rOffset;

      const x = currentRadius * Math.sin(phi) * Math.cos(theta);
      const y = currentRadius * Math.cos(phi) - 0.2;
      const z = currentRadius * Math.sin(phi) * Math.sin(theta) * 0.9;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      originalPositions[i * 3] = x;
      originalPositions[i * 3 + 1] = y;
      originalPositions[i * 3 + 2] = z;

      const chosenColor = goldPalette[Math.floor(Math.random() * goldPalette.length)];
      const heightFactor = Math.max(0, Math.min(1, (y + 0.2) / 1.6));
      const finalColor = chosenColor.clone().lerp(new THREE.Color('#F3D27A'), (1.0 - heightFactor) * 0.6);

      colors[i * 3] = finalColor.r;
      colors[i * 3 + 1] = finalColor.g;
      colors[i * 3 + 2] = finalColor.b;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Particle Texture with Subtle Gold Radial Falloff (No Orange Halo)
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
      grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
      grad.addColorStop(0.35, 'rgba(243, 210, 122, 0.85)'); // #F3D27A
      grad.addColorStop(0.7, 'rgba(201, 164, 92, 0.3)');   // #C9A45C
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 32, 32);
    }
    const particleTexture = new THREE.CanvasTexture(canvas);

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.05,
      map: particleTexture,
      transparent: true,
      opacity: 0.82,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particleSystem = new THREE.Points(particleGeo, particleMaterial);
    masterGroup.add(particleSystem);

    // ==========================================================
    // 3. FLOATING AMBIENT STARDUST
    // ==========================================================
    const stardustCount = 280;
    const stardustGeo = new THREE.BufferGeometry();
    const stardustPos = new Float32Array(stardustCount * 3);
    for (let s = 0; s < stardustCount; s++) {
      stardustPos[s * 3] = (Math.random() - 0.5) * 8.5;
      stardustPos[s * 3 + 1] = (Math.random() - 0.25) * 3.5;
      stardustPos[s * 3 + 2] = (Math.random() - 0.5) * 4.5;
    }
    stardustGeo.setAttribute('position', new THREE.BufferAttribute(stardustPos, 3));
    const stardustMat = new THREE.PointsMaterial({
      size: 0.028,
      color: 0xF3D27A,
      transparent: true,
      opacity: 0.32,
      blending: THREE.AdditiveBlending,
    });
    const stardust = new THREE.Points(stardustGeo, stardustMat);
    scene.add(stardust);

    // ==========================================================
    // MOUSE TRACKING & RESIZE
    // ==========================================================
    let targetMouseX = 0;
    let targetMouseY = 0;
    let currentMouseX = 0;
    let currentMouseY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      targetMouseX = (e.clientX / innerWidth - 0.5) * 2;
      targetMouseY = -(e.clientY / innerHeight - 0.5) * 2;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    const handleResize = () => {
      if (!container || !renderer) return;
      width = container.clientWidth;
      height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    // ==========================================================
    // ANIMATION LOOP
    // ==========================================================
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Smooth Parallax Interpolation
      currentMouseX += (targetMouseX - currentMouseX) * 0.045;
      currentMouseY += (targetMouseY - currentMouseY) * 0.045;

      // Camera Perspective Tilt
      camera.position.x = currentMouseX * 0.35;
      camera.position.y = 0.25 + currentMouseY * 0.22;
      camera.lookAt(0, 0.3, 0);

      // 3D Emblem Elegant Floating & Tilting
      const floatOffset = Math.sin(elapsed * 1.2) * 0.04;
      emblemGroup.position.y = floatOffset;
      emblemGroup.rotation.y = Math.sin(elapsed * 0.4) * 0.08 + currentMouseX * 0.28;
      emblemGroup.rotation.x = Math.cos(elapsed * 0.35) * 0.04 - currentMouseY * 0.22;

      // Orbital Rings Rotation
      ring1.rotation.z = elapsed * 0.12;
      ring2.rotation.z = -elapsed * 0.08;

      // Master Particle Dome Rotation
      particleSystem.rotation.y = elapsed * 0.05 + currentMouseX * 0.1;

      // Subtle Breathing Ripple on the Particle Dome
      const posAttr = particleGeo.getAttribute('position') as THREE.BufferAttribute;
      const posArray = posAttr.array as Float32Array;

      for (let p = 0; p < particleCount; p += 3) {
        const ox = originalPositions[p * 3];
        const oy = originalPositions[p * 3 + 1];
        const oz = originalPositions[p * 3 + 2];
        const wave = Math.sin(elapsed * 1.4 + ox * 2.5 + oy * 1.8) * 0.018;
        posArray[p * 3] = ox * (1 + wave);
        posArray[p * 3 + 1] = oy * (1 + wave);
        posArray[p * 3 + 2] = oz * (1 + wave);
      }
      posAttr.needsUpdate = true;

      // Stardust Drift
      stardust.rotation.y = elapsed * 0.015;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (renderer && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
        renderer.dispose();
      }
      plateGeo.dispose();
      plateMat.dispose();
      frameGeo.dispose();
      frameMat.dispose();
      bGeometry.dispose();
      bMaterial.dispose();
      ring1Geo.dispose();
      ring1Mat.dispose();
      ring2Geo.dispose();
      ring2Mat.dispose();
      particleGeo.dispose();
      particleMaterial.dispose();
      particleTexture.dispose();
      stardustGeo.dispose();
      stardustMat.dispose();
    };
  }, []);

  if (!hasWebGL) {
    return (
      <div className={`w-full h-full flex items-center justify-center ${className}`}>
        <div className="w-48 h-56 rounded-2xl border border-[#D4AF37]/30 bg-[#08090D]/90 backdrop-blur-xl flex items-center justify-center shadow-[0_0_30px_rgba(212,175,55,0.25)]">
          <span className="font-display text-4xl font-extrabold text-[#D4AF37]">B</span>
        </div>
      </div>
    );
  }

  return <div ref={mountRef} className={`w-full h-full ${className}`} />;
};
