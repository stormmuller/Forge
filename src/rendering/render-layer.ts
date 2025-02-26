import { Vector2 } from '../math';
import { CLEAR_STRATEGY, type CLEAR_STRATEGY_KEYS } from './types';

/**
 * The `RenderLayer` class represents a rendering layer with its own canvas and WebGL context.
 */
export class RenderLayer {
  /** The name of the render layer. */
  public name: string;

  /** The canvas element associated with the render layer. */
  public canvas: HTMLCanvasElement;

  /** The WebGL2 rendering context for the canvas. */
  public context: WebGL2RenderingContext;

  /** The center of the canvas. */
  public center: Vector2;

  /** The strategy for clearing the render layer. */
  public clearStrategy: CLEAR_STRATEGY_KEYS;

  /**
   * Constructs a new instance of the `RenderLayer` class.
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
    const context = canvas.getContext('webgl2');

    if (!context) {
      throw new Error('Context not found');
    }

    this.name = name;
    this.canvas = canvas;
    this.context = context;
    this.center = new Vector2(canvas.width / 2, canvas.height / 2);
    this.clearStrategy = clearStrategy;
  }

  /**
   * Resizes the canvas to the specified width and height, and updates the center.
   * @param width - The new width of the canvas.
   * @param height - The new height of the canvas.
   */
  public resize(width: number, height: number) {
    this.canvas.width = width;
    this.canvas.height = height;

    this.center = new Vector2(this.canvas.width / 2, this.canvas.height / 2);
  }
}
