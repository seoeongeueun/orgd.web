"use client";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { debounce, throttle } from "../utils/tools";
import TextGroup from "./TextGroup";
import { apiRequest } from "../utils/tools";

const fetchTexts = async () => {
	const response = await fetch("/api/texts");
	const data = await response.json();
	return data;
};

const fetchSettings = async () => {
	const settings = await apiRequest("/api/settings");
	console.log("폰트 설정 정보:", settings);
	return settings;
};

export default function SharedPage() {
	const [socket, setSocket] = useState(null);
	const [isMain, setIsMain] = useState(true);
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

		//setIsMain(window.location.hostname === "localhost");
		const isMainDevice = sessionStorage.getItem("mainDevice") === "true";
		if (isMainDevice) setIsMain(true);
		else setIsMain(false);

		const newSocket = io(`wss://${process.env.NEXT_PUBLIC_SERVER_URL}`, {
			transports: ["websocket", "polling"],
			query: { userId: userId, isMain: isMainDevice },
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

		const loadSettings = async () => {
			const data = await fetchSettings();
			const fontSizes = data[0].fontSize;
			document.documentElement.style.setProperty(
				"--fs-main",
				fontSizes.default
			);
			document.documentElement.style.setProperty("--fs-sub", fontSizes.sub);
		};

		loadSettings();

		return () => {
			if (newSocket.connected) {
				newSocket.disconnect();
			}
		};
	}, []);

	useEffect(() => {
		const handleResize = () => {
			console.log("Debounced resize with isMain:", isMain);
			const windowWidth = document.body.clientWidth;
			const baseWidth = 1920;
			if (isMain) {
				setScale(windowWidth < baseWidth ? windowWidth / baseWidth : 1);
			} else {
				setScale(scaleFactor);
			}
		};
		if (!isMain) setScale(scaleFactor);
		else {
			handleResize();

			window.addEventListener("resize", handleResize);

			return () => {
				window.removeEventListener("resize", handleResize);
			};
		}
	}, [isMain]);

	// useEffect(() => {
	// 	if (!isMain) {
	// 		const handleTouchMove = () => {
	// 			const deviceWidth = document.body.clientWidth;
	// 			const deviceHeight = document.body.clientHeight;
	// 			const canvasWidth = 1920;
	// 			const canvasHeight = 1080;

	// 			// Calculate scaling based on touch movement
	// 			const scaledWidth =
	// 				((deviceWidth / canvasWidth) * canvasWidth) / scaleFactor;
	// 			const scaledHeight =
	// 				((deviceHeight / canvasHeight) * canvasHeight) / scaleFactor;
	// 			const scrollLeft = window.scrollX / scaleFactor;
	// 			const scrollTop = window.scrollY / scaleFactor;

	// 			socket.emit("send_viewport", {
	// 				scaledWidth,
	// 				scaledHeight,
	// 				scrollLeft,
	// 				scrollTop,
	// 			});
	// 		};

	// 		// Listen to both scroll and touchmove events
	// 		window.addEventListener("scroll", handleTouchMove);
	// 		window.addEventListener("touchmove", handleTouchMove);

	// 		return () => {
	// 			// Remove both listeners when the component unmounts or dependencies change
	// 			window.removeEventListener("scroll", handleTouchMove);
	// 			window.removeEventListener("touchmove", handleTouchMove);
	// 		};
	// 	}
	// }, [isMain, scaleFactor, socket]);

	// useEffect(() => {
	// 	const handleViewportUpdate = throttle(() => {
	// 		const deviceWidth = document.body.clientWidth;
	// 		const deviceHeight = document.body.clientHeight;
	// 		const canvasWidth = 1920;
	// 		const canvasHeight = 1080;

	// 		const scaledWidth =
	// 			((deviceWidth / canvasWidth) * canvasWidth) / scaleFactor;
	// 		const scaledHeight =
	// 			((deviceHeight / canvasHeight) * canvasHeight) / scaleFactor;
	// 		const scrollLeft = window.scrollX / scaleFactor;
	// 		const scrollTop = window.scrollY / scaleFactor;

	// 		// Emit viewport data through WebSocket
	// 		socket.emit("send_viewport", {
	// 			scaledWidth,
	// 			scaledHeight,
	// 			scrollLeft,
	// 			scrollTop,
	// 		});
	// 	}, 100);

	// 	if (!isMain) {
	// 		window.addEventListener("scroll", handleViewportUpdate);
	// 		window.addEventListener("touchmove", handleViewportUpdate);
	// 	}

	// 	return () => {
	// 		window.removeEventListener("scroll", handleViewportUpdate);
	// 		window.removeEventListener("touchmove", handleViewportUpdate);
	// 	};
	// }, [isMain, scaleFactor, socket]);

	// useEffect(() => {
	// 	const handleViewportUpdate = throttle(() => {
	// 		const scrollDiv = document.querySelector("#scroll-div");
	// 		if (scrollDiv) {
	// 			const deviceWidth = window.innerWidth;
	// 			const deviceHeight = window.innerHeight;
	// 			const canvasWidth = 1920;
	// 			const canvasHeight = 1080;

	// 			const scaledWidth =
	// 				((deviceWidth / canvasWidth) * canvasWidth) / scaleFactor;
	// 			const scaledHeight =
	// 				((deviceHeight / canvasHeight) * canvasHeight) / scaleFactor;
	// 			const scrollLeft = scrollDiv.scrollLeft / scaleFactor;
	// 			const scrollTop = scrollDiv.scrollTop / scaleFactor;

	// 			socket.emit("send_viewport", {
	// 				scaledWidth,
	// 				scaledHeight,
	// 				scrollLeft,
	// 				scrollTop,
	// 			});
	// 		}
	// 	}, 100);

	// 	const scrollDiv = document.querySelector("#scroll-div");
	// 	if (scrollDiv && !isMain) {
	// 		scrollDiv.addEventListener("scroll", handleViewportUpdate);
	// 		scrollDiv.addEventListener("touchmove", handleViewportUpdate);
	// 	}

	// 	return () => {
	// 		if (scrollDiv) {
	// 			scrollDiv.removeEventListener("scroll", handleViewportUpdate);
	// 			scrollDiv.removeEventListener("touchmove", handleViewportUpdate);
	// 		}
	// 	};
	// }, [isMain, scaleFactor, socket]);

	useEffect(() => {
		let lastSentScrollLeft = 0;
		let lastSentScrollTop = 0;

		// threshold px 이상 스크롤할 때만 업데이트
		const scrollThreshold = 20;
		const throttleTime = 100;
		const debounceTime = 300;
		let debounceTimer;

		const sendViewportUpdate = () => {
			const scrollDiv = document.querySelector("#scroll-div");
			if (scrollDiv) {
				const scrollLeft = scrollDiv.scrollLeft;
				const scrollTop = scrollDiv.scrollTop;

				const deltaX = Math.abs(scrollLeft - lastSentScrollLeft);
				const deltaY = Math.abs(scrollTop - lastSentScrollTop);

				if (deltaX > scrollThreshold || deltaY > scrollThreshold) {
					lastSentScrollLeft = scrollLeft;
					lastSentScrollTop = scrollTop;

					const deviceWidth = window.innerWidth;
					const deviceHeight = window.innerHeight;
					const canvasWidth = 1920;
					const canvasHeight = 1080;

					const scaledWidth =
						((deviceWidth / canvasWidth) * canvasWidth) / scaleFactor;
					const scaledHeight =
						((deviceHeight / canvasHeight) * canvasHeight) / scaleFactor;

					socket.emit("send_viewport", {
						scaledWidth,
						scaledHeight,
						scrollLeft: scrollLeft / scaleFactor,
						scrollTop: scrollTop / scaleFactor,
					});
				}
			}
		};

		const throttledViewportUpdate = throttle(sendViewportUpdate, throttleTime);

		const handleViewportUpdate = () => {
			throttledViewportUpdate();

			clearTimeout(debounceTimer);
			debounceTimer = setTimeout(() => {
				sendViewportUpdate();
			}, debounceTime);
		};

		const scrollDiv = document.querySelector("#scroll-div");
		if (scrollDiv && !isMain) {
			scrollDiv.addEventListener("scroll", handleViewportUpdate);
			scrollDiv.addEventListener("touchmove", handleViewportUpdate);
		}

		return () => {
			if (scrollDiv) {
				scrollDiv.removeEventListener("scroll", handleViewportUpdate);
				scrollDiv.removeEventListener("touchmove", handleViewportUpdate);
			}
			clearTimeout(debounceTimer);
		};
	}, [isMain, scaleFactor, socket]);

	useEffect(() => {
		if (isMain && socket) {
			const handleUpdateViewportFrames = (frames) => {
				setUserFrames(frames);
			};

			socket.on("update_viewport_frames", handleUpdateViewportFrames);
			socket.on("initial_frame", handleUpdateViewportFrames);

			return () => {
				socket.off("update_viewport_frames", handleUpdateViewportFrames);
				socket.off("initial_frames", handleUpdateViewportFrames);
			};
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
			className="main canvas"
			style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}
		>
			<div id="canvas" className="w-full h-full">
				<button
					onClick={() => socket.emit("refresh_visibility")}
					className="fixed right-4 top-4 text-black"
				>
					초기화
				</button>
				{texts?.length > 0 &&
					texts.map((text) => (
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
								key={userId}
								style={{
									position: "absolute",
									top: `${frame.scrollTop}px`,
									left: `${frame.scrollLeft}px`,
									width: `${frame.scaledWidth}px`,
									height: `${frame.scaledHeight}px`,
									border: "1px solid red",
									zIndex: 1000,
								}}
							/>
						);
					})}
			</div>
		</div>
	);
}
