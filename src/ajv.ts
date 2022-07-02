import Ajv from "ajv";
import { validatePath } from "./index";
import { AslPathContext } from "./types";

export const AslPathValidatorConfig = {
  format_names: {
    [AslPathContext.PATH]: "asl_path",
    [AslPathContext.REFERENCE_PATH]: "asl_ref_path",
    [AslPathContext.PAYLOAD_TEMPLATE]: "asl_payload_template",
  },
  silent: true,
};

export const registerAll = (
  ajv: Ajv,
  config = AslPathValidatorConfig
): void => {
  const validateAdapter = (path: string, pathType: AslPathContext): boolean => {
    const result = validatePath(path, pathType);
    if (!config.silent && !result.isValid) {
      ajv.logger.error(
        `asl_path_validator: code:${result.code}. pathType:${pathType}. input: ${path}`
      );
    }
    return result.isValid;
  };

  ajv.addFormat(
    config.format_names[AslPathContext.REFERENCE_PATH],
    (path: string): boolean => {
      return validateAdapter(path, AslPathContext.REFERENCE_PATH);
    }
  );

  ajv.addFormat(
    config.format_names[AslPathContext.PATH],
    (path: string): boolean => {
      return validateAdapter(path, AslPathContext.PATH);
    }
  );

  ajv.addFormat(
    config.format_names[AslPathContext.PAYLOAD_TEMPLATE],
    (path: string): boolean => {
      return validateAdapter(path, AslPathContext.PAYLOAD_TEMPLATE);
    }
  );
};
