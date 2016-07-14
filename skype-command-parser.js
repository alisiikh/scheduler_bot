'use strict';



class SkypeCommandParser {
	constructor() {
	}

	get separator() {
		return '|';
	}

	parseCommand(commandLine) {
		try {
			let parsedCommand = commandLine.split(this.separator);
			let commandName = parsedCommand[0].trim();

			if (commandName === "schedule") {
				return this.generateScheduleCommand(parsedCommand);;
			} else if (commandName === "repeat") {
				return this.generateRepeatCommand(parsedCommand);
			} else if (commandName === "abort") {
				return this.generateAbortCommand(parsedCommand);
			} else if (commandName === "unsubscribe") { 
				return this.generateUnsubscribeCommand(parsedCommand);
			} else {
				throw new Error(`Incorrect command name: ${commandName}`);
			}
		} catch (e) {
			console.error(`Failed to parse bot command. Message: ${e.message}`);
			return null;
		}
	}

	generateScheduleCommand(parsedCommand) {
		let command = new ScheduleCommand();

		this.validateCommand(command, parsedCommand);

		let interval = parsedCommand[1].trim();
		let target = parsedCommand[2].trim();
		let content = parsedCommand[3].trim();

		if (target !== "me" || target !== "all") {
			target = "me";
		}

		this.validateInterval(interval);
		// TODO: validate interval with humanInterval

		command.target = target;
		command.interval = interval;
		command.content = content;
		return command;
	}

	generateRepeatCommand(parsedCommand) {
		let command = new RepeatCommand();

		this.validateCommand(command, parsedCommand);

		let interval = parsedCommand[1].trim();
		let content = parsedCommand[2].trim();

		command.interval = interval;
		command.content = content;
		return command;
	}

	generateAbortCommand(parsedCommand) {
		let command = new AbortCommand();
		this.validateCommand(command, parsedCommand);
		return command;
	}

	generateUnsubscribeCommand(parsedCommand) {
		let command = new UnsubscribeCommand();
		this.validateCommand(command, parsedCommand);
		return command;
	}

	validateCommand(command, parsedCommand) {
		if (parsedCommand.length != command.argsLength) {
			throw new Error(`Incorrect command: ${parsedCommand}`);
		}
	}

	validateInterval(interval) {

	}
}


module.exports = new SkypeCommandParser();

class Command {
	constructor() {
		if (new.target === Command) {
			throw new TypeError("Command class is an abstract class");
		}

		if (typeof this.commandName === "undefined") {
			throw new TypeError("Inheritor must override 'get commandName' getter");
		}

		if (typeof this.argsLength === "undefined") {
			throw new TypeError("Inheritor must override 'get argsLength' getter")
		}
	}
}

/**
* Example:
* schedule | now | me | content
* schedule | in 30 minutes | all | content
*/
class ScheduleCommand extends Command {
	constructor() {
		super();
	}

	get commandName() {
		return "schedule";
	}

	get argsLength() {
		return 4;
	}
}

/**
* Example:
* abort
*/
class AbortCommand extends Command {
	constructor() {
		super();
	}

	get commandName() {
		return "abort";
	}

	get argsLength() {
		return 1;
	}
}

/**
* repeat | 30 minutes | content
* repeat | 0,30 * * * * | content
*/
class RepeatCommand extends Command {
	constructor() {
		super();
	}

	get commandName() {
		return "repeat";
	}

	get argsLength() {
		return 3;
	}
}

/**
* Example:
* unsubscribe
*/
class UnsubscribeCommand extends Command {
	constructor() {
		super();
	}

	get commandName() {
		return "unsubscribe";
	}

	get argsLength() {
		return 1;
	}
}