"use client";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import TextGroup from "./components/TextGroup";

const fetchTexts = async () => {
	const response = await fetch("/api/texts");
	const data = await response.json();
	return data;
};

const fetchIp = async () => {
	const response = await fetch("/api/ip");
	const data = await response.json();
	return data.ip;
};

export default function SharedPage() {
	const [socket, setSocket] = useState(null);
	const [isMain, setIsMain] = useState(true);
	const mainIp = "172.30.1.21"; // 메인 기기의 ip 주소
	const [texts, setTexts] = useState([]);
	const [subTextVisibility, setSubTextVisibility] = useState({});
	const [nonMainViewport, setNonMainViewport] = useState({
		width: 0,
		height: 0,
		scrollLeft: 0,
		scrollTop: 0,
	});
	const scaleFactor = 10;

	useEffect(() => {
		let userId = localStorage.getItem("userId");
		if (!userId) {
			userId = Math.random().toString(36).substring(2);
			localStorage.setItem("userId", userId);
		}

		console.log("User ID:", userId);
		console.log("Main IP:", mainIp);

		// fetchIp().then((data) => {
		// 	setIsMain(data === mainIp || data === "localhost");
		// 	console.log("current IP: ", data);
		// });
		setIsMain(window.location.hostname === "localhost");

		const newSocket = io(`http://${window.location.hostname}:3000`, {
			transports: ["websocket", "polling"],
			query: { userId },
		});

		const loadTexts = async () => {
			const data = await fetchTexts();
			setTexts(data);
		};
		loadTexts();

		newSocket.on("connect", () => {
			console.log("Connected to WebSocket server");
		});

		newSocket.on("connect_error", (error) => {
			console.error("Connection error:", error);
		});

		// 현재 활성화된 서브 텍스트가 있는지 받아옴
		newSocket.on("initial_visibility", (initialVisibility) => {
			setSubTextVisibility(initialVisibility);
		});

		newSocket.on("refresh_visibility", () => {
			setSubTextVisibility({});
		});

		newSocket.on("show_subtext", ({ mainTextId }) => {
			setSubTextVisibility((prevVisibility) => ({
				...prevVisibility,
				[mainTextId]: true,
			}));
		});

		setSocket(newSocket);

		return () => {
			if (newSocket.connected) {
				newSocket.disconnect();
			}
		};
	}, []);

	// useEffect(() => {
	// 	if (!isMain) {
	// 		const canvasWidth = 1920; // Full canvas width
	// 		const canvasHeight = 1080; // Full canvas height

	// 		// Get the physical viewport size of the non-main device
	// 		const deviceWidth = window.innerWidth; // Non-main device's screen width
	// 		const deviceHeight = window.innerHeight; // Non-main device's screen height

	// 		// Calculate the visible area relative to the full canvas and the zoom level (scaleFactor = 10)
	// 		const scaledWidth =
	// 			((deviceWidth / canvasWidth) * canvasWidth) / scaleFactor;
	// 		const scaledHeight =
	// 			((deviceHeight / canvasHeight) * canvasHeight) / scaleFactor;

	// 		// Get the current scroll position and adjust it by the zoom factor
	// 		const scrollLeft = window.scrollX / scaleFactor;
	// 		const scrollTop = window.scrollY / scaleFactor;

	// 		// Emit the calculated viewport and scroll position to the server
	// 		socket.emit("send_viewport", {
	// 			scaledWidth,
	// 			scaledHeight,
	// 			scrollLeft,
	// 			scrollTop,
	// 		});
	// 	}
	// }, [isMain, scaleFactor]);

	useEffect(() => {
		if (!isMain) {
			const handleScroll = () => {
				const deviceWidth = window.innerWidth;
				const deviceHeight = window.innerHeight;
				const canvasWidth = 1920;
				const canvasHeight = 1080;

				// Calculate the scaled viewport size and scroll position
				const scaledWidth =
					((deviceWidth / canvasWidth) * canvasWidth) / scaleFactor;
				const scaledHeight =
					((deviceHeight / canvasHeight) * canvasHeight) / scaleFactor;
				const scrollLeft = window.scrollX / scaleFactor;
				const scrollTop = window.scrollY / scaleFactor;

				socket.emit("send_viewport", {
					scaledWidth,
					scaledHeight,
					scrollLeft,
					scrollTop,
				});
			};

			window.addEventListener("scroll", handleScroll);

			return () => {
				window.removeEventListener("scroll", handleScroll);
			};
		}
	}, [isMain, scaleFactor, socket]);

	useEffect(() => {
		if (isMain && socket) {
			socket.on(
				"update_viewport_frame",
				({ scaledWidth, scaledHeight, scrollLeft, scrollTop }) => {
					setNonMainViewport({
						width: scaledWidth, // The scaled width of the viewport
						height: scaledHeight, // The scaled height of the viewport
						scrollLeft, // The scaled scroll left position
						scrollTop, // The scaled scroll top position
					});
				}
			);
		}
	}, [isMain, socket]);

	const handleMainTextClick = (mainTextId) => {
		const newVisibility = !subTextVisibility[mainTextId];
		socket.emit("show_subtext", { mainTextId, subtextVisible: newVisibility });

		setSubTextVisibility((prevVisibility) => ({
			...prevVisibility,
			[mainTextId]: newVisibility,
		}));
	};

	const handleViewportScroll = (event) => {
		if (isMain) {
			const { scrollLeft, scrollTop } = event.target;
			const scaledWidth = scrollLeft / scaleFactor;
			const scaledHeight = scrollTop / scaleFactor;
			socket.emit("send_viewport", { scaledWidth, scaledHeight });
		}
	};

	return (
		<div className={`${isMain ? "main" : "zoomed-main"} canvas`}>
			<div id="canvas" className="w-full h-full">
				<button
					onClick={() => socket.emit("refresh_visibility")}
					className="fixed right-4 top-4 text-black"
				>
					초기화
				</button>
				{texts.map((text) => (
					<TextGroup
						key={text.uid}
						mainText={text}
						subText={text?.subText}
						isVisible={subTextVisibility[text.uid]}
						onMainTextClick={handleMainTextClick}
					/>
				))}
				{isMain && (
					<div
						style={{
							position: "absolute",
							top: `${nonMainViewport.scrollTop}px`,
							left: `${nonMainViewport.scrollLeft}px`,
							width: `${nonMainViewport.width}px`,
							height: `${nonMainViewport.height}px`,
							border: "1px solid red", // 1px border to mark the non-main viewport
							zIndex: 1000, // Make sure it's on top
						}}
					/>
				)}
			</div>
		</div>
	);
}
