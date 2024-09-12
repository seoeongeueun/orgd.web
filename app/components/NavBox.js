"use client";

import Draggable from "react-draggable";
import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { useMode } from "@/app/contexts/ModeContext";
import { useTrigger } from "@/app/contexts/TriggerContext";
import { apiRequest } from "../utils/tools";

const fetchSettings = async () => {
	const settings = await apiRequest("/api/settings");
	console.log("Settings fetched successfully:", settings);
	return settings;
};

const updateSettings = async (data) => {
	const response = await apiRequest("/api/settings", "PUT", {
		fontSize: data,
	});
	console.log("Settings updated successfully:", response);
};

export default function NavBox({ setFontSizes, fontSizes }) {
	const [hasSubText, setHasSubText] = useState(false);
	const [isMinimized, setIsMinimized] = useState(false);
	const { mode, handleModeChange } = useMode();
	const { triggerState, setTrigger } = useTrigger();
	const [message, setMessage] = useState("");
	const [navMode, setNavMode] = useState("view");
	const [shiftLeft, setShiftLeft] = useState(false);
	const [shiftValue, setShiftValue] = useState(0);
	const [ogFontSizes, setOgFontSizes] = useState({
		default: "5px",
		sub: "6px",
	});
	const nodeRef = useRef(null);

	useEffect(() => {
		const loadSettings = async () => {
			const data = await fetchSettings();
			const fontSizes = data[0].fontSize;
			setFontSizes(fontSizes);
			setOgFontSizes({
				default: parseInt(fontSizes.default.replace("px", "")),
				sub: parseInt(fontSizes.sub.replace("px", "")),
			});
		};
		loadSettings();
	}, []);

	useEffect(() => {
		if (triggerState?.message) {
			setMessage(triggerState?.message);

			setTimeout(() => {
				setMessage("");
			}, 4000);
		}
	}, [triggerState?.message]);

	//설정 모드가 바뀌면 최소화 상태를 해제
	useEffect(() => {
		setIsMinimized(false);
	}, [navMode]);

	const triggerSaveState = () => {
		setTrigger("save", "저장 중입니다....");
		if (
			ogFontSizes.default !== fontSizes.default ||
			ogFontSizes.sub !== fontSizes.sub
		) {
			console.log(fontSizes);
			updateSettings({ ...fontSizes });
		}
	};

	// 신규 텍스트 등록시
	const handleSubmit = async (e) => {
		e.preventDefault();

		const mainText = document.getElementById("main-text-info").value;
		const positionX =
			parseInt(document.getElementById("position-x").value) || 0;
		const positionY =
			parseInt(document.getElementById("position-y").value) || 0;
		const subText = document.getElementById("sub-text-info")?.value;
		const subTextColor = document.querySelector(
			'input[name="sub-text-color"]:checked'
		)?.value;

		const hasSubText = subText !== undefined && subText !== "";

		const data = {
			text: mainText,
			position: { x: positionX, y: positionY },
			subText: hasSubText ? subText : null,
			subTextColor: hasSubText ? subTextColor : null,
		};

		try {
			const responseData = await apiRequest("/api/single", "POST", data);
			console.log("Text created successfully:", responseData);
			setMessage("등록 완료 되었습니다.");
			setTrigger("refresh", "");
		} catch (error) {
			console.error("Error creating text:", error);
			setMessage("등록 실패했습니다.");
			alert("Failed to create text.");
		}
	};

	const handleNavMode = () => {
		setNavMode((prev) => (prev === "default" ? "view" : "default"));
	};

	const triggerRefresh = () => {
		setTrigger("refresh", "");
	};

	const triggerVisibility = (e) => {
		if (e.target.checked) setTrigger("visible", "");
		else setTrigger("hide", "");
	};

	const handleFontSizeChange = (e, type) => {
		const value = Math.max(0, parseInt(e.target.value, 10) || 0);
		setFontSizes((prev) => ({ ...prev, [type]: value + "px" }));
	};

	const triggerShift = (e) => {
		const newShiftValue = e.target.value;
		const delta = newShiftValue - shiftValue;

		setShiftValue(newShiftValue);

		const direction =
			delta > 0 ? (shiftLeft ? "Left" : "Right") : shiftLeft ? "Right" : "Left";
		setTrigger(`shift${direction}`, Math.abs(delta));
	};

	//방향이 바뀌면 텍스트 이동 값 초기화
	useEffect(() => {
		const oppDirection = shiftLeft ? "Left" : "Right";
		setTrigger(`shift${oppDirection}`, shiftValue);
		setShiftValue(0);
		const value = document.getElementById("shift-px");
		if (value) value.value = 0;
	}, [shiftLeft]);

	return (
		<Draggable
			nodeRef={nodeRef}
			bounds="#edit-page"
			defaultPosition={{ x: 20, y: 20 }}
		>
			<div
				ref={nodeRef}
				className="fixed w-nav-width z-[99] cursor-move h-fit flex flex-col gap-2 opacity-80 text-black"
			>
				<div className="flex flex-row justify-between items-center text-sm">
					<div className="flex flex-row gap-1">
						<button
							className="bg-theme-gray px-2 rounded-sm"
							onClick={() => handleModeChange(mode === "main" ? "sub" : "main")}
						>
							{mode === "main" ? "메인" : "해설"}
						</button>
						수정 중...
					</div>
					{message && (
						<span
							className={`${
								triggerState?.trigger === "error" && "text-red-500"
							}`}
						>
							{message}
						</span>
					)}
				</div>
				<div
					className={`h-fit flex flex-col gap-4 justify-start px-4 ${
						isMinimized ? "py-2" : "py-4"
					} border border-theme-gray rounded-md bg-white text-black`}
				>
					<div className="flex flex-row justify-end items-center gap-2">
						<h1 className="text-xl mr-auto" onClick={handleNavMode}>
							{navMode === "default" ? "텍스트 등록" : "뷰 설정"}
						</h1>
						<div className="flex flex-row justify-between items-center gap-2">
							<button
								type="button"
								className="nav-input"
								onClick={triggerRefresh}
							>
								초기화
							</button>
							<button
								type="button"
								className="nav-input"
								onClick={triggerSaveState}
							>
								저장
							</button>
						</div>
						<button onClick={() => setIsMinimized((prev) => !prev)}>
							<Image
								src="/icons/minimize.svg"
								width={14}
								height={14}
								alt="최소화"
								className="pointer-events-none"
							/>
						</button>
					</div>
					{!isMinimized &&
						(navMode === "default" ? (
							<>
								<label className="flex flex-col items-start">
									<span className="block">메인 텍스트</span>
									<input
										type="text"
										id="main-text-info"
										className="nav-input mt-px w-full"
										placeholder="메인 텍스트 내용"
									/>
								</label>
								<label>
									텍스트 좌표 (x, y)
									<div className="flex flex-row gap-2">
										<input
											type="number"
											id="position-x"
											className="nav-input mt-px w-16"
											defaultValue={0}
										></input>
										<input
											type="number"
											id="position-y"
											className="nav-input mt-px w-16"
											defaultValue={0}
										></input>
									</div>
								</label>
								<label className="flex flex-row items-center gap-2">
									해설이 있나요?
									<input
										type="checkbox"
										id="has-sub-text"
										onChange={(e) => setHasSubText(e.target.checked)}
									></input>
								</label>
								{hasSubText && (
									<div className="flex flex-col gap-4">
										<label>
											해설 텍스트
											<input
												type="text"
												id="sub-text-info"
												className="nav-input mt-px w-full"
												placeholder="해설 내용"
											></input>
										</label>
										<label>
											해설 배경 컬러
											<div className="flex flex-row gap-2 items-center mt-px">
												<input
													type="radio"
													id="sub-dark"
													name="sub-text-color"
													value="dark"
												/>
												<label htmlFor="sub-dark" className="mr-4">
													다크
												</label>
												<input
													type="radio"
													id="sub-light"
													name="sub-text-color"
													value="light"
												/>
												<label htmlFor="sub-light">라이트</label>
											</div>
										</label>
									</div>
								)}
								<button
									type="submit"
									className="btn-gray w-full"
									onClick={handleSubmit}
								>
									등록
								</button>
							</>
						) : (
							<>
								<label className="flex flex-row items-center gap-2">
									모든 해설 보이기
									<input
										type="checkbox"
										id="sub-text-visibility"
										disabled={mode === "sub"}
										onChange={(e) => triggerVisibility(e)}
									></input>
								</label>
								<label className="flex flex-row items-center gap-2">
									현재
									<button
										className="nav-input px-2 rounded-sm"
										onClick={() =>
											handleModeChange(mode === "main" ? "sub" : "main")
										}
									>
										{mode === "main" ? "메인" : "해설"}
									</button>
									텍스트를 수정 중입니다
								</label>
								<label>
									기본 폰트 크기
									<input
										type="number"
										id="font-size"
										className="nav-input mt-px w-16 ml-2"
										defaultValue={ogFontSizes.default}
										onChange={(e) => handleFontSizeChange(e, "default")}
									></input>
								</label>
								<label>
									해설 폰트 크기
									<input
										type="number"
										id="sub-font-size"
										className="nav-input mt-px w-16 ml-2"
										defaultValue={ogFontSizes.sub}
										onChange={(e) => handleFontSizeChange(e, "sub")}
									></input>
								</label>
								<label className="flex flex-row items-center gap-2 whitespace-nowrap">
									모든 텍스트를
									<button
										className="nav-input px-2 rounded-sm"
										onClick={() => setShiftLeft((prev) => !prev)}
									>
										{shiftLeft ? "왼쪽" : "오른쪽"}
									</button>
									으로
									<input
										type="number"
										id="shift-px"
										className="nav-input w-14"
										defaultValue={0}
										min={0}
										onChange={(e) => triggerShift(e)}
									></input>
									px
								</label>
							</>
						))}
				</div>
			</div>
		</Draggable>
	);
}
