"use client";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import TextGroup from "./components/TextGroup";

const fetchTexts = async () => {
	const response = await fetch("/api/texts");
	const data = await response.json();
	return data;
};

const createButton = async () => {
	const response = await fetch("/api/texts", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			text: "Say something",
			position: { x: Math.random() * 1000, y: Math.random() * 1000 },
		}),
	});

	const data = await response.json();
	console.log(data);
};

const createSubText = async (mainTextId = null) => {
	const response = await fetch("/api/texts", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			text: "extra things to say",
			backgroundColor: "#ffcc00",
			position: { x: Math.random() * 1000, y: Math.random() * 1000 },
			isSubText: true,
			mainTextId,
		}),
	});

	const data = await response.json();
	console.log(data);
	return data; // Return the created subtext
};

export default function SharedPage() {
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [socket, setSocket] = useState(null);
	const [canvasState, setCanvasState] = useState({ elements: [] });
	const [otherCursors, setOtherCursors] = useState({});
	const [isMain, setIsMain] = useState(true);
	const mainIp = "172.30.1.21"; // 메인 기기의 ip 주소
	const scaleFactor = 0.2; // 줌 레벨
	const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
	const [myColor, setMyColor] = useState("");
	const [texts, setTexts] = useState([]);
	const [subTextVisibility, setSubTextVisibility] = useState({});
	const colors = [
		"red",
		"blue",
		"green",
		"yellow",
		"purple",
		"orange",
		"pink",
		"cyan",
		"magenta",
		"lime",
		"teal",
		"white",
	];

	useEffect(() => {
		let userId = localStorage.getItem("userId");
		if (!userId) {
			userId = Math.random().toString(36).substring(2);
			localStorage.setItem("userId", userId);
		}

		console.log("User ID:", userId);
		console.log("Main IP:", mainIp);

		const newSocket = io(`http://${window.location.hostname}:3000`, {
			transports: ["websocket", "polling"],
			query: { userId },
		});

		// 메인 기기인지 확인
		// fetch("/api/ip")
		// 	.then((response) => response.json())
		// 	.then((data) => {
		// 		console.log("current ip:", data.ip);
		// 		setIsMain(data.ip === mainIp);
		// 	});

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

		newSocket.on("update_view", (updatedCanvasState) => {
			setCanvasState(updatedCanvasState);
		});

		newSocket.on("existing_cursors", (cursors) => {
			setOtherCursors(cursors);
		});

		newSocket.on("cursor_update", ({ id, position }) => {
			setOtherCursors((prevCursors) => ({
				...prevCursors,
				[id]: position,
			}));
		});

		newSocket.on("cursor_remove", ({ id }) => {
			setOtherCursors((prevCursors) => {
				const newCursors = { ...prevCursors };
				delete newCursors[id];
				return newCursors;
			});
		});

		newSocket.on("open_dialog", () => {
			setIsDialogOpen(true);
			createButton();
			createSubText();
		});

		newSocket.on("is_not_host", () => {
			setIsMain(false);
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
		<div className={`${isMain ? "main" : "main"} canvas`}>
			<div id="canvas" className="w-full h-full">
				<button
					onClick={() => socket.emit("open_dialog")}
					className="text-white"
				>
					say something
				</button>
				{texts.map((text) => (
					<TextGroup
						key={text.id}
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
