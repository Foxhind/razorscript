import RazorStatement = require('./RazorStatement');
import RazorExpression = require('./RazorExpression');
import RazorBlock = require('./RazorBlock');

class RazorLabelStatement extends RazorStatement {
  public condition: RazorExpression;
  public label: string;

  constructor(label: string, condition?: RazorExpression) {
    super();
    this.label = label;
    this.condition = condition;
  }
}

export = RazorLabelStatement;
