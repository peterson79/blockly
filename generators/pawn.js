/**
 * @license
 * Visual Blocks Language
 *
 * Copyright 2014 Google Inc.
 * https://developers.google.com/blockly/
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Helper functions for generating Pawn for blocks.
 * @author fraser@google.com (Neil Fraser)
 */
'use strict';

goog.provide('Blockly.Pawn');

goog.require('Blockly.Generator');


/**
 * Pawn code generator.
 * @type {!Blockly.Generator}
 */
Blockly.Pawn = new Blockly.Generator('Pawn');

/**
 * List of illegal variable names.
 * This is not intended to be a security feature.  Blockly is 100% client-side,
 * so bypassing this list is trivial.  This is intended to prevent users from
 * accidentally clobbering a built-in object or function.
 * @private
 */
Blockly.Pawn.addReservedWords(
    // https://www.pawnlang.org/docs/spec/latest/pawn-language-specification.pdf
    // Section 16.1.1
    'assert,break,case,catch,class,const,continue,default,do,else,enum,' +
    'extends,false,final,finally,for,if,in,is,new,null,rethrow,return,super,' +
    'switch,this,throw,true,try,var,void,while,with,' +
    // https://api.pawnlang.org/pawn_core.html
    'print,identityHashCode,identical,BidirectionalIterator,Comparable,' +
    'double,Function,int,Invocation,Iterable,Iterator,List,Map,Match,num,' +
    'Pattern,RegExp,Set,StackTrace,String,StringSink,Type,bool,DateTime,' +
    'Deprecated,Duration,Expando,Null,Object,RuneIterator,Runes,Stopwatch,' +
    'StringBuffer,Symbol,Uri,Comparator,AbstractClassInstantiationError,' +
    'ArgumentError,AssertionError,CastError,ConcurrentModificationError,' +
    'CyclicInitializationError,Error,Exception,FallThroughError,' +
    'FormatException,IntegerDivisionByZeroException,NoSuchMethodError,' +
    'NullThrownError,OutOfMemoryError,RangeError,StackOverflowError,' +
    'StateError,TypeError,UnimplementedError,UnsupportedError'
);

/**
 * Order of operation ENUMs.
 * https://www.pawnlang.org/docs/pawn-up-and-running/ch02.html#operator_table
 */
Blockly.Pawn.ORDER_ATOMIC = 0;         // 0 "" ...
Blockly.Pawn.ORDER_UNARY_POSTFIX = 1;  // expr++ expr-- () [] . ?.
Blockly.Pawn.ORDER_UNARY_PREFIX = 2;   // -expr !expr ~expr ++expr --expr
Blockly.Pawn.ORDER_MULTIPLICATIVE = 3; // * / % ~/
Blockly.Pawn.ORDER_ADDITIVE = 4;       // + -
Blockly.Pawn.ORDER_SHIFT = 5;          // << >>
Blockly.Pawn.ORDER_BITWISE_AND = 6;    // &
Blockly.Pawn.ORDER_BITWISE_XOR = 7;    // ^
Blockly.Pawn.ORDER_BITWISE_OR = 8;     // |
Blockly.Pawn.ORDER_RELATIONAL = 9;     // >= > <= < as is is!
Blockly.Pawn.ORDER_EQUALITY = 10;      // == !=
Blockly.Pawn.ORDER_LOGICAL_AND = 11;   // &&
Blockly.Pawn.ORDER_LOGICAL_OR = 12;    // ||
Blockly.Pawn.ORDER_IF_NULL = 13;       // ??
Blockly.Pawn.ORDER_CONDITIONAL = 14;   // expr ? expr : expr
Blockly.Pawn.ORDER_CASCADE = 15;       // ..
Blockly.Pawn.ORDER_ASSIGNMENT = 16;    // = *= /= ~/= %= += -= <<= >>= &= ^= |=
Blockly.Pawn.ORDER_NONE = 99;          // (...)

/**
 * Initialise the database of variable names.
 * @param {!Blockly.Workspace} workspace Workspace to generate code from.
 */
Blockly.Pawn.init = function(workspace) {
    // Create a dictionary of definitions to be printed before the code.
    Blockly.Pawn.definitions_ = Object.create(null);
    // Create a dictionary mapping desired function names in definitions_
    // to actual function names (to avoid collisions with user functions).
    Blockly.Pawn.functionNames_ = Object.create(null);

    if (!Blockly.Pawn.variableDB_) {
        Blockly.Pawn.variableDB_ =
            new Blockly.Names(Blockly.Pawn.RESERVED_WORDS_);
    } else {
        Blockly.Pawn.variableDB_.reset();
    }

    var defvars = [];
    var variables = workspace.getAllVariables();
    if (variables.length) {
        for (var i = 0; i < variables.length; i++) {
            defvars[i] = Blockly.Pawn.variableDB_.getName(variables[i].name,
                Blockly.Variables.NAME_TYPE);
        }
        Blockly.Pawn.definitions_['variables'] =
            'var ' + defvars.join(', ') + ';';
    }
};

/**
 * Prepend the generated code with the variable definitions.
 * @param {string} code Generated code.
 * @return {string} Completed code.
 */
Blockly.Pawn.finish = function(code) {
    // Indent every line.
    if (code) {
        code = Blockly.Pawn.prefixLines(code, Blockly.Pawn.INDENT);
    }
    code = 'main() {\n' + code + '}';

    // Convert the definitions dictionary into a list.
    var imports = [];
    var definitions = [];
    for (var name in Blockly.Pawn.definitions_) {
        var def = Blockly.Pawn.definitions_[name];
        if (def.match(/^import\s/)) {
            imports.push(def);
        } else {
            definitions.push(def);
        }
    }
    // Clean up temporary data.
    delete Blockly.Pawn.definitions_;
    delete Blockly.Pawn.functionNames_;
    Blockly.Pawn.variableDB_.reset();
    var allDefs = imports.join('\n') + '\n\n' + definitions.join('\n\n');
    return allDefs.replace(/\n\n+/g, '\n\n').replace(/\n*$/, '\n\n\n') + code;
};

/**
 * Naked values are top-level blocks with outputs that aren't plugged into
 * anything.  A trailing semicolon is needed to make this legal.
 * @param {string} line Line of generated code.
 * @return {string} Legal line of code.
 */
Blockly.Pawn.scrubNakedValue = function(line) {
    return line + ';\n';
};

/**
 * Encode a string as a properly escaped Pawn string, complete with quotes.
 * @param {string} string Text to encode.
 * @return {string} Pawn string.
 * @private
 */
Blockly.Pawn.quote_ = function(string) {
    // Can't use goog.string.quote since $ must also be escaped.
    string = string.replace(/\\/g, '\\\\')
        .replace(/\n/g, '\\\n')
        .replace(/\$/g, '\\$')
        .replace(/'/g, '\\\'');
    return '\'' + string + '\'';
};

/**
 * Common tasks for generating Pawn from blocks.
 * Handles comments for the specified block and any connected value blocks.
 * Calls any statements following this block.
 * @param {!Blockly.Block} block The current block.
 * @param {string} code The Pawn code created for this block.
 * @return {string} Pawn code with comments and subsequent blocks added.
 * @private
 */
Blockly.Pawn.scrub_ = function(block, code) {
    var commentCode = '';
    // Only collect comments for blocks that aren't inline.
    if (!block.outputConnection || !block.outputConnection.targetConnection) {
        // Collect comment for this block.
        var comment = block.getCommentText();
        comment = Blockly.utils.wrap(comment, Blockly.Pawn.COMMENT_WRAP - 3);
        if (comment) {
            if (block.getProcedureDef) {
                // Use documentation comment for function comments.
                commentCode += Blockly.Pawn.prefixLines(comment + '\n', '/// ');
            } else {
                commentCode += Blockly.Pawn.prefixLines(comment + '\n', '// ');
            }
        }
        // Collect comments for all value arguments.
        // Don't collect comments for nested statements.
        for (var i = 0; i < block.inputList.length; i++) {
            if (block.inputList[i].type == Blockly.INPUT_VALUE) {
                var childBlock = block.inputList[i].connection.targetBlock();
                if (childBlock) {
                    var comment = Blockly.Pawn.allNestedComments(childBlock);
                    if (comment) {
                        commentCode += Blockly.Pawn.prefixLines(comment, '// ');
                    }
                }
            }
        }
    }
    var nextBlock = block.nextConnection && block.nextConnection.targetBlock();
    var nextCode = Blockly.Pawn.blockToCode(nextBlock);
    return commentCode + code + nextCode;
};

/**
 * Gets a property and adjusts the value while taking into account indexing.
 * @param {!Blockly.Block} block The block.
 * @param {string} atId The property ID of the element to get.
 * @param {number=} opt_delta Value to add.
 * @param {boolean=} opt_negate Whether to negate the value.
 * @param {number=} opt_order The highest order acting on this value.
 * @return {string|number}
 */
Blockly.Pawn.getAdjusted = function(block, atId, opt_delta, opt_negate,
                                    opt_order) {
    var delta = opt_delta || 0;
    var order = opt_order || Blockly.Pawn.ORDER_NONE;
    if (block.workspace.options.oneBasedIndex) {
        delta--;
    }
    var defaultAtIndex = block.workspace.options.oneBasedIndex ? '1' : '0';
    if (delta) {
        var at = Blockly.Pawn.valueToCode(block, atId,
                Blockly.Pawn.ORDER_ADDITIVE) || defaultAtIndex;
    } else if (opt_negate) {
        var at = Blockly.Pawn.valueToCode(block, atId,
                Blockly.Pawn.ORDER_UNARY_PREFIX) || defaultAtIndex;
    } else {
        var at = Blockly.Pawn.valueToCode(block, atId, order) ||
            defaultAtIndex;
    }

    if (Blockly.isNumber(at)) {
        // If the index is a naked number, adjust it right now.
        at = parseInt(at, 10) + delta;
        if (opt_negate) {
            at = -at;
        }
    } else {
        // If the index is dynamic, adjust it in code.
        if (delta > 0) {
            at = at + ' + ' + delta;
            var innerOrder = Blockly.Pawn.ORDER_ADDITIVE;
        } else if (delta < 0) {
            at = at + ' - ' + -delta;
            var innerOrder = Blockly.Pawn.ORDER_ADDITIVE;
        }
        if (opt_negate) {
            if (delta) {
                at = '-(' + at + ')';
            } else {
                at = '-' + at;
            }
            var innerOrder = Blockly.Pawn.ORDER_UNARY_PREFIX;
        }
        innerOrder = Math.floor(innerOrder);
        order = Math.floor(order);
        if (innerOrder && order >= innerOrder) {
            at = '(' + at + ')';
        }
    }
    return at;
};
