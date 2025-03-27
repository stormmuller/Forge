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

  const worldSpace = new forge.Space(
    window.innerWidth * 5,
    window.innerHeight * 5,
  );
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
    new forge.CameraComponent({
      allowZooming: true,
      allowPanning: true,
      minZoom: 0.25,
    }),
    new forge.PositionComponent(0, 0),
  ]);

  const backgroundRenderLayer = addRenderLayer(
    forge.DEFAULT_LAYERS.background,
    gameContainer,
    layerService,
    world,
    cameraEntity,
  );

  const foregroundRenderLayer = addRenderLayer(
    forge.DEFAULT_LAYERS.foreground,
    gameContainer,
    layerService,
    world,
    cameraEntity,
  );

  const foregroundBatcher = new forge.Entity('foreground renderable batcher', [
    new forge.RenderableBatchComponent(foregroundRenderLayer),
  ]);

  const backgroundBatcher = new forge.Entity('background renderable batcher', [
    new forge.RenderableBatchComponent(backgroundRenderLayer),
  ]);

  const foregroundBatchingSystem = new forge.SpriteBatchingSystem(
    foregroundBatcher,
  );
  const backgroundBatchingSystem = new forge.SpriteBatchingSystem(
    backgroundBatcher,
  );

  world.addEntity(foregroundBatcher);
  world.addEntity(backgroundBatcher);

  await createShip(imageCache, foregroundRenderLayer, world);
  createStarfield(world, 10_000, worldSpace);

  const image = await imageCache.getOrLoad('star_small.png');
  const material = new forge.SpriteMaterial(
    backgroundRenderLayer.context,
    image,
  );

  const renderable = new forge.Renderable(
    forge.createQuadGeometry(backgroundRenderLayer.context),
    material,
  );

  const sprite = new forge.Sprite({
    renderable,
    renderLayer: backgroundRenderLayer,
    width: image.width,
    height: image.height,
  });

  const shipMovementSystem = new ShipMovementSystem(inputsEntity, game.time);
  const starfieldSystem = new StarfieldSystem(world, sprite);
  const animationSystem = new forge.AnimationSystem(game.time);

  world.addSystems([shipMovementSystem, starfieldSystem, animationSystem]);

  const cameraSystem = new forge.CameraSystem(inputsEntity, game.time);

  world.addEntity(cameraEntity);
  world.addSystem(cameraSystem);
  world.addSystem(foregroundBatchingSystem);
  world.addSystem(backgroundBatchingSystem);

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
) {
  const canvas = forge.createCanvas(`$forge-layer-${layerName}`, gameContainer);
  const layer = new forge.ForgeRenderLayer(layerName, canvas);

  layerService.registerLayer(layer);

  const layerRenderSystem = new forge.RenderSystem({
    layer,
    cameraEntity,
  });

  world.addSystem(layerRenderSystem);

  return layer;
}
