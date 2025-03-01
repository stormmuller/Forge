import { RenderLayer } from './render-layer';
import { CLEAR_STRATEGY, type CLEAR_STRATEGY_KEYS } from '../types';

/**
 * The `ForgeRenderLayer` class represents a rendering layer with its own canvas and WebGL context.
 */
export class ForgeRenderLayer extends RenderLayer {
  /** The WebGL2 rendering context for the canvas. */
  public context: WebGL2RenderingContext;

  /** The strategy for clearing the render layer. */
  public clearStrategy: CLEAR_STRATEGY_KEYS;

  /**
   * Constructs a new instance of the `ForgeRenderLayer` class.
   * @param name - The name of the render layer.
   * @param canvas - The canvas element associated with the render layer.
   * @param clearStrategy - The strategy for clearing the render layer (default: CLEAR_STRATEGY.blank).
   * @throws An error if the WebGL2 context is not found.
   */
  constructor(
    name: string,
    canvas: HTMLCanvasElement,
    clearStrategy: CLEAR_STRATEGY_KEYS = CLEAR_STRATEGY.blank,
  ) {
    super(name, canvas);

    const context = canvas.getContext('webgl2');

    if (!context) {
      throw new Error('Context not found');
    }

    this.context = context;
    this.clearStrategy = clearStrategy;
  }
}
