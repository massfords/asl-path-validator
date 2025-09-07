import Ajv from "ajv";
import example from "./json/example-schema.json";
import payloadTemplateSchema from "./json/payload-template.json";
import fs from "fs";
import path from "path";
import { registerAll } from "../ajv";
import { must } from "../assertions";

describe("tests for the ajv custom formatters", () => {
  let ajv: Ajv | null = null;

  beforeAll(() => {
    ajv = new Ajv({
      schemas: [
        { ...example, $async: true },
        { ...payloadTemplateSchema, $async: true },
      ],
      allowUnionTypes: true,
    });
    registerAll(ajv);
  });
  const loadDefinition = (name: string): Record<string, unknown> => {
    const parsed: Record<string, unknown> = JSON.parse(
      fs.readFileSync(path.join(__dirname, "json", name), "utf-8")
    ) as Record<string, unknown>;
    return parsed;
  };

  const valid_inputs: Record<string, unknown>[] = [
    { ...loadDefinition("valid.json"), label: "valid file" },
    {
      label: "nested templates",
      Type: "Example",
      Parameters: {
        flagged: true,
        parts: {
          "first.$": "$.vals[0]",
          "last3.$": "$.vals[3:]",
        },
      },
    },
  ];

  it.each(valid_inputs)("$label", async (inputWithLabel) => {
    expect.hasAssertions();
    must(ajv);
    const { label, ...input } = inputWithLabel;
    const validator = ajv.getSchema(
      "https://asl-path-validator.cloud/example.json#"
    );
    must(validator);
    const result = await validator(input);
    expect(label).toBeTruthy();
    expect(ajv.errors ?? []).toStrictEqual([]);
    expect(result).toBeTruthy();
  });

  const invalid_shapes: Array<{
    OutputPath?: string;
    InputPath?: string;
    ResultPath?: string;
    TimeoutSecondsPath?: string;
    HeartbeatSecondsPath?: string;
    ResultSelector?: unknown;
    Parameters?: unknown;
    label: string;
  }> = [
    {
      OutputPath: "not a valid path",
      label: "invalid json path",
    },
    {
      OutputPath: "States.StringToJson('functions not allowed here')",
      label: "intrinsic function out of place",
    },
    {
      ResultPath: "$.invalid..path",
      label: "recursive descent not allowed in ref path",
    },
    {
      Parameters: {
        "dynamic.path1.$": "not a valid path",
        static2: "ok",
      },
      label: "field matching path pattern doesn't have a valid path",
    },
    {
      Parameters: {
        deeply_nested: {
          static: {
            "nested.dynamic.path1.$": "not a valid path",
            static2: "ok",
          },
        },
      },
      label: "deeply nested invalid payload template field",
    },
    {
      Parameters: {
        deeply_nested: {
          valid$: {
            "invalid.$": "not a valid path",
            valid2$: "ok",
          },
        },
      },
      label: "deeply nested invalid with dollar",
    },
  ];

  it.each(invalid_shapes)(
    "$label should be rejected",
    async (inputWithLabel) => {
      expect.hasAssertions();
      must(ajv);
      const { label, ...input } = inputWithLabel;
      expect(label).toBeTruthy();
      const inputFields = Object.keys(input);
      expect(inputFields).toHaveLength(1);
      const validator = ajv.getSchema(
        "https://asl-path-validator.cloud/example.json#"
      );
      must(validator);
      try {
        await validator({ ...input, Type: "Example" });
        fail("expected validation to fail");
      } catch (e: unknown) {
        expect(e).toBeTruthy();
      }
      // const instancePath: string = JSONPath({
      //   json: ajv,
      //   path: "$.errors.[0].instancePath",
      //   wrap: false,
      // });
      //
      // expect(instancePath.split("/")[1]).toStrictEqual(inputFields[0]);
    }
  );
});
