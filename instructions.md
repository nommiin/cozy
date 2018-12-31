* ADD (Add)
    - Arguments: 0
    - Description: Pops 2 values from stack and pushes sum to stack

* SUB (Subtract)
    - Arguments: 0
    - Description: Pops 2 values from stack and pushes difference to stack

* MUL (Multiply)
    - Arguments: 0
    - Description: Pops 2 values from stack and pushes product to stack

* DIV (Divide)
    - Arguments: 0
    - Description: Pops 2 values from stack and pushes quotient to stack

* DUP (Duplicate)
    - Arguments: 0
    - Description: Copies the top value of the stack back into the stack

* PUSH (Push)
    - Arguments: 2 (type, value)
    - Description: Pushes the "value" to the stack

* LOCL (Local)
    - Arguments: 1 (name)
    - Description: Pops 1 value from the stack and assigns it to local variables as "name"

* GLOB (Global)
    - Arguments: 1 (name)
    - Description: Pops 1 value from the stack and assigns it to global variables as "name

* CALL (Call)
    - Arguments: 2 (argcount, name)
    - Description: Pops "argcount" values from stack and passes them as arguments into "name" function

* COMP (Compare)
    - Arguments: 1 (type)
    - Description: Pops 2 values from stack, compares them using "type", and pushes result to stack

* JUMP (Jump)
    - Arguments: 1 (position)
    - Description: Moves the interpreter to "position" 

* BTRU (Branch If True)
    - Arguments: 1 (position)
    - Description: Moves the interpreter to "position" if true

* BFAL (Branch If False)
    - Arguments: 1 (position)
    - Description: Moves the interpreter to "position" if false

* FUNC (Function)
    - Arguments: 0-1 (name)
    - Description: If 1 argument is given, registers all incoming instructions as function "name", otherwise marks the end of the function

* DUMP (Dump)
    - Arguments: 0
    - Description: Clears the stack of all values

* RTRN (Return)
    - Arguments: 0
    - Description: Pops 1 value from stack and returns it from function call, ends current execution

* EXIT (Exit)
    - Arguments: 0
    - Description: Ends current execution