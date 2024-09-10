"use client";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { debounce } from "../utils/tools";
import TextGroup from "./TextGroup";

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

// edit mode인 경우 소켓 통신 x
export default function SharedPage({ isEditMode = true }) {
	const [socket, setSocket] = useState(null);
	const [isMain, setIsMain] = useState(true);
	const mainIp = "172.30.1.72"; // 메인 기기의 ip 주소
	const [texts, setTexts] = useState([]);
	const [subTextVisibility, setSubTextVisibility] = useState({});
	const [userFrames, setUserFrames] = useState({});
	const [scale, setScale] = useState(1); // 어떤 기기 너비든 너비가 가득 차도록 조정
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

		// const handleResize = () => {
		// 	const windowWidth = window.innerWidth;
		// 	const windowHeight = window.innerHeight;

		// 	// 기본 비율은 1920 / 1080 = 16 / 9
		// 	const baseWidth = 1920;
		// 	const baseHeight = 1080;

		// 	const scaleFactorWidth = windowWidth / baseWidth;
		// 	const scaledHeight = baseHeight * scaleFactorWidth;
		// 	if (scaledHeight <= windowHeight) {
		// 		setScale(scaleFactorWidth);
		// 	} else {
		// 		const scaleFactorHeight = windowHeight / baseHeight;
		// 		setScale(scaleFactorHeight);
		// 	}
		// };
		// handleResize();

		const handleResize = debounce(() => {
			//const windowWidth = window.innerWidth;
			const windowWidth = document.body.clientWidth;
			const baseWidth = 1920;
			setScale(windowWidth < baseWidth ? windowWidth / baseWidth : 1);
		}, 100);

		handleResize();
		window.addEventListener("resize", handleResize);

		return () => {
			if (newSocket.connected) {
				newSocket.disconnect();
			}
			window.removeEventListener("resize", handleResize);
		};
	}, []);

	useEffect(() => {
		if (!isMain) {
			const handleScroll = () => {
				const deviceWidth = window.innerWidth;
				const deviceHeight = window.innerHeight;
				const canvasWidth = 1920;
				const canvasHeight = 1080;

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
			socket.on("update_viewport_frames", (frames) => {
				setUserFrames(frames);
			});

			socket.on("initial_frames", (frames) => {
				setUserFrames(frames);
			});
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
		<div
			className={`${isMain ? "main" : "zoomed-main"} canvas`}
			style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}
		>
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
				{isMain &&
					Object.keys(userFrames).map((userId) => {
						const frame = userFrames[userId];
						return (
							<div
								key={userId} // Unique key for each frame
								style={{
									position: "absolute",
									top: `${frame.scrollTop}px`,
									left: `${frame.scrollLeft}px`,
									width: `${frame.scaledWidth}px`,
									height: `${frame.scaledHeight}px`,
									border: "1px solid red", // 1px border for each user frame
									zIndex: 1000,
								}}
							/>
						);
					})}
			</div>
		</div>
	);
}
