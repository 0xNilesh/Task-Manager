const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Task = require("./taskModel");

const userSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
			trim: true,
		},
		age: {
			type: Number,
			default: 1,
			validate(value) {
				if (value <= 0) {
					throw new Error("Age must be more than 0");
				}
			},
		},
		email: {
			type: String,
			required: true,
			unique: true,
			trim: true,
			lowercase: true,
			validate(value) {
				if (!validator.isEmail(value)) {
					throw new Error("Email is invalid");
				}
			},
		},
		password: {
			type: String,
			required: true,
			trim: true,
			minlength: 7,
			validate(value) {
				if (value.toLowerCase().includes("password")) {
					throw new Error("Password cannot contain 'password");
				}
			},
		},
		avatar: {
			type: Buffer,
		},
		tokens: [
			{
				token: {
					type: String,
					required: true,
				},
			},
		],
	},
	{
		timestamps: true,
	}
);

userSchema.virtual("tasks", {
	ref: "Task",
	localField: "_id",
	foreignField: "owner",
});

// userSchema.methods.getPublicProfile = function () {
userSchema.methods.toJSON = function () {
	const user = this;
	const userObject = user.toObject();

	delete userObject.password;
	delete userObject.tokens;
	delete userObject.avatar;

	return userObject;
};

// Returns unique token for a logged in user
// methods - mthods accessible for instances
userSchema.methods.generateAuthToken = async function () {
	const user = this;
	const token = jwt.sign(
		{ _id: user._id.toString() },
		process.env.JWT_SECRET
	);

	user.tokens = user.tokens.concat({ token });
	await user.save();

	return token;
};

// Checks the credentials for login
// statics - methods accessible for models
userSchema.statics.findByCredentials = async (email, password) => {
	const user = await User.findOne({ email });

	if (!user) {
		throw new Error("Unable to login");
	}

	const isMatch = await bcrypt.compare(password, user.password);
	if (!isMatch) {
		throw new Error("Unable to login");
	}

	return user;
};

// Hash the password before saving
userSchema.pre("save", async function (next) {
	const user = this;
	if (user.isModified("password")) {
		user.password = await bcrypt.hash(user.password, 8);
	}

	next();
});

// Delete all the tasks by the user
userSchema.pre("remove", async function (next) {
	const user = this;
	await Task.deleteMany({ owner: user._id });

	next();
});

const User = mongoose.model("User", userSchema);

module.exports = User;
