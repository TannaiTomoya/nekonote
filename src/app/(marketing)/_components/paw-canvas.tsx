"use client";
import { Canvas, useLoader, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import type { Group } from "three";
function Paw({ onReady, small }: { onReady: () => void; small: boolean }) {
  const gltf = useLoader(GLTFLoader, "/models/paw.glb", (loader) => {
    const draco = new DRACOLoader();
    draco.setDecoderPath("/draco/");
    loader.setDRACOLoader(draco);
  });
  const ref = useRef<Group>(null),
    { invalidate, gl } = useThree();
  useEffect(() => {
    const scene = gltf.scene.clone();
    ref.current?.add(scene);
    onReady();
    const scroll = () => {
      if (!ref.current) return;
      const rect = gl.domElement.getBoundingClientRect();
      const progress = Math.max(
        -1,
        Math.min(1, (innerHeight / 2 - rect.top) / innerHeight),
      );
      ref.current.rotation.z = (small ? -0.35 : -0.22) + progress * 0.18;
      ref.current.rotation.y = -0.3 + progress * 0.25;
      ref.current.position.y = -0.05 + progress * 0.18;
      invalidate();
    };
    scroll();
    window.addEventListener("scroll", scroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", scroll);
      ref.current?.remove(scene);
    };
  }, [gltf, gl, invalidate, onReady, small]);
  return <group ref={ref} />;
}
export default function PawCanvas({
  onReady,
  small = false,
}: {
  onReady: () => void;
  small?: boolean;
}) {
  return (
    <Canvas
      frameloop="demand"
      dpr={[1, 1.5]}
      camera={{ position: [0, 0.15, 6.5], fov: 43 }}
      gl={{ alpha: true, antialias: true }}
      fallback={null}
    >
      <ambientLight intensity={1.5} />
      <directionalLight position={[-3, 4, 5]} intensity={2.8} />
      <directionalLight position={[4, 0, 2]} intensity={1.1} />
      <Paw onReady={onReady} small={small} />
    </Canvas>
  );
}
