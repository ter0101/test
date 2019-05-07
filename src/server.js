import fs from "fs";
import path from "path";
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import compression from "compression";
import socketIO from "socket.io";
import SerialPort from "socket.io-serialport";

import config from "./config";

const api = express();

api.use(cors());
api.use(compression());
api.use(bodyParser.urlencoded({ extended: true }));
api.use(bodyParser.json());

const server = api.listen(config.server.port, err => {
	if (err) {
		console.error(err);
		process.exit(1);
	}

	fs.readdirSync(path.join(__dirname, "routes")).map(file => {
		require("./routes/" + file)(api);
	});

	console.log(`API is now running on port ${config.server.port} in ${config.env} mode`);
});

const io = socketIO.listen(server);
// รอการ connect จาก client
io.on("connection", client => {
	console.log("user connected");

	// เมื่อ Client ตัดการเชื่อมต่อ
	client.on("disconnect", () => {
		console.log("user disconnected");
	});

	// ส่งข้อมูลไปยัง Client ทุกตัวที่เขื่อมต่อแบบ Realtime
	client.on("sent-message", function(message) {
		io.sockets.emit("new-message", message);
	});

	client.on("connect-serialport", function(comName) {
		const serialport = new SerialPort({
			io: io,
			route: "/port/COM17",
			captureFile: "/var/log/serialport/ttyS0",
			retryPeriod: 1000,
			device: comName,
			options: {
				baudrate: 9600,
			},
		});

		serialport.open().then(() => {
			console.log("port opened");

			// And when done (shutting down, etc)
			serialport.close().then(() => {
				console.log("port closed");
			});
		});
	});
});

module.exports = api;
