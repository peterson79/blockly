/**
 * @fileoverview Generating Pawn for procedure blocks.
 * @author jason@startechplus.com (Jason Peterson)
 */
'use strict';

goog.provide('Blockly.Pawn.procedures');

goog.require('Blockly.Pawn');


Blockly.Pawn['procedures_defreturn'] = function(block) {
  // Define a procedure with a return value.
  var funcName = Blockly.Pawn.variableDB_.getName(block.getFieldValue('NAME'),
      Blockly.Procedures.NAME_TYPE);
  var branch = Blockly.Pawn.statementToCode(block, 'STACK');
  if (Blockly.Pawn.STATEMENT_PREFIX) {
    var id = block.id.replace(/\$/g, '$$$$');  // Issue 251.
    branch = Blockly.Pawn.prefixLines(
        Blockly.Pawn.STATEMENT_PREFIX.replace(/%1/g,
        '\'' + id + '\''), Blockly.Pawn.INDENT) + branch;
  }
  if (Blockly.Pawn.INFINITE_LOOP_TRAP) {
    branch = Blockly.Pawn.INFINITE_LOOP_TRAP.replace(/%1/g,
        '\'' + block.id + '\'') + branch;
  }
  var returnValue = Blockly.Pawn.valueToCode(block, 'RETURN',
      Blockly.Pawn.ORDER_NONE) || '';
  if (returnValue) {
    returnValue = Blockly.Pawn.INDENT + 'return ' + returnValue + ';\n';
  }
  var returnType = returnValue ? 'dynamic' : 'void';
  var args = [];
  for (var i = 0; i < block.arguments_.length; i++) {
    args[i] = Blockly.Pawn.variableDB_.getName(block.arguments_[i],
        Blockly.Variables.NAME_TYPE);
  }
  var code = returnType + ' ' + funcName + '(' + args.join(', ') + ') {\n' +
      branch + returnValue + '}';
  code = Blockly.Pawn.scrub_(block, code);
  // Add % so as not to collide with helper functions in definitions list.
  Blockly.Pawn.definitions_['%' + funcName] = code;
  return null;
};

// Defining a procedure without a return value uses the same generator as
// a procedure with a return value.
Blockly.Pawn['procedures_defnoreturn'] = Blockly.Pawn['procedures_defreturn'];

Blockly.Pawn['procedures_callreturn'] = function(block) {
  // Call a procedure with a return value.
  var funcName = Blockly.Pawn.variableDB_.getName(block.getFieldValue('NAME'),
      Blockly.Procedures.NAME_TYPE);
  var args = [];
  for (var i = 0; i < block.arguments_.length; i++) {
    args[i] = Blockly.Pawn.valueToCode(block, 'ARG' + i,
        Blockly.Pawn.ORDER_NONE) || 'null';
  }
  var code = funcName + '(' + args.join(', ') + ')';
  return [code, Blockly.Pawn.ORDER_UNARY_POSTFIX];
};

Blockly.Pawn['procedures_callnoreturn'] = function(block) {
  // Call a procedure with no return value.
  var funcName = Blockly.Pawn.variableDB_.getName(block.getFieldValue('NAME'),
      Blockly.Procedures.NAME_TYPE);
  var args = [];
  for (var i = 0; i < block.arguments_.length; i++) {
    args[i] = Blockly.Pawn.valueToCode(block, 'ARG' + i,
        Blockly.Pawn.ORDER_NONE) || 'null';
  }
  var code = funcName + '(' + args.join(', ') + ');\n';
  return code;
};

Blockly.Pawn['procedures_ifreturn'] = function(block) {
  // Conditionally return value from a procedure.
  var condition = Blockly.Pawn.valueToCode(block, 'CONDITION',
      Blockly.Pawn.ORDER_NONE) || 'false';
  var code = 'if (' + condition + ') {\n';
  if (block.hasReturnValue_) {
    var value = Blockly.Pawn.valueToCode(block, 'VALUE',
        Blockly.Pawn.ORDER_NONE) || 'null';
    code += Blockly.Pawn.INDENT + 'return ' + value + ';\n';
  } else {
    code += Blockly.Pawn.INDENT + 'return;\n';
  }
  code += '}\n';
  return code;
};
