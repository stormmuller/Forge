import { describe, expect, it } from 'vitest';
import { createProjectionMatrix } from './create-projection-matrix';
import { Matrix3x3 } from '../../../math';

describe('createProjectionMatrix', () => {
  it('should create a correct projection matrix for given width and height', () => {
    const width = 800;
    const height = 600;
    const expectedMatrix = new Matrix3x3([
      2 / width,
      0,
      0,
      0,
      -2 / height,
      0,
      -1,
      1,
      1,
    ]);

    const result = createProjectionMatrix(width, height);

    expect(result).toEqual(expectedMatrix);
  });

  it('should create a correct projection matrix for a square area', () => {
    const size = 500;
    const expectedMatrix = new Matrix3x3([
      2 / size,
      0,
      0,
      0,
      -2 / size,
      0,
      -1,
      1,
      1,
    ]);

    const result = createProjectionMatrix(size, size);

    expect(result).toEqual(expectedMatrix);
  });

  it('should create a correct projection matrix for a very small area', () => {
    const width = 1;
    const height = 1;
    const expectedMatrix = new Matrix3x3([
      2 / width,
      0,
      0,
      0,
      -2 / height,
      0,
      -1,
      1,
      1,
    ]);

    const result = createProjectionMatrix(width, height);

    expect(result).toEqual(expectedMatrix);
  });

  it('should create a correct projection matrix for a very large area', () => {
    const width = 10000;
    const height = 10000;
    const expectedMatrix = new Matrix3x3([
      2 / width,
      0,
      0,
      0,
      -2 / height,
      0,
      -1,
      1,
      1,
    ]);

    const result = createProjectionMatrix(width, height);

    expect(result).toEqual(expectedMatrix);
  });
});
