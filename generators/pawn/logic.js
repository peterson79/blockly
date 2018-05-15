/**
 * @fileoverview Generating Pawn for logic blocks.
 * @author jason@startechplus.com (Jason Peterson)
 */
'use strict';

goog.provide('Blockly.Pawn.logic');

goog.require('Blockly.Pawn');


Blockly.Pawn['controls_if'] = function(block) {
  // If/elseif/else condition.
  var n = 0;
  var code = '', branchCode, conditionCode;
  do {
    conditionCode = Blockly.Pawn.valueToCode(block, 'IF' + n,
      Blockly.Pawn.ORDER_NONE) || 'false';
    branchCode = Blockly.Pawn.statementToCode(block, 'DO' + n);
    code += (n > 0 ? 'else ' : '') +
        'if (' + conditionCode + ') {\n' + branchCode + '}';

    ++n;
  } while (block.getInput('IF' + n));

  if (block.getInput('ELSE')) {
    branchCode = Blockly.Pawn.statementToCode(block, 'ELSE');
    code += ' else {\n' + branchCode + '}';
  }
  return code + '\n';
};

Blockly.Pawn['controls_ifelse'] = Blockly.Pawn['controls_if'];

Blockly.Pawn['logic_compare'] = function(block) {
  // Comparison operator.
  var OPERATORS = {
    'EQ': '==',
    'NEQ': '!=',
    'LT': '<',
    'LTE': '<=',
    'GT': '>',
    'GTE': '>='
  };
  var operator = OPERATORS[block.getFieldValue('OP')];
  var order = (operator == '==' || operator == '!=') ?
      Blockly.Pawn.ORDER_EQUALITY : Blockly.Pawn.ORDER_RELATIONAL;
  var argument0 = Blockly.Pawn.valueToCode(block, 'A', order) || '0';
  var argument1 = Blockly.Pawn.valueToCode(block, 'B', order) || '0';
  var code = argument0 + ' ' + operator + ' ' + argument1;
  return [code, order];
};

Blockly.Pawn['logic_operation'] = function(block) {
  // Operations 'and', 'or'.
  var operator = (block.getFieldValue('OP') == 'AND') ? '&&' : '||';
  var order = (operator == '&&') ? Blockly.Pawn.ORDER_LOGICAL_AND :
      Blockly.Pawn.ORDER_LOGICAL_OR;
  var argument0 = Blockly.Pawn.valueToCode(block, 'A', order);
  var argument1 = Blockly.Pawn.valueToCode(block, 'B', order);
  if (!argument0 && !argument1) {
    // If there are no arguments, then the return value is false.
    argument0 = 'false';
    argument1 = 'false';
  } else {
    // Single missing arguments have no effect on the return value.
    var defaultArgument = (operator == '&&') ? 'true' : 'false';
    if (!argument0) {
      argument0 = defaultArgument;
    }
    if (!argument1) {
      argument1 = defaultArgument;
    }
  }
  var code = argument0 + ' ' + operator + ' ' + argument1;
  return [code, order];
};

Blockly.Pawn['logic_negate'] = function(block) {
  // Negation.
  var order = Blockly.Pawn.ORDER_UNARY_PREFIX;
  var argument0 = Blockly.Pawn.valueToCode(block, 'BOOL', order) || 'true';
  var code = '!' + argument0;
  return [code, order];
};

Blockly.Pawn['logic_boolean'] = function(block) {
  // Boolean values true and false.
  var code = (block.getFieldValue('BOOL') == 'TRUE') ? 'true' : 'false';
  return [code, Blockly.Pawn.ORDER_ATOMIC];
};

Blockly.Pawn['logic_null'] = function(block) {
  // Null data type.
  return ['0', Blockly.Pawn.ORDER_ATOMIC];
};

Blockly.Pawn['logic_ternary'] = function(block) {
  // Ternary operator.
  var value_if = Blockly.Pawn.valueToCode(block, 'IF',
      Blockly.Pawn.ORDER_CONDITIONAL) || 'false';
  var value_then = Blockly.Pawn.valueToCode(block, 'THEN',
      Blockly.Pawn.ORDER_CONDITIONAL) || '0';
  var value_else = Blockly.Pawn.valueToCode(block, 'ELSE',
      Blockly.Pawn.ORDER_CONDITIONAL) || '0';
  var code = value_if + ' ? ' + value_then + ' : ' + value_else;
  return [code, Blockly.Pawn.ORDER_CONDITIONAL];
};
