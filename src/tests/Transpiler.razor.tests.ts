import Segment = require('../segments/Segment');
import Html = require('../segments/Html');
import HtmlAttribute = require('../segments/HtmlAttribute');
import Literal = require('../segments/Literal');
import RazorBlock = require('../segments/RazorBlock');
import RazorVariableAccess = require('../segments/RazorVariableAccess');
import RazorLiteral = require('../segments/RazorLiteral');
import RazorArrayAccess = require('../segments/RazorArrayAccess');
import RazorMethodCall = require('../segments/RazorMethodCall');
import RazorStatement = require('../segments/RazorStatement');
import RazorIfStatement = require('../segments/RazorIfStatement');
import RazorForLoop = require('../segments/RazorForLoop');
import RazorForEachLoop = require('../segments/RazorForEachLoop');
import RazorVariableAssignment = require('../segments/RazorVariableAssignment');
import RazorUnaryExpression = require('../segments/RazorUnaryExpression');
import RazorBinaryExpression = require('../segments/RazorBinaryExpression');
import RazorTernaryExpression = require('../segments/RazorTernaryExpression');
import IView = require('../IView');

import Transpiler = require('../transpiler/Transpiler');

QUnit.module('Transpiler Razor');

var transpile = function(model?: any, ...segments: Array<Segment>): IView {
  if (model instanceof Segment) {
    segments.unshift(<Segment>model);
    model = null;
  }
  var parser = { parse: function() { return segments; } },
      transpiler = new Transpiler(parser),
      viewClass = transpiler.transpile(),
      viewInstance = new viewClass(model);

  return viewInstance;
};

test('razor expression with literal string', function() {
  var view = transpile(// @("hello")
        new RazorLiteral('"hello"')
      ),
      result = view.execute();

  equal(result, 'hello');
});

test('razor expression with literal number', function() {
  var view = transpile(// @(42)
        new RazorLiteral('42')
      ),
      result = view.execute();

  equal(result, '42');
});

test('razor expression using view model', function() {
  var model = { bilbo: 'baggins' },
      view = transpile(// @model.bilbo
        model,
        new RazorVariableAccess('bilbo',
          new RazorVariableAccess('model', null))
      );

  var result = view.execute();

  equal(result, 'baggins');
});

test('razor block with empty html element', function() {
  var view = transpile(// @{<div />}
        new RazorBlock([
          new Html('div', '', ' ', true)
        ])
      ),
      result = view.execute();

  equal(result, '<div />');
});

test('razor block with variable assignment', function() {
  var view = transpile(// @{var x = 42;}
        new RazorBlock([
          new RazorVariableAssignment(
            new RazorVariableAccess('x'),
            new RazorLiteral('42')
          )
        ])
      ),
      code = view.execute.toString();

  ok(/;var x = 42;/.test(code), 'expected execute body to contain var x = 42;');
});

test('razor if(true) statement expression with empty html element', function() {
  var view = transpile(// @if(true){<div />}
        new RazorIfStatement(
          new RazorLiteral('true'),
          new RazorBlock([
            new Html('div', '', ' ', true)
          ])
        )
      ),
      result = view.execute();

  equal(result, '<div />');
});

test('razor if(false) statement expression with empty html element', function() {
  var view = transpile(// @if(false){<div />}
        new RazorIfStatement(
          new RazorLiteral('false'),
          new RazorBlock([
            new Html('div', '', ' ', true)
          ])
        )
      ),
      result = view.execute();

  equal(result, '');
});

test('razor for loop statement expression with empty html element', function() {
  var view = transpile(// @for(var i = 0; i < 2; ++i){ <div /> }
        new RazorForLoop(
          new RazorVariableAssignment(
            new RazorVariableAccess('i'),
            new RazorLiteral('0')
          ),
          new RazorBinaryExpression(
            new RazorVariableAccess('i'),
            '<',
            new RazorLiteral('2')
          ),
          new RazorUnaryExpression(
            new RazorVariableAccess('i'),
            '++'
          ),
          new RazorBlock([
            new Html('div', '', ' ', true)
          ])
        )
      );
  var result = view.execute();

  equal(result, '<div /><div />');
});

test('razor for loop statement expression with html element and loop variable', function() {
  var view = transpile(// @for(var i = 0; i < 2; ++i){ <div>@i</div> }
        new RazorForLoop(
          new RazorVariableAssignment(
            new RazorVariableAccess('i'),
            new RazorLiteral('0')
          ),
          new RazorBinaryExpression(
            new RazorVariableAccess('i'),
            '<',
            new RazorLiteral('2')
          ),
          new RazorUnaryExpression(
            new RazorVariableAccess('i'),
            '++'
          ),
          new RazorBlock([
            new Html('div', '', '', [], [
              new RazorVariableAccess('i')
            ])
          ])
        )
      ),
      result = view.execute();

  equal(result, '<div>0</div><div>1</div>');
});

test('razor for loop statement expression with loop variable and view model', function() {
  var view = transpile(// @for(var i = 0; i < model.d.length; ++i){ <div>@model.d[i]</div> }
        { d: ['alpha', 'bravo', 'charlie'] },
        new RazorForLoop(
          new RazorVariableAssignment(
            new RazorVariableAccess('i'),
            new RazorLiteral('0')
          ),
          new RazorBinaryExpression(
            new RazorVariableAccess('i'),
            '<',
            new RazorVariableAccess('length',
              new RazorVariableAccess('d',
                new RazorVariableAccess('model')
              )
            )
          ),
          new RazorUnaryExpression(
            new RazorVariableAccess('i'),
            '++'
          ),
          new RazorBlock([
            new Html('div', '', '', [], [
              new RazorArrayAccess(
                new RazorVariableAccess('d',
                  new RazorVariableAccess('model')
                ),
                new RazorVariableAccess('i')
              )
            ])
          ])
        )
      ),
      result = view.execute();

  equal(result, '<div>alpha</div><div>bravo</div><div>charlie</div>');
});

test('variable access without declaration is transpiled to access of a this property', function(){
  var view = transpile(
        new RazorBlock([
          new RazorVariableAccess('test')
        ])
      ),
      executeBody = view.execute.toString();

  ok(/push\(this\.test\)/.test(executeBody), 'expected execute body to contain this.test');
});

test('variable access with previous declaration is transpiled as-is', function(){
  var view = transpile(
        new RazorBlock([
          new RazorVariableAssignment(
            new RazorVariableAccess('test'),
            new RazorLiteral('42')
          ),
          new RazorVariableAccess('test')
        ])
      ),
      executeBody = view.execute.toString();

  ok(/push\(test\)/.test(executeBody), 'expected execute body to contain push(test)');
});

test('empty foreach loop with collection variable', function() {
  var view = transpile(
        new RazorForEachLoop(
          'abc',
          new RazorVariableAccess('def'),
          new RazorBlock([])
        )
      ),
      executeBody = view.execute.toString();

  ok(/this\.def\.forEach\(function\(abc\){},this\);/.test(executeBody), 'expected execute body to contain this.def.forEach(function(abc){},this);');
});
