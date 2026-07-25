'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export interface VideoOutfit {
  id: string;
  name: string;
  category: string;
  videoUrl: string;
  posterImage: string;
  tag: string;
  price: number;
  craftHighlights: string[];
  gradientBg: string;
}

const REAL_MODEL_VIDEOS: VideoOutfit[] = [
  {
    id: 'nh-09',
    name: 'NH09 Kathiawadi 360° Twirl',
    category: 'Authentic Mirror Work & 7m Flare',
    videoUrl: '/videos/NH09.mp4',
    posterImage: '/images/NH09.png',
    tag: 'Navratri Kathiawadi',
    price: 8499,
    craftHighlights: ['✨ 7.0 Meter Double-Layer Flare', '🪞 Authentic Kathiawadi Mirror Work', '🧵 Premium Handloom Gamthi Border'],
    gradientBg: 'radial-gradient(circle at 65% 50%, rgba(55, 20, 35, 0.95) 0%, rgba(18, 6, 28, 0.98) 60%, rgba(6, 2, 12, 1) 100%)',
  },
  {
    id: 'nh-12',
    name: 'NH12 Peacock Blue Chikankari',
    category: 'Lucknowi Chikankari & Sequin',
    videoUrl: '/videos/NH12.mp4',
    posterImage: '/images/NH121.jpg',
    tag: 'Chikankari 360°',
    price: 12999,
    craftHighlights: ['🥻 Lucknowi Chikankari Threadwork', '✨ Sparkly Sequin Embellishments', '👑 Royal Peacock Blue Faux Georgette'],
    gradientBg: 'radial-gradient(circle at 65% 50%, rgba(12, 45, 60, 0.95) 0%, rgba(6, 20, 32, 0.98) 60%, rgba(4, 10, 20, 1) 100%)',
  },
  {
    id: 'nh-16',
    name: 'NH16 Crimson Zardosi Silk',
    category: 'Raw Silk & Gold Zari Handwork',
    videoUrl: '/videos/NH16.mp4',
    posterImage: '/images/NH16.jpg',
    tag: 'Bridal Zardosi',
    price: 16499,
    craftHighlights: ['🧵 Handcrafted Zardozi Motif', '🔴 Pure Crimson Banarasi Raw Silk', '✨ Micro-Pearl & Gold Zari Edging'],
    gradientBg: 'radial-gradient(circle at 65% 50%, rgba(65, 12, 22, 0.95) 0%, rgba(25, 4, 12, 0.98) 60%, rgba(8, 2, 8, 1) 100%)',
  },
  {
    id: 'nh-17',
    name: 'NH17 Luxury Velvet Gota-Patti',
    category: 'Micro Velvet & Rajasthani Gota',
    videoUrl: '/videos/NH17-final-video.mp4',
    posterImage: '/images/NH175.jpg',
    tag: 'Velvet Gota-Patti',
    price: 10999,
    craftHighlights: ['👑 Premium Micro Velvet 9000', '🌟 Traditional Rajasthani Gota-Patti', '✨ Double Can-Can Extra Flare'],
    gradientBg: 'radial-gradient(circle at 65% 50%, rgba(48, 14, 38, 0.95) 0%, rgba(20, 5, 20, 0.98) 60%, rgba(7, 2, 10, 1) 100%)',
  },
];

export const Hero3DCanvas: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const particleCanvasRef = useRef<HTMLDivElement>(null);
  
  // Interactive UI State
  const [selectedVideoIndex, setSelectedVideoIndex] = useState<number>(0);
  const [isPlaying] = useState<boolean>(true);
  const [autoCycle] = useState<boolean>(true);
  const [videoOpacity, setVideoOpacity] = useState<number>(1);

  // Auto Cycle Handler when video finishes or timer elapses
  const handleVideoEnded = () => {
    if (!autoCycle) return;
    triggerNextOutfit();
  };

  // Ultra-Smooth Slow Cross-Fade Transition (800ms Fade-Out -> Source Switch -> 1.2s Fade-In)
  const triggerNextOutfit = () => {
    setVideoOpacity(0);
    setTimeout(() => {
      setSelectedVideoIndex((prevIndex) => (prevIndex + 1) % REAL_MODEL_VIDEOS.length);
      setTimeout(() => {
        setVideoOpacity(1);
      }, 100);
    }, 850);
  };

  // Auto change timer (cycles every 9.5 seconds for complete relaxed 360° showcase)
  useEffect(() => {
    if (!autoCycle || !isPlaying) return;
    const interval = setInterval(() => {
      triggerNextOutfit();
    }, 9500);

    return () => clearInterval(interval);
  }, [autoCycle, isPlaying, selectedVideoIndex]);

  // THREE.JS PARTICLES & CURSOR SPARKLE TRAIL
  useEffect(() => {
    if (!particleCanvasRef.current) return;
    const container = particleCanvasRef.current;

    const scene = new THREE.Scene();
    const width = container.clientWidth;
    const height = container.clientHeight;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 1. AMBIENT BACKGROUND PARTICLES
    const particleCount = 200;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 12;
      particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 9;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 6;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

    const pCanvas = document.createElement('canvas');
    pCanvas.width = 64;
    pCanvas.height = 64;
    const pCtx = pCanvas.getContext('2d');
    if (pCtx) {
      const pGrad = pCtx.createRadialGradient(32, 32, 0, 32, 32, 32);
      pGrad.addColorStop(0, 'rgba(255, 235, 160, 1)');
      pGrad.addColorStop(0.35, 'rgba(212, 175, 55, 0.85)');
      pGrad.addColorStop(1, 'rgba(125, 31, 26, 0)');
      pCtx.fillStyle = pGrad;
      pCtx.fillRect(0, 0, 64, 64);
    }
    const pTexture = new THREE.CanvasTexture(pCanvas);

    const particleMat = new THREE.PointsMaterial({
      size: 0.18,
      map: pTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.85,
    });

    const particleSystem = new THREE.Points(particleGeo, particleMat);
    scene.add(particleSystem);

    // 2. INTERACTIVE CURSOR SPARKLE TRAIL
    const trailMax = 60;
    const trailGeo = new THREE.BufferGeometry();
    const trailPositions = new Float32Array(trailMax * 3);
    const trailVelocities: { x: number; y: number; z: number; life: number }[] = [];

    for (let i = 0; i < trailMax; i++) {
      trailPositions[i * 3] = 999;
      trailPositions[i * 3 + 1] = 999;
      trailPositions[i * 3 + 2] = 999;
      trailVelocities.push({ x: 0, y: 0, z: 0, life: 0 });
    }

    trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));

    const trailMat = new THREE.PointsMaterial({
      size: 0.22,
      map: pTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.9,
    });

    const trailSystem = new THREE.Points(trailGeo, trailMat);
    scene.add(trailSystem);

    let trailPointer = 0;
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      const vector = new THREE.Vector3(x, y, 0.5);
      vector.unproject(camera);
      const dir = vector.sub(camera.position).normalize();
      const distance = -camera.position.z / dir.z;
      const pos = camera.position.clone().add(dir.multiplyScalar(distance));

      const idx = trailPointer;
      trailPositions[idx * 3] = pos.x;
      trailPositions[idx * 3 + 1] = pos.y;
      trailPositions[idx * 3 + 2] = pos.z;
      trailVelocities[idx] = {
        x: (Math.random() - 0.5) * 0.012,
        y: (Math.random() - 0.5) * 0.012 + 0.005,
        z: (Math.random() - 0.5) * 0.005,
        life: 1.0,
      };

      trailPointer = (trailPointer + 1) % trailMax;
    };

    window.addEventListener('mousemove', handleMouseMove);

    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      const elapsed = clock.getElapsedTime();

      // Ambient system rotation
      particleSystem.rotation.y += 0.0012;
      particleSystem.rotation.x = Math.sin(elapsed * 0.4) * 0.03;

      // Update cursor trail positions
      const posAttr = trailGeo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < trailMax; i++) {
        if (trailVelocities[i].life > 0) {
          trailVelocities[i].life -= 0.03;
          posAttr.setX(i, posAttr.getX(i) + trailVelocities[i].x);
          posAttr.setY(i, posAttr.getY(i) + trailVelocities[i].y);
          posAttr.setZ(i, posAttr.getZ(i) + trailVelocities[i].z);
        }
      }
      posAttr.needsUpdate = true;

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    const handleResize = () => {
      if (!particleCanvasRef.current) return;
      const w = particleCanvasRef.current.clientWidth;
      const h = particleCanvasRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  const activeVideo = REAL_MODEL_VIDEOS[selectedVideoIndex];

  return (
    <div className="hero-3d-full-background" style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'auto' }}>
      {/* 1. DYNAMIC THEME AMBIENT GLOW PER OUTFIT (ULTRA-SMOOTH 1.8s TRANSITION) */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: activeVideo.gradientBg,
        transition: 'background 1.8s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: 0,
      }} />

      {/* 2. FULL UNCUT 360 MODEL VIDEO (100% VISIBILITY FROM HEAD TO TOE, ULTRA-SMOOTH 1.2s CROSS-FADE) */}
      <div style={{
        position: 'absolute',
        top: 0,
        right: '4%',
        width: '55vw',
        maxWidth: '720px',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1,
      }}>
        <video
          ref={videoRef}
          key={activeVideo.id}
          src={activeVideo.videoUrl}
          poster={activeVideo.posterImage}
          autoPlay
          muted
          playsInline
          onEnded={handleVideoEnded}
          style={{
            maxHeight: '92%',
            maxWidth: '100%',
            width: 'auto',
            height: 'auto',
            objectFit: 'contain', // 100% FULL VISIBILITY FROM HEAD TO TOE!
            opacity: videoOpacity,
            transition: 'opacity 1.2s cubic-bezier(0.4, 0, 0.2, 1), filter 1.2s ease',
            filter: 'drop-shadow(0 15px 35px rgba(0,0,0,0.8)) brightness(0.96) contrast(1.04)',
            maskImage: 'radial-gradient(ellipse at center, black 75%, transparent 100%)',
            WebkitMaskImage: 'radial-gradient(ellipse at center, black 75%, transparent 100%)',
          }}
        />
      </div>

      {/* 3. SHARPLINK-STYLE CRISP TEXT GRADIENT OVERLAY ON LEFT */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(90deg, rgba(9, 5, 17, 0.95) 0%, rgba(9, 5, 17, 0.82) 42%, rgba(9, 5, 17, 0.2) 75%, transparent 100%)',
        zIndex: 2,
        pointerEvents: 'none',
      }} />

      {/* 4. THREE.JS FLOATING 3D SPARKLE & CURSOR TRAIL CANVAS */}
      <div
        ref={particleCanvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 3,
          pointerEvents: 'none',
        }}
      />
    </div>
  );
};
