function Split(mValue) {
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
}

console.log((Split(
    `1 + print(32 + print(64 + print(128)));`
)));