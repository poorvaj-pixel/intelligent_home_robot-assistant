import * as THREE from "three";

function canvasTex(draw: (g: CanvasRenderingContext2D, s: number) => void, repeat: number) {
  const s = 256;
  const c = document.createElement("canvas");
  c.width = c.height = s;
  draw(c.getContext("2d")!, s);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat, repeat);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function wood() {
  return canvasTex((g, s) => {
    const rows = 8;
    for (let i = 0; i < rows; i++) {
      const l = 68 + Math.random() * 8;
      g.fillStyle = `hsl(34, 55%, ${l}%)`;
      g.fillRect(0, (i * s) / rows, s, s / rows);
      g.fillStyle = "rgba(60,35,15,0.25)";
      g.fillRect(0, (i * s) / rows, s, 1.5);
      const off = Math.random() * s;
      g.fillRect(off, (i * s) / rows, 1.5, s / rows);
      for (let k = 0; k < 6; k++) {
        g.fillStyle = `rgba(90,55,25,${0.05 + Math.random() * 0.06})`;
        g.fillRect(0, (i * s) / rows + Math.random() * (s / rows), s, 1);
      }
    }
  }, 1);
}

function tile() {
  return canvasTex((g, s) => {
    g.fillStyle = "#cfe9f2";
    g.fillRect(0, 0, s, s);
    const n = 4;
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++) {
        g.fillStyle = `hsl(190, 55%, ${90 + Math.random() * 5}%)`;
        g.fillRect((i * s) / n + 2, (j * s) / n + 2, s / n - 4, s / n - 4);
      }
  }, 1);
}

function concrete() {
  return canvasTex((g, s) => {
    g.fillStyle = "#f3e3c4";
    g.fillRect(0, 0, s, s);
    for (let k = 0; k < 2500; k++) {
      g.fillStyle = `rgba(${Math.random() > 0.5 ? "255,255,255" : "0,0,0"},0.04)`;
      g.fillRect(Math.random() * s, Math.random() * s, 2, 2);
    }
  }, 1);
}

let cache: ReturnType<typeof build> | null = null;
function build() {
  return {
    floor: { wood: wood(), tile: tile(), concrete: concrete() },
    wall: new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.8 }),
    wallCap: new THREE.MeshStandardMaterial({ color: "#ff8a4c", roughness: 0.5 }),
    doorFrame: new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.45 }),
    fabric: new THREE.MeshStandardMaterial({ color: "#1fb5a8", roughness: 0.96 }),
    fabricWarm: new THREE.MeshStandardMaterial({ color: "#ffb627", roughness: 0.96 }),
    oak: new THREE.MeshStandardMaterial({ color: "#e9b26f", roughness: 0.6 }),
    walnut: new THREE.MeshStandardMaterial({ color: "#b9774a", roughness: 0.55 }),
    white: new THREE.MeshStandardMaterial({ color: "#fffdf7", roughness: 0.4 }),
    steel: new THREE.MeshStandardMaterial({ color: "#d8e0e5", roughness: 0.25, metalness: 0.85 }),
    black: new THREE.MeshStandardMaterial({ color: "#26292e", roughness: 0.5, metalness: 0.3 }),
    stone: new THREE.MeshStandardMaterial({ color: "#9ca7ad", roughness: 0.32 }),
    linen: new THREE.MeshStandardMaterial({ color: "#fff2dc", roughness: 0.95 }),
    blanket: new THREE.MeshStandardMaterial({ color: "#ff6f91", roughness: 0.95 }),
    leaf: new THREE.MeshStandardMaterial({ color: "#3fc060", roughness: 0.82 }),
    ceramic: new THREE.MeshStandardMaterial({ color: "#f5eee1", roughness: 0.3 }),
    cardboard: new THREE.MeshStandardMaterial({ color: "#d8a15f", roughness: 0.9 }),
    lampGlow: new THREE.MeshStandardMaterial({ color: "#fff1d6", emissive: "#ffd9a0", emissiveIntensity: 1.2, toneMapped: false }),
    doorBlue: new THREE.MeshStandardMaterial({ color: "#3d9bff", roughness: 0.45 }),
    doorPink: new THREE.MeshStandardMaterial({ color: "#ff6f91", roughness: 0.45 }),
    doorYellow: new THREE.MeshStandardMaterial({ color: "#ffc93c", roughness: 0.45 }),
    doorGreen: new THREE.MeshStandardMaterial({ color: "#2ec4a0", roughness: 0.45 }),
    fridgeInside: new THREE.MeshStandardMaterial({ color: "#f4fbff", emissive: "#dff3ff", emissiveIntensity: 0.35, roughness: 0.3 }),
    grass: new THREE.MeshStandardMaterial({ color: "#7fd65b", roughness: 1 }),
    gardenStone: new THREE.MeshStandardMaterial({ color: "#e2cfae", roughness: 0.9 }),
    terracotta: new THREE.MeshStandardMaterial({ color: "#d9855d", roughness: 0.82 }),
    flower: new THREE.MeshStandardMaterial({ color: "#ff5fa2", roughness: 0.72 }),
  };
}

export function envMat() {
  if (!cache) cache = build();
  return cache;
}
