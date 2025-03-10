import {
  type OrNull,
  PositionComponent,
  RotationComponent,
  ScaleComponent,
} from '../../common';
import type { Component, Entity } from '../../ecs';
import type { Sprite } from '../sprite';
import { SpriteComponent } from './sprite-component';

export interface Batchable {
  sprite: Sprite;
  position: PositionComponent;
  rotation: OrNull<RotationComponent>;
  scale: OrNull<ScaleComponent>;
}

export type Batch = Batchable[];

/**
 * The `SpriteComponent` class implements the `Component` interface and represents
 * a component that contains a `Sprite`.
 */
export class SpriteBatchComponent implements Component {
  /** The name property holds the unique symbol for this component. */
  public name: symbol;

  /** A static symbol property that uniquely identifies the `SpriteComponent`. */
  public static symbol = Symbol('SpriteBatch');

  /** The map of batched entities. */
  public batches: Map<Sprite, Batch> = new Map();

  /**
   * Constructs a new instance of the `SpriteComponent` class with the given `Sprite`.
   * @param sprite - The `Sprite` instance to associate with this component.
   * @param enabled - Indicates whether the sprite is enabled or not (default: true).
   */
  constructor(entities: Entity[] = []) {
    this.name = SpriteBatchComponent.symbol;

    for (const entity of entities) {
      this.add(entity);
    }
  }

  /**
   * Adds an entity to the batch.
   * @param entity - The entity to add to the batch.
   * TODO: move this logic into the batching system
   * */
  public add(entity: Entity): void {
    const spriteComponent = entity.getComponentRequired<SpriteComponent>(
      SpriteComponent.symbol,
    );

    const positionComponent = entity.getComponentRequired<PositionComponent>(
      PositionComponent.symbol,
    );

    const rotationComponent = entity.getComponent<RotationComponent>(
      RotationComponent.symbol,
    );

    const scaleComponent = entity.getComponent<ScaleComponent>(
      ScaleComponent.symbol,
    );

    const batchable = {
      sprite: spriteComponent.sprite,
      position: positionComponent,
      rotation: rotationComponent,
      scale: scaleComponent,
    };

    if (!this.batches.has(spriteComponent.sprite)) {
      this.batches.set(spriteComponent.sprite, []);
    }

    this.batches.get(spriteComponent.sprite)!.push(batchable);
  }
}
