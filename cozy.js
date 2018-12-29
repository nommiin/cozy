/**
    cozy - another parser and stack-based vm
    by nommiin
 */

mGeneric = false;
mOptimize = true;
mBytecode = [];
mVariables = [];
mFunctions = ["print"];

mTokens = {
    "local": {
        Section: {Start: undefined, End: ";"},
        Process: function(mSection) {
            var mSections = mParser.Split(mSection);//mSection.split(",");
            console.log("SECTIONS!!!!", JSON.stringify(mSections));
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
                    }
                    
                }
            }
        }
    }
};

mParser = {
    Split: function(mValue) {
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
    Parse: function(mInput) {
        for(mPosition = 0; mPosition < mInput.length; mPosition++) {
            var mFound = false;
            for(mToken in mTokens) {
                if (mInput.slice(mPosition, mPosition + mToken.length) == mToken) {
                    mPosition += mToken.length;
                    while (mTokens[mToken].Section.Start != undefined && mInput[mPosition] != mTokens[mToken].Section.Start) {
                        if (++mPosition > mInput.length) {
                            mParser.Error("Could not find starting token:", mTokens[mToken].Section.Start);
                        }
                    }
                    var mBase = (mTokens[mToken].Section.Start != undefined ? 1 : 0) + mPosition;
                    while (mTokens[mToken].Section.End != undefined && mInput[mPosition] != mTokens[mToken].Section.End) {
                        if (++mPosition > mInput.length) {
                            mParser.Error(`Could not find ending token: "${mTokens[mToken].Section.End}"`);
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
                        mPosition += mFunction.length;
                        while (mInput[mPosition] != "(") {
                            if (++mPosition > mInput.length) {
                                mParser.Error("Could not find function starting token: \"(\"");
                            }
                        }
                        var mBase = ++mPosition;
                        while (mInput[mPosition] != ")") {
                            if (++mPosition > mInput.length) {
                                mParser.Error("Could not find function ending token: \")\"");
                            }
                        }

                        console.log("function!!", mInput.slice(mBase, mPosition));
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
                                mParser.Error("Could not find variable ending token: \";\"")
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
            
        }

        console.log("- Inital Pass -");
        mParser.Print();
        console.log("- Optimization Pass" + (!mOptimize ? " (SKIPPED)" : "") + " -");
        if (mOptimize == true) {
            mParser.Optimize();
            mParser.Print();
        }
        console.log("- Expansion Pass" + (mGeneric ? " (SKIPPED)" : "") + " -");
        if (mGeneric == false) {
            mParser.Expand();
            mParser.Print();
            /*
            for(mPosition = 0; mPosition < mBytecode.length; mPosition++) {
                if (mBytecode[mPosition] == "EXPR") {
                    var mExpression = mParser.Tokenize(mBytecode[++mPosition]);
                    if (mExpression.length > 1) {
                        // Special
                    } else {
                        // Simple
                        console.log(mBytecode.slice(0, mPosition).concat(mBytecode.slice(mPosition)));
                        //mBytecode = mBytecode.slice(0, mPosition);
                    }
                }
            }*/
            //mParser.Print();
        }
        console.log("- Compile Complete -");
        mParser.Print();
        return mBytecode;
        //console.log(JSON.stringify(mBytecode));
    },
    Expand: function() {
        for(var mPosition = 0; mPosition < mBytecode.length; mPosition++) {
            if (mBytecode[mPosition] == "EXPR") {
                var mTokens = mParser.Tokenize(mBytecode[mPosition + 1]);
                if (mTokens.length > 1) {

                } else {
                    if (mTokens.length == 1) {
                        mBytecode = (mBytecode.slice(0, mPosition)).concat(["PUSH", [mTokens[0].Type, mTokens.pop().Value]].concat(mBytecode.slice(mPosition + 2)));
                    }
                }
                console.log(JSON.stringify(mBytecode));
            }
        }
    },
    Tokenize: function(mExpression) {
        // Turn generic expressions into operators
        var mTokens = [];
        for(var mPosition = 0; mPosition < mExpression.length; mPosition++) {
            switch (mExpression.charCodeAt(mPosition)) {
                // String
                case 34: {
                    var mBase = mPosition + 1;
                    while (mExpression.charCodeAt(++mPosition) != 34) {
                        if (mPosition > mExpression.length) {
                            mParser.Error("Failed to tokenize expression, could not find closing token", mPosition);
                        }
                    }
                    mTokens.push({Type: "string", Value: mExpression.slice(mBase, mPosition)});
                    break;
                }

                // Add
                case 43: {
                    switch (mExpression.charCodeAt(mPosition + 1)) {
                        case 43: {
                            mTokens.push({Type: "add" + (mTokens.length > 0 && mTokens[mTokens.length - 1].Type == "variable") ? "post" : "pre"});
                            mPosition++;
                            break;
                        }
                        default: mTokens.push({Type: "add"});
                    }
                    break;
                }

                // Subtract
                case 45: {
                    switch (mExpression.charCodeAt(mPosition + 1)) {
                        case 45: {
                            mTokens.push({Type: "sub" + (mTokens.length > 0 && mTokens[mTokens.length - 1].Type == "variable") ? "post" : "pre"});
                            mPosition++;
                            break;
                        }
                        default: mTokens.push({Type: "sub"});
                    }
                    break;
                }

                // Multiply
                case 42: mTokens.push({Type: "mul"}); break;
                // Divide
                case 47: mTokens.push({Type: "div"}); break;
                // Modulo
                case 37: mTokens.push({Type: "mod"}); break;

                // Dynamic
                default: {
                    var mBase = mPosition;
                    switch (mParser.Type(mExpression[mPosition])) {
                        // Function/Variable
                        case "letter": {
                            while (mParser.Type(mExpression[mPosition]) == "letter" || mExpression.charCodeAt(mPosition) == 95) {
                                if (++mPosition > mExpression.length) {
                                    break;
                                }
                            }

                            if (mExpression.charCodeAt(mPosition) == 40) {
                                var mFunction =  mExpression.slice(mBase, mPosition).trim(), mBase = mPosition + 1;
                                mPosition = mExpression.length;
                                while (mExpression.charCodeAt(mPosition) != 41) {
                                    if (--mPosition < 0) {
                                        mParser.Error("Unable to tokenize expression, could not find end of function call", mPosition);
                                    }
                                }
                                mTokens.push({Type: "function", Value: mFunction, Arguments: mParser.Tokenize(mExpression.slice(mBase, mPosition).trim())});
                                
                                //mTokens = mTokens.concat(mParser.Expand("1"))
                            } else {
                                mTokens.push({Type: "variable", Value: mExpression.slice(mBase, mPosition--)});
                            }
                            break;
                        }

                        // Number
                        case "number": {
                            while (mParser.Type(mExpression[mPosition]) == "number") {
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
                                mParser.Error("Unable to tokenize expression, unexpected character in stream", mPosition);
                            }
                        }
                    }
                }
            }
        }
        console.log(JSON.stringify(mTokens));
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

                case "POP": {
                    if (mStack.length > 0) {
                        mStack.pop();
                    } else {mRuntime.Error("Unable to pop value, stack is empty", mPosition);}
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
            }
        }
        console.log("Locals: " + JSON.stringify(mLocals));
        return [];
        // end
    }
}

mDecompiler = {
    Decompile: function(mBytecode, mStack=[]) {
        for(var mPosition = 0; mPosition < mBytecode.length; mPosition++) {
            switch (mBytecode[mPosition]) {
                
            }
        }
    }
}

/*mRuntime.Run(mParser.Parse(`
    local a = 0;
`));*/

var mB = mParser.Parse(`
    local a = 1 + show_debug_message(32 + big_func_name(128 + 256));
    print(a);
`);

console.log("Output:", JSON.stringify(mB));

mRuntime.Run(mB);

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