/**
 * @fileoverview Generating Pawn for variable blocks.
 * @author jason@startechplus.com (Jason Peterson)
 */
'use strict';

goog.provide('Blockly.Pawn.variables');

goog.require('Blockly.Pawn');


Blockly.Pawn['variables_get'] = function(block) {
  // Variable getter.
  var code = Blockly.Pawn.variableDB_.getName(block.getFieldValue('VAR'),
      Blockly.Variables.NAME_TYPE);
  return [code, Blockly.Pawn.ORDER_ATOMIC];
};

Blockly.Pawn['variables_set'] = function(block) {
  // Variable setter.
  var argument0 = Blockly.Pawn.valueToCode(block, 'VALUE',
      Blockly.Pawn.ORDER_ASSIGNMENT) || '0';
  var varName = Blockly.Pawn.variableDB_.getName(block.getFieldValue('VAR'),
      Blockly.Variables.NAME_TYPE);
  return varName + ' = ' + argument0 + ';\n';
};
