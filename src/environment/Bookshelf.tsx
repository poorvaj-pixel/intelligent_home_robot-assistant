import { FURNITURE_DIMS } from "./layout";
import { envMat } from "./envMaterials";

export const SHELF_LEVELS = [0.08, 0.5, 0.92, 1.34];
const BOOK_COLORS = ["#8c3b2e", "#2f4f6f", "#c9a24a", "#3f6b4f", "#6b4a7a", "#a8584a", "#2c3e50", "#7a6a4f"];

/**
 * Shelf slots: some filled, some deliberately empty — the empty ones are
 * where the misplaced books will be returned in a later phase.
 */
export const SHELF_SLOTS: { id: string; level: number; x: number; filled: boolean }[] = (() => {
  const out: { id: string; level: number; x: number; filled: boolean }[] = [];
  SHELF_LEVELS.forEach((_, level) => {
    for (let i = 0; i < 8; i++) {
      const empty = (level === 1 && i >= 5) || (level === 2 && i < 2) || (level === 3 && i > 3);
      out.push({ id: `shelf-slot-${level}-${i}`, level, x: -0.38 + i * 0.105, filled: !empty });
    }
  });
  return out;
})();

export function Bookshelf({ id }: { id: string }) {
  const m = envMat();
  const [w, h, d] = FURNITURE_DIMS.bookshelf;
  return (
    <group name={id}>
      {/* sides, back, top */}
      {[-w / 2 + 0.02, w / 2 - 0.02].map((x) => (
        <mesh key={x} position={[x, h / 2, 0]} material={m.walnut} castShadow>
          <boxGeometry args={[0.04, h, d]} />
        </mesh>
      ))}
      <mesh position={[0, h / 2, -d / 2 + 0.01]} material={m.walnut} receiveShadow>
        <boxGeometry args={[w, h, 0.02]} />
      </mesh>
      <mesh position={[0, h - 0.02, 0]} material={m.walnut} castShadow>
        <boxGeometry args={[w, 0.04, d]} />
      </mesh>
      {SHELF_LEVELS.map((y) => (
        <mesh key={y} position={[0, y - 0.015, 0]} material={m.walnut} receiveShadow>
          <boxGeometry args={[w - 0.06, 0.03, d - 0.02]} />
        </mesh>
      ))}
      {SHELF_SLOTS.filter((s) => s.filled).map((s, i) => {
        const bh = 0.26 + ((i * 37) % 7) * 0.012;
        return (
          <mesh key={s.id} name={`shelf-book-${s.level}-${s.id.split("-").pop()}`} position={[s.x, SHELF_LEVELS[s.level]! + bh / 2, 0.02]} castShadow>
            <boxGeometry args={[0.07, bh, 0.22]} />
            <meshStandardMaterial color={BOOK_COLORS[i % BOOK_COLORS.length]!} roughness={0.8} />
          </mesh>
        );
      })}
    </group>
  );
}
