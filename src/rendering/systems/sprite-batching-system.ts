import { PositionComponent } from '../../common';
import { Entity, System } from '../../ecs';
import { SpriteBatchComponent, SpriteComponent } from '../components';

/**
 * The `SpriteBatchingSystem` class extends the `System` class and manages the batching of sprites.
 */
export class SpriteBatchingSystem extends System {
  private _spriteBatch: SpriteBatchComponent;

  constructor(spriteBatcherEntity: Entity) {
    super('sprite-batching', [
      PositionComponent.symbol,
      SpriteComponent.symbol,
    ]);

    this._spriteBatch =
      spriteBatcherEntity.getComponentRequired<SpriteBatchComponent>(
        SpriteBatchComponent.symbol,
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

    if (!spriteComponent.enabled || spriteComponent.batched) {
      return;
    }

    this._spriteBatch.add(entity);
    spriteComponent.batched = true;
  }
}
