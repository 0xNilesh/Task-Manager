const express = require("express");
const router = new express.Router();
const Task = require("../models/taskModel");
const auth = require("../middlewares/auth");

/* -------------- Tasks Database Requests -------------- */
// Handling get request for reading all tasks
router.get("/tasks", auth, async (req, res) => {
	const match = {};
	const sort = {};

	if (req.query.completed) {
		match.completed = req.query.completed === "true";
	}

	if (req.query.sortBy) {
		const parts = req.query.sortBy.split(":");
		sort[parts[0]] = parts[1] === "desc" ? -1 : 1;
	}

	try {
		await req.user
			.populate({
				path: "tasks",
				match,
				options: {
					limit: parseInt(req.query.limit),
					skip: parseInt(req.query.skip),
					sort,
				},
			})
			.execPopulate();
		res.send(req.user.tasks);
	} catch (err) {
		console.log(err);
		res.status(500).send();
	}
});

// Handling get request for reading a particular task
router.get("/tasks/:id", auth, async (req, res) => {
	const _id = req.params.id;
	console.log(_id);

	try {
		const task = await Task.findOne({ _id, owner: req.user._id });
		if (!task) {
			return res.status(404).send({ error: "You have no tasks" });
		}
		res.send(task);
	} catch (err) {
		console.log(err);
		res.status(500).send();
	}
});

// Handling post requests for /tasks route
router.post("/tasks", auth, async (req, res) => {
	const task = new Task({
		...req.body,
		owner: req.user._id,
	});

	try {
		const taskDoc = await task.save();
		res.status(201).send(taskDoc);
	} catch (err) {
		console.log(err);
		res.status(400).send();
	}
});

// Handling patch request for updating the task properties
router.patch("/tasks/:id", auth, async (req, res) => {
	const updates = Object.keys(req.body);
	const allowedUpdates = ["description", "completed"];

	const isValidUpdateOperation = updates.every((update) =>
		allowedUpdates.includes(update)
	);

	if (!isValidUpdateOperation) {
		res.status(400).send({
			error: "Invalid updates",
		});
	}

	try {
		const task = await Task.findOne({
			_id: req.params.id,
			owner: req.user._id,
		});

		if (!task) {
			res.status(404).send({ error: "No tasks found" });
		}
		updates.forEach((update) => (task[update] = req.body[update]));
		await task.save();
		res.send(task);
	} catch (err) {
		console.log(err);
		res.status(400).send();
	}
});

// Handling delete request for deleting a task from the DB
router.delete("/tasks/:id", auth, async (req, res) => {
	try {
		const task = await Task.findOneAndDelete({
			_id: req.params.id,
			owner: req.user._id,
		});

		if (!task) {
			res.status(404).send({ error: "task not found" });
		}

		res.send(task);
	} catch (err) {
		console.log(err);
		res.status(500).send();
	}
});

module.exports = router;
