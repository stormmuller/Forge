import { RiveEventPayload } from '@rive-app/canvas';
import * as forge from '../../../src';
import { createStarfield } from '../create-starfield';
import { StarfieldSystem } from '../starfield';
import { createShipPilotScene } from './ship-pilot';

const riveFileUri = 'ui.riv';
const riveStateMachine = 'Button';
const riveStartOnClickedEventName = 'OnClick';

export async function createTitleScene(
  game: forge.Game,
  gameContainer: HTMLElement,
  imageCache: forge.ImageCache,
  riveCache: forge.RiveCache,
) {
  const scene = new forge.Scene('title-screen');

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
  );

  createStarfield(world, 2000);

  // const riveFile = await riveCache.getOrLoad(riveFileUri);

  // const riveRenderLayer = new forge.RiveRenderLayer(
  //   forge.DEFAULT_LAYERS.ui,
  //   forge.createCanvas(forge.DEFAULT_LAYERS.ui, gameContainer),
  //   riveFile,
  //   riveStateMachine,
  // );

  // const onStartClickedEvent = new forge.ParameterizedEvent<RiveEventPayload>(
  //   `rive_${riveStartOnClickedEventName}`,
  // );

  // riveRenderLayer.registerRiveEvent(
  //   riveStartOnClickedEventName,
  //   onStartClickedEvent,
  // );

  // layerService.registerLayer(riveRenderLayer);

  // onStartClickedEvent.registerListener(async () => {
  //   console.log('Start clicked');

  //   game.registerScene(
  //     await createShipPilotScene(game, gameContainer, imageCache),
  //   );

  //   game.deregisterScene(scene);
  // });

  const starfieldSystem = new StarfieldSystem(
    world,
    imageCache,
    foregroundRenderLayer,
  );
  const animationSystem = new forge.AnimationSystem(game.time);

  world.addSystems([starfieldSystem, animationSystem]);

  const cameraSystem = new forge.CameraSystem(inputsEntity, game.time);

  world.addEntity(cameraEntity);
  world.addSystem(cameraSystem);

  scene.registerUpdatable(world);
  scene.registerStoppable(world);
  // scene.registerStoppable(riveRenderLayer);

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

  const spriteBatcher = new forge.Entity('sprite batcher', [
    new forge.SpriteBatchComponent(),
  ]);

  const batchingSystem = new forge.SpriteBatchingSystem(spriteBatcher);

  world.addEntity(spriteBatcher);
  world.addSystem(batchingSystem);

  return layer;
}
