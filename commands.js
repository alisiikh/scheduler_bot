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

module.exports = {
	ScheduleCommand: ScheduleCommand,
	AbortCommand: AbortCommand,
	RepeatCommand: RepeatCommand,
	UnsubscribeCommand: UnsubscribeCommand
}