const express = require("express");
const User = require("../models/userModel");
const auth = require("../middlewares/auth");
const multer = require("multer");
const sharp = require("sharp");
const {
	sendWelcomeEmail,
	sendCancellationEmail,
} = require("../emails/accounts");
const router = new express.Router();

/* -------------- Users Database Requests -------------- */

// Handling post requests for creating new user (SignUp)
router.post("/users", async (req, res) => {
	const user = new User(req.body);
	try {
		await user.save();
		await sendWelcomeEmail(user.email, user.name);
		const token = await user.generateAuthToken();
		res.status(201).send({ user, token });
	} catch (err) {
		//setting status 400 and sending error back
		console.log(err);
		res.status(400).send();
	}
});

// Handling login request
router.post("/users/login", async (req, res) => {
	try {
		const user = await User.findByCredentials(
			req.body.email,
			req.body.password
		);
		const token = await user.generateAuthToken();

		// res.send({ user: user.getPublicProfile(), token });
		res.send({ user, token });
	} catch (err) {
		console.log(err);
		res.status(400).send();
	}
});

// Handling logout request
router.post("/users/logout", auth, async (req, res) => {
	try {
		req.user.tokens = req.user.tokens.filter(
			(token) => token.token !== req.token
		);
		await req.user.save();

		res.send();
	} catch (err) {
		console.log(err);
		res.status(500).send();
	}
});

// Logout all sessions
router.post("/users/logoutAll", auth, async (req, res) => {
	try {
		req.user.tokens = [];
		await req.user.save();
		res.send();
	} catch (err) {
		console.log(err);
		res.status(500).send();
	}
});

// Handling get request for reading the profile of authenticated user
router.get("/users/me", auth, async (req, res) => {
	/* 
    // Sending details of all users
    try {
		const users = await User.find({});
		res.send(users);
	} catch (err) {
		res.status(500).send();
	} */

	res.send(req.user);
});

// Handling get request for reading particular user by id
router.get("/users/:id", async (req, res) => {
	try {
		const _id = req.params.id;

		const user = await User.findById(_id);
		if (!user) {
			return res.status(404).send();
		}
		res.send(user);
	} catch (err) {
		console.log(err);
		res.status(500).send();
	}
});

// Updating current authenticated user's details
router.patch("/users/me", auth, async (req, res) => {
	const updates = Object.keys(req.body);
	const allowedUpdates = ["name", "email", "age", "password"];
	const isValidUpdateOperation = updates.every((update) =>
		allowedUpdates.includes(update)
	);

	if (!isValidUpdateOperation) {
		return res.status(400).send({ error: "Invalid Updates" });
	}

	try {
		/* // findByIdAndUpdate bypasses the middleware that's why using runValidators
		const user = await User.findByIdAndUpdate(req.params.id, req.body, {
			runValidators: true,
			new: true,
		}); */

		const user = req.user;
		updates.forEach((update) => (user[update] = req.body[update]));

		if (!user) {
			return res.status(404).send({ error: "User not found!!!" });
		}

		const UpdatedUser = await user.save();
		res.send(UpdatedUser);
	} catch (err) {
		console.log(err);
		res.status(400).send();
	}
});

// Delete current authenticated user from DB
router.delete("/users/me", auth, async (req, res) => {
	try {
		const user = await User.findById(req.user.id);
		if (!user) {
			return res.status(404).send({ error: "User not found!!!" });
		}

		await user.remove();
		await sendCancellationEmail(user.email, user.name);
		res.send(req.user);
	} catch (err) {
		console.log(err);
		res.status(500).send();
	}
});

const upload = multer({
	limits: {
		fileSize: 1000000,
	},
	fileFilter(req, file, cb) {
		if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
			return cb(new Error("Please upload an image"));
		}
		cb(undefined, true);
	},
});

// Uploading avatar
router.post(
	"/users/me/avatar",
	auth,
	upload.single("image"),
	async (req, res) => {
		const buffer = await sharp(req.file.buffer)
			.resize({ width: 250, height: 250 })
			.png()
			.toBuffer();
		req.user.avatar = buffer;
		await req.user.save();
		res.send();
	},
	(error, req, res, next) => {
		res.status(400).send({ error: error.message });
	}
);

// Deleting the avatar
router.delete("/users/me/avatar", auth, async (req, res) => {
	req.user.avatar = undefined;
	await req.user.save();
	res.send();
});

// Access profile pic
router.get("/users/:id/avatar", async (req, res) => {
	try {
		const user = await User.findById(req.params.id);
		if (!user || !user.avatar) {
			throw new Error();
		}

		res.set("Content-Type", "image/jpg");
		res.send(user.avatar);
	} catch (err) {
		res.status(404).send();
	}
});

module.exports = router;
