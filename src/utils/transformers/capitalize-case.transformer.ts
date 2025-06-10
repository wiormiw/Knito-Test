import { TransformFnParams } from 'class-transformer/types/interfaces';
import { MaybeType } from '../types/maybe.type';

export const capitalizeTransformer = (
  params: TransformFnParams,
): MaybeType<string> => {
  const value = params.value?.toString().trim();
  return value
    ? value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
    : undefined;
};
