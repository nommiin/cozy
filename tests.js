var a = [1, 2, 3];
var b = [9, 8, 7];

console.log("Concat:", JSON.stringify(a.concat(b)));
while (b.length > 0) {
    a.push(b.pop());
}
console.log("Pop:", JSON.stringify(a.concat(b)));

/*
mEvaluator = {
    Precedence: function(mToken) {
        // 0 = left
        // 1 = right
        switch (mToken.Value) {
            case "addpost": case "subpost": 
                return {Precedence: 2, Associativity: 0};
            case "addpre": case "subpre": 
                return {Precedence: 3, Associativity: 1};
            case "mul": case "div": case "mod":
                return {Precedence: 5, Associativity: 0};
            case "add": case "sub":
                return {Precedence: 6, Associativity: 0};
        }
        return -1;
    },
    Evaluate: function(mTokens) {
        var mOperators = [], mOutput = [];
        for(var mPosition = 0; mPosition < mTokens.length; mPosition++) {
            if (mTokens[mPosition].Type == "number" || mTokens[mPosition].Type == "variable" || mTokens[mPosition].Type == "string") {
                mOutput.push(mTokens[mPosition]);
            } else if (mTokens[mPosition].Type == "function") {
                mOperators.push(mTokens[mPosition]);
            } else if (mTokens[mPosition].Type == "operator") {
                if (mOperators.length > 0) {
                    while ((mOperators[mOperators.length - 1].Type == "function")
                    || (mEvaluator.Precedence(mOperators[mOperators.length - 1]).Precedence > mEvaluator.Precedence(mTokens[mPosition]).Precedence)
                    || (mEvaluator.Precedence(mOperators[mOperators.length - 1]).Precedence == mEvaluator.Precedence(mTokens[mPosition]).Precedence && mEvaluator.Precedence(mOperators[mOperators.length - 1]).Associativity == 0)
                    || (!(mOperators[mOperators.length - 1].Type == "parenthesis" && mOperators[mOperators.length - 1].Value == "left"))) {
                        mOutput.push(mOperators.pop());
                    }
                    mOperators.push(mTokens[mPosition]);
                }
                mOperators.push(mTokens[mPosition]);
            } else if (mTokens[mPosition].Type == "parenthesis") {
                if (mTokens[mPosition].Value == "left") {
                    mOperators.push(mTokens[mPosition]);
                } else if (mTokens[mPosition].Value == "right") {
                    while (!(mOperators[mOperators.length - 1].Type == "parenthesis" && mOperators[mOperators.length - 1].Value == "left")) {
                        mOutput.push(mOperators.pop());
                    }
                    mOperators.pop();
                }
            }
        }
        return mOutput;
    }
}

// 1 + (local.b + 32);

mEvaluator.Evaluate([{"Type":"number","Value":1},{"Type":"operator","Value":"add"},{"Type":"parenthesis","Value":"left"},{"Type":"variable","Value":"b","Scope":"local"},{"Type":"operator","Value":"add"},{"Type":"number","Value":32},{"Type":"parenthesis","Value":"right"}]);
*/