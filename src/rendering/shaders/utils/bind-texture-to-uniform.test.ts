/* eslint-disable @typescript-eslint/naming-convention */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { bindTextureToUniform } from './bind-texture-to-uniform';

describe('bindTextureToUniform', () => {
  let gl: WebGLRenderingContext;
  let program: WebGLProgram;
  let texture: WebGLTexture;

  beforeEach(() => {
    gl = {
      TEXTURE0: 33984,
      TEXTURE_2D: 3553,
      activeTexture: vi.fn(),
      bindTexture: vi.fn(),
      getUniformLocation: vi.fn(),
      uniform1i: vi.fn(),
    } as unknown as WebGLRenderingContext;

    program = {} as WebGLProgram;
    texture = {} as WebGLTexture;
  });

  it('should bind the texture to the specified texture unit and uniform', () => {
    const uniformName = 'u_texture';
    const textureUnit = 0;
    const uniformLocation = {} as WebGLUniformLocation;

    vi.spyOn(gl, 'getUniformLocation').mockReturnValue(uniformLocation);

    bindTextureToUniform(gl, program, texture, uniformName, textureUnit);

    expect(gl.activeTexture).toHaveBeenCalledWith(gl.TEXTURE0 + textureUnit);
    expect(gl.bindTexture).toHaveBeenCalledWith(gl.TEXTURE_2D, texture);
    expect(gl.getUniformLocation).toHaveBeenCalledWith(program, uniformName);
    expect(gl.uniform1i).toHaveBeenCalledWith(uniformLocation, textureUnit);
  });

  it('should throw an error if the texture unit is greater than the maximum allowed', () => {
    const uniformName = 'u_texture';
    const textureUnit = 32;

    expect(() => {
      bindTextureToUniform(gl, program, texture, uniformName, textureUnit);
    }).toThrow(`Cannot bind to texture unit greater than 31.`);
  });

  it('should throw an error if the uniform is not found in the shader', () => {
    const uniformName = 'u_texture';
    const textureUnit = 0;

    vi.spyOn(gl, 'getUniformLocation').mockReturnValue(null);

    expect(() => {
      bindTextureToUniform(gl, program, texture, uniformName, textureUnit);
    }).toThrow(`Uniform '${uniformName}' not found in the shader.`);
  });
});
