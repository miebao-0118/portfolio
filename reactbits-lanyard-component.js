import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Canvas, extend, useFrame, useLoader } from '@react-three/fiber';
import { BallCollider, CuboidCollider, Physics, RigidBody, useRopeJoint, useSphericalJoint } from '@react-three/rapier';
import { MeshLineGeometry, MeshLineMaterial } from 'meshline';

const cardGLB = './card-BP4TWJmK.glb';
const portraitImage = './assets/about-portrait.jpg';
const accent = '#ff8a1f';
const transparentPixel =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

const backFace = `data:image/svg+xml,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1208">
  <rect width="800" height="1208" rx="60" fill="#f2f2ee"/>
  <rect x="50" y="50" width="700" height="1108" rx="46" fill="#111111"/>
  <rect x="82" y="82" width="636" height="1044" rx="34" fill="none" stroke="${accent}" stroke-width="10"/>
  <text x="112" y="540" fill="#f2f2ee" font-family="Inter, Arial, sans-serif" font-size="116" font-weight="800" letter-spacing="-4">ABOUT</text>
  <text x="112" y="660" fill="${accent}" font-family="Inter, Arial, sans-serif" font-size="116" font-weight="800" letter-spacing="-4">ME</text>
  <text x="112" y="812" fill="#8f8f8f" font-family="Inter, Arial, sans-serif" font-size="34" font-weight="500" letter-spacing="4">UI DESIGNER</text>
</svg>
`)}`;

extend({ MeshLineGeometry, MeshLineMaterial });

function Lanyard({
  position = [0, 0, 20],
  gravity = [0, -40, 0],
  fov = 20,
  transparent = true,
  frontImage = null,
  backImage = null,
  imageFit = 'cover',
  lanyardWidth = 1
}) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const [reduceMotion, setReduceMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduceMotion(media.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  return React.createElement(
    'div',
    { className: 'lanyard-wrapper' },
    React.createElement(
      Canvas,
      {
        camera: { position, fov },
        dpr: [1, isMobile ? 1.5 : 2],
        gl: { alpha: transparent },
        onCreated: ({ gl }) => gl.setClearColor(new THREE.Color(0x000000), transparent ? 0 : 1)
      },
      React.createElement('ambientLight', { intensity: Math.PI }),
      React.createElement('directionalLight', { intensity: 4.5, position: [-4, 5, 8] }),
      React.createElement('pointLight', { intensity: 18, position: [-8, 2, 8], color: '#ffffff' }),
      React.createElement('pointLight', { intensity: 9, position: [4, -3, 5], color: accent }),
      React.createElement(
        Physics,
        { gravity, timeStep: isMobile ? 1 / 30 : 1 / 60 },
        React.createElement(Band, {
          isMobile,
          frontImage,
          backImage,
          imageFit,
          lanyardWidth,
          reduceMotion
        })
      )
    )
  );
}

function Band({
  maxSpeed = 50,
  minSpeed = 0,
  isMobile = false,
  frontImage = null,
  backImage = null,
  imageFit = 'cover',
  lanyardWidth = 1,
  reduceMotion = false
}) {
  const band = useRef();
  const connector = useRef();
  const fixed = useRef();
  const j1 = useRef();
  const j2 = useRef();
  const j3 = useRef();
  const card = useRef();
  const vec = new THREE.Vector3();
  const ang = new THREE.Vector3();
  const rot = new THREE.Vector3();
  const dir = new THREE.Vector3();

  const segmentProps = {
    type: 'dynamic',
    canSleep: true,
    colliders: false,
    angularDamping: 4,
    linearDamping: 4
  };

  const gltf = useLoader(GLTFLoader, cardGLB);
  const frontTexture = useLoader(THREE.TextureLoader, frontImage || transparentPixel);
  const backTexture = useLoader(THREE.TextureLoader, backImage || transparentPixel);

  const { nodes, materials } = useMemo(() => {
    const foundNodes = {};
    const foundMaterials = {};

    gltf.scene.traverse(object => {
      if (!object.isMesh) return;
      foundNodes[object.name] = object;
      if (object.material) {
        foundMaterials[object.material.name] = object.material;
      }
    });

    return {
      nodes: foundNodes,
      materials: foundMaterials
    };
	  }, [gltf]);

  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1920;
    canvas.height = 250;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = accent;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = 'rgba(17, 17, 17, 0.18)';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(0, 38);
    ctx.lineTo(canvas.width, 38);
    ctx.moveTo(0, 212);
    ctx.lineTo(canvas.width, 212);
    ctx.stroke();

    ctx.fillStyle = '#111111';
    ctx.font = '800 76px Inter, Arial, sans-serif';
    ctx.letterSpacing = '6px';
    ctx.textBaseline = 'middle';
    ['ABOUT ME', 'ABOUT ME'].forEach((text, index) => {
      ctx.fillText(text, 260 + index * 840, 132);
    });

    const map = new THREE.CanvasTexture(canvas);
    map.colorSpace = THREE.SRGBColorSpace;
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.anisotropy = 16;
    map.needsUpdate = true;
    return map;
  }, []);

  const metalMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#d8d1c8',
    metalness: 1,
    roughness: 0.24
  }), []);

  const cardMap = useMemo(() => {
    const baseMap = materials.base.map;
    if (!frontImage && !backImage) return baseMap;

    const source = baseMap.image;
    const width = source.width;
    const height = source.height;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return baseMap;

    ctx.drawImage(source, 0, 0, width, height);

    const drawFace = (image, region, options = {}) => {
      const inset = options.inset ?? 0;
      const faceX = region.x * width;
      const faceY = region.y * height;
      const faceW = region.w * width;
      const faceH = region.h * height;
      const targetX = faceX + faceW * inset;
      const targetY = faceY + faceH * inset;
      const targetW = faceW * (1 - inset * 2);
      const targetH = faceH * (1 - inset * 2);
      const ratio = (imageFit === 'contain' ? Math.min : Math.max)(targetW / image.width, targetH / image.height);
      const drawW = image.width * ratio;
      const drawH = image.height * ratio;
      const drawX = targetX + (targetW - drawW) / 2;
      const drawY = targetY + (targetH - drawH) / 2;

      if (options.border) {
        ctx.save();
        ctx.fillStyle = options.border;
        ctx.fillRect(faceX, faceY, faceW, faceH);
        ctx.restore();
      }

      ctx.save();
      ctx.beginPath();
      ctx.rect(targetX, targetY, targetW, targetH);
      ctx.clip();
      ctx.drawImage(image, drawX, drawY, drawW, drawH);
      ctx.restore();
    };

    if (frontImage && frontTexture.image) {
      drawFace(frontTexture.image, { x: 0, y: 0, w: 0.5, h: 0.755 }, { inset: 0.055, border: '#f2f2ee' });
    }
    if (backImage && backTexture.image) {
      drawFace(backTexture.image, { x: 0.5, y: 0, w: 0.5, h: 0.757 }, { inset: 0 });
    }

    const map = new THREE.CanvasTexture(canvas);
    map.colorSpace = THREE.SRGBColorSpace;
    map.flipY = baseMap.flipY;
    map.anisotropy = 16;
    map.needsUpdate = true;
    return map;
  }, [frontImage, backImage, imageFit, frontTexture, backTexture, materials.base.map]);

  const [curve] = useState(() => new THREE.CatmullRomCurve3([new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()]));
  const [connectorCurve] = useState(() => new THREE.CatmullRomCurve3([new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()]));
  const [dragged, drag] = useState(false);
  const [hovered, hover] = useState(false);

  useRopeJoint(fixed, j1, [[0, 0, 0], [0, 0, 0], 1]);
  useRopeJoint(j1, j2, [[0, 0, 0], [0, 0, 0], 1]);
  useRopeJoint(j2, j3, [[0, 0, 0], [0, 0, 0], 1]);
  useSphericalJoint(j3, card, [
    [0, 0, 0],
    [0, 1.5, 0]
  ]);

  useEffect(() => {
    if (!hovered) return undefined;
    document.body.style.cursor = dragged ? 'grabbing' : 'grab';
    return () => {
      document.body.style.cursor = 'auto';
    };
  }, [hovered, dragged]);

  useFrame((state, delta) => {
    if (dragged) {
      vec.set(state.pointer.x, state.pointer.y, 0.5).unproject(state.camera);
      dir.copy(vec).sub(state.camera.position).normalize();
      vec.add(dir.multiplyScalar(state.camera.position.length()));
      [card, j1, j2, j3, fixed].forEach(ref => ref.current?.wakeUp());
      card.current?.setNextKinematicTranslation({
        x: vec.x - dragged.x,
        y: vec.y - dragged.y,
        z: vec.z - dragged.z
      });
    }

    if (fixed.current) {
      [j1, j2].forEach(ref => {
        if (!ref.current.lerped) {
          ref.current.lerped = new THREE.Vector3().copy(ref.current.translation());
        }
        const distance = Math.max(0.1, Math.min(1, ref.current.lerped.distanceTo(ref.current.translation())));
        ref.current.lerped.lerp(ref.current.translation(), delta * (minSpeed + distance * (maxSpeed - minSpeed)));
      });

      const strapEnd = new THREE.Vector3().copy(j3.current.translation());
      strapEnd.y += 0.5;
      strapEnd.z -= 0.54;
      const connectorEnd = new THREE.Vector3().copy(j3.current.translation());
      connectorEnd.y += 0.45;
      connectorEnd.z -= 0.62;

      curve.points[0].copy(strapEnd);
      curve.points[1].copy(j2.current.lerped);
      curve.points[1].z -= 0.54;
      curve.points[2].copy(j1.current.lerped);
      curve.points[2].z -= 0.54;
      curve.points[3].copy(fixed.current.translation());
      curve.points[3].z -= 0.54;
      band.current.geometry.setPoints(curve.getPoints(isMobile ? 16 : 32));

      connectorCurve.points[0].copy(connectorEnd);
      connectorCurve.points[1].copy(connectorEnd).lerp(strapEnd, 0.36);
      connectorCurve.points[2].copy(connectorEnd).lerp(strapEnd, 0.72);
      connectorCurve.points[3].copy(strapEnd);
      connector.current.geometry.setPoints(connectorCurve.getPoints(6));

      ang.copy(card.current.angvel());
      rot.copy(card.current.rotation());
      const t = state.clock.elapsedTime;
      const idle = !dragged && !reduceMotion
        ? {
            x: Math.sin(t * 0.72) * 0.045 + Math.sin(t * 0.31 + 1.4) * 0.025,
            y: Math.cos(t * 0.53 + 0.8) * 0.06,
            z: Math.sin(t * 0.61 + 2.1) * 0.04
          }
        : { x: 0, y: 0, z: 0 };

      card.current.setAngvel({
        x: ang.x * 0.94 + idle.x,
        y: ang.y * 0.94 - rot.y * 0.25 + idle.y,
        z: ang.z * 0.94 + idle.z
      }, true);
    }
  });

  curve.curveType = 'chordal';
  return React.createElement(
    React.Fragment,
    null,
    React.createElement(
      'group',
      { position: [0, 4.15, 0] },
      React.createElement(RigidBody, { ref: fixed, ...segmentProps, type: 'fixed' }),
      React.createElement(RigidBody, { position: [0.5, 0, 0], ref: j1, ...segmentProps }, React.createElement(BallCollider, { args: [0.1] })),
      React.createElement(RigidBody, { position: [1, 0, 0], ref: j2, ...segmentProps }, React.createElement(BallCollider, { args: [0.1] })),
      React.createElement(RigidBody, { position: [1.5, 0, 0], ref: j3, ...segmentProps }, React.createElement(BallCollider, { args: [0.1] })),
      React.createElement(
        RigidBody,
        { position: [2, 0, 0], ref: card, ...segmentProps, type: dragged ? 'kinematicPosition' : 'dynamic' },
        React.createElement(CuboidCollider, { args: [0.8, 1.125, 0.01] }),
        React.createElement(
          'group',
          {
            scale: 2.62,
            position: [0, -1.12, -0.05],
            onPointerOver: () => hover(true),
            onPointerOut: () => hover(false),
            onPointerUp: e => {
              e.target.releasePointerCapture(e.pointerId);
              drag(false);
            },
            onPointerDown: e => {
              e.target.setPointerCapture(e.pointerId);
              drag(new THREE.Vector3().copy(e.point).sub(vec.copy(card.current.translation())));
            }
          },
          React.createElement(
            'mesh',
            { geometry: nodes.card.geometry },
            React.createElement('meshPhysicalMaterial', {
              map: cardMap,
              'map-anisotropy': 16,
              clearcoat: isMobile ? 0 : 1,
              clearcoatRoughness: 0.15,
              roughness: 0.9,
              metalness: 0.8
            })
          ),
          React.createElement('mesh', { geometry: nodes.clip.geometry, material: metalMaterial }),
          React.createElement('mesh', { geometry: nodes.clamp.geometry, material: metalMaterial })
        )
      )
    ),
    React.createElement(
      'mesh',
      { ref: band, position: [0, 0, -0.28] },
      React.createElement('meshLineGeometry', null),
      React.createElement('meshLineMaterial', {
        color: 'white',
        depthTest: true,
        resolution: isMobile ? [1000, 2000] : [1000, 1000],
        useMap: true,
        map: texture,
        repeat: [-1, 1],
        lineWidth: lanyardWidth
      })
    ),
    React.createElement(
      'mesh',
      { ref: connector, position: [0, 0, -0.42] },
      React.createElement('meshLineGeometry', null),
      React.createElement('meshLineMaterial', {
        color: accent,
        depthTest: true,
        depthWrite: false,
        resolution: isMobile ? [1000, 2000] : [1000, 1000],
        lineWidth: lanyardWidth * 0.54
      })
    )
  );
}

const rootNode = document.getElementById('reactbits-lanyard-root');
if (rootNode) {
  createRoot(rootNode).render(
    React.createElement(Lanyard, {
      position: [0, 0, 18.5],
      gravity: [0, -34, 0],
      frontImage: portraitImage,
      backImage: backFace,
      lanyardWidth: 1.08
    })
  );
}
