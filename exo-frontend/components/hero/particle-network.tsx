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

// IM06: Hook to detect prefers-reduced-motion for accessibility
const usePrefersReducedMotion = () => {
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        setPrefersReducedMotion(mediaQuery.matches);
        
        const handler = (event: MediaQueryListEvent) => {
            setPrefersReducedMotion(event.matches);
        };
        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
    }, []);
    return prefersReducedMotion;
};

interface ParticleNetworkProps {
    count?: number;
    connectionDistance?: number;
    mouseDistance?: number;
}

const Particles = ({ count = 200, connectionDistance = 2.5, mouseDistance = 4 }: ParticleNetworkProps) => {
    const mesh = useRef<THREE.InstancedMesh>(null);
    const linesGeometry = useRef<THREE.BufferGeometry>(null);
    const isDark = useDarkMode();

    // Brand colors: Emerald-400 (#34d399) to Cyan-400 (#22d3ee)
    // We'll use a mix for particles
    const particleColor = new THREE.Color("#34d399"); // Emerald
    const lineColor = new THREE.Color("#22d3ee");     // Cyan

    // Particle positioning
    const particles = useMemo(() => {
        const temp = [];
        for (let i = 0; i < count; i++) {
            const x = (Math.random() - 0.5) * 25;
            const y = (Math.random() - 0.5) * 25;
            const z = (Math.random() - 0.5) * 15;
            temp.push({
                x, y, z,
                vx: (Math.random() - 0.5) * 0.03,
                vy: (Math.random() - 0.5) * 0.03,
                vz: (Math.random() - 0.5) * 0.01
            });
        }
        return temp;
    }, [count]);

    const dummy = useMemo(() => new THREE.Object3D(), []);

    useFrame((state) => {
        if (!mesh.current) return;
        const meshRef = mesh.current;
        
        // Mouse interaction
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
            particle.z += particle.vz;

            // Bounce from a larger box
            if (particle.x > 12 || particle.x < -12) particle.vx *= -1;
            if (particle.y > 12 || particle.y < -12) particle.vy *= -1;
            if (particle.z > 8 || particle.z < -8) particle.vz *= -1;

            // Mouse interaction (Repulsion)
            const dx = particle.x - pos.x;
            const dy = particle.y - pos.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < mouseDistance) {
                const force = (mouseDistance - dist) / mouseDistance;
                // Gentle push
                particle.x += dx * force * 0.03;
                particle.y += dy * force * 0.03;
            }

            // Update Instance
            dummy.position.set(particle.x, particle.y, particle.z);
            
            // Breathing effect for scale
            const scale = 0.08 + Math.sin(state.clock.elapsedTime * 2 + i) * 0.03;
            dummy.scale.set(scale, scale, scale);
            
            dummy.updateMatrix();
            meshRef.setMatrixAt(i, dummy.matrix);
        });
        meshRef.instanceMatrix.needsUpdate = true;

        // Slow rotation of the whole system
        meshRef.rotation.y = state.clock.elapsedTime * 0.05;

        // Update Lines
        let lineIdx = 0;
        const positions = [];
        // Optional: Colors array if we want gradient lines (requires vertex colors)
        
        // Optimization: Only check a subset or use spatial partitioning for large counts
        // For < 300 particles, O(N^2) is acceptable in JS per frame usually
        const limit = count; 

        // Apply same rotation to lines calculation? 
        // No, lines are drawn in world space usually, but here linesGeometry is child of scene?
        // Actually, if we rotate the mesh, the lines need to rotate too or be computed in local space.
        // To simplify, let's NOT rotate the mesh, but rotate the camera or just let particles move.
        // Reverting mesh rotation to avoid line sync issues unless we wrap both in a Group.
        meshRef.rotation.y = 0;

        // Let's rotate the camera slightly instead for "cinematic" feel
        state.camera.position.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.5;
        state.camera.lookAt(0, 0, 0);

        for (let i = 0; i < limit; i++) {
            for (let j = i + 1; j < limit; j++) {
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

    return (
        <>
            <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
                <sphereGeometry args={[1, 16, 16]} />
                <meshBasicMaterial 
                    color={particleColor} 
                    transparent 
                    opacity={0.8} 
                    blending={THREE.AdditiveBlending}
                />
            </instancedMesh>
            <lineSegments>
                <bufferGeometry ref={linesGeometry} />
                <lineBasicMaterial 
                    color={lineColor} 
                    transparent 
                    opacity={0.15} 
                    blending={THREE.AdditiveBlending}
                />
            </lineSegments>
        </>
    );
};

export function ParticleNetwork({ className }: { className?: string }) {
    const prefersReducedMotion = usePrefersReducedMotion();

    // IM06: Static fallback for users who prefer reduced motion
    if (prefersReducedMotion) {
        return (
            <div className={`absolute inset-0 -z-0 ${className}`}>
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-cyan-500/5" />
                <div className="absolute top-1/4 left-1/4 w-2 h-2 rounded-full bg-emerald-400/30" />
                <div className="absolute top-1/3 right-1/3 w-1.5 h-1.5 rounded-full bg-cyan-400/20" />
                <div className="absolute bottom-1/4 right-1/4 w-2.5 h-2.5 rounded-full bg-emerald-400/20" />
                <div className="absolute top-1/2 left-1/2 w-1 h-1 rounded-full bg-cyan-400/30" />
            </div>
        );
    }

    return (
        <div className={`absolute inset-0 -z-0 ${className}`}>
            <Canvas 
                camera={{ position: [0, 0, 12], fov: 60 }} 
                resize={{ scroll: false }}
                dpr={[1, 2]} // Support high DPI
                gl={{ antialias: true, alpha: true }}
            >
                <Particles count={120} connectionDistance={3.5} />
            </Canvas>
        </div>
    );
}

