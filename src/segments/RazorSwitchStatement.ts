import RazorStatement = require('./RazorStatement');
import RazorExpression = require('./RazorExpression');
import RazorBlock = require('./RazorBlock');

class RazorSwitchStatement extends RazorStatement {
  public expression: RazorExpression;
  public body: RazorBlock;

  constructor(expression: RazorExpression, body: RazorBlock) {
    super();
    this.expression = expression;
    this.body = body;
  }
}

export = RazorSwitchStatement;
