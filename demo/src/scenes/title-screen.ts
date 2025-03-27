import { Alignment, Fit, Layout, RiveEventPayload } from '@rive-app/canvas';
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
    new forge.PositionComponent(0, 0),
  ]);

  const foregroundRenderLayer = addRenderLayer(
    forge.DEFAULT_LAYERS.foreground,
    gameContainer,
    layerService,
    world,
    cameraEntity,
  );

  createStarfield(world, 500, worldSpace);

  const riveFile = await riveCache.getOrLoad(riveFileUri);
  const riveCanvas = forge.createCanvas(forge.DEFAULT_LAYERS.ui, gameContainer);

  const riveRenderLayer = new forge.RiveRenderLayer(
    forge.DEFAULT_LAYERS.ui,
    riveCanvas,
    {
      riveFile,
      stateMachines: riveStateMachine,
      canvas: riveCanvas,
      layout: new Layout({
        fit: Fit.Layout,
        alignment: Alignment.Center,
      }),
    },
  );

  const onStartClickedEvent =
    new forge.ParameterizedForgeEvent<RiveEventPayload>(
      `rive_${riveStartOnClickedEventName}`,
    );

  riveRenderLayer.registerRiveEvent(
    riveStartOnClickedEventName,
    onStartClickedEvent,
  );

  layerService.registerLayer(riveRenderLayer);

  onStartClickedEvent.registerListener(async () => {
    game.registerScene(
      await createShipPilotScene(game, gameContainer, imageCache),
    );

    game.deregisterScene(scene);
  });

  const image = await imageCache.getOrLoad('star_small.png');

  const material = new forge.SpriteMaterial(
    foregroundRenderLayer.context,
    image,
  );

  const geometry = forge.createQuadGeometry(foregroundRenderLayer.context);

  const renderable = new forge.Renderable(geometry, material);

  const sprite = new forge.Sprite({
    renderable,
    renderLayer: foregroundRenderLayer,
    width: image.width,
    height: image.height,
  });

  const starfieldSystem = new StarfieldSystem(world, sprite);
  const animationSystem = new forge.AnimationSystem(game.time);

  world.addSystems([starfieldSystem, animationSystem]);

  const cameraSystem = new forge.CameraSystem(inputsEntity, game.time);

  world.addEntity(cameraEntity);
  world.addSystem(cameraSystem);

  scene.registerUpdatable(world);
  scene.registerStoppable(world);
  scene.registerStoppable(riveRenderLayer);

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

  const spriteBatcher = new forge.Entity('renderable batcher', [
    new forge.RenderableBatchComponent(layer),
  ]);

  const batchingSystem = new forge.SpriteBatchingSystem(spriteBatcher);

  world.addEntity(spriteBatcher);
  world.addSystem(batchingSystem);

  return layer;
}
