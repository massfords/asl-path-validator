import Ajv from "ajv";
import { validatePath } from "./index";
import { AslPathContext } from "./types";

export const registerReferencePathValidator = (
  ajv: Ajv,
  format: string
): void => {
  ajv.addFormat(format, (path: string): boolean => {
    return validatePath(path, AslPathContext.REFERENCE_PATH).isValid;
  });
};

export const registerPathValidator = (ajv: Ajv, format: string): void => {
  ajv.addFormat(format, (path: string): boolean => {
    return validatePath(path, AslPathContext.PATH).isValid;
  });
};

export const registerPayloadTemplate = (ajv: Ajv, format: string): void => {
  ajv.addFormat(format, (path: string): boolean => {
    const result = validatePath(path, AslPathContext.PAYLOAD_TEMPLATE);
    return result.isValid;
  });
};
