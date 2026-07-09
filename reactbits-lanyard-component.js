import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import * as THREE from 'three';
import { Canvas, extend, useFrame } from '@react-three/fiber';
import { Environment, Lightformer, useGLTF, useTexture } from '@react-three/drei';
import { BallCollider, CuboidCollider, Physics, RigidBody, useRopeJoint, useSphericalJoint } from '@react-three/rapier';
import { MeshLineGeometry, MeshLineMaterial } from 'meshline';

const cardGLB = './card-BP4TWJmK.glb';
const defaultLanyardImage = './lanyard-BQfo1yFS.png';
const portraitImage = './assets/about-portrait.jpg';
const accent = '#ff8a1f';
const blankPixel =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

const frontUvRect = { x: 0, y: 0, w: 0.5, h: 0.755 };
const backUvRect = { x: 0.5, y: 0, w: 0.5, h: 0.757 };

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

function createOrangeLanyardDataUrl() {
  if (typeof document === 'undefined') return defaultLanyardImage;

  const canvas = document.createElement('canvas');
  canvas.width = 1920;
  canvas.height = 250;
  const ctx = canvas.getContext('2d');
  if (!ctx) return defaultLanyardImage;

  ctx.fillStyle = accent;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = 'rgba(17, 17, 17, 0.2)';
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(0, 36);
  ctx.lineTo(canvas.width, 36);
  ctx.moveTo(0, 214);
  ctx.lineTo(canvas.width, 214);
  ctx.stroke();

  ctx.fillStyle = '#111111';
  ctx.font = '800 72px Inter, Arial, sans-serif';
  ctx.textBaseline = 'middle';
  ['ABOUT ME', 'ABOUT ME'].forEach((text, index) => {
    ctx.fillText(text, 260 + index * 840, 128);
  });

  return canvas.toDataURL('image/png');
}

function Lanyard({
  position = [0, 0, 30],
  gravity = [0, -40, 0],
  fov = 20,
  transparent = true,
  frontImage = null,
  backImage = null,
  imageFit = 'cover',
  lanyardImage = null,
  lanyardWidth = 1
}) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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
      React.createElement(
        Physics,
        { gravity, timeStep: isMobile ? 1 / 30 : 1 / 60 },
        React.createElement(Band, {
          isMobile,
          frontImage,
          backImage,
          imageFit,
          lanyardImage,
          lanyardWidth
        })
      ),
      React.createElement(
        Environment,
        { blur: 0.75 },
        React.createElement(Lightformer, {
          intensity: 2,
          color: 'white',
          position: [0, -1, 5],
          rotation: [0, 0, Math.PI / 3],
          scale: [100, 0.1, 1]
        }),
        React.createElement(Lightformer, {
          intensity: 3,
          color: 'white',
          position: [-1, -1, 1],
          rotation: [0, 0, Math.PI / 3],
          scale: [100, 0.1, 1]
        }),
        React.createElement(Lightformer, {
          intensity: 3,
          color: 'white',
          position: [1, 1, 1],
          rotation: [0, 0, Math.PI / 3],
          scale: [100, 0.1, 1]
        }),
        React.createElement(Lightformer, {
          intensity: 10,
          color: 'white',
          position: [-10, 0, 14],
          rotation: [0, Math.PI / 2, Math.PI / 3],
          scale: [100, 10, 1]
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
  lanyardImage = null,
  lanyardWidth = 1
}) {
  const band = useRef();
  const fixed = useRef();
  const j1 = useRef();
  const j2 = useRef();
  const j3 = useRef();
  const card = useRef();
  const vec = new THREE.Vector3();
  const ang = new THREE.Vector3();
  const rot = new THREE.Vector3();
  const dir = new THREE.Vector3();
  const lanyardEndTrim = 0.18;

  const segmentProps = {
    type: 'dynamic',
    canSleep: true,
    colliders: false,
    angularDamping: 4,
    linearDamping: 4
  };

  const getLerped = body => {
    if (!body.lerped) {
      body.lerped = new THREE.Vector3().copy(body.translation());
    }

    return body.lerped;
  };

  const { nodes, materials } = useGLTF(cardGLB);
  const orangeLanyard = useMemo(() => createOrangeLanyardDataUrl(), []);
  const texture = useTexture(lanyardImage || orangeLanyard);
  const frontTex = useTexture(frontImage || blankPixel);
  const backTex = useTexture(backImage || blankPixel);

  const cardMap = useMemo(() => {
    const baseMap = materials.base.map;
    if (!frontImage && !backImage) return baseMap;

    const baseImg = baseMap.image;
    const width = baseImg.width;
    const height = baseImg.height;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return baseMap;

    ctx.drawImage(baseImg, 0, 0, width, height);

    const drawFitted = (img, rect, options = {}) => {
      const inset = options.inset ?? 0;
      const rx = rect.x * width;
      const ry = rect.y * height;
      const rw = rect.w * width;
      const rh = rect.h * height;
      const tx = rx + rw * inset;
      const ty = ry + rh * inset;
      const tw = rw * (1 - inset * 2);
      const th = rh * (1 - inset * 2);
      const pick = imageFit === 'contain' ? Math.min : Math.max;
      const scale = pick(tw / img.width, th / img.height);
      const dw = img.width * scale;
      const dh = img.height * scale;
      const dx = tx + (tw - dw) / 2;
      const dy = ty + (th - dh) / 2;

      if (options.border) {
        ctx.save();
        ctx.fillStyle = options.border;
        ctx.fillRect(rx, ry, rw, rh);
        ctx.restore();
      }

      ctx.save();
      ctx.beginPath();
      ctx.rect(tx, ty, tw, th);
      ctx.clip();
      ctx.drawImage(img, dx, dy, dw, dh);
      ctx.restore();
    };

    if (frontImage && frontTex.image) {
      drawFitted(frontTex.image, frontUvRect, { inset: 0.055, border: '#f2f2ee' });
    }
    if (backImage && backTex.image) {
      drawFitted(backTex.image, backUvRect);
    }

    const composite = new THREE.CanvasTexture(canvas);
    composite.colorSpace = THREE.SRGBColorSpace;
    composite.flipY = baseMap.flipY;
    composite.anisotropy = 16;
    composite.needsUpdate = true;
    return composite;
  }, [frontImage, backImage, imageFit, frontTex, backTex, materials.base.map]);

  const [curve] = useState(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3(),
    new THREE.Vector3(),
    new THREE.Vector3(),
    new THREE.Vector3()
  ]));
  const [dragged, drag] = useState(false);
  const [hovered, hover] = useState(false);

  useRopeJoint(fixed, j1, [[0, 0, 0], [0, 0, 0], 1]);
  useRopeJoint(j1, j2, [[0, 0, 0], [0, 0, 0], 1]);
  useRopeJoint(j2, j3, [[0, 0, 0], [0, 0, 0], 1]);
  useSphericalJoint(j3, card, [
    [0, 0, 0],
    [0, 1.45, 0]
  ]);

  useEffect(() => {
    if (!hovered) return undefined;

    document.body.style.cursor = dragged ? 'grabbing' : 'grab';
    return () => {
      document.body.style.cursor = 'auto';
    };
  }, [hovered, dragged]);

  useFrame((state, delta) => {
    if (dragged && typeof dragged !== 'boolean') {
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
        const lerped = getLerped(ref.current);
        const clampedDistance = Math.max(0.1, Math.min(1, lerped.distanceTo(ref.current.translation())));
        lerped.lerp(ref.current.translation(), delta * (minSpeed + clampedDistance * (maxSpeed - minSpeed)));
      });

      curve.points[0].copy(j3.current.translation());
      curve.points[1].copy(getLerped(j2.current));
      // Visual-only trim: keep the official physics joint intact while stopping the band above the buckle.
      curve.points[0].add(vec.copy(curve.points[1]).sub(curve.points[0]).normalize().multiplyScalar(lanyardEndTrim));
      curve.points[2].copy(getLerped(j1.current));
      curve.points[3].copy(fixed.current.translation());
      band.current.geometry.setPoints(curve.getPoints(isMobile ? 16 : 32));

      ang.copy(card.current.angvel());
      rot.copy(card.current.rotation());
      card.current.setAngvel({ x: ang.x, y: ang.y - rot.y * 0.25, z: ang.z }, true);
    }
  });

  curve.curveType = 'chordal';
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

  return React.createElement(
    React.Fragment,
    null,
    React.createElement(
      'group',
      { position: [0, 4, 0] },
      React.createElement(RigidBody, { ref: fixed, ...segmentProps, type: 'fixed' }),
      React.createElement(RigidBody, { position: [0.5, 0, 0], ref: j1, ...segmentProps, type: 'dynamic' }, React.createElement(BallCollider, { args: [0.1] })),
      React.createElement(RigidBody, { position: [1, 0, 0], ref: j2, ...segmentProps, type: 'dynamic' }, React.createElement(BallCollider, { args: [0.1] })),
      React.createElement(RigidBody, { position: [1.5, 0, 0], ref: j3, ...segmentProps, type: 'dynamic' }, React.createElement(BallCollider, { args: [0.1] })),
      React.createElement(
        RigidBody,
        { position: [2, 0, 0], ref: card, ...segmentProps, type: dragged ? 'kinematicPosition' : 'dynamic' },
        React.createElement(CuboidCollider, { args: [0.8, 1.125, 0.01] }),
        React.createElement(
          'group',
          {
            scale: 2.36,
            position: [0, -1.2, -0.05],
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
          React.createElement('mesh', { geometry: nodes.clip.geometry, material: materials.metal, 'material-roughness': 0.3 }),
          React.createElement('mesh', { geometry: nodes.clamp.geometry, material: materials.metal })
        )
      )
    ),
    React.createElement(
      'mesh',
      { ref: band },
      React.createElement('meshLineGeometry', null),
      React.createElement('meshLineMaterial', {
        color: 'white',
        depthTest: false,
        resolution: isMobile ? [1000, 2000] : [1000, 1000],
        useMap: true,
        map: texture,
        repeat: [-4, 1],
        lineWidth: lanyardWidth
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
