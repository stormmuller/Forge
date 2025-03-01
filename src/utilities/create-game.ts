import { ImageCache, RiveCache } from '../asset-loading';
import { PositionComponent, Space } from '../common';
import { Entity, World } from '../ecs';
import { Game, Scene } from '../game';
import { InputsComponent, InputSystem } from '../input';
import { Vector2 } from '../math';
import {
  CameraComponent,
  CameraSystem,
  CLEAR_STRATEGY,
  DEFAULT_LAYER_NAMES,
  ForgeRenderLayer,
  LayerService,
  RenderSystem,
} from '../rendering';
import { createCanvas } from '../rendering/create-canvas';
import { createContainer } from './create-container';
import { isString } from './is-string';

export type CreateGameOptions = {
  sceneName: string;
  container: string | HTMLElement;
  layers: string[];
  dimensions: Vector2;
};

const defaultOptions: CreateGameOptions = {
  sceneName: 'main',
  container: 'forge-game',
  layers: DEFAULT_LAYER_NAMES,
  dimensions: new Vector2(window.innerWidth, window.innerHeight),
};

/**
 * Utility function to create a new game instance with the specified options.
 *
 * This function is typically used to get started quickly, but production games may not use this function as it only has one scene and initializes common entities (like a camera, inputs, etc.). Some games may not need or want these.
 *
 * @param options - Options to customize the game creation.
 * @returns An object containing the created game instance and related entities:
 * - `game`: The created Game instance.
 * - `gameContainer`: The HTML container element for the game.
 * - `scene`: The main Scene instance.
 * - `imageCache`: The ImageCache instance.
 * - `riveCache`: The RiveCache instance.
 * - `worldSpace`: The Space instance representing the game world.
 * - `layerService`: The LayerService instance.
 * - `world`: The World instance managing the entities and systems.
 * - `inputsEntity`: The Entity instance for handling inputs.
 * - `inputSystem`: The InputSystem instance.
 * - `cameraEntity`: The Entity instance for the camera.
 * - `cameraSystem`: The CameraSystem instance.
 * @example
 * const { game, gameContainer, scene, imageCache, worldSpace, layerService, world, inputsEntity, inputSystem, cameraEntity, cameraSystem } = await createGame({
 *   sceneName: 'myScene',
 *   container: 'game-container',
 *   layers: ['background', 'main', 'foreground'],
 *   dimensions: new Vector2(800, 600),
 * });
 */
export async function createGame(
  options: Partial<CreateGameOptions> = defaultOptions,
) {
  const mergedOptions = { ...defaultOptions, ...options };

  const game = new Game();

  const gameContainer = isString(mergedOptions.container)
    ? createContainer(mergedOptions.container as string)
    : (mergedOptions.container as HTMLElement);

  const scene = new Scene(mergedOptions.sceneName);
  const imageCache = new ImageCache();
  const riveCache = new RiveCache();

  const worldSpace = new Space(mergedOptions.dimensions);
  const layerService = new LayerService();

  const world = new World();

  const inputsEntity = new Entity('inputs', [new InputsComponent()]);

  const inputSystem = new InputSystem(gameContainer);

  world.addEntity(inputsEntity);
  world.addSystem(inputSystem);

  const cameraEntity = new Entity('world camera', [
    new CameraComponent({ allowZooming: false, allowPanning: false }),
    new PositionComponent(worldSpace.center.x, worldSpace.center.y),
  ]);

  for (const layerName of mergedOptions.layers) {
    const canvas = createCanvas(`$forge-layer-${layerName}`, gameContainer);
    const layer = new ForgeRenderLayer(layerName, canvas, CLEAR_STRATEGY.blank);

    layerService.registerLayer(layer);

    const layerRenderSystem = new RenderSystem({
      layer,
      cameraEntity,
    });

    world.addSystem(layerRenderSystem);
  }

  const cameraSystem = new CameraSystem(inputsEntity, game.time);

  world.addEntity(cameraEntity);
  world.addSystem(cameraSystem);

  scene.registerUpdatable(world);
  scene.registerStoppable(world);

  game.registerScene(scene);

  return {
    game,
    gameContainer,
    scene,
    imageCache,
    riveCache,
    worldSpace,
    layerService,
    world,
    inputsEntity,
    inputSystem,
    cameraEntity,
    cameraSystem,
  };
}
