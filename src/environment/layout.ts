// Declarative smart-home layout. Every wall, piece of furniture and object has a
// stable id so later phases (navigation, organization) can query it as data.
// Units: metres. Origin = house centre, +Z = south, robot faces +Z by default.

export type V2 = [number, number];
export type V3 = [number, number, number];

export const WALL_HEIGHT = 1.8;
export const WALL_THICKNESS = 0.1;

export type RoomId = "living" | "dining" | "kitchen" | "bedroom" | "study" | "corridor";

export interface Room {
  id: RoomId;
  name: string;
  min: V2; // [x, z]
  max: V2;
  floor: "wood" | "tile" | "concrete";
  labeled: boolean;
}

export const ROOMS: Room[] = [
  { id: "living", name: "Living Room", min: [-6, 0.6], max: [1.5, 5], floor: "wood", labeled: true },
  { id: "dining", name: "Dining", min: [1.5, 0.6], max: [6, 5], floor: "tile", labeled: true },
  { id: "kitchen", name: "Kitchen", min: [2, -5], max: [6, -0.8], floor: "tile", labeled: true },
  { id: "bedroom", name: "Bedroom", min: [-6, -5], max: [-1.5, -0.8], floor: "wood", labeled: true },
  { id: "study", name: "Study", min: [-1.5, -5], max: [2, -0.8], floor: "wood", labeled: true },
  { id: "corridor", name: "Corridor", min: [-6, -0.8], max: [6, 0.6], floor: "concrete", labeled: false },
];

export interface Doorway {
  id: string;
  at: number; // centre along the wall axis
  width: number;
}

export interface Wall {
  id: string;
  from: V2;
  to: V2; // axis-aligned
  doors?: Doorway[];
}

export const WALLS: Wall[] = [
  { id: "wall-outer-north", from: [-6, -5], to: [6, -5] },
  { id: "wall-outer-south", from: [-6, 5], to: [6, 5], doors: [{ id: "front-entrance", at: 0, width: 1.5 }] },
  { id: "wall-outer-west", from: [-6, -5], to: [-6, 5] },
  { id: "wall-outer-east", from: [6, -5], to: [6, 5] },
  {
    id: "wall-corridor-north",
    from: [-6, -0.8],
    to: [6, -0.8],
    doors: [
      { id: "door-bedroom", at: -2.6, width: 1.0 },
      { id: "door-study", at: -0.6, width: 1.0 },
      { id: "door-kitchen", at: 3.2, width: 1.1 },
    ],
  },
  {
    id: "wall-corridor-south",
    from: [-6, 0.6],
    to: [6, 0.6],
    doors: [
      { id: "door-living", at: -2.0, width: 1.4 },
      { id: "door-dining", at: 3.75, width: 1.2 },
    ],
  },
  { id: "wall-bedroom-study", from: [-1.5, -5], to: [-1.5, -0.8] },
  { id: "wall-study-kitchen", from: [2, -5], to: [2, -0.8] },
  { id: "wall-living-dining", from: [1.5, 0.6], to: [1.5, 5], doors: [{ id: "door-living-dining", at: 2.8, width: 1.6 }] },
];

export type FurnitureKind =
  | "sofa" | "coffeeTable" | "armchair" | "sideTable" | "floorLamp" | "plant"
  | "diningTable" | "diningChair"
  | "counter" | "upperCabinet" | "fridge" | "island"
  | "bed" | "bedsideTable" | "wardrobe"
  | "desk" | "deskChair" | "bookshelf";

/** Bounding size [width X, height Y, depth Z] in local (unrotated) space. */
export const FURNITURE_DIMS: Record<FurnitureKind, V3> = {
  sofa: [2.2, 0.85, 0.9],
  coffeeTable: [1.1, 0.42, 0.6],
  armchair: [0.8, 0.85, 0.8],
  sideTable: [0.5, 0.55, 0.5],
  floorLamp: [0.4, 1.6, 0.4],
  plant: [0.5, 1.1, 0.5],
  diningTable: [1.6, 0.75, 0.9],
  diningChair: [0.45, 0.9, 0.45],
  counter: [2.8, 0.9, 0.6],
  upperCabinet: [2.8, 0.5, 0.35],
  fridge: [0.75, 1.8, 0.7],
  island: [1.4, 0.9, 0.7],
  bed: [1.6, 0.55, 2.0],
  bedsideTable: [0.45, 0.5, 0.4],
  wardrobe: [1.2, 1.75, 0.55],
  desk: [1.4, 0.75, 0.6],
  deskChair: [0.5, 0.95, 0.5],
  bookshelf: [1.0, 1.75, 0.35],
};

export interface FurnitureItem {
  id: string;
  kind: FurnitureKind;
  room: RoomId;
  position: V3; // base centre on the floor (y = elevation of base)
  rotationY?: number; // front faces local +Z
  obstacle: boolean; // occupies floor space for future navigation
}

const PI = Math.PI;

export const FURNITURE: FurnitureItem[] = [
  // Living room
  { id: "living-sofa", kind: "sofa", room: "living", position: [-2.5, 0, 4.45], rotationY: PI, obstacle: true },
  { id: "living-coffee-table", kind: "coffeeTable", room: "living", position: [-2.5, 0, 3.3], obstacle: true },
  { id: "living-chair-1", kind: "armchair", room: "living", position: [-4.6, 0, 2.9], rotationY: PI / 2, obstacle: true },
  { id: "living-chair-2", kind: "armchair", room: "living", position: [-4.6, 0, 3.95], rotationY: PI / 2, obstacle: true },
  { id: "living-side-table", kind: "sideTable", room: "living", position: [-0.9, 0, 4.55], obstacle: true },
  { id: "living-floor-lamp", kind: "floorLamp", room: "living", position: [-5.6, 0, 4.6], obstacle: true },
  { id: "living-plant", kind: "plant", room: "living", position: [-5.6, 0, 1.0], obstacle: true },
  // Dining
  { id: "dining-table", kind: "diningTable", room: "dining", position: [3.9, 0, 3.0], obstacle: true },
  // Chairs start out messy — the "Arrange chairs" task tucks them in (see CHAIR_TARGETS).
  { id: "dining-chair-1", kind: "diningChair", room: "dining", position: [2.55, 0, 1.75], rotationY: 0.7, obstacle: true },
  { id: "dining-chair-2", kind: "diningChair", room: "dining", position: [5.2, 0, 1.95], rotationY: -0.6, obstacle: true },
  { id: "dining-chair-3", kind: "diningChair", room: "dining", position: [2.4, 0, 4.3], rotationY: 2.4, obstacle: true },
  { id: "dining-chair-4", kind: "diningChair", room: "dining", position: [5.35, 0, 4.25], rotationY: -2.5, obstacle: true },
  { id: "dining-sideboard", kind: "sideTable", room: "dining", position: [5.6, 0, 3.0], obstacle: true },
  // Kitchen
  { id: "kitchen-counter", kind: "counter", room: "kitchen", position: [3.7, 0, -4.65], obstacle: true },
  { id: "kitchen-upper-cabinet", kind: "upperCabinet", room: "kitchen", position: [3.7, 1.25, -4.77], obstacle: false },
  { id: "kitchen-fridge", kind: "fridge", room: "kitchen", position: [5.55, 0, -4.55], obstacle: true },
  { id: "kitchen-island", kind: "island", room: "kitchen", position: [4.0, 0, -2.6], obstacle: true },
  // Bedroom
  { id: "bedroom-bed", kind: "bed", room: "bedroom", position: [-4.4, 0, -3.9], obstacle: true },
  { id: "bedroom-bedside-table", kind: "bedsideTable", room: "bedroom", position: [-3.3, 0, -4.7], obstacle: true },
  { id: "bedroom-wardrobe", kind: "wardrobe", room: "bedroom", position: [-5.67, 0, -1.8], rotationY: PI / 2, obstacle: true },
  // Study
  { id: "study-desk", kind: "desk", room: "study", position: [0.25, 0, -4.6], obstacle: true },
  { id: "study-chair", kind: "deskChair", room: "study", position: [0.25, 0, -3.95], rotationY: PI, obstacle: true },
  { id: "study-bookshelf", kind: "bookshelf", room: "study", position: [1.77, 0, -2.6], rotationY: -PI / 2, obstacle: true },
];

export type ObjectKind = "book" | "box" | "cup" | "remote" | "vase" | "bottle" | "lamp" | "vegetable" | "plate" | "spoon";

export interface HouseholdObjectItem {
  id: string;
  kind: ObjectKind;
  room: RoomId;
  position: V3; // resting point (y = surface height)
  rotationY?: number;
  color?: string;
  /** True for items a future organization task should act on. */
  organizable: boolean;
  /** For books: whether it currently sits on the bookshelf. */
  misplaced?: boolean;
}

export const HOUSEHOLD_OBJECTS: HouseholdObjectItem[] = [
  { id: "book-misplaced-1", kind: "book", room: "study", position: [-0.05, 0.75, -4.55], rotationY: 0.3, color: "#b5452f", organizable: true, misplaced: true },
  { id: "book-misplaced-2", kind: "book", room: "study", position: [0.6, 0.75, -4.6], rotationY: -0.5, color: "#2f5f8f", organizable: true, misplaced: true },
  { id: "book-misplaced-3", kind: "book", room: "study", position: [-0.7, 0, -2.2], rotationY: 1.1, color: "#3f7a4f", organizable: true, misplaced: true },
  { id: "remote-1", kind: "remote", room: "living", position: [-2.2, 0.42, 3.25], rotationY: 0.4, organizable: true },
  { id: "cup-1", kind: "cup", room: "living", position: [-0.9, 0.55, 4.55], organizable: true },
  { id: "cup-2", kind: "cup", room: "kitchen", position: [3.7, 0.9, -2.55], organizable: true },
  { id: "vegetable-carrot", kind: "vegetable", room: "kitchen", position: [2.8, 0.94, -4.58], color: "#e67e22", organizable: true },
  { id: "vegetable-tomato", kind: "vegetable", room: "kitchen", position: [3.35, 0.94, -4.58], color: "#d94b3d", organizable: true },
  { id: "vegetable-cucumber", kind: "vegetable", room: "kitchen", position: [4.0, 0.94, -4.58], color: "#5d9f5b", organizable: true },
  { id: "dining-plate", kind: "plate", room: "dining", position: [5.6, 0.55, 2.9], organizable: true },
  { id: "dining-cup", kind: "cup", room: "dining", position: [5.5, 0.55, 3.15], organizable: true },
  { id: "dining-spoon", kind: "spoon", room: "dining", position: [5.72, 0.55, 3.12], organizable: true },
  { id: "box-2", kind: "box", room: "bedroom", position: [-2.1, 0, -4.4], rotationY: -0.2, organizable: true },
  { id: "decor-vase-dining", kind: "vase", room: "dining", position: [3.9, 0.75, 3.0], organizable: false },
  { id: "decor-vase-living", kind: "vase", room: "living", position: [-2.75, 0.42, 3.35], organizable: false },
  { id: "decor-bottle-kitchen", kind: "bottle", room: "kitchen", position: [2.8, 0.9, -4.6], organizable: false },
  { id: "decor-lamp-bedside", kind: "lamp", room: "bedroom", position: [-3.3, 0.5, -4.7], organizable: false },
];

/** Robot starting pose in the living room. */
/** Neat seat positions for the "Arrange chairs" task: [x, z, rotationY]. */
export const CHAIR_TARGETS: Record<string, [number, number, number]> = {
  "dining-chair-1": [3.45, 2.2, 0],
  "dining-chair-2": [4.35, 2.2, 0],
  "dining-chair-3": [3.45, 3.8, PI],
  "dining-chair-4": [4.35, 3.8, PI],
};

export const ROBOT_START: { position: V3; rotationY: number } = { position: [-0.4, 0, 2.2], rotationY: -PI / 2 };

export interface CameraView {
  id: string;
  label: string;
  position: V3;
  target: V3;
}

export const CAMERA_VIEWS: CameraView[] = [
  { id: "overview", label: "Whole house", position: [3.5, 11, 11], target: [0, 0, 0] },
  { id: "robot", label: "Robot", position: [-2.6, 1.6, 3.4], target: [-0.4, 0.6, 2.2] },
  { id: "living", label: "Living Room", position: [-1.8, 6.5, -1.2], target: [-2.4, 0, 3] },
  { id: "dining", label: "Dining", position: [4.5, 7.5, 9], target: [3.8, 0, 2.8] },
  { id: "kitchen", label: "Kitchen", position: [3, 4.5, 1.8], target: [4, 0.4, -3.2] },
  { id: "bedroom", label: "Bedroom", position: [-2.5, 4.5, 1.8], target: [-3.8, 0.3, -3.2] },
  { id: "study", label: "Study", position: [0.3, 3.8, 1.3], target: [0.3, 0.6, -3.2] },
];
