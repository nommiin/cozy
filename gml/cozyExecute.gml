/// @function cozyExecute( bytecode, locals )
var czStack = ds_stack_create(), czLocals = ds_map_create();
if (is_string(argument[0]) == true) {
	var czMain = json_decode(argument[0]);
	czMain = czMain[? "default"];
} else {
	var czMain = argument[0];
}
gml_pragma("global", "global.czGlobals = ds_map_create();");

// Interpret Bytecode
for(var czPosition = 0; czPosition < ds_list_size(czMain); czPosition++) {
	var czInstruction = czMain[| czPosition];
	switch (czInstruction) {
		case "ADD": ds_stack_push(czStack, ds_stack_pop(czStack) + ds_stack_pop(czStack)); break;
		case "SUB": ds_stack_push(czStack, ds_stack_pop(czStack) - ds_stack_pop(czStack)); break;
		case "MUL": ds_stack_push(czStack, ds_stack_pop(czStack) * ds_stack_pop(czStack)); break;
		case "DIV": ds_stack_push(czStack, ds_stack_pop(czStack) / ds_stack_pop(czStack)); break;
		case "DUP": ds_stack_push(czStack, ds_stack_top(czStack)); break;
		case "POP": ds_stack_pop(czStack); break;
		case "LOCL": czLocals[? czMain[| ++czPosition]] = ds_stack_pop(czStack); break;
		case "GLOB": global.czGlobals[? czMain[| ++czPosition]] = ds_stack_pop(czStack); break;
		case "JUMP": czPosition = czMain[| czPosition + 1]; break;
		
		case "PUSH": {
			var czArguments = czMain[| ++czPosition];
			switch (czArguments[| 0]) {
				case "string": string(ds_stack_push(czStack, czArguments[| 1])); break;
				case "number": real(ds_stack_push(czStack, czArguments[| 1])); break;
				case "global": {
					if (ds_map_exists(global.czGlobals, czArguments[| 1]) == true) {
						ds_stack_push(czStack, global.czGlobals[? czArguments[| 1]]);	
					} else {show_error("Unable to push value, undefined global variable named \"" + string(czArguments[| 1]) + "\"", true);}
					break;
				}
				
				case "local": {
					if (ds_map_exists(czLocals, czArguments[| 1]) == true) {
						ds_stack_push(czStack, czLocals[? czArguments[| 1]]);	
					} else {show_error("Unable to push value, undefined local variable named \"" + string(czArguments[| 1]) + "\"", true);}
					break;
				}
				default: {
					show_error("Unable to push value, unknown type given \"" + string(czArguments[| 0]) + "\"", true);
				}
			}
		break;}
		
		case "CALL": {
			var czArguments = czMain[| ++czPosition], czFunction = [];
			for(var i = 0; i < czArguments[| 0]; i++) {
				czFunction[array_length_1d(czFunction)] = ds_stack_pop(czStack);
			}
			
			switch (czArguments[| 1]) {
				case "print": {
					show_debug_message("VM::(" + string(czFunction[0]) + ")");
					break;
				}
				
				default: {
					/*
						TODO: CALL FUNCTION
					*/
				}
			}
		break;}
	}	
}

show_debug_message("Locals: " + string(czLocals));