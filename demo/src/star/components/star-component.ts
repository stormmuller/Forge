import * as forge from '../../../../src';

export class StarComponent implements forge.Component {
  public name: symbol;

  public static symbol = Symbol('Star');
  public velocity: forge.Vector2;

  private _random: forge.Random;

  constructor(random: forge.Random) {
    this.name = StarComponent.symbol;
    this._random = random;

    this.recalculateVelocity();
  }

  public recalculateVelocity = (): void => {
    this.velocity = new forge.Vector2(
      this._random.randomFloat(-1, 1),
      this._random.randomFloat(-1, 1),
    )
      .normalize()
      .multiply(this._random.randomFloat(0.1, 5));
  };
}
