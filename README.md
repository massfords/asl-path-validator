# asl-path-validator

[![license](https://img.shields.io/badge/MIT-blue.svg)](https://github.com/massfords/asl-path-validator/blob/master/LICENSE)
[![npm version](https://badge.fury.io/js/asl-path-validator.svg)](https://badge.fury.io/js/asl-path-validator)

[![NPM](https://nodei.co/npm/asl-path-validator.png?stars=true)](https://www.npmjs.com/package/asl-path-validator)

# What is in this library:

## register validators as AJV formats
Provides adapters to register as custom format validators for [AJV](https://ajv.js.org/api.html#ajv-addformat-name-string-format-format-ajv).

The AJV schemas for the Step Functions are not provided here. See [asl-validator](https://github.com/ChristopheBougere/asl-validator) for schemas.
See the provided unit tests for integrating. An example schema is defined to illustrate how to leverage AJV to invoke our custom validation.

```typescript
beforeAll(() => {
  ajv = new Ajv({
    schemas: [example, payloadTemplateSchema],
    allowUnionTypes: true,
  });
  registerPathValidator(ajv, "asl_path");
  registerReferencePathValidator(ajv, "asl_ref_path");
  registerPayloadTemplate(ajv, "asl_payload_template");
});
it("should accept valid input", () => {
  expect.hasAssertions();
  const input = loadDefinition("valid.json");
  const result = ajv.validate(
    "https://asl-path-validator.cloud/example.json#",
    input
  );
  expect(result).toBe(true);
});

```

## validate a single expression
```typescript
    expect(validatePath("$.library.movies", AslPathContext.REFERENCE_PATH)).toStrictEqual({
      isValid: true,
    });
```

This library provides a parser to validate **Path** and **Reference Path** expressions for the [Amazon States Language](https://states-language.net/spec.html)

The parser supports the super set of what's allowed in the **Path**, **Reference Path**, and **Payload Template** contexts.

Additional validation to enforce rules about functions and special operators.

# How this is done

1. leverage AJV to do schema validation (see asl-validator for the schemas)
2. custom formatter validates the **Path** and **Reference Path** fields
3. Payload Templates leverage **patternProperties** to validate fields ending in ".$"
4. Generated parser from a PEG grammar provides the actual validation logic

## What fields should be validated

The table below includes all the fields within a Step Function that are validated.

The suggested approach is to update the asl-validator schemas to uses AJV format strings
for these fields. 

The example schema provided here also includes a recursive definition for the **Payload Template** context

| Step Function Field            | Expression Type  |
|--------------------------------|------------------|
| BooleanEqualsPath              | Path             |
| HeartbeatSecondsPath           | Reference Path   |
| InputPath                      | Path             |
| ItemsPath                      | Reference Path   |
| NumericEqualsPath              | Path             |
| NumericGreaterThanPath         | Path             |
| NumericLessThanEqualsPath      | Path             |
| NumericLessThanPath            | Path             |
| OutputPath                     | Path             |
| Parameters                     | Payload Template |
| ResultPath                     | Reference Path   |
| ResultSelector                 | Payload Template |
| SecondsPath                    | Reference Path   |
| StringEqualsPath               | Path             |
| StringGreaterThanPath          | Path             |
| StringGreaterThanEqualsPath    | Path             |
| StringLessThanPath             | Path             |
| StringLessThanEqualsPath       | Path             |
| TimeoutSecondsPath             | Reference Path   |
| TimestampEqualsPath            | Path             |
| TimestampGreaterThanEqualsPath | Path             |
| TimestampGreaterThanPath       | Path             |
| TimestampLessThanEqualsPath    | Path             |
| TimestampPath                  | Reference Path   |


### Path
The spec references a [Java library](https://github.com/json-path/JsonPath) for its definition of its **Path** expressions.
The documentation for the referenced library has more functionality than is supported by the AWS Step Function runtimes.

### Reference Paths
A limited subset of what's allowed in a **Path** expression.

> A **Reference Path** is a Path with syntax limited in such a way
> that it can only identify a single node in a JSON structure:
> The operators "@", ",", ":", and "?" [and "*"] are not supported.

#### Samples from the spec
Note the escapes. The disallowed operators are escaped and thus part of the literal text.

```
$.store.book
$.store\.book
$.\stor\e.boo\k
$.store.book.title
$.foo.\.bar
$.foo\@bar.baz\[\[.\?pretty
$.&Ж中.\uD800\uDF46
$.ledgers.branch[0].pending.count
$.ledgers.branch[0]
$.ledgers[0][22][315].foo
$['store']['book']
$['store'][0]['book']
```

### Payload Templates
JSON Fields within a **Payload Template** that have names that end with `.$`
MUST contain a **Path** expression or an **Intrinsic Function**

### Context Expressions
> When a Path begins with "$$", two dollar signs, this signals that it is intended to identify content within the
> Context Object. The first dollar sign is stripped, and the remaining text, which begins with a dollar sign,
> is interpreted as the JSONPath applying to the Context Object.

### Intrinsic Functions
These functions are available within the context of a **Payload Template** only.

This is explicitly noted in the AWS docs. The relevant fields to examine are **Parameters** and **ResultSelector**.

| Intrinsic Function    | Arguments | Comments                                   |
|-----------------------|-----------|--------------------------------------------|
| `States.Format`       | 1+        | arguments MAY contain one or more **Path** |
| `States.StringToJson` | 1         | argument MAY be a **Path**                 |                 
| `States.JsonToString` | 1         | argument MUST be a **Path**                |
| `States.Array`        | 0+        | arguments MAY contain onr or more **Path** |

### Operators

| JSONPath Operator       | JSONPath Description                                             | Path               | Reference Path     |
|:------------------------|:-----------------------------------------------------------------|--------------------|--------------------|
| `$`                     | The root element to query. This starts all **Path** expressions. | :white_check_mark: | :white_check_mark: |     
| `@`                     | The current node being processed by a filter predicate.          | :white_check_mark: | :x:                |
| `*`                     | Wildcard. Available anywhere a name or numeric are required.     | :white_check_mark: | :x:                |
| `..`                    | Deep scan. Available anywhere a name is required.                | :white_check_mark: | :x:                |
| `.<name>`               | Dot-notated child matches on the existence of the child.         | :white_check_mark: | :white_check_mark: |
| `['<name>']`            | Bracket-notated child                                            | :white_check_mark: | :white_check_mark: |
| `[<number>]`            | Array index                                                      | :white_check_mark: | :white_check_mark: |
| `[<number>, <number>)]` | Multiple array indexes                                           | :white_check_mark: | :x:                |
| `[start:end]`           | Array slice operator (one of start/end is optional)              | :white_check_mark: | :x:                |
| `[?(<expression>)]`     | Filter expression. Expression must evaluate to a boolean value.  | :white_check_mark: | :x:                |

### Filter Expressions and Operators

Filters are logical expressions used to filter arrays. A typical filter would be `[?(@.age > 18)]` where `@` represents
the current item being processed.

Note that the comparison operators below only work with numeric values in the **AWS Data flow simulator**

| Operator | Description              |
|:---------|:-------------------------|
| ==       | equality                 |
| <        | less than                | 
| <=       | less than or equal to    |
| >        | greater than             |
| >=       | greater than or equal to |
