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
			let name = parsedCommand[0].trim();

			if (name === "schedule") {
				return this.generateScheduleCommand(parsedCommand);;
			} else if (name === "repeat") {
				return this.generateRepeatCommand(parsedCommand);
			} else if (name === "abort") {
				return this.generateAbortCommand(parsedCommand);
			} else if (name === "unsubscribe") { 
				return this.generateUnsubscribeCommand(parsedCommand);
			} else {
				throw new Error(`Incorrect command name: ${name}`);
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

		if (target !== "me" && target !== "all") {
			target = "me";
		}

		this.validateInterval(interval);


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

		this.validateInterval(interval);

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
		// TODO: validate interval with humanInterval
	}
}


module.exports = new SkypeCommandParser();


class Command {
	constructor() {
		if (new.target === Command) {
			throw new TypeError("Command class is an abstract class");
		}

		if (typeof this.name === "undefined") {
			throw new TypeError("Inheritor must override 'get name' getter");
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

	get name() {
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

	get name() {
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

	get name() {
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

	get name() {
		return "unsubscribe";
	}

	get argsLength() {
		return 1;
	}
}