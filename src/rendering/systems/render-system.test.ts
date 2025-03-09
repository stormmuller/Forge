/* eslint-disable @typescript-eslint/naming-convention */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RenderSystem, RenderSystemOptions } from './render-system';
import { Entity } from '../../ecs';
import {
  PositionComponent,
  RotationComponent,
  ScaleComponent,
} from '../../common';
import { CameraComponent, SpriteComponent } from '../components';
import { Vector2 } from '../../math';
import { ForgeRenderLayer } from '../render-layers';

describe('RenderSystem', () => {
  let cameraEntity: Entity;
  let renderSystem: RenderSystem;
  let entity: Entity;
  let positionComponent: PositionComponent;
  let spriteComponent: SpriteComponent;
  let cameraComponent: CameraComponent;

  const renderLayer = {
    context: {
      useProgram: vi.fn(),
      enable: vi.fn(),
      blendFunc: vi.fn(),
      clear: vi.fn(),
      getUniformLocation: vi.fn(),
      activeTexture: vi.fn(),
      bindTexture: vi.fn(),
      uniform1i: vi.fn(),
      uniformMatrix3fv: vi.fn(),
      drawArrays: vi.fn(),
      createBuffer: vi.fn(),
      bindBuffer: vi.fn(),
      bufferData: vi.fn(),
      getAttribLocation: vi.fn(),
      enableVertexAttribArray: vi.fn(),
      vertexAttribPointer: vi.fn(),
      createShader: vi.fn(() => shader),
      shaderSource: vi.fn(),
      compileShader: vi.fn(),
      getShaderParameter: vi.fn(() => ({})),
      createProgram: vi.fn(() => ({})),
      attachShader: vi.fn(),
      linkProgram: vi.fn(),
      getProgramParameter: vi.fn(() => ({})),
      COLOR_BUFFER_BIT: 1,
      TEXTURE0: 2,
      TEXTURE_2D: 3,
      TRIANGLES: 4,
    },
    canvas: {
      width: 800,
      height: 600,
    },
  };

  const shader = {};

  beforeEach(() => {
    cameraComponent = {
      isStatic: false,
      allowZooming: true,
      allowPanning: true,
      zoom: 1,
      zoomSensitivity: 0.1,
      minZoom: 0.5,
      maxZoom: 2,
      panSensitivity: 0.5,
    } as CameraComponent;

    positionComponent = {
      x: 0,
      y: 0,
    } as PositionComponent;

    spriteComponent = {
      enabled: true,
      sprite: {
        renderLayer: renderLayer as unknown as ForgeRenderLayer,
        texture: {} as WebGLTexture,
        width: 100,
        height: 100,
        pivot: new Vector2(0.5, 0.5),
      },
    } as SpriteComponent;

    cameraEntity = {
      getComponentRequired: vi.fn((symbol) => {
        if (symbol === CameraComponent.symbol) return cameraComponent;
        if (symbol === PositionComponent.symbol) return positionComponent;
      }),
    } as unknown as Entity;

    entity = {
      getComponentRequired: vi.fn((symbol) => {
        if (symbol === SpriteComponent.symbol) return spriteComponent;
        if (symbol === PositionComponent.symbol) return positionComponent;
      }),
      getComponent: vi.fn((symbol) => {
        if (symbol === ScaleComponent.symbol) return null;
        if (symbol === RotationComponent.symbol) return null;
      }),
    } as unknown as Entity;

    const options: RenderSystemOptions = {
      layer: renderLayer as unknown as ForgeRenderLayer,
      cameraEntity: cameraEntity,
    };

    renderSystem = new RenderSystem(options);
  });

  it('should prepare the render system before processing all entities', () => {
    const entities = [entity];

    const sortedEntities = renderSystem.beforeAll(entities);

    expect(renderLayer.context.clear).toHaveBeenCalledWith(
      renderLayer.context.COLOR_BUFFER_BIT,
    );
    expect(sortedEntities).toEqual(entities);
  });

  it('should render the sprite for the given entity', async () => {
    renderLayer.context.getUniformLocation.mockReturnValue(() => ({}));
    await renderSystem.run(entity);

    expect(renderLayer.context.activeTexture).toHaveBeenCalledWith(
      renderLayer.context.TEXTURE0,
    );
    expect(renderLayer.context.bindTexture).toHaveBeenCalledWith(
      renderLayer.context.TEXTURE_2D,
      spriteComponent.sprite.texture,
    );
    expect(renderLayer.context.uniform1i).toHaveBeenCalled();
    expect(renderLayer.context.uniformMatrix3fv).toHaveBeenCalled();
    expect(renderLayer.context.drawArrays).toHaveBeenCalledWith(
      renderLayer.context.TRIANGLES,
      0,
      6,
    );
  });

  it('should not render the sprite if it is not enabled', async () => {
    spriteComponent.enabled = false;

    await renderSystem.run(entity);

    expect(renderLayer.context.drawArrays).not.toHaveBeenCalled();
  });

  it('should not render the sprite if it belongs to a different render layer', async () => {
    spriteComponent.sprite.renderLayer = {} as ForgeRenderLayer;

    await renderSystem.run(entity);

    expect(renderLayer.context.drawArrays).not.toHaveBeenCalled();
  });
});
