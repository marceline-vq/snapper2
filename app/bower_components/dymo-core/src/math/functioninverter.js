/**
 * A tool that inverts simple functions.
 * @constructor
 */
function FunctionInverter() {
	
	//currently inverts functions that are linear binary trees with 
	//arithmetic operations, constant leaves, and one variable leaf
	this.invert = function(func) {
		var currentNode;
		try {
			currentNode = math.parse(func);
		} catch (e) {
			if (!(e instanceof SyntaxError)) {
				console.log(e);
			}
			return;
		}
		var symbolNode = new math.expression.node.SymbolNode('a');
		var invertedTree = symbolNode;
		while (currentNode) {
			if (currentNode.isSymbolNode) {
				symbolNode.name = currentNode.name;
				currentNode = undefined;
			} else if (currentNode.isParenthesisNode) {
				currentNode = currentNode.content;
			} else if (currentNode.isOperatorNode) {
				var invertedOperator = getInvertedOperator(currentNode.op);
				if (currentNode.op == '+' || currentNode.op == '*') {
					if (currentNode.args[0].isConstantNode) {
						invertedTree = new math.expression.node.OperatorNode(invertedOperator, getOperatorName(invertedOperator), [invertedTree, currentNode.args[0]]);
						currentNode = ifNextNode(currentNode.args[1]);
					} else if (currentNode.args[1].isConstantNode) {
						invertedTree = new math.expression.node.OperatorNode(invertedOperator, getOperatorName(invertedOperator), [invertedTree, currentNode.args[1]]);
						currentNode = ifNextNode(currentNode.args[0]);
					} else {
						return;
					}
				} else if (currentNode.op == '-' || currentNode.op == '/') {
					if (currentNode.args[0].isConstantNode) {
						invertedTree = new math.expression.node.OperatorNode(currentNode.op, getOperatorName(currentNode.op), [currentNode.args[0], invertedTree]);
						currentNode = ifNextNode(currentNode.args[1]);
					} else if (currentNode.args[1].isConstantNode) {
						invertedTree = new math.expression.node.OperatorNode(invertedOperator, getOperatorName(invertedOperator), [invertedTree, currentNode.args[1]]);
						currentNode = ifNextNode(currentNode.args[0]);
					} else {
						return;
					}
				}
			} else {
				return;
			}
		}
		return invertedTree.toString();
	}
	
	this.toJavaScriptFunction = function(returnString) {
		return new Function("a", "return " + returnString + ";");
	}
	
	this.toReturnValueString = function(functionString) {
		return functionString.substring(functionString.indexOf("return ")+7, functionString.indexOf(";"));
	}
	
	//returns the given node if a valid next node, undefined otherwise..
	function ifNextNode(node) {
		if (node.isOperatorNode || node.isParenthesisNode || node.isSymbolNode) {
			return node;
		}
	}
	
	function getInvertedOperator(operator) {
		if (operator == "+") {
			return "-";
		} else if (operator == "-") {
			return "+";
		} else if (operator == "*") {
			return "/";
		} else if (operator == "/") {
			return "*";
		}
	}
	
	//weirdly mathjs doesn't seem to offer this
	function getOperatorName(operator) {
		if (operator == "+") {
			return "add";
		} else if (operator == "-") {
			return "subtract";
		} else if (operator == "*") {
			return "multiply";
		} else if (operator == "/") {
			return "divide";
		}
	}
	
}