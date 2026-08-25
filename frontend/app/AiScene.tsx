"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  Float,
  OrbitControls,
  Stars,
} from "@react-three/drei";
import * as THREE from "three";

type AiSceneProps = {
  gesture: string;
};

export default function AiScene({
  gesture,
}: AiSceneProps) {
  return (
    <div className="h-full w-full">
      <Canvas
        camera={{
          position: [0, 0, 6],
          fov: 42,
        }}
      >
        <ambientLight intensity={0.65} />

        <directionalLight
          position={[3, 3, 5]}
          intensity={1.8}
        />

        <pointLight
          position={[-3, -2, 2]}
          intensity={3}
        />

        <Stars
          radius={40}
          depth={20}
          count={500}
          factor={1.8}
          saturation={0}
          fade
          speed={0.25}
        />

        <Float
          speed={1.2}
          rotationIntensity={0.18}
          floatIntensity={0.25}
        >
          <GestureObject
            gesture={gesture}
          />
        </Float>

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate={false}
        />
      </Canvas>
    </div>
  );
}

function GestureObject({
  gesture,
}: {
  gesture: string;
}) {
  const meshRef =
    useRef<THREE.Mesh>(null);

  const glowRef =
    useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (!meshRef.current) {
      return;
    }

    let targetScale = 1;

    switch (gesture) {
      case "OPEN PALM":
        targetScale = 1.25;
        break;

      case "FIST":
        targetScale = 0.7;
        break;

      case "POINT":
        targetScale = 1;

        meshRef.current.rotation.y +=
          delta * 2;

        meshRef.current.rotation.x +=
          delta * 0.5;

        break;

      case "PINCH":
        targetScale =
          0.9 +
          Math.sin(
            state.clock.elapsedTime * 8
          ) *
            0.06;

        break;

      default:
        targetScale = 1;

        meshRef.current.rotation.y +=
          delta * 0.12;

        break;
    }

    const currentScale =
      meshRef.current.scale.x;

    const newScale =
      THREE.MathUtils.lerp(
        currentScale,
        targetScale,
        0.1
      );

    meshRef.current.scale.setScalar(
      newScale
    );

    if (glowRef.current) {
      glowRef.current.scale.setScalar(
        newScale * 1.28
      );

      glowRef.current.rotation.copy(
        meshRef.current.rotation
      );
    }
  });

  return (
    <group>
      {/* Main object */}
      <mesh ref={meshRef}>
        <icosahedronGeometry
          args={[0.95, 4]}
        />

        <meshStandardMaterial
          color="#22d3ee"
          emissive="#0891b2"
          emissiveIntensity={0.6}
          metalness={0.5}
          roughness={0.2}
          wireframe={
            gesture === "POINT"
          }
        />
      </mesh>

      {/* Outer shell */}
      <mesh ref={glowRef}>
        <icosahedronGeometry
          args={[1.05, 2]}
        />

        <meshBasicMaterial
          color={
            gesture === "PINCH"
              ? "#4ade80"
              : "#22d3ee"
          }
          transparent
          opacity={0.09}
          wireframe
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}