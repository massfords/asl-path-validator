# asl-path-validator

[![license](https://img.shields.io/badge/MIT-blue.svg)](https://github.com/massfords/asl-path-validator/blob/master/LICENSE)
[![npm version](https://badge.fury.io/js/asl-path-validator.svg)](https://badge.fury.io/js/asl-path-validator)

[![NPM](https://nodei.co/npm/asl-path-validator.png?stars=true)](https://www.npmjs.com/package/asl-path-validator)

# What is in this library:

This library provides a parser to validate **Path**, **Reference Path**, and **Payload Template** expressions 
for the [Amazon States Language](https://states-language.net/spec.html)

The parser produces an [Abstract Syntax Tree (AST)](https://en.wikipedia.org/wiki/Abstract_syntax_tree) for the 
expression if it's valid. Additional checks are performed if necessary to limit the operators 
or presence of functions based on the context.

## Samples from the spec
The expressions resemble JSONPath.

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

## validate a single expression
```typescript
expect(validatePath("$.library.movies", AslPathContext.REFERENCE_PATH)).toStrictEqual({
  isValid: true,
});
```

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
  registerAll(ajv);
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


# How this is done

1. leverage AJV to do schema validation (see asl-validator for the schemas)
2. custom formatter validates the **Path** and **Reference Path** fields
3. Payload Templates leverage **patternProperties** to validate fields ending in ".$"
4. Generated parser from a PEG grammar provides the actual validation logic


## Formal Definitions
The spec references a [Java library](https://github.com/json-path/JsonPath) for the syntax of the expressions.  
The documentation for the referenced library has more functionality than is supported by the AWS Step Function runtimes.

| Expression Feature                                                                                | Path               | Reference Path     | Payload Template   |
|:--------------------------------------------------------------------------------------------------|:-------------------|:-------------------|:-------------------|
| Simple dot notation or single predicate notation<br>`$.library.movies`                            | :white_check_mark: | :white_check_mark: | :white_check_mark: |     
| Use of operators that select multiple nodes via descent, wildcard, or a filter<br>`.. @ , : ? *`  | :white_check_mark: | :x:                | :white_check_mark: |
| **Intrinsic functions**<br> `States.JsonToString($.foo)`<br>See below for the supported functions | :x:                | :x:                | :white_check_mark: |


### Context Expressions
> When a Path begins with "$$", two dollar signs, this signals that it is intended to identify content within the
> Context Object. The first dollar sign is stripped, and the remaining text, which begins with a dollar sign,
> is interpreted as the JSONPath applying to the Context Object.

### Intrinsic Functions
These functions are available within the context of a **Payload Template** only.

The relevant fields to examine are **Parameters** and **ResultSelector**.

| Intrinsic Function    | Arguments | Comments                                   |
|-----------------------|-----------|--------------------------------------------|
| `States.Format`       | 1+        | arguments MAY contain one or more **Path** |
| `States.StringToJson` | 1         | argument MAY be a **Path**                 |                 
| `States.JsonToString` | 1         | argument MUST be a **Path**                |
| `States.Array`        | 0+        | arguments MAY contain onr or more **Path** |

### Filter Expressions and Operators

Filters are logical expressions used to filter arrays. A typical filter would be `[?(@.age > 18)]` where `@` represents
the current item being processed.

Note that the comparison operators only work with numeric values in the **AWS Data flow simulator**

## What fields should be validated

The table below includes all the fields within a Step Function that are validated.

> See [asl-validator](https://github.com/ChristopheBougere/asl-validator) 3.x branch or higher for schemas modeling ASL.  

The schema provided here illustrate how to integrate and includes a recursive definition for the **Payload Template** context.

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
