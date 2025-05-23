import {
  registerDecorator, ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';



/**
 * Validator constraint to check if a property value matches another property's value.
 */
@ValidatorConstraint({ name: 'Match' })
export class MatchConstraint implements ValidatorConstraintInterface {
  /**
   * Validates if a property value matches another property's value.
   * @param value {any} The value of the property to validate.
   * @param args {ValidationArguments} The validation arguments containing the related property name.
   * @returns {boolean} A boolean indicating if the property value matches the related property value (`true`) or not (`false`).
   */
  validate(value: any, args: ValidationArguments): boolean {
    const [relatedPropertyName] = args.constraints;
    const relatedValue = (args.object as any)[relatedPropertyName];
    return value === relatedValue;
  }

  /**
   * Default error message for MatchConstraint.
   * @param args {ValidationArguments} The validation arguments containing the related property name.
   * @returns {string} Error message indicating that the property value does not match the related property value.
   */
  defaultMessage(args: ValidationArguments): string {
    return `${args.constraints[0]} does not match.`
  }
}

/**
 * Decorator to apply the MatchConstraint constraint to a class property.
 * @param property {string} - The name of the related property to match against.
 * @param validationOptions {ValidationOptions} - Optional validation options.
 * @returns A decorator function.
 */
export function IsMatch(
  property: string,
  validationOptions?: ValidationOptions,
) {
  return (object: any, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [property],
      validator: MatchConstraint,
    });
  };
}