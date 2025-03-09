import { isNil, PositionComponent } from '../../common';
import { Entity, System } from '../../ecs';
import {
  CameraComponent,
  SpriteBatchComponent,
  SpriteComponent,
} from '../components';
import { createProjectionMatrix } from '../shaders/utils/create-projection-matrix';
import { Matrix3x3, Vector2 } from '../../math';
import {
  bindTextureToUniform,
  createProgram,
  spriteFragmentShader,
  spriteVertexShader,
} from '../shaders';
import type { ForgeRenderLayer } from '../render-layers';

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

  /**
   * Constructs a new instance of the `RenderSystem` class.
   * @param options - The options for configuring the render system.
   */
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

    const camera = cameraEntity.getComponentRequired<CameraComponent>(
      CameraComponent.symbol,
    );

    if (isNil(camera)) {
      throw new Error(
        `The 'camera' provided to the ${this.name} system during construction is missing the "${CameraComponent.name}" component`,
      );
    }

    this._program =
      program ??
      createProgram(layer.context, spriteVertexShader, spriteFragmentShader);

    this._uTextureLoc = this._layer.context.getUniformLocation(
      this._program,
      'u_texture',
    )!; // TODO: handle null

    this._matrixLocation = this._layer.context.getAttribLocation(
      this._program,
      'a_instanceMatrix',
    );

    this._instanceBuffer = this._layer.context.createBuffer();

    const { context } = this._layer;

    context.useProgram(this._program);
    this._getSpriteBuffers(this._program);

    context.enable(context.BLEND);

    context.blendFunc(context.SRC_ALPHA, context.ONE_MINUS_SRC_ALPHA);
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

    for (const [sprite, batch] of spriteBatchComponent.batches) {
      const instanceData = new Float32Array(batch.length * FLOATS_PER_MATRIX);

      for (let instanceId = 0; instanceId < batch.length; instanceId++) {
        const { position, rotation, scale, sprite } = batch[instanceId]!;

        const mat = this._getSpriteMatrix(
          position,
          rotation,
          sprite.width,
          sprite.height,
          scale,
          sprite.pivot,
        );

        for (let row = 0; row < mat.matrix.length; row++) {
          instanceData[instanceId * mat.matrix.length + row] = mat.matrix[row]!;
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

      // Each column is a vec3, so "size" = 3, "stride" = 9 floats * 4 bytes = 36
      // and the offset for each column is 0, 3, and 6 floats * 4 bytes.
      for (let column = 0; column < 3; column++) {
        const attribLoc = this._matrixLocation + column;
        this._layer.context.enableVertexAttribArray(attribLoc);

        // We skip 'column * 3' floats for each column
        const offsetInBytes = column * 3 * 4;

        this._layer.context.vertexAttribPointer(
          attribLoc,
          3, // each column is 3 floats
          this._layer.context.FLOAT, // type
          false, // normalized
          9 * 4, // stride in bytes (9 floats total for each matrix)
          offsetInBytes, // offset in bytes to this column
        );

        // Now set the divisor so it advances once per instance
        this._layer.context.vertexAttribDivisor(attribLoc, 1);
      }

      bindTextureToUniform(
        this._layer.context,
        sprite.texture,
        this._uTextureLoc,
        0,
      );

      this._layer.context.drawArraysInstanced(
        this._layer.context.TRIANGLES,
        0, // offset
        6,
        batch.length, // number of instances
      );
    }
  }

  /**
   * Creates and sets up the buffers for rendering sprites.
   * @param program - The WebGL program to use for rendering.
   */
  private _getSpriteBuffers(program: WebGLProgram) {
    const gl = this._layer.context;

    // Create a single quad with 2 triangles.
    const positions = new Float32Array([
      //  X,   Y
      0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0,
    ]);

    const texCoords = new Float32Array([
      // U, V
      0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0,
    ]);

    // Position buffer
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    const aPositionLoc = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(aPositionLoc);
    gl.vertexAttribPointer(aPositionLoc, 2, gl.FLOAT, false, 0, 0);

    // Texture coordinate buffer
    const texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);
    const aTexCoordLoc = gl.getAttribLocation(program, 'a_texCoord');
    gl.enableVertexAttribArray(aTexCoordLoc);
    gl.vertexAttribPointer(aTexCoordLoc, 2, gl.FLOAT, false, 0, 0);

    return { positionBuffer, texCoordBuffer };
  }

  /**
   * Computes the transformation matrix for rendering a sprite.
   * @param position - The position of the sprite.
   * @param rotation - The rotation angle of the sprite in radians.
   * @param spriteWidth - The width of the sprite.
   * @param spriteHeight - The height of the sprite.
   * @param scale - The scale of the sprite.
   * @param pivot - The pivot point of the sprite.
   * @returns The computed transformation matrix.
   */
  private _getSpriteMatrix(
    position: Vector2,
    rotation: number,
    spriteWidth: number,
    spriteHeight: number,
    scale: Vector2,
    pivot: Vector2,
  ): Matrix3x3 {
    const matrix = createProjectionMatrix(
      this._layer.canvas.width,
      this._layer.canvas.height,
    );

    matrix
      .translate(position.x, position.y)
      .rotate(rotation)
      .scale(scale.x * spriteWidth, scale.y * spriteHeight)
      .translate(-pivot.x, -pivot.y);

    return matrix;
  }

  private _sortEntities(entities: Entity[]) {
    return entities.sort((entity1, entity2) => {
      const position1 = entity1.getComponentRequired<PositionComponent>(
        PositionComponent.symbol,
      );

      const spriteComponent1 = entity1.getComponentRequired<SpriteComponent>(
        SpriteComponent.symbol,
      );

      const position2 = entity2.getComponentRequired<PositionComponent>(
        PositionComponent.symbol,
      );

      const spriteComponent2 = entity2.getComponentRequired<SpriteComponent>(
        SpriteComponent.symbol,
      );

      return (
        position1.y -
        spriteComponent1.sprite.pivot.y -
        (position2.y - spriteComponent2.sprite.pivot.y)
      );
    });
  }

  public override stop(): void {
    this._layer.context.clear(this._layer.context.COLOR_BUFFER_BIT);
  }
}
