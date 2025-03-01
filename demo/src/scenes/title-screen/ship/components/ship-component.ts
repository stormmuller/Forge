import * as forge from '../../../../../../src';

export interface ShipComponentOptions {
  speed: number;
  rotationSpeed: number;
}

const defaultOptions: ShipComponentOptions = {
  speed: 0.1,
  rotationSpeed: 0.1,
};

export class ShipComponent implements forge.Component {
  public name: symbol;
  public speed: number;
  public rotationSpeed: number;

  public static symbol = Symbol('Ship');

  constructor(options: ShipComponentOptions) {
    this.name = ShipComponent.symbol;

    const { speed, rotationSpeed } = {
      ...defaultOptions,
      ...options,
    };

    this.speed = speed;
    this.rotationSpeed = rotationSpeed;
  }
}
