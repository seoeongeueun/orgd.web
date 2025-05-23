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

	let subTextVisibilityState = {}; // 현재 활성화된 서브텍스트를 저장
	let userFrames = {}; // 유저의 뷰포트를 저장

	io.on("connection", (socket) => {
		console.log("A user connected:", socket.id);
		const userId = socket.handshake.query.userId;

		socket.emit("initial_visibility", subTextVisibilityState);
		socket.emit("initial_frame", userFrames);

		socket.on("show_subtext", ({ mainTextId, subtextVisible }) => {
			subTextVisibilityState[mainTextId] = subtextVisible;
			socket.broadcast.emit("show_subtext", { mainTextId, subtextVisible });
		});

		socket.on("refresh_visibility", () => {
			subTextVisibilityState = {};
			io.emit("refresh_visibility");
		});

		socket.on(
			"send_viewport",
			({ scaledWidth, scaledHeight, scrollLeft, scrollTop }) => {
				//연결된 유저의 뷰포트 정보를 저장
				userFrames[userId] = {
					scaledWidth,
					scaledHeight,
					scrollLeft,
					scrollTop,
				};

				io.emit("update_viewport_frames", userFrames);
			}
		);

		socket.on("disconnect", () => {
			console.log("User disconnected:", userId);
			delete userFrames[userId];
			io.emit("update_viewport_frames", userFrames);
		});
	});

	server.all("*", (req, res) => handle(req, res));

	httpServer.listen(3000, () => {
		console.log("Server is running on http://localhost:3000");
	});
});
