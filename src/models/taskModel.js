const mongoose = require("mongoose");

// By making schema, we can use advanced features like using middleware
const taskSchema = new mongoose.Schema(
	{
		description: {
			type: String,
			trim: true,
			required: true,
		},
		completed: {
			type: Boolean,
			default: false,
		},
		owner: {
			type: mongoose.Schema.Types.ObjectId,
			required: true,
			ref: "User",
		},
	},
	{
		timestamps: true,
	}
);

const Task = mongoose.model("Task", taskSchema);

module.exports = Task;
