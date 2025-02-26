import * as forge from '../../src';

export const createRenderLayer = (
  layerService: forge.LayerService,
  cameraEntity: forge.Entity,
  world: forge.World,
) => {
  const foregroundRenderLayer = layerService.createLayer('foreground');

  const foregroundRenderSystem = new forge.RenderSystem({
    layer: foregroundRenderLayer,
    cameraEntity,
  });

  world.addSystem(foregroundRenderSystem);

  return foregroundRenderLayer;
};
