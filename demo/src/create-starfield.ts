import * as forge from '../../src';
import { StarfieldComponent } from './starfield';

export const createStarfield = async (world: forge.World) => {
  const starfieldComponent = new StarfieldComponent(100);
  const starfieldEntity = new forge.Entity('starfield', [starfieldComponent]);

  world.addEntity(starfieldEntity);

  return starfieldEntity;
};
