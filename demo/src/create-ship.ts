import * as forge from '../../src';
import { ShipComponent } from './ship';

export const createShip = async (
  imageCache: forge.ImageCache,
  renderLayer: forge.ForgeRenderLayer,
  world: forge.World,
) => {
  const image = await imageCache.getOrLoad('ship.png');

  const material = new forge.SpriteMaterial(renderLayer.context, image);
  const renderable = new forge.Renderable(
    forge.createQuadGeometry(renderLayer.context),
    material,
  );

  const shipSprite = new forge.Sprite({
    renderable,
    renderLayer,
    width: image.width,
    height: image.height,
  });

  const positionComponent = new forge.PositionComponent(0, 0);

  const scaleComponent = new forge.ScaleComponent();

  const shipEntity = new forge.Entity('ship', [
    positionComponent,
    scaleComponent,
    new forge.RotationComponent(0),
    new forge.SpriteComponent(shipSprite),
    new ShipComponent({
      rotationSpeed: 0.5,
      speed: 0.5,
    }),
  ]);

  world.addEntity(shipEntity);

  return shipEntity;
};
