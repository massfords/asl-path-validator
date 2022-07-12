jsonpath
   = CONTEXT_ROOT_VALUE sub:subscript? _  {return {node: "$$", sub, isRoot:true}}
   / ROOT_VALUE sub:subscript? _  {return {node: "$", sub, isRoot:true}}
   / intrinsic_function

jsonpath_
   = CONTEXT_ROOT_VALUE sub:subscript? {return {node: "$$", sub}}
   / ROOT_VALUE sub:subscript? {return {node: "$", sub}}
   / CURRENT_VALUE sub:subscript? {return {node: "@", sub, atmark: true}}
   / intrinsic_function

jsonpath__
   = jsonpath_
   / value

subscript
   = RECURSIVE_DESCENT id:subscriptableBareword sub:subscript? {return {axis: "..", id, sub, recursiveDescent: true}}
   / RECURSIVE_DESCENT brackets:subscriptables sub:subscript? {return {axis: "..", brackets, sub, recursiveDescent: true}}
   / SUBSCRIPT WILDCARD_SUBSCRIPT sub:subscript? {return {axis: ".", wildcard: true, sub}}
   / SUBSCRIPT id:subscriptableBareword sub:subscript? {return {axis: ".", id, sub}}
   / brackets:subscriptables sub:subscript? {return {axis: ".", brackets, sub}}

subscriptables
   = BRACKET_LEFT _ head:subscriptable _ BRACKET_RIGHT { return {head}}
   / BRACKET_LEFT _ WILDCARD_SUBSCRIPT _ BRACKET_RIGHT { return {wildcard: true}}
   / BRACKET_LEFT _ minus:MINUS? head:NUMBER _ tail:( COMMA _ MINUS? NUMBER )* _ BRACKET_RIGHT {
        const negOffset = (minus === '-') || tail.some((t) => t[2]);
        const result = {
            head: minus === '-'? -head : head
        };
        if (tail.length >0 ) {
        	result.tail = tail.map((t) => t[2] === '-'? -t[3] : t[3]);
            result.multipleIndex = true;
        }
        if (negOffset) {
        	result.negOffset = true;
        }
        return result;
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
   / PAREN_LEFT _ head:jsonpath__ _ tail:(COMMA _ jsonpath__)* _ PAREN_RIGHT
   {return {
   	head,
    tail: tail.map((t) => t[2]) }
   }

subscriptable
   = STRING
   / MINUS? start:NUMBER COLON MINUS? end:NUMBER {return {start, end, slice:true}}
   / MINUS? start:NUMBER COLON {return {start:start, end:null, slice: true}}
   / COLON MINUS? end:NUMBER {return {start:null, end, slice: true}}
   / NUMBER
   / QUESTION PAREN_LEFT _ exp:expression _ PAREN_RIGHT {return {exp, filter: true}}
   / PAREN_LEFT _ CURRENT_VALUE ".length" _ MINUS _ offset:NUMBER _ PAREN_RIGHT {return {node:"@", offset: -offset, atmark: true}}
   / jsonpath_

expression
   = expression_

expression_
   = PAREN_LEFT _ exp:expression _ PAREN_RIGHT {return {exp}}
   / path:jsonpath__ _ op:comparison_op _ minus:MINUS? val:NUMBER {return {path, op, val: minus==='-'?-val:val}}
   / path:jsonpath__

comparison_op
	= EQ / LE / LT / GE / GT

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

MINUS = "-"
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
   = v:(escaped / [^),'"\\\.\[\] ><!=])* {return v.join('')}
STRING = singlequoted / doublequoted

singlequoted = [\'] v:(escaped / [^'\\])* [\'] {return v.join("")}
doublequoted = [\"] v:(escaped / [^"\\])* [\"] {return v.join("")}
escaped = "\\" c:allchars { return c; }
allchars = $[^\\n]

_ "whitespace" = [ \t\n]*

