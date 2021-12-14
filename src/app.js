const express = require("express");

// connect to DataBase
require("./db/mongoose");

// Importing Routers
const userRouter = require("./routers/userRouter");
const taskRouter = require("./routers/taskRouter");

// Configure express app
const app = express();

// Add JSON body to the request object
app.use(express.json());

// Registering Routers
app.use(userRouter);
app.use(taskRouter);

module.exports = app;
