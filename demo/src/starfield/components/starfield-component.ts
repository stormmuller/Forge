import * as forge from '../../../../src';

export class StarfieldComponent implements forge.Component {
  public name: symbol;
  public targetNumberOfStars: number;
  public numberOfStars: number;
  public space: forge.Space;

  public static symbol = Symbol('StarField');

  constructor(numberOfStars: number, space: forge.Space) {
    this.name = StarfieldComponent.symbol;

    this.targetNumberOfStars = numberOfStars;
    this.numberOfStars = 0;
    this.space = space;
  }
}
