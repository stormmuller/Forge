import * as forge from '../../../../src';

export const createCameras = (
  world: forge.World,
  worldSpace: forge.Space,
  inputsEntity: forge.Entity,
  game: forge.Game,
) => {
  const worldCamera = new forge.Entity('World Camera', [
    new forge.CameraComponent(),
    new forge.PositionComponent(worldSpace.center.x, worldSpace.center.y),
  ]);

  const cameraSystem = new forge.CameraSystem(inputsEntity, game.time);

  world.addEntity(worldCamera);
  world.addSystem(cameraSystem);

  return worldCamera;
};
