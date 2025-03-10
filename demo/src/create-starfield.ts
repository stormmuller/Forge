import * as forge from '../../src';
import { StarfieldComponent } from './starfield';

export const createStarfield = async (
  world: forge.World,
  amount: number,
  space: forge.Space,
) => {
  const starfieldComponent = new StarfieldComponent(amount, space);
  const starfieldEntity = new forge.Entity('starfield', [starfieldComponent]);

  world.addEntity(starfieldEntity);

  return starfieldEntity;
};
