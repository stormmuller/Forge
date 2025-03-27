import {
  PositionComponent,
  RotationComponent,
  ScaleComponent,
} from '../../common';
import { Entity, System } from '../../ecs';
import {
  type Batchable,
  RenderableBatchComponent,
  SpriteComponent,
} from '../components';

/**
 * The `SpriteBatchingSystem` class extends the `System` class and manages the batching of sprites.
 */
export class SpriteBatchingSystem extends System {
  private _spriteBatch: RenderableBatchComponent;

  constructor(spriteBatcherEntity: Entity) {
    super('sprite-batching', [
      PositionComponent.symbol,
      SpriteComponent.symbol,
    ]);

    this._spriteBatch =
      spriteBatcherEntity.getComponentRequired<RenderableBatchComponent>(
        RenderableBatchComponent.symbol,
      );
  }

  /**
   * Runs the batching system for the given entity, batching the sprite.
   * @param entity - The entity.
   */
  public async run(entity: Entity): Promise<void> {
    const spriteComponent = entity.getComponentRequired<SpriteComponent>(
      SpriteComponent.symbol,
    );

    if (
      !spriteComponent.enabled ||
      spriteComponent.batched ||
      spriteComponent.sprite.renderLayer !== this._spriteBatch.renderLayer
    ) {
      return;
    }

    const { renderable } = spriteComponent.sprite;

    const position = entity.getComponentRequired<PositionComponent>(
      PositionComponent.symbol,
    );
    const rotation = entity.getComponent<RotationComponent>(
      RotationComponent.symbol,
    );
    const scale = entity.getComponent<ScaleComponent>(ScaleComponent.symbol);

    const batchEntry: Batchable = {
      renderable,
      width: spriteComponent.sprite.width,
      height: spriteComponent.sprite.height,
      pivot: spriteComponent.sprite.pivot,
      position,
      rotation,
      scale,
    };

    if (!this._spriteBatch.batches.has(renderable)) {
      this._spriteBatch.batches.set(renderable, []);
    }

    this._spriteBatch.batches.get(renderable)!.push(batchEntry);
    spriteComponent.batched = true;
  }
}
