'use strict';

class Command {
	constructor() {
		if (new.target === Command) {
			throw new TypeError("Command class is an abstract class");
		}

		if (typeof this.commandName === "undefined") {
      		throw new TypeError("Inheritor must override getCommand method");
    	}
	}
}

class ScheduleCommand extends Command {
	constructor() {
		super();

		this.reminderInterval = null;
		this.content = null;
	}

	get commandName() {
		return "schedule";
	}

	get argsLength() {
		return 3;
	}
}

class AbortCommand extends Command {
	constructor() {
		super();
	}

	get commandName() {
		return "abort";
	}
}

class RepeatCommand extends Command {
	constructor() {
		super();
	}

	get commandName() {
		return "repeat";
	}
}


class SkypeCommandParser {
	constructor() {
	}

	parseCommand(commandLine) {
		try {
        	let parsedCommand = commandLine.split('|');
        	let commandName = parsedCommand[0].trim();
        	if (commandName === "schedule") {
        		var command = new ScheduleCommand();
        		if (parsedCommand.length != commandName.argsLength) {
            		throw new Error(`Incorrect command: ${parsedCommand}`);
        		}
        		let reminderInterval = parsedCommand[1].trim();
        		let content = parsedCommand[2].trim();

        		command.reminderInterval = reminderInterval;
        		command.content = content;
        		return command;
        	} else if (commandName === "repeat") {
        		command = new RepeatCommand();
        	} else if (commandName === "abort") {
        		command = new AbortCommand();
        	} else {
        		throw new Error(`Incorrect command name, was: '${commandName}', expected: 'schedule' or 'repeat' or 'abort'`);
        	}
    	} catch (e) {
        	console.error(`Failed to parse bot command. Message: ${e.message}`);
        	return null;
    	}
	}
}


module.exports = {
	SkypeCommandParser: SkypeCommandParser
}