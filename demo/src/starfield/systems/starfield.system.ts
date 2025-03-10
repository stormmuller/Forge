import * as forge from '../../../../src';
import { StarfieldComponent } from '../components';

export class StarfieldSystem extends forge.System {
  private _world: forge.World;
  private _random: forge.Random;
  private _sprite: forge.Sprite;

  constructor(world: forge.World, sprite: forge.Sprite) {
    super('starfield', [StarfieldComponent.symbol]);

    this._world = world;
    this._random = new forge.Random('starfield');
    this._sprite = sprite;
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
    const scaleComponent = new forge.ScaleComponent(0.5, 0.5);

    this._world.addEntity(
      new forge.Entity('star', [
        new forge.PositionComponent(
          Math.random() * window.innerWidth - window.innerWidth / 2,
          Math.random() * window.innerHeight - window.innerHeight / 2,
        ),
        scaleComponent,
        new forge.RotationComponent(0),
        new forge.SpriteComponent(this._sprite),
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
