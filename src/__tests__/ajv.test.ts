import Ajv from "ajv";
import example from "./json/example-schema.json";
import payloadTemplateSchema from "./json/payload-template.json";
import fs from "fs";
import path from "path";
import {
  registerPathValidator,
  registerPayloadTemplate,
  registerReferencePathValidator,
} from "../ajv";
import { must } from "../assertions";
import { JSONPath } from "jsonpath-plus";

describe("tests for the ajv custom formatters", () => {
  let ajv: Ajv | null = null;

  beforeAll(() => {
    ajv = new Ajv({
      schemas: [example, payloadTemplateSchema],
      allowUnionTypes: true,
    });
    registerPathValidator(ajv, "asl_path");
    registerReferencePathValidator(ajv, "asl_ref_path");
    registerPayloadTemplate(ajv, "asl_payload_template");
  });
  const loadDefinition = (name: string): unknown => {
    return JSON.parse(
      fs.readFileSync(path.join(__dirname, "json", name), "utf-8")
    ) as unknown;
  };

  it("should accept valid input", () => {
    expect.hasAssertions();
    const input = loadDefinition("valid.json");
    must(ajv);
    const result = ajv.validate(
      "https://asl-path-validator.cloud/example.json#",
      input
    );
    expect(result).toBe(true);
  });

  const invalid_shapes: Array<{
    OutputPath?: string;
    InputPath?: string;
    ResultPath?: string;
    TimeoutSecondsPath?: string;
    HeartbeatSecondsPath?: string;
    ResultSelector?: unknown;
    Parameters?: unknown;
  }> = [
    {
      OutputPath: "not a valid path",
    },
    {
      OutputPath: "States.StringToJson('functions not allowed here')",
    },
    {
      ResultPath: "States.StringToJson('functions not allowed here')",
    },
    {
      ResultPath: "$.invalid..path",
    },
    {
      Parameters: {
        "dynamic.path1.$": "not a valid path",
        static2: "ok",
      },
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
    },
  ];

  it.each(invalid_shapes)("%s should be rejected", (input) => {
    expect.hasAssertions();
    must(ajv);
    const inputFields = Object.keys(input);
    expect(inputFields).toHaveLength(1);
    const result = ajv.validate(
      "https://asl-path-validator.cloud/example.json#",
      { ...input, Type: "Example" }
    );
    expect(result).toBe(false);
    const instancePath: string = JSONPath({
      json: ajv,
      path: "$.errors.[0].instancePath",
      wrap: false,
    });

    expect(instancePath.split("/")[1]).toStrictEqual(inputFields[0]);
  });
});
