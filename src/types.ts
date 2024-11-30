export enum AslPathContext {
  PATH = "path",
  REFERENCE_PATH = "reference_path",
  RESULT_PATH = "result_path",
  PAYLOAD_TEMPLATE = "payload_template",
}

export enum ErrorCodes {
  parse_error = "parse_error",
  exp_has_functions = "exp_has_functions",
  exp_has_variable = "exp_has_variable",
  exp_has_non_reference_path_ops = "exp_has_non_reference_path_ops",
}

export type ValidationResult =
  | { isValid: true }
  | { isValid: false; code: ErrorCodes; message?: string };
