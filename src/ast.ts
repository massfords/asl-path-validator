export type FieldsUsed = {
  hasFunc?: boolean;
  hasVar?: boolean;
  hasInvalidReferencePathOps?: boolean;
};

const invalidReferencePathOps = [
  "atmark",
  "wildcard",
  "negOffset",
  "slice",
  "recursiveDescent",
  "multipleIndex",
  "filter",
];

export const gather = (
  json: unknown,
  accum?: FieldsUsed | null | undefined
): FieldsUsed => {
  const acc: FieldsUsed = accum ?? {};
  if (typeof json !== "object") {
    return acc;
  }
  const ast = json as Record<string, unknown>;
  for (const key of Object.keys(ast)) {
    if (key === "func") {
      acc.hasFunc = true;
    } else if (key === "var") {
      acc.hasVar = true;
    } else if (invalidReferencePathOps.includes(key)) {
      acc.hasInvalidReferencePathOps = true;
    }

    // if all the acc fields are set, stop traversing
    if (acc.hasFunc && acc.hasVar && acc.hasInvalidReferencePathOps) {
      return acc;
    }

    const value = ast[key];
    if (value && typeof value === "object") {
      if (Array.isArray(value)) {
        for (const item of value) {
          if (item && typeof item === "object") {
            gather(item as Record<string, unknown>, acc);
          }
        }
      } else if (value && typeof value === "object") {
        gather(value as Record<string, unknown>, acc);
      }
    }
  }
  return acc;
};
