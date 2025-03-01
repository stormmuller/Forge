import * as forge from '../../../src';

export const createInputs = (
  world: forge.World,
  gameContainer: HTMLElement,
) => {
  const inputsEntity = new forge.Entity('input', [new forge.InputsComponent()]);

  const inputSystem = new forge.InputSystem(gameContainer);

  world.addEntity(inputsEntity);
  world.addSystem(inputSystem);

  return inputsEntity;
};
