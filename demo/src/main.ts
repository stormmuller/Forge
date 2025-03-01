import { RiveEventPayload } from '@rive-app/canvas';
import { createShip } from './create-ship';
import { ShipMovementSystem } from './ship';
import { createStarfield } from './create-starfield';
import { StarfieldSystem } from './starfield';
import * as forge from '../../src';
import './style.css';

const riveFileUri = 'ui.riv';
const riveStateMachine = 'State Machine 1';
const riveStartOnClickedEventName = 'OnStartClicked';

const {
  imageCache,
  riveCache,
  world,
  game,
  layerService,
  inputsEntity,
  gameContainer,
} = await forge.createGame();

const foregroundRenderLayer = layerService.getLayer<forge.ForgeRenderLayer>(
  forge.DEFAULT_LAYERS.foreground,
);

await createShip(imageCache, foregroundRenderLayer, world);
createStarfield(world);

const riveFile = await riveCache.getOrLoad(riveFileUri);

const riveRenderLayer = new forge.RiveRenderLayer(
  forge.DEFAULT_LAYERS.ui,
  forge.createCanvas(forge.DEFAULT_LAYERS.ui, gameContainer),
  riveFile,
  riveStateMachine,
);

const onStartClickedEvent = new forge.ParameterizedEvent<RiveEventPayload>(
  `rive_${riveStartOnClickedEventName}`,
);

riveRenderLayer.registerRiveEvent(
  riveStartOnClickedEventName,
  onStartClickedEvent,
);

onStartClickedEvent.registerListener((payload) => {
  console.log('Start clicked', payload);
});

const shipMovementSystem = new ShipMovementSystem(inputsEntity, game.time);
const starfieldSystem = new StarfieldSystem(
  world,
  imageCache,
  foregroundRenderLayer,
);
const animationSystem = new forge.AnimationSystem(game.time);

world.addSystems([shipMovementSystem, starfieldSystem, animationSystem]);

game.run();
