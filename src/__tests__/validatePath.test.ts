import { AslPathContext, ErrorCodes } from "../types";
import { validatePath } from "../index";

describe("unit tests for the parser", () => {
  const asl_spec_reference_paths = [
    "$.store.book",
    "$.store\\.book",
    "$.\\stor\\e.boo\\k",
    "$.store.book.title",
    "$.foo.\\.bar",
    "$.foo\\@bar.baz\\[\\[.\\?pretty",
    "$.&Ж中.\uD800\uDF46",
    "$.ledgers.branch[0].pending.count",
    "$.ledgers.branch[0]",
    "$.ledgers[0][22][315].foo",
    "$['store']['book']",
    "$['store'][0]['book']",
  ];

  it.each(asl_spec_reference_paths)("%s", (path) => {
    expect.hasAssertions();
    expect(validatePath(path, AslPathContext.REFERENCE_PATH)).toStrictEqual({
      isValid: true,
    });
    expect(validatePath(path, AslPathContext.PATH)).toStrictEqual({
      isValid: true,
    });
    expect(validatePath(path, AslPathContext.PAYLOAD_TEMPLATE)).toStrictEqual({
      isValid: true,
    });
  });

  const intrinsic_functions = [
    "States.Format('Welcome to {} {}\\'s playlist.', $.firstName, $.lastName)",
    "States.Format('Today is {}', $$.DayOfWeek)",
    "States.StringToJson($.someString)",
    "States.JsonToString($.someJson)",
    "States.Array('Foo', 2020, $.someJson, null)",
  ];
  it.each(intrinsic_functions)("%s", (path) => {
    expect.hasAssertions();
    expect(validatePath(path, AslPathContext.PAYLOAD_TEMPLATE)).toStrictEqual({
      isValid: true,
    });
  });
  it.each(intrinsic_functions)(
    "%s invalid outside of Payload Template",
    (path) => {
      expect.hasAssertions();
      expect(validatePath(path, AslPathContext.PATH)).toStrictEqual({
        isValid: false,
        code: ErrorCodes.exp_has_functions,
      });
      expect(validatePath(path, AslPathContext.REFERENCE_PATH)).toStrictEqual({
        isValid: false,
        code: ErrorCodes.exp_has_functions,
      });
    }
  );

  const path_expressions = [
    "$.library.movies[?(@.genre)]",
    "$.library.movies[?(@.year == 1992)]",
    "$.library.movies[?(@.year >= 1992)]",
    "$.library.movies[0:2]",
    "$.library.movies[0,1,2,3]",
    "$..director",
    "$.fooList[1:]",
  ];
  it.each(path_expressions)("%s valid path and payload template", (path) => {
    expect.hasAssertions();
    expect(validatePath(path, AslPathContext.PATH)).toStrictEqual({
      isValid: true,
    });
    expect(validatePath(path, AslPathContext.PAYLOAD_TEMPLATE)).toStrictEqual({
      isValid: true,
    });
  });
  it.each(path_expressions)("%s invalid as Reference Path", (path) => {
    expect.hasAssertions();
    expect(validatePath(path, AslPathContext.REFERENCE_PATH)).toStrictEqual({
      isValid: false,
      code: ErrorCodes.exp_has_non_reference_path_ops,
    });
  });
});
