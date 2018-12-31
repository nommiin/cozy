* ADD (Add)
    - Arguments: 0
    - Function: Pops 2 values from stack and pushes sum to stack

* SUB (Subtract)
    - Arguments: 0
    - Function: Pops 2 values from stack and pushes difference to stack

* MUL (Multiply)
    - Arguments: 0
    - Function: Pops 2 values from stack and pushes product to stack

* DIV (Divide)
    - Arguments: 0
    - Function: Pops 2 values from stack and pushes quotient to stack

* DUP (Duplicate)
    - Arguments: 0
    - Function: Copies the top value of the stack back into the stack

* PUSH
    - Arguments: 2 (type, value)
    - Function: Pushes the "value" to the stack

* LOCL
    - Arguments: 1 (name)
    - Function: Pops 1 value from the stack and assigns it to local variables as "name"

* GLOB
    - Arguments: 1 (name)
    - Function: Pops 1 value from the stack and assigns it to global variables as "name

* CALL
    - Arguments: 2 (argcount, name)
    - Function: Pops "argcount" values from stack and passes them as arguments into "name" function

* COMP
    - Arguments: 1 (type)
    - Function: Pops 2 values from stack, compares them using "type", and pushes result to stack

* JUMP
    - Arguments: 1 (count)
    - Function: Moves the interpreter position "count" values 

* BTRU
    - Arguments: 1 (count)
    - Function: Pops 1 value from stack and moves the interpreter position "count" values if true

* BFAL
    - Arguments: 1 (count)
    - Function: Pops 1 value from stack and moves the interpreter position "count" values if false

* FUNC
    - Arguments: 0-1 (name)
    - Function: If 1 argument is given, registers all incoming instructions as function "name", otherwise marks the end of the function

* DUMP
    - Arguments: 0
    - Function: Clears the stack of all values

* RTRN
    - Arguments: 0
    - Function: Pops 1 value from stack and returns it from function call, ends current execution

* EXIT
    - Arguments: 0
    - Function: Ends current execution