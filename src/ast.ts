import jsonata from "jsonata";

const find = async (fields: string[], ast: unknown): Promise<boolean> => {
  for (const field of fields) {
    const expr = jsonata(`**.${field}`);
    const result: unknown = await expr.evaluate(ast);
    if (result) {
      return true;
    }
  }
  return false;
};

export const referencePathChecks = async (ast: unknown): Promise<boolean> => {
  const names = [
    "atmark",
    "wildcard",
    "negOffset",
    "slice",
    "recursiveDescent",
    "multipleIndex",
    "filter",
  ];
  return !(await find(names, ast));
};

export const hasFunctions = async (ast: unknown): Promise<boolean> => {
  return find(["func"], ast);
};

export const hasVariable = async (ast: unknown): Promise<boolean> => {
  return find(["var"], ast);
};
