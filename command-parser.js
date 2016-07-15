'use strict';

let humanInterval = require('human-interval');
let ScheduleCommand = require('./commands').ScheduleCommand;
let	AbortCommand = require('./commands').AbortCommand;
let	RepeatCommand = require('./commands').RepeatCommand;
let	UnsubscribeCommand = require('./commands').UnsubscribeCommand;

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
		let interval = parsedCommand[1].trim();
		let target = parsedCommand[2].trim();
		let content = parsedCommand[3].trim();

		this.validateCommand(command, parsedCommand);
		this.validateInterval(interval);

		if (target !== "me" && target !== "all") {
			target = "me";
		}

		command.target = target;
		command.interval = interval;
		command.content = content;
		return command;
	}

	generateRepeatCommand(parsedCommand) {
		let command = new RepeatCommand();
		let interval = parsedCommand[1].trim();
		let content = parsedCommand[2].trim();
		
		this.validateCommand(command, parsedCommand);
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
		if (isNaN(humanInterval(interval))) {
			throw new Error(`Incorrect interval: ${interval}`)
		}
	}
}


module.exports = new SkypeCommandParser();

