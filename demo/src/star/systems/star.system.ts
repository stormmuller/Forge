import * as forge from '../../../../src';
import { StarComponent } from '../components';

export class StarSystem extends forge.System {
  private _pool: forge.ObjectPool;
  private _bounds: forge.BoxCollider;

  constructor(pool: forge.ObjectPool, bounds: forge.BoxCollider) {
    super('star', [StarComponent.symbol, forge.PositionComponent.symbol]);
    this._pool = pool;
    this._bounds = bounds;
  }

  public async run(entity: forge.Entity): Promise<void> {
    const starComponent = entity.getComponentRequired<StarComponent>(
      StarComponent.symbol,
    );

    const positionComponent =
      entity.getComponentRequired<forge.PositionComponent>(
        forge.PositionComponent.symbol,
      );

    positionComponent.x += starComponent.velocity.x;
    positionComponent.y += starComponent.velocity.y;

    if (!this._bounds.contains(positionComponent)) {
      this._pool.release(entity);
    }
  }
}
