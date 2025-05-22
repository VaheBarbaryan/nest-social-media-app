import { ValidationError } from '@nestjs/common';
import { getNestedErrorMessage } from './getNestedErrorMessage.helper';

export function formatValidationErrors(
  errors: ValidationError[],
): Array<{ property: string; message: string; index?: number }> {
  return errors.flatMap((error) => {
    const messageObject = {
      property: error.property,
    };
    if (error.constraints) {
      return {
        ...messageObject,
        message: Object.values(error.constraints)[0],
      };
    }
    if (error.children && error.children.length > 0) {
      const nestedErrors = getNestedErrorMessage(error.children);
      return nestedErrors.map((nestedError) => ({
        ...messageObject,
        message: nestedError.message,
        index: nestedError.index,
      }));
    }

    return { ...messageObject, message: 'Unknown validation error' };
  });
}