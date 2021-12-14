const app = require("./app");
const port = process.env.PORT;

// Listen requests on port
app.listen(port, () => {
	console.log("App is running on port ", port);
});
