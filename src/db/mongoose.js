const mongoose = require("mongoose");

const start = async () => {
	mongoose.connect(process.env.MONGODB_URL, {
		useNewUrlParser: true,
		useCreateIndex: true,
		useUnifiedTopology: true,
	});
};

start();
