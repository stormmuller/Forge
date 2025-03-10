import { isNil, PositionComponent } from '../../common';
import { Entity, System } from '../../ecs';
import { CameraComponent, SpriteBatchComponent } from '../components';
import { createProjectionMatrix } from '../shaders/utils/create-projection-matrix';
import { Matrix3x3, Vector2 } from '../../math';
import {
  bindTextureToUniform,
  createProgram,
  spriteFragmentShader,
  spriteVertexShader,
} from '../shaders';
import type { ForgeRenderLayer } from '../render-layers';
import type { Camera } from '../camera';

/**
 * Options for configuring the `RenderSystem`.
 */
export interface RenderSystemOptions {
  /** The render layer to use for rendering. */
  layer: ForgeRenderLayer;

  /** The entity that contains the camera component. */
  cameraEntity: Entity;

  /** The WebGL program to use for rendering (optional). */
  program?: WebGLProgram;
}

const FLOATS_PER_MATRIX = 9;

/**
 * The `RenderSystem` class extends the `System` class and manages the rendering of sprites.
 */
export class RenderSystem extends System {
  private _layer: ForgeRenderLayer;
  private _program: WebGLProgram;

  private _uTextureLoc: WebGLUniformLocation;
  private _matrixLocation: number;

  private _instanceBuffer: WebGLBuffer;

  // A single VAO storing all attribute pointer states
  private _vao: WebGLVertexArrayObject;

  private _cameraPosition: Vector2;
  private _camera: Camera;

  constructor(options: RenderSystemOptions) {
    super('renderer', [SpriteBatchComponent.symbol]);

    const { layer, cameraEntity, program } = options;
    this._layer = layer;

    const cameraPosition = cameraEntity.getComponentRequired<PositionComponent>(
      PositionComponent.symbol,
    );
    if (isNil(cameraPosition)) {
      throw new Error(
        `The 'camera' provided to the ${this.name} system during construction is missing the "${PositionComponent.name}" component`,
      );
    }
    this._cameraPosition = cameraPosition;

    const camera = cameraEntity.getComponentRequired<CameraComponent>(
      CameraComponent.symbol,
    );
    if (isNil(camera)) {
      throw new Error(
        `The 'camera' provided to the ${this.name} system during construction is missing the "${CameraComponent.name}" component`,
      );
    }

    this._camera = camera;

    this._program =
      program ??
      createProgram(layer.context, spriteVertexShader, spriteFragmentShader);

    layer.context.useProgram(this._program);

    this._uTextureLoc = layer.context.getUniformLocation(
      this._program,
      'u_texture',
    )!; // TODO: handle null
    this._matrixLocation = layer.context.getAttribLocation(
      this._program,
      'a_instanceMatrix',
    );

    this._vao = layer.context.createVertexArray() as WebGLVertexArrayObject;
    layer.context.bindVertexArray(this._vao);

    this._getSpriteBuffers(this._program);

    this._instanceBuffer = layer.context.createBuffer() as WebGLBuffer;
    layer.context.bindBuffer(layer.context.ARRAY_BUFFER, this._instanceBuffer);
    // We won't upload data yet; just define the layout:

    // Each mat3 is 3 "columns" of vec3 in column-major
    // a_instanceMatrix consumes 3 consecutive attribute locations:
    //   matrixLoc + 0, matrixLoc + 1, matrixLoc + 2
    for (let column = 0; column < 3; column++) {
      const attribLoc = this._matrixLocation + column;
      layer.context.enableVertexAttribArray(attribLoc);

      // offset for each column = column * 3 floats
      const offsetInBytes = column * 3 * 4;
      const strideInBytes = FLOATS_PER_MATRIX * 4; // 9 floats * 4 bytes

      layer.context.vertexAttribPointer(
        attribLoc,
        3, // each column is a vec3
        layer.context.FLOAT,
        false,
        strideInBytes,
        offsetInBytes,
      );

      // We only advance to the next mat3 after each instance
      layer.context.vertexAttribDivisor(attribLoc, 1);
    }

    // Unbind the VAO now that it's fully set up
    layer.context.bindVertexArray(null);

    // Enable blending
    layer.context.enable(layer.context.BLEND);
    layer.context.blendFunc(
      layer.context.SRC_ALPHA,
      layer.context.ONE_MINUS_SRC_ALPHA,
    );
  }

  /**
   * Prepares the render system before processing all entities.
   * @param entities - The array of entities to process.
   * @returns The sorted array of entities.
   */
  public override beforeAll(entities: Entity[]) {
    this._layer.context.clear(this._layer.context.COLOR_BUFFER_BIT);

    return entities;
  }

  /**
   * Runs the render system for the given entity, rendering the sprite.
   * @param entity - The entity that contains the `SpriteComponent` and `PositionComponent`.
   */
  public async run(entity: Entity): Promise<void> {
    const spriteBatchComponent =
      entity.getComponentRequired<SpriteBatchComponent>(
        SpriteBatchComponent.symbol,
      );

    // Bind the VAO once per "run" (once for each system tick)
    this._layer.context.bindVertexArray(this._vao);

    for (const [sprite, batch] of spriteBatchComponent.batches) {
      if (sprite.renderLayer !== this._layer) {
        continue;
      }

      const instanceData = new Float32Array(batch.length * FLOATS_PER_MATRIX);

      for (let instanceId = 0; instanceId < batch.length; instanceId++) {
        const { position, rotation, scale, sprite } = batch[instanceId]!;

        const mat = this._getSpriteMatrix(
          position,
          rotation?.radians ?? 0,
          sprite.width,
          sprite.height,
          scale ?? Vector2.one,
          sprite.pivot,
        );

        // Copy mat into instanceData
        // mat.matrix is a 9-element array in column-major
        for (let i = 0; i < FLOATS_PER_MATRIX; i++) {
          instanceData[instanceId * FLOATS_PER_MATRIX + i] = mat.matrix[i]!;
        }
      }

      this._layer.context.bindBuffer(
        this._layer.context.ARRAY_BUFFER,
        this._instanceBuffer,
      );

      this._layer.context.bufferData(
        this._layer.context.ARRAY_BUFFER,
        instanceData,
        this._layer.context.DYNAMIC_DRAW,
      );

      bindTextureToUniform(
        this._layer.context,
        sprite.texture,
        this._uTextureLoc,
        0,
      );

      this._layer.context.drawArraysInstanced(
        this._layer.context.TRIANGLES,
        0,
        6,
        batch.length,
      );
    }

    // Unbind VAO (optional; many engines just leave it bound)
    this._layer.context.bindVertexArray(null);
  }

  /**
   * Called once at system stop to clear.
   */
  public override stop(): void {
    this._layer.context.clear(this._layer.context.COLOR_BUFFER_BIT);
  }

  /**
   * Creates the static quad geometry buffers (positions + tex coords)
   * and configures them as vertex attributes. This is called while our VAO
   * is bound, so these attribute settings are recorded in the VAO.
   */
  private _getSpriteBuffers(program: WebGLProgram) {
    const positions = new Float32Array([
      0.0, 0.0, 1.0, 0.0, 0.0, 1.0,

      0.0, 1.0, 1.0, 0.0, 1.0, 1.0,
    ]);

    const texCoords = new Float32Array([
      0.0, 0.0, 1.0, 0.0, 0.0, 1.0,

      0.0, 1.0, 1.0, 0.0, 1.0, 1.0,
    ]);

    // Create + bind position buffer
    const positionBuffer = this._layer.context.createBuffer();
    this._layer.context.bindBuffer(
      this._layer.context.ARRAY_BUFFER,
      positionBuffer,
    );
    this._layer.context.bufferData(
      this._layer.context.ARRAY_BUFFER,
      positions,
      this._layer.context.STATIC_DRAW,
    );

    const aPositionLoc = this._layer.context.getAttribLocation(
      program,
      'a_position',
    );
    this._layer.context.enableVertexAttribArray(aPositionLoc);
    this._layer.context.enableVertexAttribArray(aPositionLoc);
    this._layer.context.vertexAttribPointer(
      aPositionLoc,
      2,
      this._layer.context.FLOAT,
      false,
      0,
      0,
    );

    // Create + bind texCoord buffer
    const texCoordBuffer = this._layer.context.createBuffer();
    this._layer.context.bindBuffer(
      this._layer.context.ARRAY_BUFFER,
      texCoordBuffer,
    );
    this._layer.context.bufferData(
      this._layer.context.ARRAY_BUFFER,
      texCoords,
      this._layer.context.STATIC_DRAW,
    );

    const aTexCoordLoc = this._layer.context.getAttribLocation(
      program,
      'a_texCoord',
    );
    this._layer.context.enableVertexAttribArray(aTexCoordLoc);
    this._layer.context.vertexAttribPointer(
      aTexCoordLoc,
      2,
      this._layer.context.FLOAT,
      false,
      0,
      0,
    );
  }

  /**
   * Builds a column-major 3x3 matrix for each sprite instance
   * (projection -> translation -> rotation -> scale -> pivot).
   */
  private _getSpriteMatrix(
    position: Vector2,
    rotation: number,
    spriteWidth: number,
    spriteHeight: number,
    scale: Vector2,
    pivot: Vector2,
  ): Matrix3x3 {
    const { width, height } = this._layer.canvas;
    const { x: camX, y: camY } = this._cameraPosition;
    const zoom = this._camera.zoom;

    // Start with a standard projection:
    const matrix = createProjectionMatrix(width, height);

    // 1) Translate so screen center becomes the new origin
    matrix.translate(width / 2, height / 2);

    // 2) Scale around that center
    matrix.scale(zoom, zoom);

    // 3) Translate back so that (0, 0) again refers to the top-left corner,
    //    but now any scaling has happened around the screen center
    matrix.translate(-width / 2, -height / 2);

    // 4) Apply camera offset (so that cameraPosition is centered on screen)
    matrix.translate(camX + width / 2, camY + height / 2);

    // 5) Now place this particular sprite
    matrix.translate(position.x, position.y);
    matrix.rotate(rotation);
    matrix.scale(spriteWidth * scale.x, spriteHeight * scale.y);

    // 6) Finally apply sprite pivot if needed
    matrix.translate(-pivot.x, -pivot.y);

    return matrix;
  }
}
