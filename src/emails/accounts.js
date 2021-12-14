const sgMail = require("@sendgrid/mail");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendWelcomeEmail = (email, name) => {
	sgMail.send({
		to: email,
		from: "guptanilesh2000@gmail.com",
		subject: "Thanks for connecting with us! 😊",
		text: `Welcome to the app, ${name}. Let me know your feedback about the app`,
	});
};

const sendCancellationEmail = (email, name) => {
	sgMail.send({
		to: email,
		from: "guptanilesh2000@gmail.com",
		subject: "Sorry to see you go!",
		text: `Goodbye, ${name}. I hope to see you back some time soon`,
	});
};

module.exports = {
	sendWelcomeEmail,
	sendCancellationEmail,
};
