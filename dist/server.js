"use strict";

var _fs = require("fs");

var _fs2 = _interopRequireDefault(_fs);

var _path = require("path");

var _path2 = _interopRequireDefault(_path);

var _express = require("express");

var _express2 = _interopRequireDefault(_express);

var _bodyParser = require("body-parser");

var _bodyParser2 = _interopRequireDefault(_bodyParser);

var _cors = require("cors");

var _cors2 = _interopRequireDefault(_cors);

var _compression = require("compression");

var _compression2 = _interopRequireDefault(_compression);

var _socket = require("socket.io");

var _socket2 = _interopRequireDefault(_socket);

var _socket3 = require("socket.io-serialport");

var _socket4 = _interopRequireDefault(_socket3);

var _config = require("./config");

var _config2 = _interopRequireDefault(_config);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const api = (0, _express2.default)();

api.use((0, _cors2.default)());
api.use((0, _compression2.default)());
api.use(_bodyParser2.default.urlencoded({ extended: true }));
api.use(_bodyParser2.default.json());

const server = api.listen(_config2.default.server.port, err => {
	if (err) {
		console.error(err);
		process.exit(1);
	}

	_fs2.default.readdirSync(_path2.default.join(__dirname, "routes")).map(file => {
		require("./routes/" + file)(api);
	});

	console.log(`API is now running on port ${_config2.default.server.port} in ${_config2.default.env} mode`);
});

const io = _socket2.default.listen(server);
// รอการ connect จาก client
io.on("connection", client => {
	console.log("user connected");

	// เมื่อ Client ตัดการเชื่อมต่อ
	client.on("disconnect", () => {
		console.log("user disconnected");
	});

	// ส่งข้อมูลไปยัง Client ทุกตัวที่เขื่อมต่อแบบ Realtime
	client.on("sent-message", function (message) {
		io.sockets.emit("new-message", message);
	});

	client.on("connect-serialport", function (comName) {
		const serialport = new _socket4.default({
			io: io,
			route: "/port/COM17",
			captureFile: "/var/log/serialport/ttyS0",
			retryPeriod: 1000,
			device: comName,
			options: {
				baudrate: 9600
			}
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