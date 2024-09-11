"use client";

import Draggable from "react-draggable";
import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { useMode } from "@/app/contexts/ModeContext";
import { useTrigger } from "@/app/contexts/TriggerContext";

export default function NavBox() {
	const [hasSubText, setHasSubText] = useState(false);
	const [isMinimized, setIsMinimized] = useState(false);
	const nodeRef = useRef(null);
	const { mode, handleModeChange } = useMode();
	const { triggerState, setTrigger } = useTrigger();
	const [message, setMessage] = useState("");
	const [navMode, setNavMode] = useState("default");

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
		setTrigger("save", "");
	};

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

		console.log("Sending data:", data);

		try {
			const response = await fetch("/api/single", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(data),
			});

			if (response.ok) {
				const responseData = await response.json();
				console.log("Text created successfully:", responseData);
				setMessage("등록 완료 되었습니다.");
				alert("Text created successfully!");
			} else {
				const errorData = await response.json();
				console.error("Error creating text:", errorData);
				setMessage("등록 실패했습니다.");
				alert("Failed to create text.");
			}
		} catch (error) {
			console.error("An error occurred:", error);
			alert("An error occurred while creating the text.");
		}
	};

	const handleNavMode = () => {
		setNavMode((prev) => (prev === "default" ? "view" : "default"));
	};

	const triggerRefresh = () => {
		setTrigger("refresh", "");
	};

	return (
		<Draggable
			nodeRef={nodeRef}
			bounds="#edit-page"
			defaultPosition={{ x: 0, y: 0 }}
		>
			<div
				ref={nodeRef}
				className="fixed w-nav-width z-[99] cursor-move h-fit flex flex-col gap-2 opacity-70 text-black"
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
									<input type="checkbox" id="sub-text-visibility"></input>
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
									텍스트를 수정 중입니다.
								</label>
							</>
						))}
				</div>
			</div>
		</Draggable>
	);
}
