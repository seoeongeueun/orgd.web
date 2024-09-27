"use client";
import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import { debounce, throttle } from "../utils/tools";
import TextGroup from "./TextGroup";
import { apiRequest } from "../utils/tools";
import Image from "next/image";
import { Play } from "next/font/google";

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
	const [message, setMessage] = useState(0);
	const [showLoading, setShowLoading] = useState(true);
	const [isConnected, setIsConnected] = useState(false);
	const [darkCount, setDarkCount] = useState(0); // 전체 오픈된 다크 해설 텍스트 개수
	const scaleFactor = 8;
	const messageList = [
		"화면을 이동하면서 질문을 터치해보세요",
		"처음으로 돌아가기",
	];
	const ALL_DARK_COUNT = 57; // 전체 다크 텍스트 개수
	const audioRef = useRef(null);

	const playAudio = () => {
		if (audioRef.current) {
			audioRef.current.play();
		}
	};

	useEffect(() => {
		if (typeof window !== "undefined") {
			audioRef.current = new Audio("/audio/mixkit-toy-drums.wav");
		}

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
			setIsConnected(true);
		});

		newSocket.on("connect_error", (error) => {
			console.error("Connection error:", error);
			setIsConnected(false);
		});

		// 현재 활성화된 서브 텍스트가 있는지 받아옴
		newSocket.on("initial_visibility", (initialVisibility) => {
			setSubTextVisibility(initialVisibility);
		});

		newSocket.on("refresh_visibility", () => {
			setSubTextVisibility({});
			setDarkCount(0);
		});

		newSocket.on("show_subtext", ({ mainTextId }) => {
			setMessage(0);
			setSubTextVisibility((prevVisibility) => ({
				...prevVisibility,
				[mainTextId]: !prevVisibility[mainTextId],
			}));
		});

		newSocket.on("connection_limit_exceeded", () => {
			setIsConnected(false);
			alert("연결 가능한 인원을 초과했습니다. 나중에 다시 시도해주세요.");
		});

		newSocket.on("disconnect", () => {
			console.log("Disconnected from WebSocket server");
			setSocket(null);
			setIsConnected(false);
			alert("서버 연결이 끊어졌습니다. 연결을 재시도 합니다.");
			window.location.reload();
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
		if (Object.keys(subTextVisibility)?.length > 0 && texts?.length > 0) {
			const darkCount = texts?.filter(
				(text) =>
					subTextVisibility[text.uid] &&
					text.subText.background_color === "dark"
			).length;
			setDarkCount(darkCount);

			if (
				Object.values(subTextVisibility).filter(
					(visibility) => visibility === true
				).length === texts?.length &&
				texts?.length > 0
			) {
				setMessage(1);
			}
		}
	}, [subTextVisibility, texts]);

	// useEffect(() => {
	// 	if (darkCount === ALL_DARK_COUNT && socket) {
	// 		socket?.emit("enable_all_visibility");
	// 	}
	// }, [darkCount]);

	useEffect(() => {
		const handleResize = () => {
			const windowWidth = document.body.clientWidth;
			const baseWidth = 1920;
			if (isMain) {
				//setScale(windowWidth < baseWidth ? windowWidth / baseWidth : 1);
				setScale(windowWidth / baseWidth);
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
					if (!isMain && isConnected && showLoading) setShowLoading(false);
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
			scrollDiv.addEventListener("scroll", handleViewportUpdate, {
				passive: true,
			});
			scrollDiv.addEventListener("touchmove", handleViewportUpdate, {
				passive: true,
			});
		}

		return () => {
			if (scrollDiv) {
				scrollDiv.removeEventListener("scroll", handleViewportUpdate);
				scrollDiv.removeEventListener("touchmove", handleViewportUpdate);
			}
			clearTimeout(debounceTimer);
		};
	}, [isMain, scaleFactor, socket, isConnected]);

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
				setMessage(1);
				setDarkCount(ALL_DARK_COUNT);
			});
		}
	}, [socket, texts]);

	const handleMainTextClick = (mainTextId) => {
		if (showLoading) setShowLoading(false);
		const newVisibility = !subTextVisibility[mainTextId];

		// 해설을 닫으려는데 현재 100%메세지가 떠있는 경우 메세지를 디폴트로 변경
		if (!newVisibility && message !== 0) setMessage(0);

		socket?.emit("show_subtext", { mainTextId, subtextVisible: newVisibility });
		setSubTextVisibility((prevVisibility) => ({
			...prevVisibility,
			[mainTextId]: newVisibility,
		}));

		const darkCount = texts?.filter(
			(text) =>
				subTextVisibility[text.uid] && text.subText.background_color === "dark"
		).length;

		if (newVisibility && darkCount + 1 === ALL_DARK_COUNT) {
			const currentSubText = texts.find(
				(text) => text.uid === mainTextId
			)?.subText;

			if (currentSubText?.background_color === "dark") {
				playAudio();
				socket?.emit("enable_all_visibility");
			}
		}

		// 해설이 오픈 되었으나 유저 화면에 안 보이는 경우 스크롤 보정
		// if (newVisibility && !isMain) {
		// 	const scrollDiv = document.querySelector("#scroll-div");
		// 	const subText = texts.find((text) => text.uid === mainTextId)?.subText;

		// 	if (scrollDiv && subText) {
		// 		const threshold =
		// 			Math.abs(subText?.rotation) > 80 && Math.abs(subText?.rotation) < 100
		// 				? window.innerWidth / 2
		// 				: 0;
		// 		if (
		// 			scrollDiv.scrollLeft <
		// 				subText.position.x * scale + window.innerWidth - threshold ||
		// 			scrollDiv.scrollLeft >
		// 				subText.position.x * scale - window.innerWidth - threshold
		// 		) {
		// 			scrollDiv.scrollTo({
		// 				top: subText.position.y * scale - window.innerHeight / 2,
		// 				left: subText.position.x * scale + threshold,
		// 				behavior: "smooth",
		// 			});
		// 		}
		// 	}
		// }

		// 해설이 오픈 되었으나 유저 화면에 안 보이는 경우 스크롤 보정
		if (newVisibility && !isMain) {
			const scrollDiv = document.querySelector("#scroll-div");
			const subText = texts.find((text) => text.uid === mainTextId)?.subText;

			if (scrollDiv && subText) {
				const rotation = subText?.rotation;
				const absRotation = Math.abs(rotation);

				let threshold;
				if (absRotation > 80 && absRotation < 100) {
					threshold = window.innerWidth / 2;
				} else if (absRotation <= 80 || absRotation >= 100) {
					threshold = window.innerWidth / 4;
				}

				if (rotation < 0) {
					threshold = -threshold;
				}

				if (
					scrollDiv.scrollLeft < subText.position.x * scale - threshold ||
					scrollDiv.scrollLeft > subText.position.x * scale - threshold
				) {
					scrollDiv.scrollTo({
						top: subText.position.y * scale - window.innerHeight / 2,
						left: subText.position.x * scale - Math.abs(threshold / 2),
						behavior: "smooth",
					});
				}
			}
		}
	};

	const handleRefreshVisibility = () => {
		socket?.emit("refresh_visibility");
		setTimeout(() => setMessage(0), 500);
		const scrollDiv = document.querySelector("#scroll-div");
		if (!scrollDiv) return;

		// 텍스트가 있는 안전한 위치 중 랜덤 한 곳으로 이동
		const sWidth = scrollDiv.scrollWidth;
		const sHeight = scrollDiv.scrollHeight;
		const safeCoords = [
			{ x: sWidth / 1.5, y: sHeight / 1.5 },
			{ x: sWidth / 3, y: sHeight / 3 },
			{
				x: sWidth / 2 - window.innerWidth / 2,
				y: sHeight / 2 + window.innerHeight / 2.5,
			},
			{ x: sWidth / 5, y: sHeight / 5 },
		];
		const randomCoords =
			safeCoords[Math.floor(Math.random() * safeCoords.length)];
		scrollDiv.scrollTo({
			top: randomCoords.y,
			left: randomCoords.x,
			behavior: "smooth",
		});
	};

	return (
		<div
			id="scroll-div"
			className={`w-full h-full ${!isMain && "overflow-auto"}`}
		>
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
										pointerEvents: "none",
									}}
								/>
							);
						})}
				</div>
			</div>
			{!isMain && (
				<div
					className={`fixed ${
						showLoading ? "animate-fade-in" : "animate-fade-out"
					} duration-300 top-0 left-0 pointer-events-none w-full h-full bg-loading-white flex items-center justify-center shrink-0`}
				>
					<Image
						src="/minorquestions.svg"
						alt="logo"
						width={1000}
						height={1000}
						className="w-[74.41%] object-contain"
						priority
					/>
				</div>
			)}
			{texts?.length > 0 && !isMain && (
				<div className="info-box animate-fade-in z-[999] pointer-events-none fixed top-[40px] left-1/2 -translate-x-1/2 flex flex-col gap-[4px] items-center justify-center text-info">
					<div className="flex flex-row items-center gap-2">
						<p>{`${
							Object.values(subTextVisibility).filter(
								(visibility) => visibility === true
							)?.length
						} / ${texts.length}`}</p>
						<p>{`${((darkCount / ALL_DARK_COUNT) * 100).toFixed(0)}%`}</p>
					</div>
					<p
						className={`${
							message === 1 ? "underline cursor-pointer" : ""
						} underline-offset-[2px] pointer-events-auto`}
						onClick={() => handleRefreshVisibility()}
					>
						{messageList[message]}
					</p>
				</div>
			)}
		</div>
	);
}
