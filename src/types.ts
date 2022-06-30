export enum AslPathContext {
  PATH = "P",
  REFERENCE_PATH = "RP",
  PAYLOAD_TEMPLATE = "PT",
}

export enum ErrorCodes {
  parse_error = "parse_error",
  exp_has_functions = "exp_has_functions",
  exp_has_non_reference_path_ops = "exp_has_non_reference_path_ops",
}

export type ValidationResult =
  | { isValid: true }
  | { isValid: false; code: ErrorCodes; message?: string };
