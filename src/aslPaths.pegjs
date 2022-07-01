jsonpath
   = CONTEXT_ROOT_VALUE sub:subscript? _  {return {node: "$$", sub, isRoot:true}}
   / ROOT_VALUE sub:subscript? _  {return {node: "$", sub, isRoot:true}}
   / intrinsic_function

jsonpath_
   = CONTEXT_ROOT_VALUE sub:subscript? {return {node: "$$", sub}}
   / ROOT_VALUE sub:subscript? {return {node: "$", sub}}
   / CURRENT_VALUE sub:subscript? {return {node: "@", sub}}
   / intrinsic_function

jsonpath__
   = jsonpath_
   / value

subscript
   = RECURSIVE_DESCENT id:subscriptableBareword sub:subscript? {return {axis: "..", id, sub}}
   / RECURSIVE_DESCENT brackets:subscriptables sub:subscript? {return {axis: "..", brackets, sub}}
   / SUBSCRIPT id:subscriptableBareword sub:subscript? {return {axis: ".", id, sub}}
   / brackets:subscriptables sub:subscript? {return {axis: ".", brackets, sub}}

subscriptables
   = BRACKET_LEFT head:subscriptable BRACKET_RIGHT { return {head}}
   / BRACKET_LEFT head:NUMBER tail:( COMMA NUMBER )* BRACKET_RIGHT {
   		return {
        head,
        tail: tail.map((t) => t[1])
        }
     }

subscriptableBareword
   = ID
   / intrinsic_function
   / WILDCARD_SUBSCRIPT

intrinsic_function
	= func:"States.Format" args:function_args {return {func, args}}
    / func:"States.StringToJson" args:single_arg {return {func, args}}
    / func:"States.JsonToString" args:single_arg {return {func, args}}
    / func:"States.Array" args:function_args {return {func, args}}

single_arg
   = PAREN_LEFT _ head:jsonpath__ _ PAREN_RIGHT
   {return {
   	head,
    tail: [] }
   }


function_args
   = PAREN_LEFT _ PAREN_RIGHT { return []}
   / PAREN_LEFT _ head:jsonpath__ _ tail:(COMMA _ jsonpath__ _)* _ PAREN_RIGHT
   {return {
   	head,
    tail: tail.map((t) => t[2]) }
   }

subscriptable
   = STRING
   / start:NUMBER COLON end:NUMBER {return {start, end, slice:true}}
   / NUMBER
   / COLON end:NUMBER {return {start:null, end, slice: true}}
   / WILDCARD_SUBSCRIPT
   / QUESTION PAREN_LEFT exp:expression PAREN_RIGHT {return {exp}}
   / jsonpath_

expression
   = expression_

expression_
   = PAREN_LEFT exp:expression PAREN_RIGHT {return {exp}}
   / path:jsonpath__
   / path:jsonpath__ op:comparison_op val:NUMBER {return {path, op, val}}

comparison_op
	= EQ / LT / LE / GT / GE

value
   = STRING
   / NUMBER
   / TRUE
   / FALSE
   / NULL


CURRENT_VALUE = "@"
RECURSIVE_DESCENT = ".."
CONTEXT_ROOT_VALUE = "$$"
ROOT_VALUE = "$"
SUBSCRIPT = "."
WILDCARD_SUBSCRIPT = "*"

EQ = "=="
GE = ">="
GT = ">"
LE = "<="
LT = "<"

BRACKET_LEFT = "["
BRACKET_RIGHT = "]"
COMMA = ","
PAREN_LEFT = "("
PAREN_RIGHT = ")"
QUESTION = "?"
NUMBER = $[0-9]+
COLON = ":"

TRUE = "true"
FALSE = "false"
NULL = "null"

ID
   = v:(escaped / [^),'"\\\.\[\]])* {return v.join('')}
STRING = singlequoted / doublequoted

singlequoted = [\'] v:(escaped / [^'\\])* [\'] {return v.join("")}
doublequoted = [\"] v:(escaped / [^"\\])* [\"] {return v.join("")}
escaped = "\\" c:allchars { return c; }
allchars = $[^\\n]

_ "whitespace" = [ \t\n]*

