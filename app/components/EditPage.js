"use client";
import { useEffect, useState, useCallback } from "react";
import DraggableTextGroup from "./DraggableTextGroup";
import { debounce } from "../utils/tools";
import { useTrigger } from "../contexts/TriggerContext";
import { apiRequest } from "../utils/tools";
import { useRouter } from "next/navigation";
import { useLastText } from "../contexts/LastTextContext";

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
	const { triggerState, setTrigger } = useTrigger();
	const [initialLoad, setInitialLoad] = useState(true);
	const { lastText, setLastText } = useLastText();
	const router = useRouter();

	const loadTexts = async () => {
		const data = await fetchTexts();
		setTexts(data);
		setInitialLoad(true);
	};

	useEffect(() => {
		loadTexts();
	}, []);

	useEffect(() => {
		// 기기 너비가 바뀔 때 마다 가로 100%로 유지하기 위해 스케일 조정
		const handleResize = debounce(() => {
			const windowWidth = window.innerWidth;
			const baseWidth = 1920;
			console.log("Window Width:", windowWidth);
			setScale(windowWidth < baseWidth ? windowWidth / baseWidth : 1);
		}, 100);

		handleResize();
		window.addEventListener("resize", handleResize);

		return () => {
			window.removeEventListener("resize", handleResize);
		};
	}, []);

	useEffect(() => {
		const handleOutsideClick = (e) => {
			if (
				!e.target.closest(".drag-text-group") &&
				!e.target.closest(".nav-edit")
			) {
				setLastText(null);
			}
		};

		document.addEventListener("click", handleOutsideClick);

		return () => {
			document.removeEventListener("click", handleOutsideClick);
		};
	}, []);

	useEffect(() => {
		// 첫 로드시에 모든 서브 텍스트를 숨김처리
		if (initialLoad && texts.length > 0) {
			setTrigger("loaded", "데이터 로드 완료");
			setSubTextVisibility(
				Object.fromEntries(texts.map((text) => [text.uid, false]))
			);
			setInitialLoad(false);
		}
	}, [texts, initialLoad]);

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

	// const handleUpdateText = useCallback((uid, updatedText) => {
	// 	setTexts((prevTexts) =>
	// 		prevTexts.map((text) => {
	// 			if (text.uid === uid) {
	// 				return updatedText;
	// 			}

	// 			if (text.subText && text.subText.uid === uid) {
	// 				return {
	// 					...text,
	// 					subText: {
	// 						...text.subText,
	// 						text: updatedText.text,
	// 					},
	// 				};
	// 			}
	// 			return text;
	// 		})
	// 	);
	// }, []);

	useEffect(() => {
		if (lastText?.uid) {
			setTexts((prevTexts) => {
				const textIndex = prevTexts.findIndex(
					(text) =>
						text.uid === lastText.uid ||
						(text.subText && text.subText.uid === lastText.uid)
				);

				if (textIndex === -1) return prevTexts;

				const updatedTexts = [...prevTexts];

				if (updatedTexts[textIndex].uid === lastText.uid) {
					updatedTexts[textIndex] = {
						...updatedTexts[textIndex],
						position: {
							x: lastText.x,
							y: lastText.y,
						},
						rotation: lastText.rotation,
						text: lastText.text,
					};
				} else if (updatedTexts[textIndex].subText?.uid === lastText.uid) {
					updatedTexts[textIndex] = {
						...updatedTexts[textIndex],
						subText: {
							...updatedTexts[textIndex].subText,
							position: {
								x: lastText.x,
								y: lastText.y,
							},
							rotation: lastText.rotation,
							text: lastText.text,
							background_color: lastText?.background_color || "dark",
						},
					};
				}

				return updatedTexts;
			});
		}
	}, [lastText]);

	const handleSavePositions = async () => {
		try {
			const updatedTexts = texts.map((text) => ({
				uid: text.uid,
				position: text.position,
				text: text.text,
				subText: text.subText
					? {
							uid: text.subText.uid,
							position: text.subText.position,
							rotation: text.subText.rotation,
							text: text.subText.text,
							background_color: text.subText.background_color,
					  }
					: null,
			}));

			const response = await apiRequest("/api/texts", "POST", { updatedTexts });
			setTrigger("saved", "저장 완료 되었습니다.");
			alert("저장 완료 되었습니다.");
		} catch (error) {
			console.error("Error saving positions:", error);
			setTrigger("error", "저장 실패했습니다.");
			const confirmed = confirm(
				"저장 실패: 인증을 다시 시도해주세요. 로그인 페이지로 이동하시겠습니까?"
			);
			if (confirmed) {
				router.push("/login");
			}
		}
	};

	useEffect(() => {
		const triggerActions = {
			save: () => handleSavePositions(),
			refresh: () => {
				loadTexts(); //초기화시 텍스트 다시 불러오기
				setTrigger("refreshed", "새로고침 중 입니다");
			},
			visible: () => {
				setSubTextVisibility((prevVisibility) =>
					Object.fromEntries(
						Object.keys(prevVisibility).map((key) => [key, true])
					)
				);
				setTrigger("", "");
			},
			hide: () => {
				setSubTextVisibility((prevVisibility) =>
					Object.fromEntries(
						Object.keys(prevVisibility).map((key) => [key, false])
					)
				);
				setTrigger("", "");
			},
			shiftLeft: () => {
				setTexts((prevTexts) =>
					prevTexts.map((text) => ({
						...text,
						position: {
							...text.position,
							x: text.position.x - parseInt(triggerState.message),
						},
					}))
				);
				setTrigger("", "");
			},
			shiftRight: () => {
				setTexts((prevTexts) =>
					prevTexts.map((text) => ({
						...text,
						position: {
							...text.position,
							x: text.position.x + parseInt(triggerState.message),
						},
					}))
				);
				setTrigger("", "");
			},
		};

		if (triggerState?.trigger && triggerActions[triggerState.trigger]) {
			triggerActions[triggerState.trigger]();
		}
	}, [triggerState?.trigger, loadTexts, setTrigger, handleSavePositions]);

	return (
		<div
			id="edit-canvas"
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
							onMainTextClick={handleMainTextClick}
							onUpdateText={handleUpdateText}
						/>
					))}
			</div>
		</div>
	);
}
