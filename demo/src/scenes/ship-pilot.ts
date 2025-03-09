import * as forge from '../../../src';
import { createShip } from '../create-ship';
import { createStarfield } from '../create-starfield';
import { ShipMovementSystem } from '../ship';
import { StarfieldSystem } from '../starfield';

export async function createShipPilotScene(
  game: forge.Game,
  gameContainer: HTMLElement,
  imageCache: forge.ImageCache,
) {
  const scene = new forge.Scene('ship-pilot');

  const worldSpace = new forge.Space(window.innerWidth, window.innerHeight);
  const layerService = new forge.LayerService();

  window.addEventListener('resize', () => {
    layerService.resizeAllLayers();
  });

  const world = new forge.World();

  const inputsEntity = new forge.Entity('inputs', [
    new forge.InputsComponent(),
  ]);

  const inputSystem = new forge.InputSystem(gameContainer);

  world.addEntity(inputsEntity);
  world.addSystem(inputSystem);

  const cameraEntity = new forge.Entity('world camera', [
    new forge.CameraComponent({ allowZooming: false, allowPanning: false }),
    new forge.PositionComponent(worldSpace.center.x, worldSpace.center.y),
  ]);

  const foregroundRenderLayer = addRenderLayer(
    forge.DEFAULT_LAYERS.foreground,
    gameContainer,
    layerService,
    world,
    cameraEntity,
    false,
  );

  const backgroundRenderLayer = addRenderLayer(
    forge.DEFAULT_LAYERS.background,
    gameContainer,
    layerService,
    world,
    cameraEntity,
    false,
  );

  await createShip(imageCache, foregroundRenderLayer, world);
  createStarfield(world, 500);

  const shipMovementSystem = new ShipMovementSystem(inputsEntity, game.time);
  const starfieldSystem = new StarfieldSystem(
    world,
    imageCache,
    backgroundRenderLayer,
  );
  const animationSystem = new forge.AnimationSystem(game.time);

  world.addSystems([shipMovementSystem, starfieldSystem, animationSystem]);

  const cameraSystem = new forge.CameraSystem(inputsEntity, game.time);

  world.addEntity(cameraEntity);
  world.addSystem(cameraSystem);

  scene.registerUpdatable(world);
  scene.registerStoppable(world);

  return scene;
}

function addRenderLayer(
  layerName: string,
  gameContainer: HTMLElement,
  layerService: forge.LayerService,
  world: forge.World,
  cameraEntity: forge.Entity,
  sortEntities: boolean,
) {
  const canvas = forge.createCanvas(`$forge-layer-${layerName}`, gameContainer);
  const layer = new forge.ForgeRenderLayer(
    layerName,
    canvas,
    forge.CLEAR_STRATEGY.blank,
    sortEntities,
  );

  layerService.registerLayer(layer);

  const layerRenderSystem = new forge.RenderSystem({
    layer,
    cameraEntity,
  });

  world.addSystem(layerRenderSystem);

  return layer;
}
