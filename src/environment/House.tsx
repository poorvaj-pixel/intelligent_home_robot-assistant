import { FURNITURE, HOUSEHOLD_OBJECTS, ROOMS, WALLS } from "./layout";
import { Room } from "./Room";
import { Walls } from "./Walls";
import { Furniture } from "./Furniture";
import { HouseholdObject } from "./HouseholdObject";
import { Garden } from "./Garden";
import { InteriorDoors } from "./InteriorDoors";

export function House() {
  return (
    <group name="house">
      <Garden />
      {ROOMS.map((r) => (
        <Room key={r.id} room={r} />
      ))}
      <Walls walls={WALLS} />
      <InteriorDoors />
      {FURNITURE.map((f) => (
        <Furniture key={f.id} item={f} />
      ))}
      {HOUSEHOLD_OBJECTS.map((o) => (
        <HouseholdObject key={o.id} item={o} />
      ))}
    </group>
  );
}
