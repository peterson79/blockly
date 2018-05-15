/**
 * @fileoverview Generating Pawn for loop blocks.
 * @author jason@startechplus.com (Jason Peterson)
 */
'use strict';

goog.provide('Blockly.Pawn.loops');

goog.require('Blockly.Pawn');


Blockly.Pawn['controls_repeat_ext'] = function(block) {
  // Repeat n times.
  if (block.getField('TIMES')) {
    // Internal number.
    var repeats = String(Number(block.getFieldValue('TIMES')));
  } else {
    // External number.
    var repeats = Blockly.Pawn.valueToCode(block, 'TIMES',
        Blockly.Pawn.ORDER_ASSIGNMENT) || '0';
  }
  var branch = Blockly.Pawn.statementToCode(block, 'DO');
  branch = Blockly.Pawn.addLoopTrap(branch, block.id);
  var code = '';
  var loopVar = Blockly.Pawn.variableDB_.getDistinctName(
      'count', Blockly.Variables.NAME_TYPE);
  var endVar = repeats;
  if (!repeats.match(/^\w+$/) && !Blockly.isNumber(repeats)) {
    var endVar = Blockly.Pawn.variableDB_.getDistinctName(
        'repeat_end', Blockly.Variables.NAME_TYPE);
    code += 'new ' + endVar + ' = ' + repeats + ';\n';
  }
  code += 'for (new ' + loopVar + ' = 0; ' +
      loopVar + ' < ' + endVar + '; ' +
      loopVar + '++) {\n' +
      branch + '}\n';
  return code;
};

Blockly.Pawn['controls_repeat'] = Blockly.Pawn['controls_repeat_ext'];

Blockly.Pawn['controls_whileUntil'] = function(block) {
  // Do while/until loop.
  var until = block.getFieldValue('MODE') == 'UNTIL';
  var argument0 = Blockly.Pawn.valueToCode(block, 'BOOL',
      until ? Blockly.Pawn.ORDER_UNARY_PREFIX :
      Blockly.Pawn.ORDER_NONE) || 'false';
  var branch = Blockly.Pawn.statementToCode(block, 'DO');
  branch = Blockly.Pawn.addLoopTrap(branch, block.id);
  if (until) {
    argument0 = '!' + argument0;
  }
  return 'while (' + argument0 + ') {\n' + branch + '}\n';
};

Blockly.Pawn['controls_for'] = function(block) {
  // For loop.
  var variable0 = Blockly.Pawn.variableDB_.getName(
      block.getFieldValue('VAR'), Blockly.Variables.NAME_TYPE);
  var argument0 = Blockly.Pawn.valueToCode(block, 'FROM',
      Blockly.Pawn.ORDER_ASSIGNMENT) || '0';
  var argument1 = Blockly.Pawn.valueToCode(block, 'TO',
      Blockly.Pawn.ORDER_ASSIGNMENT) || '0';
  var increment = Blockly.Pawn.valueToCode(block, 'BY',
      Blockly.Pawn.ORDER_ASSIGNMENT) || '1';
  var branch = Blockly.Pawn.statementToCode(block, 'DO');
  branch = Blockly.Pawn.addLoopTrap(branch, block.id);
  var code;
  if (Blockly.isNumber(argument0) && Blockly.isNumber(argument1) &&
      Blockly.isNumber(increment)) {
    // All arguments are simple numbers.
    var up = parseFloat(argument0) <= parseFloat(argument1);
    code = 'for (' + variable0 + ' = ' + argument0 + '; ' +
        variable0 + (up ? ' <= ' : ' >= ') + argument1 + '; ' +
        variable0;
    var step = Math.abs(parseFloat(increment));
    if (step == 1) {
      code += up ? '++' : '--';
    } else {
      code += (up ? ' += ' : ' -= ') + step;
    }
    code += ') {\n' + branch + '}\n';
  } else {
    code = '';
    // Cache non-trivial values to variables to prevent repeated look-ups.
    var startVar = argument0;
    if (!argument0.match(/^\w+$/) && !Blockly.isNumber(argument0)) {
      var startVar = Blockly.Pawn.variableDB_.getDistinctName(
          variable0 + '_start', Blockly.Variables.NAME_TYPE);
      code += 'new ' + startVar + ' = ' + argument0 + ';\n';
    }
    var endVar = argument1;
    if (!argument1.match(/^\w+$/) && !Blockly.isNumber(argument1)) {
      var endVar = Blockly.Pawn.variableDB_.getDistinctName(
          variable0 + '_end', Blockly.Variables.NAME_TYPE);
      code += 'var ' + endVar + ' = ' + argument1 + ';\n';
    }
    // Determine loop direction at start, in case one of the bounds
    // changes during loop execution.
    var incVar = Blockly.Pawn.variableDB_.getDistinctName(
        variable0 + '_inc', Blockly.Variables.NAME_TYPE);
    code += 'num ' + incVar + ' = ';
    if (Blockly.isNumber(increment)) {
      code += Math.abs(increment) + ';\n';
    } else {
      code += '(' + increment + ').abs();\n';
    }
    code += 'if (' + startVar + ' > ' + endVar + ') {\n';
    code += Blockly.Pawn.INDENT + incVar + ' = -' + incVar + ';\n';
    code += '}\n';
    code += 'for (' + variable0 + ' = ' + startVar + '; ' +
        incVar + ' >= 0 ? ' +
        variable0 + ' <= ' + endVar + ' : ' +
        variable0 + ' >= ' + endVar + '; ' +
        variable0 + ' += ' + incVar + ') {\n' +
        branch + '}\n';
  }
  return code;
};

Blockly.Pawn['controls_forEach'] = function(block) {
  // For each loop.
  var variable0 = Blockly.Pawn.variableDB_.getName(
      block.getFieldValue('VAR'), Blockly.Variables.NAME_TYPE);
  var argument0 = Blockly.Pawn.valueToCode(block, 'LIST',
      Blockly.Pawn.ORDER_ASSIGNMENT) || '[]';
  var branch = Blockly.Pawn.statementToCode(block, 'DO');
  branch = Blockly.Pawn.addLoopTrap(branch, block.id);

  var loopVar = Blockly.Pawn.variableDB_.getDistinctName(
      'count', Blockly.Variables.NAME_TYPE);

  var code = 'for (new ' + loopVar + ' = 0; ' + loopVar + ' < (sizeof ' + argument0 + '); '+ loopVar +'++) {\n' +
      variable0 + ' = ' + argument0 + '[' + loopVar + '];\n' +
      branch + '}\n';
  return code;
};

Blockly.Pawn['controls_flow_statements'] = function(block) {
  // Flow statements: continue, break.
  switch (block.getFieldValue('FLOW')) {
    case 'BREAK':
      return 'break;\n';
    case 'CONTINUE':
      return 'continue;\n';
  }
  throw 'Unknown flow statement.';
};
