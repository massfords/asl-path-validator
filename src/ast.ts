import { JSONPath } from "jsonpath-plus";

const find = (path: string, ast: unknown): boolean => {
  const results: unknown[] = JSONPath({
    path,
    json: ast as object,
  });
  return results.length > 0;
};

export const hasFunctions = (ast: unknown): boolean => {
  return find("$..func", ast);
};

export const hasDescentOperator = (ast: unknown): boolean => {
  return find("$..*[?(@property === 'axis' && @ === '..')]", ast);
};

export const hasSliceOperator = (ast: unknown): boolean => {
  return find("$..slice", ast);
};

export const hasMultipleIndexValues = (ast: unknown): boolean => {
  return find("$..brackets.tail", ast);
};

export const hasNodeReference = (ast: unknown): boolean => {
  return find("$..*[?(@property === 'node' && @ === '@')]", ast as object);
};

export * from "./ajv";
