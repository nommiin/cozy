/**
    cozy - another compiler(?) and stack-based vm
    by nommiin
 */

mGeneric = false;
mOptimize = true;
mBracketType = "";
mBrackets = [];
mBytecode = [];
mVariables = [];
mFunctions = ["print"];

mTokens = {
    "local": {
        Section: {Start: undefined, End: ";"},
        Process: function(mSection) {
            var mSections = mCompiler.Split(mSection);
            for(var i = 0; i < mSections.length; i++) {
                mSection = mSections[i];
                mBytecode.push("EXPR", mSection.split("=").splice(1).join("").trim());
                mBytecode.push("LOCL", mSection.split("=")[0].trim());
                mVariables.push(mBytecode[mBytecode.length - 1]);
            }
        }
    },
    "global": {
        Section: {Start: undefined, End: ";"},
        Process: function(mSection) {
            var mSections = mSection.split(",");
            for(var i = 0; i < mSections.length; i++) {
                mSection = mSections[i];
                mBytecode.push("EXPR", mSection.split("=").splice(1).join("").trim());
                mBytecode.push("GLOB", mSection.split("=")[0].trim());
                mVariables.push(mBytecode[mBytecode.length - 1]);
            }
        }
    },
    "if": {
        Section: {Start: "(", End: ")"},
        Types: [ ">", "<", ">=", "<=", "!=", "==" ],
        Process: function(mSection) {
            for(var i = 0; i < mSection.length; i++) {
                for(var j = 0; j < this.Types.length; j++) {
                    if (mSection.slice(i, i + this.Types[j].length) == this.Types[j]) {
                        mBytecode.push("EXPR", mSection.slice(i + this.Types[j].length).trim());
                        mBytecode.push("EXPR", mSection.slice(0, i).trim());
                        mBytecode.push("COMP", this.Types[j]);
                        mBracketType = "cond";
                        break;
                    }
                }
            }
        }
    },
    "function": {
        Section: {Start: undefined, End: ")"},
        Process: function(mSection) {
            var mName = mSection.slice(0, mSection.indexOf("(")), mArguments = mSection.slice(mSection.indexOf("(") + 1);
            mBytecode.push("FUNC", mName);
            mFunctions.push(mName);
            mBracketType = "func";
        }
    },
    "return": {
        Section: {Start: undefined, End: ";"},
        Process: function(mSection) {
            mBytecode.push("EXPR", mSection);
            mBytecode.push("RTRN");
        }
    }
};

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

        while (mOperators.length > 0) {
            mOutput.push(mOperators.pop());
        }
        return mOutput;
    }
}

mCompiler = {
    Split: function(mValue) {
        if (mValue.trim() == "") {return []};
        var mSections = [], mEscape = false;
        for(var mPosition = 0, mBase = 0; mPosition < mValue.length; mPosition++) {
            switch (mValue[mPosition]) {
                case "(": case ")": {
                    mEscape = !mEscape;
                    break;    
                }

                case "\"": {
                    if (mValue[mPosition - 1] != "\\") {
                        mEscape = !mEscape;
                    }
                    break;
                }

                case ",": {
                    if (mEscape == false) {
                        mSections.push(mValue.slice(mBase, mPosition).trim());
                        mBase = ++mPosition;
                    }
                    break;
                }
            }
        }
        return mSections.concat(mValue.slice(mBase).trim());
    },
    Type: function(mValue) {
        mValue = (typeof mValue == "string") ? mValue.charCodeAt(0) : mValue;
        if ((mValue >= 65 && mValue <= 90) || (mValue >= 97 && mValue <= 122)) {
            return "letter";
        } else if ((mValue >= 48 && mValue <= 57) || mValue == 46) {
            return "number";
        }
        return "unknown";
    },
    Error: function(mText) {
        // TODO: Probably
        console.error("ERROR: " + mText);
        process.exit();
    },
    Compile: function(mInput) {
        for(mPosition = 0; mPosition < mInput.length; mPosition++) {
            var mFound = false;
            // Tokens
            for(mToken in mTokens) {
                if (mInput.slice(mPosition, mPosition + mToken.length) == mToken) {
                    mPosition += mToken.length;
                    while (mTokens[mToken].Section.Start != undefined && mInput[mPosition] != mTokens[mToken].Section.Start) {
                        if (++mPosition > mInput.length) {
                            mCompiler.Error("Could not find starting token:", mTokens[mToken].Section.Start);
                        }
                    }
                    var mBase = (mTokens[mToken].Section.Start != undefined ? 1 : 0) + mPosition;
                    while (mTokens[mToken].Section.End != undefined && mInput[mPosition] != mTokens[mToken].Section.End) {
                        if (++mPosition > mInput.length) {
                            mCompiler.Error(`Could not find ending token: "${mTokens[mToken].Section.End}"`);
                        }
                    }
                    mTokens[mToken].Process(mInput.slice(mBase, mPosition).trim());
                    mFound = true;
                    
                }
            }
            // Functions
            if (mFound == false) {
                for(mFunction in mFunctions) {
                    mFunction = mFunctions[mFunction];
                    if (mInput.slice(mPosition, mPosition + mFunction.length) == mFunction) {
                        var mBase = mPosition;
                        mPosition += mFunction.length;
                        while (mInput[mPosition] != "(") {
                            if (++mPosition > mInput.length) {
                                mCompiler.Error("Could not find function starting token: \"(\"");
                            }
                        }
                        while (mInput[mPosition] != ")") {
                            if (++mPosition > mInput.length) {
                                mCompiler.Error("Could not find function ending token: \")\"");
                            }
                        }

                        mBytecode.push("EXPR", mInput.slice(mBase, ++mPosition));

                        //mBytecode.push("EXPR", [mFunction, 0]);

                        //console.log("function!!", mInput.slice(mBase, mPosition));
                    }
                }
            }

            // Variables
            if (mFound == false) {
                for(mVariable in mVariables) {
                    mVariable = mVariables[mVariable];
                    if (mInput.slice(mPosition, mPosition + mVariable.length) == mVariable) {
                        mPosition += mVariable.length;
                        var mBase = mPosition;
                        while (mInput[mPosition] != ";") {
                            if (++mPosition > mInput.length) {
                                mCompiler.Error("Could not find variable ending token: \";\"")
                            }
                        }
                        var mSection = mInput.slice(mBase, mPosition).trim();
                        if (mSection.match(/\+=|-=|\*=|\/=|%=|&=|\|=|\^=|<<=|>>=|>>>=/g) == null) {
                            // Standard Assignment
                            mBytecode.push("EXPR", mSection.slice(mSection.indexOf("=") + 1).trim());
                            mBytecode.push("LOCL", mVariable);
                        } else {
                            mBytecode.push("EXPR", `${mVariable + " " + mSection.slice(0, mSection.indexOf("="))} (${mSection.slice(mSection.indexOf("=") + 1).trim()})`);
                            mBytecode.push("LOCL", mVariable);
                        }
                    }
                }
            }

            // Characters
            if (mFound == false) {
                switch (mInput[mPosition]) {
                    case "/": {
                        switch (mInput[mPosition + 1]) {
                            // Single Comment
                            case "/": {
                                mPosition += 2;
                                while (mInput[mPosition] != "\n") {
                                    if (++mPosition > mInput.length) {
                                        break;
                                    }
                                }
                                console.log("end of single comment");
                                break;
                            }

                            // Multi-line Comment
                            case "*": {
                                mPosition += 2;
                                while (mInput.slice(mPosition, mPosition + 2) != "*/") {
                                    if (++mPosition > mInput.length) {
                                        break;
                                    }
                                }
                                console.log("end of multiline comment");
                                break;
                            }
                        }
                        break;
                    }

                    // Left Parenthesis
                    case "{": {
                        mBrackets.push(mBracketType);
                        break;
                    }

                    // Right Parenthesis
                    case "}": {
                        if (mBrackets.length > 0) {
                            switch (mBrackets.pop()) {
                                case "func": {
                                    mBytecode.push("FUNC");
                                    break;
                                }

                                case "cond": {
                                    console.log("END OF IF STATEMENT");
                                    break;
                                }
                            }
                        } else {
                            mCompiler.Error("Unexpected closing bracket found", mPosition);;
                        }
                        break;
                    }
                }
            }
            
        }

        console.log("- Inital Pass -");
        mCompiler.Print();
        console.log("- Optimization Pass" + (!mOptimize ? " (SKIPPED)" : "") + " -");
        if (mOptimize == true) {
            mCompiler.Optimize();
            mCompiler.Print();
        }
        console.log("- Expansion Pass" + (mGeneric ? " (SKIPPED)" : "") + " -");
        if (mGeneric == false) {
            mCompiler.Expand();
            mCompiler.Print();
        }
        console.log("- Compile Complete -");
        mCompiler.Print();
        return mBytecode;
        //console.log(JSON.stringify(mBytecode));
    },
    Instructionize: function(mTokens) {
        var mInstructions = [];
        for(var mPosition = 0; mPosition < mTokens.length; mPosition++) {
            switch (mTokens[mPosition].Type) {
                case "operator": {
                    switch (mTokens[mPosition].Value) {
                        case "add": mInstructions.push("ADD"); break;
                        case "sub": mInstructions.push("SUB"); break;
                        case "div": mInstructions.push("DIV"); break;
                        case "mul": mInstructions.push("MUL"); break;
                        case "addpre": {
                            if (mTokens[mPosition + 1].Type == "variable") {
                                mInstructions.push("PUSH", [mTokens[mPosition + 1].Scope, mTokens[mPosition + 1].Value], "PUSH", ["number", 1], "ADD", "DUP", (mTokens[mPosition + 1].Scope == "local" ? "LOCL" : "GLOB"), mTokens[mPosition + 1].Value);
                                mPosition++;
                            } else {mCompiler.Error("Failed to instructionize, expected variable token ahead of preincrement", mPosition);}
                            break;
                        }

                        case "addpost": {
                            if (mTokens[mPosition - 1].Type == "variable") {
                                mInstructions.push("DUP", "PUSH", ["number", 1], "ADD", (mTokens[mPosition - 1].Scope == "local" ? "LOCL" : "GLOB"), mTokens[mPosition - 1].Value);
                            } else {mCompiler.Error("Failed to instructionize, expected variable token behind postincrement", mPosition);}
                            break;
                        }
                    }
                    break;
                }

                case "variable": {
                    mInstructions.push("PUSH", [mTokens[mPosition].Scope, mTokens[mPosition].Value]);
                    break;
                }

                case "number": {
                    mInstructions.push("PUSH", ["number", mTokens[mPosition].Value]);
                    break;
                }

                case "string": {
                    mInstructions.push("PUSH", ["string", mTokens[mPosition].Value]);
                    break;
                }

                case "function": {
                    for(var i = 0; i < mTokens[mPosition].Arguments.length; i++) {
                        mInstructions = mInstructions.concat(mCompiler.Instructionize(mTokens[mPosition].Arguments[i]));
                    }
                    mInstructions.push("CALL", [mTokens[mPosition].Arguments.length, mTokens[mPosition].Value]);
                    break;
                }
            }
           // switch (mTokens[i].Type) {
                //case "function":
            //}
        }
        return mInstructions;
    },
    Expand: function() {
        for(var mPosition = 0; mPosition < mBytecode.length; mPosition++) {
            if (mBytecode[mPosition] == "EXPR") {
                mBytecode = (mBytecode.slice(0, mPosition)).concat(mCompiler.Instructionize(mEvaluator.Evaluate(mCompiler.Tokenize(mBytecode[mPosition + 1]))).concat(mBytecode.slice(mPosition + 2)));
            }
        }
    },
    Tokenize: function(mExpression) {
        // Turn generic expressions into operators
        var mTokens = [];
        for(var mPosition = 0; mPosition < mExpression.length; mPosition++) {
            switch (mExpression.charCodeAt(mPosition)) {
                // Left parenthesis
                case 40: {
                    mTokens.push({Type: "parenthesis", Value: "left"});
                    break;
                }

                // Right parenthesis
                case 41: {
                    mTokens.push({Type: "parenthesis", Value: "right"});
                    break;
                }

                // String
                case 34: {
                    var mBase = mPosition + 1;
                    while (mExpression.charCodeAt(++mPosition) != 34) {
                        if (mPosition > mExpression.length) {
                            mCompiler.Error("Failed to tokenize expression, could not find closing token", mPosition);
                        }
                    }
                    mTokens.push({Type: "string", Value: mExpression.slice(mBase, mPosition)});
                    break;
                }

                // Add
                case 43: {
                    switch (mExpression.charCodeAt(mPosition + 1)) {
                        case 43: {
                            mTokens.push({Type: "operator", Value: "add" + ((mTokens.length > 0 && mTokens[mTokens.length - 1].Type == "variable") ? "post" : "pre")});
                            mPosition++;
                            break;
                        }
                        default: mTokens.push({Type: "operator", Value: "add"});
                    }
                    break;
                }

                // Subtract
                case 45: {
                    switch (mExpression.charCodeAt(mPosition + 1)) {
                        case 45: {
                            mTokens.push({Type: "operator", Value: "sub" + ((mTokens.length > 0 && mTokens[mTokens.length - 1].Type == "variable") ? "post" : "pre")});
                            mPosition++;
                            break;
                        }
                        default: mTokens.push({Type: "operator", Value: "sub"});
                    }
                    break;
                }

                // Multiply
                case 42: mTokens.push({Type: "operator", Value: "mul"}); break;
                // Divide
                case 47: mTokens.push({Type: "operator", Value: "div"}); break;
                // Modulo
                case 37: mTokens.push({Type: "operator", Value: "mod"}); break;

                // Dynamic
                default: {
                    var mBase = mPosition;
                    switch (mCompiler.Type(mExpression[mPosition])) {
                        // Function/Variable
                        case "letter": {
                            while (mCompiler.Type(mExpression[mPosition]) == "letter" || mCompiler.Type(mExpression[mPosition]) == "number" || mExpression.charCodeAt(mPosition) == 95) {
                                if (mExpression[mPosition] == "." && mCompiler.Type(mExpression[mPosition + 1] != "number")) {
                                    break;
                                } else {
                                    if (++mPosition > mExpression.length) {
                                        break;
                                    }
                                }
                            }

                            switch (mExpression.charCodeAt(mPosition)) {
                                // Function
                                case 40: {
                                    var mFunction =  mExpression.slice(mBase, mPosition).trim(), mBase = mPosition + 1;
                                    mPosition = mExpression.length;
                                    while (mExpression.charCodeAt(mPosition) != 41) {
                                        if (--mPosition < 0) {
                                            mCompiler.Error("Unable to tokenize expression, could not find end of function call", mPosition);
                                        }
                                    }
                                    var mArguments = mCompiler.Split(mExpression.slice(mBase, mPosition).trim());
                                    console.log("ARGUMENTS::", JSON.stringify(mArguments));
                                    for(var i = 0; i < mArguments.length; i++) {
                                        mArguments[i] = mCompiler.Tokenize(mArguments[i]);
                                    }
                                    mTokens.push({Type: "function", Value: mFunction, Arguments: mArguments});//mCompiler.Tokenize(mExpression.slice(mBase, mPosition).trim())});
                                    break;
                                }

                                // Variable
                                case 46: {
                                    var mScope = mExpression.slice(mBase, mPosition).trim();
                                    mBase = ++mPosition;
                                    while (mCompiler.Type(mExpression[mPosition]) == "letter" || mCompiler.Type(mExpression[mPosition]) == "number" || mExpression.charCodeAt(mPosition) == 95) {
                                        if (++mPosition > mExpression.length) {
                                            break;
                                        }
                                    }
                                    mTokens.push({Type: "variable", Value: mExpression.slice(mBase, mPosition--).trim(), Scope: mScope})
                                    break;
                                }

                                // Special
                                default: {
                                    console.log(`Special: "${mExpression.slice(mPosition)}"`);
                                    break;
                                }
                            }
                            break;
                        }

                        // Number
                        case "number": {
                            while (mCompiler.Type(mExpression[mPosition]) == "number") {
                                if (++mPosition > mExpression.length) {
                                    break;
                                }
                            }
                            mTokens.push({Type: "number", Value: parseFloat(mExpression.slice(mBase, mPosition--))});
                            break;
                        }

                        // Unknown/Whitespace
                        default: {
                            if (mExpression.charCodeAt(mPosition) > 32) {
                                mCompiler.Error("Unable to tokenize expression, unexpected character in stream", mPosition);
                            }
                        }
                    }
                }
            }
        }
        console.log("Final Tokens", JSON.stringify(mTokens));
        return mTokens;
    },
    Optimize: function() {
        // Constant propogation and such
        for(var mPointer = 0; mPointer < mBytecode.length; mPointer += 2) {
            switch (mBytecode[mPointer]) {
                case "EXPR": {
                    if (mBytecode[mPointer + 1].match(/>>>|>>|<<|\^|&|~|\|/) == null) {
                        var mExpression = undefined;
                        try {
                            mExpression = eval(mBytecode[mPointer + 1]);
                        } catch(e) {};
                        if (mExpression != undefined) {
                            switch (typeof mExpression) {
                                case "string": {
                                    mBytecode[mPointer + 1] = `"${mExpression}"`;
                                    break;
                                }

                                default: {
                                    if (isNaN(mExpression) == false) {
                                        mBytecode[mPointer + 1] = mExpression.toString();
                                    }
                                    break;
                                }
                            }
                        }
                        
                    }
                    break;
                }
            }
        }
    },
    Print: function() {
        for(var i = 0; i < mBytecode.length; i += 2) {
            console.log(`0x${(i / 2).toString(16).padStart(2, "0")} = ${mBytecode[i]}:[${mBytecode[i + 1]}]`);
        }
    }
};

mRuntime = {
    Globals: {},
    Functions: {
        "print": {
            Type: 0,
            Code: (string) => {
                console.log("VM::(" + string + ")");
            }
        }
    },
    Continue: true,
    Error: function(string, position=0) {
        console.log(`Runtime Error: '${string}' at position ${position}`);
        mRuntime.Continue = false;
    },
    Run: function(mBytecode, mStack=[]) {
        var mLocals = {};
        for(var mPosition = 0; mPosition < mBytecode.length; mPosition++) {
            if (mRuntime.Continue == false) break;
            switch (mBytecode[mPosition]) {
                case "ADD": (mStack.length < 2 ? mRuntime.Error("Unable to complete add operation, expecting at least 2 values in stack", mPosition) : 0); mStack.push(mStack.pop() + mStack.pop()); break;
                case "SUB": (mStack.length < 2 ? mRuntime.Error("Unable to complete subtract operation, expecting at least 2 values in stack", mPosition) : 0); mStack.push(mStack.pop() - mStack.pop()); break;
                case "MUL": (mStack.length < 2 ? mRuntime.Error("Unable to complete multiplcation operation, expecting at least 2 values in stack", mPosition) : 0); mStack.push(mStack.pop() * mStack.pop()); break;
                case "DIV": (mStack.length < 2 ? mRuntime.Error("Unable to complete division operation, expecting at least 2 values in stack", mPosition) : 0); mStack.push(mStack.pop() / mStack.pop()); break;
                case "DUP": (mStack.length < 1 ? mRuntime.Error("Unable to complete duplication operation, expecting at least 1 value in stack", mPosition) : 0); mStack.push(mStack[mStack.length - 1]); break;
                case "POP": (mStack.length < 1 ? mRuntime.Error("Unable to complete pop operation, expecting at least 1 value in stack", mPosition) : 0); mStack.pop(); break;
               
                case "PUSH": {
                    switch (mBytecode[mPosition + 1][0]) {
                        case "string": mStack.push(mBytecode[++mPosition][1].toString()); break;
                        case "number": mStack.push(parseFloat(mBytecode[++mPosition][1])); break;
                        case "global": (mGlobals[mBytecode[mPosition + 1][1]] == undefined ? mRuntime.Error("Unable to push value, undefined global variable named \"" + mGlobals[mBytecode[mPosition + 1]][1] + "\" given", mPosition) : 0); mStack.push(mGlobals[mBytecode[++mPosition][1]]); break;
                        case "local": (mLocals[mBytecode[mPosition + 1][1]] == undefined ? mRuntime.Error("Unable to push value, undefined local variable named \"" + mBytecode[mPosition + 1][1] + "\" given", mPosition) : 0); mStack.push(mLocals[mBytecode[++mPosition][1]]); break;
                        default: mRuntime.Error("Unable to push value, unknown type given", mPosition);
                    }
                    break;
                }

                case "LOCL": {
                    if (mStack.length > 0) {
                        mLocals[mBytecode[++mPosition]] = mStack.pop();
                    } else {mRuntime.Error("Unable to assign local variable, stack is empty", mPosition);}
                    break;
                }

                case "GLOB": {
                    if (mStack.length > 0) {
                        mRuntime.Globals[mBytecode[++mPosition]] = mStack.pop();
                    } else {mRuntime.Error("Unable to assign global variable, stack is empty", mPosition);}
                    break;
                }

                case "CALL": {
                    if (mRuntime.Functions[mBytecode[mPosition + 1][1]] != undefined) {
                        let mArguments = [];
                        if (mStack.length >= mBytecode[mPosition + 1][0]) {
                            for(var j = 0; j < mBytecode[mPosition + 1][0]; j++) {
                                mArguments[j] = mStack.pop();
                            }
                        } else {mRuntime.Error("Unable to pass arguments, stack does not contain enough values", mPosition);}

                        switch (mRuntime.Functions[mBytecode[mPosition + 1][1]].Type) {
                            case 0: {
                                mRuntime.Functions[mBytecode[++mPosition][1]].Code.apply(this, mArguments);
                                break;
                            }

                            case 1: {
                                let mRoute = mRuntime.Functions[mBytecode[++mPosition][1]].Route;
                                mRuntime.Run(mBytecode.slice(mRoute[0], mRoute[1]), mArguments).forEach(e => {
                                    mStack.push(e);
                                });
                                break;
                            }
                        }
                    } else {mRuntime.Error("Unable to call function, undefined function named \"" + mBytecode[mPosition + 1][1] + "\" given", mPosition);}
                    break;
                }

                case "COMP": {
                    if (mStack.length >= 2) {
                        switch (mBytecode[++mPosition]) {
                            case "eq": mStack.push(mStack.pop() == mStack.pop()); break;
                            case "ne": mStack.push(mStack.pop() != mStack.pop()); break;
                            case "lt": mStack.push(mStack.pop() < mStack.pop());  break;
                            case "gt": mStack.push(mStack.pop() > mStack.pop());  break;
                            case "le": mStack.push(mStack.pop() <= mStack.pop()); break;
                            case "ge": mStack.push(mStack.pop() >= mStack.pop()); break;
                            default: {
                                mRuntime.Error("Unable to compare, unknown comparision type of \"" + mBytecode[mPosition] + "\"", mPosition)
                                break;
                            }
                        }
                    } else {mRuntime.Error("Unable to compare, expecting at least 2 values in stack", mPosition);}
                    break;
                }

                case "JUMP": {
                    mPosition = mBytecode[++mPosition];
                    break;
                }

                case "BTRU": {
                    if (mStack.length > 0) {
                        if (mStack.pop() == true) {
                            mPosition = mBytecode[++mPosition];
                        }
                    } else {mRuntime.Error("Unable to branch, stack is empty", mPosition);}
                    break;
                }

                case "BFAL": {
                    if (mStack.length > 0) {
                        if (mStack.pop() == false) {
                            mPosition = mBytecode[++mPosition];
                        }
                    } else {mRuntime.Error("Unable to branch, stack is empty", mPosition);}
                    break;
                }

                case "FUNC": {
                    var mFunction = mBytecode[++mPosition], mStart = ++mPosition;
                    while (mBytecode[mPosition] != "FUNC") {
                        if (++mPosition > mBytecode.length) {
                            mRuntime.Error("Unable to define function, unable to find end of function", mPosition);
                        }
                    }
                    mRuntime.Functions[mFunction] = {Type: 1, Route: [mStart, mPosition]};
                    break;
                }

                case "DUMP": {
                    mStack = [];
                    break;
                }

                case "RTRN": {
                    if (mStack.length > 0) {
                        return [mStack.pop()];
                    } else {mRuntime.Error("Unable to return value, stack is empty", mPosition);}
                }

                case "EXIT": {
                    return;
                }
            }
        }
        console.log("Locals: " + JSON.stringify(mLocals));
        return [];
        // end
    }
}

mDecompiler = {
    Decompile: function(mBytecode, mStack=[]) {
        return "";
        /*
        var mOutput = "", mLocals = {};
        for(var mPosition = 0; mPosition < mBytecode.length; mPosition++) {
            switch (mBytecode[mPosition]) {
                case "PUSH": {
                    switch (mBytecode[++mPosition][0]) {
                        case "string": case "number": mStack.push(mBytecode[mPosition][1]); break;
                        case "local": mStack.push(`local.${mBytecode[mPosition][1]}`); break;
                    }
                    break;
                }

                case "ADD": {
                    mStack.push(`${mStack.pop()} + ${mStack.pop()}`);
                    break;
                }

                case "DUP": {
                    mStack.push(mStack[mStack.length - 1]);
                    break;
                }

                case "LOCL": {
                    mOutput += `local ${mBytecode[++mPosition]} = ${mStack.pop()};\n`;
                    break;
                }
            }
        }
        console.log(mOutput);
        */
    }
}

var t = mCompiler.Compile(`
    local a = 0;
    if (local.a == 1) {
        print("local.a is equal to 1");
    }
`);

console.log(JSON.stringify(t))

mRuntime.Run(t);

//mDecompiler.Decompile(t);

/*

[
	"PUSH", ["number", 3],
	"LOCL", "a",
	"FUNC", "add",
	"PUSH", ["local", "a"],
	"PUSH", ["local", "b"],
	"ADD",
	"RTRN",
	"FUNC",
	"PUSH", ["local", "a"],
	"PUSH", ["number", 3],
	"ADD",
	"LOCL", "b",
	"PUSH", ["local", "b"],
	"CALL", [1, "print"]
]

mRuntime.Run([
    "PUSH", ["number", 32],
    "PUSH", ["number", 32],
    "ADD",
    "DUPE",
    "LOCL", "a",
    "LOCL", "b",
    "PUSH", ["local", "a"],
    "CALL", [1, "print"],
    "PUSH", ["local", "b"],
    "CALL", [1, "print"]
]);
*/

/*
mRuntime.Run([
    "PUSH", ["number", 1],
    "PUSH", ["number", 1],
    "PUSH", ["number", 1],
    "PUSH", ["number", 1],
    "DUMP",

    "FUNC", "test",
    "PUSH", ["number", 1],
    "RTRN",
    "FUNC",

    "PUSH", ["number", 1],
    "LOCL", "a",

    

    "PUSH", ["local", "a"],
    "CALL", [1, "print"]
]);*/

/*
    function test() {
        print(global.a);
    }

    local a = 1;
    test();
*/

/*
    if (32 == 32) {
        print("Both values are equal!");
    } else {
        print("Both values are not equal!");
    }
    print("Finished!");

    function add8(num) {
        return num + 8;
    }

    local a = add8(32);
    print(a);
*/

/*
    Psuedo Code:
    for(var i = 0; i < 10; i++) {
        print(i);
        print("Loop!")
    }
    print("Loop Finished!");
*/

/*
for loop:
0: push inital value for "i"
1: apply local "i"
2: push comparision value
3: push local "i"
4: make comparision
5: branch to X if false
6: run loop code
7: jump to 2
*/

/*
mRuntime.Run([
    "PUSH",                           // 0
        ["number", 0],                // 1
    "LOCL",                           // 2
        "i",                          // 3
    "PUSH",                           // 4
        ["number", 10],               // 5
    "PUSH",                           // 6
        ["local", "i"],               // 7
    "COMP",                           // 8
        "lt",                         // 9
    "BNFL",                           // 10
        28,                           // 11
    "PUSH",                           // 12
        ["local", "i"],               // 13
    "CALL",                           // 14
        [1, "print"],                 // 15
    "PUSH",                           // 16
        ["string", "Loop!"],          // 17
    "CALL",                           // 18
        [1, "print"],                 // 19
    "PUSH",                           // 20
        ["local", "i"],               // 21
    "PUSH",                           // 22
        ["number", 2],                // 23
    "ADD",                            // 24
    "LOCL",                           // 25
        "i",                          // 26
    "BNCH",                           // 27
        3,                            // 28
    "PUSH",                           // 29
        ["string", "Loop Finished!"], // 30
    "CALL",                           // 31
        [1, "print"]                  // 32
]);
*/
/*
mRuntime.Run([
    "PUSH", ["number", 0],
    "LOCL", "i",  // i = 0
    "PUSH", ["number", 10],
    "PUSH", ["local", "i"],
    "COMP", "lt", // i < 10
    "BNTU", 11,
    "PUSH", ["local", "i"],
    "CALL", [1, "print"], // print(i)
    "PUSH", ["string", "Loop!"],
    "CALL", [1, "print"], // print("Loop!")
    "PUSH", ["number", 1],
    "PUSH", ["local", "i"],
    "ADD",          // i++
    "LOCL", "i",
    "PUSH", ["string", "Loop Finished!"],
    "CALL", [1, "print"]
]);
*/

/*
    Psuedo Code:
    function add8(num) {
        return num + 8;
    }
*/
/*
mRuntime.Run([
    "FUNC", "add8",
    "PUSH", ["number", 8],
    "ADD",
    "RET",
    "FUNC",

    "PUSH", ["number", 32],
    "CALL", [1, "add8"],
    "LOCL", ["a"],
    "PUSH", ["local", "a"],
    "PUSH", ["string", "our variable 'a' is equal to "],
    "ADD",
    "CALL", [1, "print"]
]);*/