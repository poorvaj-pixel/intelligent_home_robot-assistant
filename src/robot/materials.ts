import * as THREE from "three";

export const mat = {
  shell: new THREE.MeshPhysicalMaterial({ color: "#eef1f5", roughness: 0.35, metalness: 0.05, clearcoat: 0.6, clearcoatRoughness: 0.25 }),
  dark: new THREE.MeshStandardMaterial({ color: "#2a3038", roughness: 0.55, metalness: 0.4 }),
  metal: new THREE.MeshStandardMaterial({ color: "#9aa4b0", roughness: 0.3, metalness: 0.9 }),
  rubber: new THREE.MeshStandardMaterial({ color: "#1a1d21", roughness: 0.9 }),
  glass: new THREE.MeshPhysicalMaterial({ color: "#0b1622", roughness: 0.05, metalness: 0.2, clearcoat: 1 }),
  accent: new THREE.MeshStandardMaterial({ color: "#3d8bff", emissive: "#3d8bff", emissiveIntensity: 1.6, toneMapped: false }),
  accentSoft: new THREE.MeshStandardMaterial({ color: "#5aa0ff", emissive: "#2f6fd6", emissiveIntensity: 0.6 }),
  led: new THREE.MeshStandardMaterial({ color: "#7cf0c8", emissive: "#4be3b0", emissiveIntensity: 2, toneMapped: false }),
};
