import * as forge from '../../../../src';
import { StarfieldComponent } from '../components';

export class StarfieldSystem extends forge.System {
  private _world: forge.World;
  private _imageCache: forge.ImageCache;
  private _renderLayer: forge.ForgeRenderLayer;
  private _random: forge.Random;

  constructor(
    world: forge.World,
    imageCache: forge.ImageCache,
    renderLayer: forge.ForgeRenderLayer,
  ) {
    super('starfield', [StarfieldComponent.symbol]);

    this._world = world;
    this._imageCache = imageCache;
    this._renderLayer = renderLayer;
    this._random = new forge.Random('starfield');
  }

  public async run(entity: forge.Entity): Promise<void> {
    const starfieldComponent = entity.getComponentRequired<StarfieldComponent>(
      StarfieldComponent.symbol,
    );

    const numberOfStarsToSpawn =
      starfieldComponent.targetNumberOfStars - starfieldComponent.numberOfStars;

    for (let index = 0; index < numberOfStarsToSpawn; index++) {
      await this._createStar(starfieldComponent);
    }
  }

  private async _createStar(starfieldComponent: StarfieldComponent) {
    const image = await this._imageCache.getOrLoad('star_small.png');

    const sprite = new forge.Sprite({
      image,
      renderLayer: this._renderLayer,
    });

    const scaleComponent = new forge.ScaleComponent(0.5, 0.5);

    this._world.addEntity(
      new forge.Entity('star', [
        new forge.PositionComponent(
          Math.random() * window.innerWidth,
          Math.random() * window.innerHeight,
        ),
        scaleComponent,
        new forge.RotationComponent(0),
        new forge.SpriteComponent(sprite),
        new forge.AnimationComponent({
          duration: this._random.randomFloat(1000, 5000),
          updateCallback: (value: number) => {
            scaleComponent.x = value * 0.5;
            scaleComponent.y = value * 0.5;
          },
          loop: 'pingpong',
        }),
      ]),
    );

    starfieldComponent.numberOfStars++;
  }
}
