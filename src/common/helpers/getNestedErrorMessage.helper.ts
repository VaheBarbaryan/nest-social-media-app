import { ValidationError } from '@nestjs/common';

export function getNestedErrorMessage(
  children: ValidationError[],
  index: number | null = null,
): { message: string; index?: number; property: string }[] {
  const result: { message: string; index?: number; property: string }[] = [];

  for (const child of children) {
    const currentIndex =
      index === null && !isNaN(Number(child.property))
        ? Number(child.property)
        : index;

    if (child.constraints) {
      result.push({
        message: Object.values(child.constraints)[0],
        property: child.property,
        ...(currentIndex !== undefined && currentIndex !== null
          ? { index: currentIndex }
          : {}),
      });
    } else if (child.children && child.children.length > 0) {
      result.push(...getNestedErrorMessage(child.children, currentIndex));
    }
  }

  return result;
}
