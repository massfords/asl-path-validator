import { JSONPath } from "jsonpath-plus";

const find = (path: string, ast: unknown): boolean => {
  const results: unknown[] = JSONPath({
    path,
    json: ast as object,
  });
  return results.length > 0;
};

export const referencePathChecks = (ast: unknown): boolean => {
  return !find(
    "$..[atmark,wildcard,negOffset,slice,recursiveDescent,multipleIndex,filter]",
    ast
  );
};

export const hasFunctions = (ast: unknown): boolean => {
  return find("$..[func]", ast);
};
