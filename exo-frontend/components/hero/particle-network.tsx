"use client";

import React, { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

// Custom hook to avoid next-themes dependency
const useDarkMode = () => {
    const [isDark, setIsDark] = useState(true); // Default to dark
    useEffect(() => {
        const check = () => document.documentElement.classList.contains('dark');
        setIsDark(check());

        const observer = new MutationObserver(() => setIsDark(check()));
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);
    return isDark;
};

interface ParticleNetworkProps {
    count?: number;
    connectionDistance?: number;
    mouseDistance?: number;
    className?: string; // Moving className here for cleaner props in simplified component
}

const Particles = ({ count = 200, connectionDistance = 2, mouseDistance = 4 }: ParticleNetworkProps) => {
    const mesh = useRef<THREE.InstancedMesh>(null);
    const linesGeometry = useRef<THREE.BufferGeometry>(null);
    const isDark = useDarkMode(); // Use custom hook

    // Particle positioning
    const particles = useMemo(() => {
        const temp = [];
        for (let i = 0; i < count; i++) {
            const x = (Math.random() - 0.5) * 20;
            const y = (Math.random() - 0.5) * 20;
            const z = (Math.random() - 0.5) * 10; // Depth
            temp.push({
                x, y, z,
                vx: (Math.random() - 0.5) * 0.02,
                vy: (Math.random() - 0.5) * 0.02
            });
        }
        return temp;
    }, [count]);

    const dummy = useMemo(() => new THREE.Object3D(), []);

    useFrame((state) => {
        if (!mesh.current) return;
        const meshRef = mesh.current;
        const vec = new THREE.Vector3(state.pointer.x, state.pointer.y, 0);
        vec.unproject(state.camera);
        const dir = vec.sub(state.camera.position).normalize();
        const distance = -state.camera.position.z / dir.z;
        const pos = state.camera.position.clone().add(dir.multiplyScalar(distance));

        // Update particles
        particles.forEach((particle, i) => {
            // Movement
            particle.x += particle.vx;
            particle.y += particle.vy;

            // Bounce
            if (particle.x > 10 || particle.x < -10) particle.vx *= -1;
            if (particle.y > 10 || particle.y < -10) particle.vy *= -1;

            // Mouse interaction (Repulsion)
            const dx = particle.x - pos.x;
            const dy = particle.y - pos.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < mouseDistance) {
                const force = (mouseDistance - dist) / mouseDistance;
                particle.x += dx * force * 0.05;
                particle.y += dy * force * 0.05;
            }

            // Update Instance
            dummy.position.set(particle.x, particle.y, particle.z);
            dummy.scale.set(0.1, 0.1, 0.1); // Small dots
            dummy.updateMatrix();
            meshRef.setMatrixAt(i, dummy.matrix);
        });
        meshRef.instanceMatrix.needsUpdate = true;

        // Update Lines
        let lineIdx = 0;
        const positions = [];

        for (let i = 0; i < count; i++) {
            for (let j = i + 1; j < count; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dz = particles[i].z - particles[j].z;
                const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

                if (dist < connectionDistance) {
                    positions.push(particles[i].x, particles[i].y, particles[i].z);
                    positions.push(particles[j].x, particles[j].y, particles[j].z);
                }
            }
        }

        if (linesGeometry.current) {
            linesGeometry.current.setAttribute(
                'position',
                new THREE.Float32BufferAttribute(positions, 3)
            );
        }
    });

    const particleColor = isDark ? '#ffffff' : '#000000';
    const lineColor = isDark ? '#aaaaaa' : '#666666';

    return (
        <>
            <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
                <sphereGeometry args={[0.08, 8, 8]} />
                <meshBasicMaterial color={particleColor} transparent opacity={0.6} />
            </instancedMesh>
            <lineSegments>
                <bufferGeometry ref={linesGeometry} />
                <lineBasicMaterial color={lineColor} transparent opacity={0.15} />
            </lineSegments>
        </>
    );
};

export function ParticleNetwork({ className }: { className?: string }) {
    return (
        <div className={`absolute inset-0 -z-0 opacity-50 ${className}`}>
            <Canvas camera={{ position: [0, 0, 10], fov: 60 }} resize={{ scroll: false }}>
                <Particles count={150} />
            </Canvas>
        </div>
    );
}
