import type { Component } from '../../ecs';
import { BoxCollider } from '../colliders';

/**
 * The `BoxColliderComponent` class implements the `Component` interface and represents
 * a component that contains a `BoxCollider`.
 */
export class BoxColliderComponent implements Component {
  /** The name property holds the unique symbol for this component. */
  public name: symbol;

  /** The `BoxCollider` instance associated with this component. */
  public boxCollider: BoxCollider;

  /** A static symbol property that uniquely identifies the `BoxColliderComponent`. */
  public static symbol = Symbol('BoxCollider');

  /**
   * Constructs a new instance of the `BoxColliderComponent` class with the given `BoxCollider`.
   * @param boxCollider - The `BoxCollider` instance to associate with this component.
   */
  constructor(boxCollider: BoxCollider) {
    this.name = BoxColliderComponent.symbol;
    this.boxCollider = boxCollider;
  }
}
