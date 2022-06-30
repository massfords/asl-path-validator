# asl-path-validator

[![license](https://img.shields.io/badge/MIT-blue.svg)](https://github.com/massfords/asl-path-validator/blob/master/LICENSE)
[![npm version](https://badge.fury.io/js/asl-path-validator.svg)](https://badge.fury.io/js/asl-path-validator)

[![NPM](https://nodei.co/npm/asl-path-validator.png?stars=true)](https://www.npmjs.com/package/asl-path-validator)

A parser to validate **Path** and **Reference Path** expressions for the [Amazon States Language](https://states-language.net/spec.html)

## Path
The spec references a [Java library](https://github.com/json-path/JsonPath) for its definition of its **Path** expressions.
The documentation for the referenced library has more functionality than is supported by the AWS Step Function runtimes.

| Fields with Paths  | Spec Text                                                          |
|--------------------|--------------------------------------------------------------------|
| `InputPath`        | The value of "InputPath" MUST be a Path                            |
| `OutputPath`       | The value of "OutputPath" MUST be a Path                           |
| `<Comparison>Path` | For those operators that end with "Path", the value MUST be a Path |

## Reference Paths
A limited subset of what's allowed in a **Path** expression. 

> A **Reference Path** is a Path with syntax limited in such a way 
> that it can only identify a single node in a JSON structure: 
> The operators "@", ",", ":", and "?" [and "*"] are not supported.

| Field with Reference Path | Spec Text                                                                         |
|---------------------------|-----------------------------------------------------------------------------------|
| `HeartbeatSecondsPath`    | A Task State may have... "HeartbeatSecondsPath" ... which MUST be Reference Paths |
| `ItemsPath`               | The "ItemsPath"... is a Reference Path                                            |
| `ResultPath`              | The value of "ResultPath" MUST be a Reference Path                                |
| `SecondsPath`             | The wait duration [can use] a Reference Path to the data                          |
| `TimeoutSecondsPath`      | A Task State may have... "TimeoutSecondsPath" ... which MUST be Reference Paths   |
| `TimestampPath`           | The wait duration [can use] a Reference Path to the data                          |

### Samples from the spec
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

## Payload Templates
JSON Fields within a **Payload Template** that have names that end with `.$`
MUST contain a **Path** expression or an **Intrinsic Function**

## Context Expressions
> When a Path begins with "$$", two dollar signs, this signals that it is intended to identify content within the 
> Context Object. The first dollar sign is stripped, and the remaining text, which begins with a dollar sign, 
> is interpreted as the JSONPath applying to the Context Object.

## Intrinsic Functions
These functions are available within the context of a **Payload Template** only.

This is explicitly noted in the AWS docs. The relevant fields to examine are **Parameters** and **ResultSelector**.

| Intrinsic Function    | Arguments | Comments                                   |
|-----------------------|-----------|--------------------------------------------|
| `States.Format`       | 1+        | arguments MAY contain one or more **Path** |
| `States.StringToJson` | 1         | argument MAY be a **Path**                 |                 
| `States.JsonToString` | 1         | argument MUST be a **Path**                |
| `States.Array`        | 0+        | arguments MAY contain onr or more **Path** |

## Operators

| JSONPath Operator       | JSONPath Description                                             | Path               | Reference Path     |
|:------------------------|:-----------------------------------------------------------------|--------------------|--------------------|
| `$`                     | The root element to query. This starts all **Path** expressions. | :white_check_mark: | :white_check_mark: |     
| `@`                     | The current node being processed by a filter predicate.          | :white_check_mark: | :x:                |
| `*`                     | Wildcard. Available anywhere a name or numeric are required.     | :white_check_mark: | :x:                |
| `..`                    | Deep scan. Available anywhere a name is required.                | :white_check_mark: | :x:                |
| `.<name>`               | Dot-notated child matches on the existence of the child.         | :white_check_mark: | :white_check_mark: |
| `['<name>']`            | Bracket-notated child                                            | :white_check_mark: | :x:                |
| `[<number>]`            | Array index                                                      | :white_check_mark: | :white_check_mark: |
| `[<number>, <number>)]` | Multiple array indexes                                           | :white_check_mark: | :x:                |
| `[start:end]`           | Array slice operator (one of start/end is optional)              | :white_check_mark: | :x:                |
| `[?(<expression>)]`     | Filter expression. Expression must evaluate to a boolean value.  | :white_check_mark: | :x:                |

## Filter Expressions and Operators

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
