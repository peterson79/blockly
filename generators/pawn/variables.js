/**
 * @fileoverview Generating Pawn for variable blocks.
 * @author jason@startechplus.com (Jason Peterson)
 */
'use strict';

goog.provide('Blockly.Pawn.variables');

goog.require('Blockly.Pawn');


Blockly.Pawn['variables_get'] = function (block) {
    // Variable getter.
    var code = Blockly.Pawn.variableDB_.getName(block.getFieldValue('VAR'),
        Blockly.Variables.NAME_TYPE);
    return [code, Blockly.Pawn.ORDER_ATOMIC];
};

Blockly.Pawn['variables_set'] = function (block) {
    // Variable setter.
    var argument0 = Blockly.Pawn.valueToCode(block, 'VALUE',
            Blockly.Pawn.ORDER_ASSIGNMENT) || '0';
    var varName = Blockly.Pawn.variableDB_.getName(block.getFieldValue('VAR'),
        Blockly.Variables.NAME_TYPE);

    if (!Blockly.Pawn.argumentDB_) {
        Blockly.Pawn.argumentDB_ = Object.create(null);
    }

    var args = {
        count: 0,
        isFloat:false,
        isPacked: false
    };

    if(Blockly.Pawn.argumentDB_[varName] && Blockly.Pawn.argumentDB_[varName].isFloat)
    {
        args.isFloat = true;
    }

    if (argument0.indexOf('[') == 0) {
        args.count = argument0.split(',').length;
        if(argument0.indexOf('.') >= 0){
            args.isFloat = true;
        }
        args.isPacked = false;
    } else if (argument0.indexOf('"') == 0) {
        args.count = argument0.length - 2;
        args.isPacked = true;
    } else if (argument0.indexOf('\'') == 0) {
        args.count = argument0.length - 4;
        args.isPacked = false;
    } else if (argument0.indexOf('{') == 0) {
        args.count = argument0.split(',').length;
        args.isPacked = true;
    }

    if(Blockly.Pawn.argumentDB_[varName] && Blockly.Pawn.argumentDB_[varName].count > args.count)
    {
        args.count = Blockly.Pawn.argumentDB_[varName].count;
    }


    if(args.count == 0 && argument0.indexOf('.') >= 0){
        args.isFloat = true;
    }

    Blockly.Pawn.argumentDB_[varName] = args;



    return varName + ' = ' + argument0 + ';\n';
};
