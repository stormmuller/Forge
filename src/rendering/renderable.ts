import type { Geometry } from './geometry';
import type { Material } from './materials';

export class Renderable {
  public geometry: Geometry;
  public material: Material;

  constructor(geometry: Geometry, material: Material) {
    this.geometry = geometry;
    this.material = material;
  }

  /**
   * Prepares for drawing: binds material and geometry (including VAO).
   * The RenderSystem is still responsible for binding instance data & calling draw.
   */
  public bind(gl: WebGL2RenderingContext): void {
    this.material.bind(gl);
    this.geometry.bind(gl, this.material.program);
  }
}
