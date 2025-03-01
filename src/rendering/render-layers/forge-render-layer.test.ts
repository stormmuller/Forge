import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ForgeRenderLayer } from './forge-render-layer';
import { RenderLayer } from './render-layer';
import { CLEAR_STRATEGY, type CLEAR_STRATEGY_KEYS } from '../types';

describe('ForgeRenderLayer', () => {
  let canvas: HTMLCanvasElement;
  let context: WebGL2RenderingContext;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    context = {
      clear: vi.fn(),
      clearColor: vi.fn(),
      getContext: vi.fn().mockReturnValue(context),
    } as unknown as WebGL2RenderingContext;
    vi.spyOn(canvas, 'getContext').mockReturnValue(context);
  });

  it('should create a new ForgeRenderLayer with the specified name, canvas, and clear strategy', () => {
    const name = 'test-layer';
    const clearStrategy: CLEAR_STRATEGY_KEYS = CLEAR_STRATEGY.blank;

    const forgeRenderLayer = new ForgeRenderLayer(name, canvas, clearStrategy);

    expect(forgeRenderLayer.name).toBe(name);
    expect(forgeRenderLayer.canvas).toBe(canvas);
    expect(forgeRenderLayer.context).toBe(context);
    expect(forgeRenderLayer.clearStrategy).toBe(clearStrategy);
  });

  it('should throw an error if the WebGL2 context is not found', () => {
    vi.spyOn(canvas, 'getContext').mockReturnValue(null);

    expect(() => new ForgeRenderLayer('test-layer', canvas)).toThrow(
      'Context not found',
    );
  });

  it('should inherit from RenderLayer', () => {
    const forgeRenderLayer = new ForgeRenderLayer('test-layer', canvas);

    expect(forgeRenderLayer).toBeInstanceOf(RenderLayer);
  });

  it('should use the default clear strategy if none is provided', () => {
    const forgeRenderLayer = new ForgeRenderLayer('test-layer', canvas);

    expect(forgeRenderLayer.clearStrategy).toBe(CLEAR_STRATEGY.blank);
  });
});
