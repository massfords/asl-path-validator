// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { parse } from "./generated/aslPaths";
import { AslPathContext, ErrorCodes, ValidationResult } from "./types";
import { hasFunctions, referencePathChecks } from "./ast";

export const validatePath = (
  path: string,
  context: AslPathContext
): ValidationResult => {
  let ast: unknown | null = null;
  try {
    ast = parse(path);
  } catch (e: unknown) {
    return {
      isValid: false,
      code: ErrorCodes.parse_error,
      message: JSON.stringify(e),
    };
  }
  if (!ast) {
    return {
      isValid: false,
      code: ErrorCodes.parse_error,
      message: "no ast returned",
    };
  }
  switch (context) {
    case AslPathContext.PAYLOAD_TEMPLATE:
      break;
    case AslPathContext.PATH:
      if (hasFunctions(ast)) {
        return {
          isValid: false,
          code: ErrorCodes.exp_has_functions,
        };
      }
      break;
    case AslPathContext.REFERENCE_PATH:
      if (hasFunctions(ast)) {
        return {
          isValid: false,
          code: ErrorCodes.exp_has_functions,
        };
      }
      if (!referencePathChecks(ast)) {
        return {
          isValid: false,
          code: ErrorCodes.exp_has_non_reference_path_ops,
        };
      }
      break;
    default: {
      const invalid: never = context;
      throw Error(invalid);
    }
  }
  return { isValid: true };
};

export * from "./ajv";
