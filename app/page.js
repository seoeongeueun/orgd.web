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

	useEffect(() => {
		let userId = localStorage.getItem("userId");
		if (!userId) {
			userId = Math.random().toString(36).substring(2);
			localStorage.setItem("userId", userId);
		}

		console.log("User ID:", userId);
		console.log("Main IP:", mainIp);

		fetchIp().then((data) => {
			setIsMain(data === mainIp || data === "localhost");
		});

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
	// 		const maxScrollLeft =
	// 			document.documentElement.scrollWidth - window.innerWidth;
	// 		const maxScrollTop =
	// 			document.documentElement.scrollHeight - window.innerHeight;

	// 		if (maxScrollLeft > 0 || maxScrollTop > 0) {
	// 			const randomScrollLeft = Math.random() * maxScrollLeft;
	// 			const randomScrollTop = Math.random() * maxScrollTop;

	// 			window.scrollTo({
	// 				left: randomScrollLeft,
	// 				top: randomScrollTop,
	// 				behavior: "instant",
	// 			});
	// 		}
	// 	}
	// }, [isMain]);

	const handleMainTextClick = (mainTextId) => {
		const newVisibility = !subTextVisibility[mainTextId];
		socket.emit("show_subtext", { mainTextId, subtextVisible: newVisibility });

		setSubTextVisibility((prevVisibility) => ({
			...prevVisibility,
			[mainTextId]: newVisibility,
		}));
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
			</div>
		</div>
	);
}
