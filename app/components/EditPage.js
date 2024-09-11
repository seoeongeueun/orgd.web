"use client";
import { useEffect, useState, useCallback } from "react";
import DraggableTextGroup from "./DraggableTextGroup";
import { debounce } from "../utils/tools";
import { useTrigger } from "../contexts/TriggerContext";

const fetchTexts = async () => {
	const response = await fetch("/api/texts");
	const data = await response.json();
	return data;
};

// edit mode인 경우 소켓 통신 x
export default function EditPage() {
	const [isMain, setIsMain] = useState(true);
	const [texts, setTexts] = useState([]);
	const [subTextVisibility, setSubTextVisibility] = useState({});
	const [scale, setScale] = useState(1);
	const [lastModified, setLastModified] = useState(null);
	const { triggerState, setTrigger } = useTrigger();

	const loadTexts = async () => {
		const data = await fetchTexts();
		setTexts(data);
	};

	useEffect(() => {
		loadTexts();
	}, []);

	useEffect(() => {
		// 기기 너비가 바뀔 때 마다 가로 100%로 유지하기 위해 스케일 조정
		const handleResize = debounce(() => {
			//const windowWidth = window.innerWidth;
			const windowWidth = document.body.clientWidth;
			const baseWidth = 1920;
			setScale(windowWidth < baseWidth ? windowWidth / baseWidth : 1);
		}, 100);

		handleResize();
		window.addEventListener("resize", handleResize);

		return () => {
			window.removeEventListener("resize", handleResize);
		};
	}, []);

	useEffect(() => {
		//모든 서브텍스트는 처음에는 보이지 않도록 설정
		if (texts.length > 0) {
			setSubTextVisibility(
				Object.fromEntries(texts.map((text) => [text.uid, false]))
			);
		}
	}, [texts]);

	useEffect(() => {
		if (triggerState?.trigger === "save") {
			handleSavePositions();
		} else if (triggerState?.trigger === "refresh") {
			loadTexts(); // 텍스트 데이터 다시 불러오기
			setTrigger("refreshed", "새로고침 되었습니다");
		}
	}, [triggerState?.trigger]);

	const handleMainTextClick = useCallback((mainTextId) => {
		setSubTextVisibility((prevVisibility) => ({
			...prevVisibility,
			[mainTextId]: !prevVisibility[mainTextId],
		}));
	}, []);

	const handleUpdateText = useCallback((uid, updatedText) => {
		setTexts((prevTexts) =>
			prevTexts.map((text) => (text.uid === uid ? updatedText : text))
		);
	}, []);

	const handleSavePositions = async () => {
		try {
			const updatedTexts = texts.map((text) => ({
				uid: text.uid,
				position: text.position,
				subText: text.subText
					? {
							uid: text.subText.uid,
							position: text.subText.position,
							rotation: text.subText.rotation,
					  }
					: null,
			}));

			const response = await fetch("/api/texts", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ updatedTexts }),
			});

			if (!response.ok) {
				throw new Error("Failed to save positions");
			}
			setTrigger("saved", "저장 완료 되었습니다.");
		} catch (error) {
			console.error("Error saving positions:", error);
			setTrigger("error", "저장 실패했습니다.");
			alert("Failed to save positions");
		}
	};

	return (
		<div
			className="canvas bg-white text-black"
			style={{
				width: "1920px",
				height: "1080px",
				transform: `scale(${scale})`,
				transformOrigin: "top left",
				margin: "0 auto",
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
							onUpdateText={handleUpdateText}
						/>
					))}
			</div>
		</div>
	);
}
