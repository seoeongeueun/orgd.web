"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { io } from "socket.io-client";
import { debounce, throttle } from "../utils/tools";
import TextGroup from "./TextGroup";
import { apiRequest } from "../utils/tools";
import Image from "next/image";

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

const fetchSubTexts = async () => {
	const response = await fetch("/api/texts/subtexts");
	const data = await response.json();
	return data;
};

export default function SharedPage() {
	const [socket, setSocket] = useState(null);
	const [isMain, setIsMain] = useState(true);
	const [texts, setTexts] = useState([]);
	const [uids, setUids] = useState({ dark: [], light: [] }); // 서브 텍스트 컬러별 메인 텍스트의 uid
	const [subTextVisibility, setSubTextVisibility] = useState({});
	const [userFrames, setUserFrames] = useState({});
	const [scale, setScale] = useState(1); // 어떤 기기 너비든 너비가 가득 차도록 조정
	const [message, setMessage] = useState(0);
	const [showLoading, setShowLoading] = useState(true);
	const [isConnected, setIsConnected] = useState(false);
	const [darkCount, setDarkCount] = useState(0); // 전체 오픈된 다크 해설 텍스트 개수
	const [lightCount, setLightCount] = useState(0); // 전체 오픈된 라이트 해설 텍스트 개수
	const [isComplete, setIsComplete] = useState(false); // 전체 해설 텍스트 오픈 완료 여부

	const scaleFactor = 6;
	const messageList = [
		"화면을 이동하면서 질문을 터치해보세요.",
		"처음으로 돌아가기",
	];
	const frameColors = ["#006aff", "#ff33dd"]; // 유저 프레임 컬러
	const ALL_DARK_COUNT = 57; // 전체 다크 텍스트 개수
	const START_DARK_COUNT = 5; // 초기 다크 텍스트 개수
	const START_LIGHT_COUNT = 10; // 초기 라이트 텍스트 개수
	const END_DARK_COUNT = 54; // 완성 기준 다크 텍스트 개수
	const END_LIGHT_COUNT = 37; // 완성 기준 라이트 텍스트 개수

	const audioRef = useRef(null);
	const timerRef = useRef(null);

	const playAudio = useCallback((type = "default") => {
		const audioFiles = ["mixkit-card-flick.wav", "mixkit-toy-drums.wav"];
		if (audioRef.current) {
			audioRef.current.src =
				type === "default"
					? `/audio/${audioFiles[0]}`
					: `/audio/${audioFiles[1]}`;
			audioRef.current
				.play()
				.then(() => {
					console.log("Audio playback started successfully.");
				})
				.catch((error) => {
					console.error("Audio playback failed:", error);
				});
		}
	}, []);

	useEffect(() => {
		if (typeof window !== "undefined") {
			audioRef.current = new Audio("/audio/mixkit-typewriter-click.wav");
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
			const uids = await fetchSubTexts();
			setTexts(data);
			setUids(uids);
		};
		loadTexts();

		newSocket.on("connect", () => {
			console.log("Connected to WebSocket server");
		});

		newSocket.on("connect_error", (error) => {
			console.error("Connection error:", error);
			setIsConnected(false);
		});

		// 현재 활성화된 서브 텍스트가 있는지 받아옴
		newSocket.on("initial_visibility", (initialVisibility) => {
			setSubTextVisibility(initialVisibility);
		});

		newSocket.on("refresh_visibility", (subTextVisibility) => {
			setSubTextVisibility(subTextVisibility);
			setDarkCount(START_DARK_COUNT);
			setLightCount(START_LIGHT_COUNT);
			setIsComplete(false);
		});

		newSocket.on("show_subtext", ({ mainTextId }) => {
			setIsComplete(false);
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
			const hasMain = sessionStorage.getItem("mainDevice");
			if (hasMain) {
				confirm("서버 연결이 끊어졌습니다. 연결을 재시도 합니다.");
				setTimeout(() => {
					window.location.reload();
				}, 100);
			} else {
				alert("서버 연결이 끊어졌습니다. 연결을 재시도 합니다.");
				setTimeout(() => {
					window.location.reload();
				}, 100);
			}
			// setSocket(null);
			// setIsConnected(false);
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
		// 서브 기기에서 3분 동안 동작 없을 경우 대기 화면으로 전환
		if (!isMain && !showLoading && isConnected) {
			timerRef.current = setTimeout(() => {
				setShowLoading(true);
			}, 180000);
			return () => {
				if (timerRef.current) {
					clearTimeout(timerRef.current);
					timerRef.current = null;
				}
			};
		}
	}, [isMain, showLoading, isConnected]);

	useEffect(() => {
		if (!subTextVisibility || !texts || texts.length === 0 || isComplete)
			return;

		let darkCount = 0;
		let visibleCount = 0;

		texts.forEach((text) => {
			if (subTextVisibility[text.uid]) {
				visibleCount++;
				if (text.subText.background_color === "dark") {
					darkCount++;
				}
			}
		});

		setDarkCount(darkCount);
		setLightCount(visibleCount - darkCount);

		console.log(visibleCount, texts.length);

		if (visibleCount === texts.length) {
			if (isMain) playAudio("drums"); //완료시 메인 기기에서만 소리 재생
			setTimeout(() => {
				setShowLoading(true);
				setIsComplete(true);
			}, 1500);
		}
	}, [subTextVisibility, texts, isComplete]);

	useEffect(() => {
		console.log(showLoading);
	}, [showLoading]);

	useEffect(() => {
		if (
			darkCount >= END_DARK_COUNT &&
			lightCount >= END_LIGHT_COUNT &&
			socket &&
			isMain
		) {
			console.log("almost done!");
			// 거의 완성 되었는데 10분간 아무런 소켓 트리거가 없을 경우 초기화
			resetTimeOut();
		}
		return () => {
			clearTimeout(timerRef.current);
		};
	}, [darkCount, lightCount, socket, timerRef, isMain]);

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
			if (canvas) {
				canvas.classList.remove("opacity-0", "pointer-events-none");
				setIsConnected(true);
			}
		}
	}, [isMain, texts]);

	useEffect(() => {
		let lastSentScrollLeft = 0;
		let lastSentScrollTop = 0;

		// threshold px 이상 스크롤할 때만 업데이트
		const scrollThreshold = 10;
		const throttleTime = 150;
		const debounceTime = 300;
		let debounceTimer;

		const preventGesture = (e) => e.preventDefault();

		const sendViewportUpdate = () => {
			const scrollDiv = document.querySelector("#scroll-div");
			if (scrollDiv) {
				const scrollLeft = scrollDiv.scrollLeft;
				const scrollTop = scrollDiv.scrollTop;

				const deltaX = Math.abs(scrollLeft - lastSentScrollLeft);
				const deltaY = Math.abs(scrollTop - lastSentScrollTop);

				if (deltaX > scrollThreshold || deltaY > scrollThreshold) {
					if (!isMain && isConnected && !isComplete) setShowLoading(false);
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
		if (scrollDiv && !isMain && isConnected) {
			//핀치줌 방지
			scrollDiv.addEventListener("gesturestart", preventGesture, {
				passive: false,
			});
			scrollDiv.addEventListener("gesturechange", preventGesture, {
				passive: false,
			});
			scrollDiv.addEventListener("gestureend", preventGesture, {
				passive: false,
			});

			if (!isMain && isConnected) {
				setTimeout(() => {
					scrollDiv.addEventListener("scroll", handleViewportUpdate, {
						passive: true,
					});
					scrollDiv.addEventListener("touchmove", handleViewportUpdate, {
						passive: true,
					});
				}, 1500);
			}
		}

		return () => {
			if (scrollDiv) {
				scrollDiv.removeEventListener("scroll", handleViewportUpdate);
				scrollDiv.removeEventListener("touchmove", handleViewportUpdate);
				scrollDiv.removeEventListener("gesturestart", preventGesture);
				scrollDiv.removeEventListener("gesturechange", preventGesture);
				scrollDiv.removeEventListener("gestureend", preventGesture);
			}
			clearTimeout(debounceTimer);
		};
	}, [isMain, scaleFactor, socket, isConnected, isComplete]);

	useEffect(() => {
		if (isMain && socket) {
			const handleUpdateViewportFrames = (frames) => {
				if (uids.dark?.length > 0) resetTimeOut();
				setUserFrames(frames);
			};

			socket.on("update_viewport_frames", handleUpdateViewportFrames);
			socket.on("initial_frames", handleUpdateViewportFrames);

			return () => {
				socket.off("update_viewport_frames", handleUpdateViewportFrames);
				socket.off("initial_frames", handleUpdateViewportFrames);
			};
		}
	}, [isMain, socket, uids]);

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
				setDarkCount(ALL_DARK_COUNT);
			});
		}
	}, [socket, texts]);

	const getRandomSubtextUids = () => {
		if (uids.dark.length < 5 || uids.light.length < 5)
			return { dark: [], light: [] };

		const getRandomElements = (array, count) => {
			return array
				.map((value) => ({ value, sort: Math.random() }))
				.sort((a, b) => a.sort - b.sort)
				.slice(0, count)
				.map(({ value }) => value);
		};

		// 랜덤한 다크 서브 텍스트 5개, 라이트 서브 텍스트 10개
		const randomDarkUids = getRandomElements(uids.dark, 5);
		const randomLightUids = getRandomElements(uids.light, 10);
		return { dark: randomDarkUids, light: randomLightUids };
	};

	const resetTimeOut = () => {
		clearTimeout(timerRef.current);
		if (darkCount >= END_DARK_COUNT && lightCount >= END_LIGHT_COUNT) {
			timerRef.current = setTimeout(() => {
				handleRefreshVisibility();
			}, 600000);
		}
		return () => {
			clearTimeout(timerRef.current);
		};
	};

	const handleMainTextClick = (mainTextId) => {
		if (isComplete) return; // 이미 완료된 상태에서는 클릭 무시
		if (showLoading) setShowLoading(false);
		const newVisibility = !subTextVisibility[mainTextId];

		// 해설을 닫으려는데 현재 100%메세지가 떠있는 경우 메세지를 디폴트로 변경
		if (!newVisibility && isComplete) {
			setIsComplete(false);
		}

		socket?.emit("show_subtext", { mainTextId, subtextVisible: newVisibility });
		playAudio();

		setSubTextVisibility((prevVisibility) => ({
			...prevVisibility,
			[mainTextId]: newVisibility,
		}));

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

				const text = document.querySelector(`#subtext-${subText.uid}`);
				const width = text?.clientWidth || 0;

				/* 이동 로직
					1. 현재 scrollLeft 값이 해설의 시작 x좌표 + 해설 텍스트의 너비 / 2 보다 큰 경우 (해설이 반절 이상 화면에 안 들어오는 경우)
					2. 현재 scrollLeft + 해설 텍스트의 너비가 해설의 x좌표 보다 작은 경우 (해설의 끝 영역이 화면의 오른쪽 가장자리 안에 오지 않는 경우)
					3. 현재 scrollTop 값 + 화면 높이가 해설의 시작 y좌표 + 해설 텍스트의 높이 / 2 보다 큰 경우 (해설이 화면보다 밑에 있는 경우)
					4. 현재 scrollTop 값 + 해설 높이 / 2가 해설의 시작 y좌표 보다 작은 경우 (해설이 화면보다 위에 있는 경우)
				*/
				const TEXT_HEIGHT = 200; // 최대 200을 넘지 않음

				const d1 =
					subText.position.x * scale + width / 2 >
					scrollDiv.scrollLeft + window.innerWidth / 2;
				const d2 =
					subText.position.x * scale < scrollDiv.scrollLeft + width / 2;
				const d3 =
					subText.position.y * scale + TEXT_HEIGHT / 2 >
					scrollDiv.scrollTop + window.innerHeight;
				const d4 =
					subText.position.y * scale < scrollDiv.scrollTop + TEXT_HEIGHT / 2;

				if (d1 || d2 || d3 || d4) {
					scrollDiv.scrollTo({
						left:
							d1 || d2
								? subText.position.x * scale - Math.abs(threshold / 1.5)
								: scrollDiv.scrollLeft,
						top:
							d3 || d4
								? subText.position.y * scale - window.innerHeight / 2
								: scrollDiv.scrollTop,
						behavior: "smooth",
					});
				}
			}
		}
	};

	const handleRefreshVisibility = () => {
		const { dark, light } = getRandomSubtextUids();
		socket?.emit("refresh_visibility", { dark, light });

		setTimeout(() => setIsComplete(false), 500);
		const scrollDiv = document.querySelector("#scroll-div");
		if (!scrollDiv || isMain) return;

		setShowLoading(false);

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
						onClick={() => handleRefreshVisibility()}
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
								isComplete={isComplete}
								onMainTextClick={handleMainTextClick}
							/>
						))}
					{isMain &&
						Object.keys(userFrames).map((userId, i) => {
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
										border: `1px solid ${frameColors[i % frameColors.length]}`,
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
				<div className="info-box min-w-[280px] animate-fade-in z-[999] pointer-events-none fixed top-[40px] left-1/2 -translate-x-1/2 flex flex-col gap-[4px] items-center justify-center text-info">
					<p>{`${
						Object.values(subTextVisibility).filter(
							(visibility) => visibility === true
						)?.length
					} / ${texts.length}`}</p>
					<p
						className={`${
							isComplete ? "underline cursor-pointer" : ""
						} underline-offset-[2px] pointer-events-auto`}
						onClick={isComplete ? () => handleRefreshVisibility() : null}
					>
						{messageList[isComplete ? 1 : 0]}
					</p>
				</div>
			)}
		</div>
	);
}
