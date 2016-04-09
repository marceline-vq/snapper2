function Benchmarker() {}
Benchmarker.taskTimes = {};
Benchmarker.currentTaskName;
Benchmarker.currentStartTime;

Benchmarker.startTask = function(taskName) {
	//console.log("start " + taskName);
	var now = Date.now();
	if (Benchmarker.currentTaskName && Benchmarker.currentStartTime) {
		if (!Benchmarker.taskTimes[Benchmarker.currentTaskName]) {
			Benchmarker.taskTimes[Benchmarker.currentTaskName] = 0;
		}
		Benchmarker.taskTimes[Benchmarker.currentTaskName] += now-Benchmarker.currentStartTime;
	}
	Benchmarker.currentTaskName = taskName;
	Benchmarker.currentStartTime = now;
}

Benchmarker.print = function() {
	for (var taskName in Benchmarker.taskTimes) {
		console.log(taskName + ": " + Benchmarker.taskTimes[taskName]/1000 + " seconds");
	}
}