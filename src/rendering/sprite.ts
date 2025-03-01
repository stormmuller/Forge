import { Vector2 } from '../math';
import type { ForgeRenderLayer } from './render-layers';
import { createTextureFromImage } from './shaders';

/**
 * Options for creating a `Sprite`.
 */
export type SpriteOptions = {
  /** The image element to use for the sprite. */
  image: HTMLImageElement;

  /** The render layer to which the sprite belongs. */
  renderLayer: ForgeRenderLayer;

  /** The bleed value to apply to the sprite (optional). */
  bleed?: number;

  /** The pivot point of the sprite (optional). */
  pivot?: Vector2;
};

/**
 * Default options for creating a `Sprite`.
 */
const defaultOptions = {
  bleed: 1,
  pivot: new Vector2(0.5, 0.5),
};

/**
 * The `Sprite` class represents a sprite in the rendering system.
 */
export class Sprite {
  /** The image element associated with the sprite. */
  public image: HTMLImageElement;

  /** The render layer to which the sprite belongs. */
  public renderLayer: ForgeRenderLayer;

  /** The bleed value applied to the sprite. */
  public bleed: number;

  /** The width of the sprite, including the bleed value. */
  public width: number;

  /** The height of the sprite, including the bleed value. */
  public height: number;

  /** The WebGL texture created from the image. */
  public texture: WebGLTexture;

  /** The pivot point of the sprite. */
  public pivot: Vector2;

  /**
   * Constructs a new instance of the `Sprite` class.
   * @param options - The options for creating the sprite.
   */
  constructor(options: SpriteOptions) {
    const { image, bleed, pivot, renderLayer } = {
      ...defaultOptions,
      ...options,
    };

    this.image = image;
    this.renderLayer = renderLayer;
    this.bleed = bleed;
    this.width = image.width + bleed;
    this.height = image.height + bleed;
    this.texture = createTextureFromImage(renderLayer.context, this.image);
    this.pivot = pivot;
  }
}
