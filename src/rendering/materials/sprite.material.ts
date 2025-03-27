import {
  createTextureFromImage,
  spriteFragmentShader,
  spriteVertexShader,
} from '../shaders';
import { Material } from './material';

export class SpriteMaterial extends Material {
  public readonly albedoTexture: HTMLImageElement;

  constructor(gl: WebGL2RenderingContext, albedoTexture: HTMLImageElement) {
    super(gl, spriteVertexShader, spriteFragmentShader);

    this.albedoTexture = albedoTexture;

    this.setUniform('u_texture', createTextureFromImage(gl, albedoTexture));
  }
}
