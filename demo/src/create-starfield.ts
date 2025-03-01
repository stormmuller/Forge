import * as forge from '../../src';
import { StarfieldComponent } from './starfield';

export const createStarfield = async (world: forge.World, amount: number) => {
  const starfieldComponent = new StarfieldComponent(amount);
  const starfieldEntity = new forge.Entity('starfield', [starfieldComponent]);

  world.addEntity(starfieldEntity);

  return starfieldEntity;
};
