"use client";
import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import TextGroup from "./TextGroup";
import DraggableTextGroup from "./DraggableTextGroup";
import Draggable from "react-draggable";

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
export default function EditPage() {
	const [isMain, setIsMain] = useState(true);
	const [texts, setTexts] = useState([]);
	const [subTextVisibility, setSubTextVisibility] = useState({});
	const [scale, setScale] = useState(1);
	const [lastModified, setLastModified] = useState(null);

	useEffect(() => {
		const loadTexts = async () => {
			const data = await fetchTexts();
			setTexts(data);
		};
		loadTexts();

		const handleResize = () => {
			const windowWidth = window.innerWidth;
			const windowHeight = window.innerHeight;

			// The aspect ratio is 1920 / 1080 = 16 / 9
			const baseWidth = 1920;

			if (windowWidth < baseWidth) {
				const scaleFactorWidth = windowWidth / baseWidth;
				setScale(scaleFactorWidth);
			} else {
				setScale(1);
			}
		};
		handleResize();
		window.addEventListener("resize", handleResize);

		return () => {
			window.removeEventListener("resize", handleResize);
		};
	}, []);

	useEffect(() => {
		if (texts.length > 0) {
			setSubTextVisibility(
				Object.fromEntries(texts.map((text) => [text.uid, false]))
			);
		}
	}, [texts]);

	const handleMainTextClick = (mainTextId) => {
		const newVisibility = !subTextVisibility[mainTextId];

		setSubTextVisibility((prevVisibility) => ({
			...prevVisibility,
			[mainTextId]: newVisibility,
		}));
	};

	return (
		<div
			className="canvas bg-white text-black"
			style={{
				width: "1920px",
				height: "1080px",
				transform: `scale(${scale})`, // Scales the canvas
				transformOrigin: "top left",
				margin: "0 auto", // Center it horizontally
				position: "relative",
			}}
		>
			<div id="canvas" className="w-full aspect-video">
				{texts?.length > 0 &&
					texts.map((text, index) => (
						<DraggableTextGroup
							key={text.uid}
							mainText={text}
							scale={scale || 1}
							subText={text?.subText}
							isVisible={subTextVisibility[text.uid]}
							lastModified={lastModified}
							setLastModified={setLastModified}
							onMainTextClick={handleMainTextClick}
						/>
					))}
			</div>
		</div>
	);
}
