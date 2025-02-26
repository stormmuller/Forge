import { Matrix3x3 } from '../../../math';

/**
 * Creates a projection matrix for mapping 0..width to -1..1 in X and 0..height to -1..1 in Y.
 *
 * @param width - The width of the projection area.
 * @param height - The height of the projection area.
 * @returns A 3x3 projection matrix.
 */
export const createProjectionMatrix = (
  width: number,
  height: number,
): Matrix3x3 => {
  // This matrix maps 0..width to 0..2, so that 0..width -> -1..1 in X
  // and 0..height -> -1..1 in Y
  return new Matrix3x3([2 / width, 0, 0, 0, -2 / height, 0, -1, 1, 1]); // 3x3 matrix
};
