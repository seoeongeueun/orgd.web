const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const next = require("next");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
	const server = express();
	const httpServer = createServer(server);
	const io = new Server(httpServer, {
		cors: {
			origin: "*",
			methods: ["GET", "POST"],
		},
	});

	// let userCursors = {}; //유저의 커서를 저장
	// io.on("connection", (socket) => {
	// 	const userId = socket.handshake.query.userId;
	// 	console.log("Client connected:", userId);

	// 	if (Object.keys(userCursors).length !== 0) {
	// 		const firstUserId = Object.keys(userCursors)[0];

	// 		if (firstUserId !== userId) {
	// 			socket.emit("is_not_host");
	// 		}
	// 	} else {
	// 	}

	// 	socket.on("open_dialog", () => {
	// 		io.emit("open_dialog");
	// 	});
	// 	console.log("Emitting existing cursors:", userCursors);
	// 	socket.emit("existing_cursors", userCursors);

	// 	socket.on("cursor_move", (position) => {
	// 		userCursors[userId] = position;
	// 		socket.broadcast.emit("cursor_update", {
	// 			id: userId,
	// 			position,
	// 		});
	// 	});

	// 	socket.on("show_subtext", ({ mainTextId }) => {
	// 		socket.broadcast.emit("show_subtext", { mainTextId });
	// 	});

	// 	socket.on("disconnect", () => {
	// 		console.log("Client disconnected:", socket.id);
	// 		delete userCursors[userId];
	// 		socket.broadcast.emit("cursor_remove", { id: userId });
	// 	});

	// 	});
	let subTextVisibilityState = {}; // 현재 활성화된 서브텍스트를 저장

	io.on("connection", (socket) => {
		console.log("A user connected:", socket.id);

		socket.emit("initial_visibility", subTextVisibilityState);

		socket.on("show_subtext", ({ mainTextId, subtextVisible }) => {
			subTextVisibilityState[mainTextId] = subtextVisible;
			socket.broadcast.emit("show_subtext", { mainTextId, subtextVisible });
		});

		socket.on("refresh_visibility", () => {
			subTextVisibilityState = {};
			io.emit("refresh_visibility");
		});

		socket.on("disconnect", () => {
			console.log("User disconnected:", socket.id);
		});
	});

	server.all("*", (req, res) => handle(req, res));

	httpServer.listen(3000, () => {
		console.log("Server is running on http://localhost:3000");
	});
});
