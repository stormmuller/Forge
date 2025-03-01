import {
  isNil,
  PositionComponent,
  RotationComponent,
  ScaleComponent,
} from '../../common';
import { Entity, System } from '../../ecs';
import { CameraComponent, SpriteComponent } from '../components';
import { createProjectionMatrix } from '../shaders/utils/create-projection-matrix';
import { Matrix3x3, Vector2 } from '../../math';
import {
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

/**
 * The `RenderSystem` class extends the `System` class and manages the rendering of sprites.
 */
export class RenderSystem extends System {
  private _layer: ForgeRenderLayer;
  private _program: WebGLProgram;

  /**
   * Constructs a new instance of the `RenderSystem` class.
   * @param options - The options for configuring the render system.
   */
  constructor(options: RenderSystemOptions) {
    super('renderer', [PositionComponent.symbol, SpriteComponent.symbol]);

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

    const sortedEntities = entities.sort((entity1, entity2) => {
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

    return sortedEntities;
  }

  /**
   * Runs the render system for the given entity, rendering the sprite.
   * @param entity - The entity that contains the `SpriteComponent` and `PositionComponent`.
   */
  public async run(entity: Entity): Promise<void> {
    const spriteComponent = entity.getComponentRequired<SpriteComponent>(
      SpriteComponent.symbol,
    );

    if (spriteComponent.sprite.renderLayer !== this._layer) {
      return; // Probably not the best way to handle layers/sprite, but the alternatives have their own issues.
    }

    if (!spriteComponent.enabled) {
      return;
    }

    const position = entity.getComponentRequired<PositionComponent>(
      PositionComponent.symbol,
    );

    const scale = entity.getComponent<ScaleComponent>(ScaleComponent.symbol);

    const rotation = entity.getComponent<RotationComponent>(
      RotationComponent.symbol,
    );

    const uMatrixLoc = this._layer.context.getUniformLocation(
      this._program,
      'u_matrix',
    );

    this._layer.context.activeTexture(this._layer.context.TEXTURE0);
    this._layer.context.bindTexture(
      this._layer.context.TEXTURE_2D,
      spriteComponent.sprite.texture,
    );

    // Set u_texture uniform to texture unit 0
    const uTextureLoc = this._layer.context.getUniformLocation(
      this._program,
      'u_texture',
    );
    this._layer.context.uniform1i(uTextureLoc, 0);

    // Compute transformation matrix
    const mat = this._getSpriteMatrix(
      position,
      rotation?.radians ?? 0,
      spriteComponent.sprite.width,
      spriteComponent.sprite.height,
      scale ?? Vector2.one,
      spriteComponent.sprite.pivot,
    );

    // Send it to the GPU
    this._layer.context.uniformMatrix3fv(uMatrixLoc, false, mat.data);

    // Draw the quad (two triangles, 6 vertices)
    this._layer.context.drawArrays(this._layer.context.TRIANGLES, 0, 6);
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

  public override stop(): void {
    this._layer.context.clear(this._layer.context.COLOR_BUFFER_BIT);

    console.log('stoooping render sys');
  }
}
