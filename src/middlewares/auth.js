const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

const auth = async (req, res, next) => {
	try {
		const token = req.header("Authorization").replace("Bearer ", "");
		const decoded_id = jwt.verify(token, process.env.JWT_SECRET)._id;
		const user = await User.findOne({
			_id: decoded_id,
			"tokens.token": token,
		});

		if (!user) {
			throw new Error();
		}

		// Storing user details in request object so that route handler can use it again instead of fetching again
		req.user = user;
		req.token = token;
		next();
	} catch (err) {
		res.status(401).send({ error: "Please authenticate first" });
	}
};

module.exports = auth;
