import { Vector2 } from '../math';
import { RenderLayer } from './render-layer';
import { CLEAR_STRATEGY, type CLEAR_STRATEGY_KEYS } from './types';

/**
 * Options for creating a new render layer.
 */
export interface CreateLayerOptions {
  /** The dimensions of the layer. */
  dimensions?: { width: number; height: number };

  /** The strategy for clearing the layer. */
  clearStrategy?: CLEAR_STRATEGY_KEYS;
}

/**
 * Default options for creating a new render layer.
 */
const defaultOptions = {
  dimensions: { width: window.innerWidth, height: window.innerHeight },
  clearStrategy: CLEAR_STRATEGY.blank,
} as const;

/**
 * The `LayerService` class manages the creation, registration, and resizing of render layers.
 */
export class LayerService {
  private _layers: Map<string, RenderLayer>;
  private _container: HTMLElement;

  /**
   * Constructs a new instance of the `LayerService` class.
   * @param container - The HTML container element to append the canvas elements to.
   */
  constructor(container: HTMLElement) {
    this._container = container;
    this._layers = new Map();
  }

  /**
   * Creates a new render layer and appends its canvas element to the container.
   * @param name - The name of the layer.
   * @param options - The options for creating the layer.
   * @returns The created `RenderLayer` instance.
   * @throws An error if the WebGL2 context is not found.
   */
  public createLayer(name: string, options: CreateLayerOptions = {}) {
    const canvas = document.createElement('canvas');
    canvas.id = `pf-canvas-${name}`;
    canvas.width = options.dimensions?.width || window.innerWidth;
    canvas.height = options.dimensions?.height || window.innerHeight;

    this._container.appendChild(canvas);

    const context = canvas.getContext('webgl2');

    if (!context) {
      throw new Error('Context not found');
    }

    const layer = this.registerLayer(name, canvas, options);

    return layer;
  }

  /**
   * Registers an existing canvas element as a render layer.
   * @param name - The name of the layer.
   * @param canvas - The canvas element to register.
   * @param options - The options for creating the layer.
   * @returns The registered `RenderLayer` instance.
   */
  public registerLayer(
    name: string,
    canvas: HTMLCanvasElement,
    options: CreateLayerOptions = {},
  ) {
    const mergedOptions = { ...defaultOptions, ...options };
    const layer = new RenderLayer(name, canvas, mergedOptions.clearStrategy);
    layer.resize(
      mergedOptions.dimensions.width,
      mergedOptions.dimensions.height,
    );

    this._layers.set(name, layer);

    return layer;
  }

  /**
   * Retrieves a render layer by its name.
   * @param name - The name of the layer.
   * @returns The `RenderLayer` instance.
   * @throws An error if the layer is not found.
   */
  public getLayer(name: string): RenderLayer {
    const layer = this._layers.get(name);

    if (!layer) {
      throw new Error(`Layer ${name} not found`);
    }

    return layer;
  }

  /**
   * Resizes all registered layers to the specified dimensions.
   * @param dimensions - The new dimensions for the layers. If not provided, the window dimensions are used.
   */
  public resizeAllLayers(dimensions?: Vector2) {
    const newDimensions =
      dimensions || new Vector2(window.innerWidth, window.innerHeight);

    for (const layer of this._layers.values()) {
      layer.resize(newDimensions.x, newDimensions.y);
    }
  }
}
