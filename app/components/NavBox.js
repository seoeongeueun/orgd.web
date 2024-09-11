import Draggable from "react-draggable";
import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { useMode } from "@/app/contexts/ModeContext";

export default function NavBox() {
	const [hasSubText, setHasSubText] = useState(false);
	const [isMinimized, setIsMinimized] = useState(false);
	const nodeRef = useRef(null);
	const { mode, handleModeChange } = useMode();

	return (
		<Draggable
			nodeRef={nodeRef}
			bounds="#edit-page"
			defaultPosition={{ x: 0, y: 0 }}
		>
			<div
				ref={nodeRef}
				className="fixed w-nav-width z-[99] cursor-move h-fit flex flex-col gap-4 opacity-70 text-black"
			>
				<div className="-my-2 self-start flex flex-row items-center gap-1 text-xs">
					<div className="bg-theme-gray px-2 rounded-sm">
						{mode.toUpperCase()}
					</div>
					수정 중...
				</div>
				<div
					className={`h-fit flex flex-col gap-4 justify-start px-4 ${
						isMinimized ? "py-2" : "py-4"
					} border border-theme-gray rounded-md bg-white text-black`}
				>
					<div className="flex flex-row justify-end items-center gap-2">
						<h1 className="text-xl mr-auto">설정</h1>
						<div className="flex flex-row justify-between items-center gap-2">
							<button type="button" className="nav-input">
								초기화
							</button>
							<button type="button" className="nav-input">
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
					{!isMinimized && (
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
								서브 텍스트가 있나요?
								<input
									type="checkbox"
									id="has-sub-text"
									onChange={(e) => setHasSubText(e.target.checked)}
								></input>
							</label>
							{hasSubText && (
								<div className="flex flex-col gap-4">
									<label>
										서브 텍스트
										<input
											type="text"
											id="sub-text-info"
											className="nav-input mt-px w-full"
											placeholder="서브 텍스트 내용"
										></input>
									</label>
									<label>
										서브 텍스트 컬러
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
							<button type="submit" className="btn-gray w-full">
								등록
							</button>
						</>
					)}
				</div>
			</div>
		</Draggable>
	);
}
