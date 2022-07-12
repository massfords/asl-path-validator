import { AslPathContext } from "../types";
import { validatePath } from "../index";
import { must } from "../assertions";

describe("unit tests for the parser", () => {
  const All = [
    AslPathContext.REFERENCE_PATH,
    AslPathContext.PATH,
    AslPathContext.PAYLOAD_TEMPLATE,
  ];
  const NoRefPaths = [AslPathContext.PATH, AslPathContext.PAYLOAD_TEMPLATE];
  const PayloadTemplatesOnly = [AslPathContext.PAYLOAD_TEMPLATE];
  const None: Array<AslPathContext> = [];

  interface TestInput {
    path: string;
    valid_in: Array<AslPathContext>;
  }

  const paths: TestInput[] = [
    // reference path examples from the ASL spec
    { path: "$.store.book", valid_in: All },
    { path: "$.store\\.book", valid_in: All },
    { path: "$.\\stor\\e.boo\\k", valid_in: All },
    { path: "$.store.book.title", valid_in: All },
    { path: "$.foo.\\.bar", valid_in: All },
    { path: "$.foo\\@bar.baz\\[\\[.\\?pretty", valid_in: All },
    { path: "$.&Ж中.\uD800\uDF46", valid_in: All },
    { path: "$.ledgers.branch[0].pending.count", valid_in: All },
    { path: "$.ledgers.branch[0]", valid_in: All },
    { path: "$.ledgers[0][22][315].foo", valid_in: All },
    { path: "$['store']['book']", valid_in: All },
    { path: "$['store'][0]['book']", valid_in: All },
    // intrinsic functions
    {
      path: "States.Format('Welcome to {} {}\\'s playlist.', $.firstName, $.lastName)",
      valid_in: PayloadTemplatesOnly,
    },
    {
      path: "States.Format('Today is {}', $$.DayOfWeek)",
      valid_in: PayloadTemplatesOnly,
    },
    {
      path: "States.StringToJson($.someString)",
      valid_in: PayloadTemplatesOnly,
    },
    { path: "States.JsonToString($.someJson)", valid_in: PayloadTemplatesOnly },
    {
      path: "States.Array('Foo', 2020, $.someJson, null)",
      valid_in: PayloadTemplatesOnly,
    },
    {
      path: "States.Format('{}_{}',$$.Execution.Name,$['test-batch']['batch_id'])",
      valid_in: PayloadTemplatesOnly,
    },

    // assorted paths
    {
      path: "$[(@.length-1)].bar",
      valid_in: NoRefPaths,
    },
    { path: "$.library.movies[?(@.genre)]", valid_in: NoRefPaths },
    {
      path: "$.library.movies[?(@.year == 1992)]",
      valid_in: NoRefPaths,
    },
    {
      path: "$.library.movies[?(@.year >= 1992)]",
      valid_in: NoRefPaths,
    },
    { path: "$.library.movies[0:2]", valid_in: NoRefPaths },
    { path: "$.library.movies[0,1,2,3]", valid_in: NoRefPaths },
    { path: "$.library.movies[0,1,-2]", valid_in: NoRefPaths },
    { path: "$..director", valid_in: NoRefPaths },
    { path: "$.fooList[1:]", valid_in: NoRefPaths },

    // examples from https://github.com/json-path/JsonPath
    // a few small changes were added to have better coverage.
    // i.e. changed a few expressions starting with a recursive
    // descent to simple subscript $..book
    { path: "$.store.book[*].author", valid_in: NoRefPaths },
    { path: "$..author", valid_in: NoRefPaths },
    { path: "$.store.*", valid_in: NoRefPaths },
    { path: "$.store..price", valid_in: NoRefPaths },
    { path: "$.book[2]", valid_in: All },
    { path: "$..book[2]", valid_in: NoRefPaths },
    { path: "$.book[-2]", valid_in: NoRefPaths },
    { path: "$.book[0,1]", valid_in: NoRefPaths },
    { path: "$.book[:2]", valid_in: NoRefPaths },
    { path: "$.book[1:2]", valid_in: NoRefPaths },
    { path: "$.book[-2:]", valid_in: NoRefPaths },
    { path: "$.book[2:]", valid_in: NoRefPaths },
    { path: "$.book[?(@.isbn)]", valid_in: NoRefPaths },
    { path: "$.store.book[?(@.price < 10)]", valid_in: NoRefPaths },
    { path: "$.store.book[?(@.price < -10)]", valid_in: NoRefPaths },
    { path: "$.book[?(@.price <= $['expensive'])]", valid_in: None },
    { path: "$.book[?(@.author =~ /.*REES/i)]", valid_in: None },
    { path: "$..*", valid_in: NoRefPaths },
    { path: "..book.length()", valid_in: None },
  ];
  interface TestInputForContext {
    path: string;
    context: AslPathContext;
    expected_outcome: boolean;
  }
  const toInput = (): TestInputForContext[] => {
    return paths
      .map((input) => {
        const expansions: TestInputForContext[] = [];
        All.forEach((context) => {
          expansions.push({
            path: input.path,
            context,
            expected_outcome: input.valid_in.indexOf(context) !== -1,
          });
        });
        return expansions;
      })
      .reduce((previous, current) => [...previous, ...current]);
  };
  describe("valid paths", () => {
    it.each(toInput())(
      "$path as $context expected: $expected_outcome",
      ({ path, context, expected_outcome }) => {
        expect.hasAssertions();
        must(context);
        const result = validatePath(path, context);
        if (!result.isValid && expected_outcome) {
          // gets a better error message
          expect(result.message).toBeFalsy();
        }
        expect(result.isValid).toBe(expected_outcome);
      }
    );
  });
});
