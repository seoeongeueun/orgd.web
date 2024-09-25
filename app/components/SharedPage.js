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

		newSocket.on("connection_limit_exceeded", () => {
			alert(
				"연결 가능한 인원을 초과했습니다. 오프라인 상태로, 변경 사항이 적용되지 않습니다."
			);
		});

		newSocket.on("disconnect", () => {
			console.log("Disconnected from WebSocket server");
			setSocket(null);
			alert("서버 연결이 끊겼습니다. 관리자에게 문의해주세요.");
		});

		setSocket(newSocket);

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
		if (!isMain) {
			setScale(scaleFactor);
		} else {
			handleResize();

			window.addEventListener("resize", handleResize);

			return () => {
				window.removeEventListener("resize", handleResize);
			};
		}
	}, [isMain]);

	useEffect(() => {
		let lastSentScrollLeft = 0;
		let lastSentScrollTop = 0;

		// threshold px 이상 스크롤할 때만 업데이트
		const scrollThreshold = 10;
		const throttleTime = 150;
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

	useEffect(() => {
		const scrollDiv = document.querySelector("#scroll-div");
		if (!isMain && texts?.length > 0) {
			// 첫 접속시 랜덤 위치로 스크롤
			const maxScrollLeft = scrollDiv.scrollWidth - scrollDiv.clientWidth;
			const maxScrollTop = scrollDiv.scrollHeight - scrollDiv.clientHeight;

			if (maxScrollLeft > 0 || maxScrollTop > 0) {
				const randomScrollLeft = Math.random() * maxScrollLeft;
				const randomScrollTop = Math.random() * maxScrollTop;
				scrollDiv.scrollLeft = randomScrollLeft;
				scrollDiv.scrollTop = randomScrollTop;
			}
			const canvas = document.querySelector(".canvas");
			if (canvas) canvas.classList.remove("opacity-0", "pointer-events-none");
		}
	}, [isMain, texts]);

	useEffect(() => {
		if (socket && texts) {
			socket.on("enable_all_visibility", () => {
				const newVisibility = {};
				if (texts?.length > 0) {
					texts.forEach((text) => {
						newVisibility[text.uid] = true;
					});
				}
				setSubTextVisibility(newVisibility);
			});
		}
	}, [socket, texts]);

	const handleMainTextClick = (mainTextId) => {
		const newVisibility = !subTextVisibility[mainTextId];
		socket?.emit("show_subtext", { mainTextId, subtextVisible: newVisibility });
		setSubTextVisibility((prevVisibility) => ({
			...prevVisibility,
			[mainTextId]: newVisibility,
		}));
	};

	return (
		<div
			className={`main canvas ${!isMain && "opacity-0 pointer-events-none"}`}
			style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}
		>
			<div id="canvas" className="w-full h-full">
				<button
					onClick={() => socket.emit("refresh_visibility")}
					className="fixed right-28 top-4 text-black"
				>
					초기화
				</button>
				<button
					onClick={() => socket.emit("enable_all_visibility")}
					className="fixed right-4 top-4 text-black"
				>
					전체 보이기
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
									// top: `${frame.scrollTop}px`,
									// left: `${frame.scrollLeft}px`,
									transform: `translate(${frame.scrollLeft}px, ${frame.scrollTop}px)`,
									width: `${frame.scaledWidth}px`,
									height: `${frame.scaledHeight}px`,
									border: "1px solid red",
									zIndex: 1000,
									transition: "all 200ms ease-in-out",
								}}
							/>
						);
					})}
			</div>
		</div>
	);
}
