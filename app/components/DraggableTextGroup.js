import Draggable from "react-draggable";
import { useRef, useState, useCallback, useMemo, useEffect } from "react";
import { useMode } from "@/app/contexts/ModeContext";
import { throttle } from "../utils/tools";
import InputBox from "./InputBox";
import { useTrigger } from "@/app/contexts/TriggerContext";
import { useLastText } from "@/app/contexts/LastTextContext";

export default function DraggableTextGroup({
	mainText,
	subText = null,
	isVisible,
	onMainTextClick,
	scale,
	onUpdateText,
}) {
	const [isDragging, setIsDragging] = useState(false);
	const [deltaPosition, setDeltaPosition] = useState({
		x: mainText.position?.x || 0,
		y: mainText.position?.y || 0,
	});
	const [subTextPosition, setSubTextPosition] = useState({
		x: subText?.position?.x || 0,
		y: subText?.position?.y || 0,
	});
	const [isRotating, setIsRotating] = useState(false);

	const { mode } = useMode();
	const { lastText, setLastText } = useLastText();
	const { triggerState, setTrigger } = useTrigger();

	const nodeRef = useRef(null);
	const subNodeRef = useRef(null);

	useEffect(() => {
		setDeltaPosition({
			x: mainText.position?.x || 0,
			y: mainText.position?.y || 0,
		});
	}, [mainText.position]);

	useEffect(() => {
		setSubTextPosition({
			x: subText?.position?.x || 0,
			y: subText?.position?.y || 0,
		});
	}, [subText?.position]);

	//회전 값의 범위를 -180도 ~ 180도로 정규화
	const normalizeRotation = (rotation) =>
		((((rotation + 180) % 360) + 360) % 360) - 180;

	//드래그 시작시 lastText에 현재 텍스트의 uid와 정보를 저장
	const handleDragStart = useCallback(() => {
		const targetText = mode === "main" ? mainText : subText;
		if (lastText?.uid !== targetText?.uid) {
			updateLastText();
		}
	}, [lastText, mainText, subText, mode]);

	// 드래그 중일 때 텍스트의 위치와 (해설 텍스트인 경우) 회전값을 변경
	const handleDrag = useCallback(
		throttle((e, data) => {
			const isMainMode = mode === "main";
			const currentPosition = isMainMode ? deltaPosition : subTextPosition;
			const deltaX = data.x - currentPosition.x;
			const deltaY = data.y - currentPosition.y;

			if (!isDragging) {
				setIsDragging(true);
			}
			// 메인 텍스트를 드래그할 때 이동한 값만큼 서브 텍스트도 같이 이동
			if (isMainMode) {
				setDeltaPosition({ x: data.x, y: data.y });
				setSubTextPosition((prev) => ({
					x: prev.x + deltaX,
					y: prev.y + deltaY,
				}));
				subText.position = {
					x: subTextPosition.x + deltaX,
					y: subTextPosition.y + deltaY,
				};
				// 마지막으로 수정한 텍스트의 정보를 저장 (이동 수치 값을 표시하기 위함)
				setLastText((prev) => ({
					...prev,
					x: data.x,
					y: data.y,
				}));
			} else {
				if (isRotating) {
					// 텍스트를 이동 시키는 대신 마우스 이동 값으로 회전 값을 계산해서 반영
					const deltaRotation = (deltaX + deltaY) / 50;
					const newRotation = normalizeRotation(
						subText.rotation + deltaRotation
					);
					if (newRotation !== subText.rotation) {
						subText.rotation = newRotation;

						setLastText((prev) => ({
							...prev,
							rotation: newRotation,
						}));
					}
				} else {
					setSubTextPosition({ x: data.x, y: data.y });
					setLastText((prev) => ({
						...prev,
						x: data.x,
						y: data.y,
					}));
				}
			}
		}, 50),
		[mode, deltaPosition, subTextPosition, setLastText]
	);

	const handleDragStop = useCallback(() => {
		setLastText((prev) => ({
			...prev,
			x: mode === "main" ? deltaPosition.x : subTextPosition.x,
			y: mode === "main" ? deltaPosition.y : subTextPosition.y,
		}));

		setTimeout(() => setIsDragging(false), 0);
	}, [mode, deltaPosition, subTextPosition, setLastText]);

	// 모드가 바뀌면 드래그 상태를 초기화
	useEffect(() => {
		setIsDragging(false);
	}, [mode]);

	const updateLastText = () => {
		const targetText = mode === "main" ? mainText : subText;
		if (targetText) {
			setLastText({
				uid: targetText.uid,
				x: targetText.position.x,
				y: targetText.position.y,
				text: targetText.text,
				rotation: targetText?.rotation || 0,
				background_color: targetText?.background_color || "dark",
			});
		}
	};

	// 텍스트 클릭시 lastText에 현재 텍스트의 정보를 저장하고 메인 텍스트일 경우 메인 텍스트 클릭 이벤트 발생
	const handleClick = useCallback(
		(e) => {
			if (isDragging) {
				e.preventDefault();
			} else {
				if (lastText?.uid === mainText?.uid) onMainTextClick(mainText.uid);
				updateLastText();
			}
		},
		[isDragging, onMainTextClick, mainText, subText, mode]
	);

	// 수동으로 숫자를 변경해서 텍스트의 위치를 변경할 때
	const handleManualPositionChange = (e, field) => {
		e.stopPropagation();
		const value = Math.max(
			0,
			Math.min(parseInt(e.target.value, 10) || 0, field === "x" ? 1920 : 1080)
		);

		if (mode === "main") {
			setDeltaPosition((prev) => ({ ...prev, [field]: value }));
		} else {
			setSubTextPosition((prev) => ({ ...prev, [field]: value }));
		}

		setLastText((prev) => ({ ...prev, [field]: value }));
	};

	// 수동으로 숫자를 변경해서 텍스트의 회전값을 변경할 때
	const handleManualRotationChange = (e) => {
		const value = parseInt(e.target.value, 10) || 0;
		const normalizedValue = normalizeRotation(value);
		subText.rotation = normalizedValue;
		setLastText((prev) => ({ ...prev, rotation: normalizedValue }));
	};

	// 해설 텍스트 관련 스타일
	const subTextStyle = useMemo(
		() => ({
			transform: `rotate(${subText?.rotation || 0}deg)`,
			left: subTextPosition?.x,
			top: subTextPosition?.y,
		}),
		[subText?.rotation, subTextPosition]
	);

	const handleSingleChange = (e) => {
		if (mode === "main")
			onUpdateText(mainText.uid, {
				...mainText,
				text: e.target.value,
			});
		else {
			onUpdateText(mainText.uid, {
				...mainText,
				subText: {
					...subText,
					text: e.target.value,
				},
			});
			subText.text = e.target.value;
		}
	};

	if (mode === "main")
		return (
			<>
				<Draggable
					bounds="parent"
					nodeRef={nodeRef}
					disabled={mode !== "main"}
					position={{ x: deltaPosition?.x, y: deltaPosition?.y }}
					scale={scale}
					handle=".text-main"
					onStart={handleDragStart}
					onDrag={handleDrag}
					onStop={handleDragStop}
				>
					<div
						ref={nodeRef}
						className="absolute w-fit text-center h-fit p-0 m-0 drag-text-group whitespace-nowrap"
					>
						<div
							className={`text-main ${
								mode === "main" ? "cursor-move" : "cursor-default"
							} flex flex-col-reverse`}
							onClick={handleClick}
						>
							{mainText.text}
							{lastText?.uid === mainText.uid && (
								<InputBox
									handleManualPositionChange={handleManualPositionChange}
								/>
							)}
						</div>
					</div>
				</Draggable>
				{subText && isVisible && (
					<div
						className={`absolute text-sub ${
							subText.background_color.startsWith("light")
								? "bg-sub-light"
								: "bg-sub-dark"
						}`}
						style={subTextStyle}
					>
						{subText.text}
					</div>
				)}
			</>
		);
	else {
		return (
			<>
				<p
					className={`absolute text-main text-center pointer-events-none !z-0 ${
						triggerState?.trigger !== "visible" &&
						mainText.sub_text_uid === lastText?.uid
							? "opacity-90"
							: "opacity-20"
					}`}
					style={{
						left: deltaPosition?.x,
						top: deltaPosition?.y,
					}}
				>
					{mainText.text}
				</p>
				{subText && (
					<Draggable
						bounds="#canvas"
						axis={isRotating ? "none" : "both"}
						nodeRef={subNodeRef}
						position={subTextPosition}
						scale={scale}
						onStart={handleDragStart}
						onDrag={handleDrag}
						onStop={handleDragStop}
					>
						<div ref={subNodeRef} className="absolute drag-text-group">
							{lastText?.uid === subText.uid && (
								<InputBox
									handleManualPositionChange={handleManualPositionChange}
									handleManualRotationChange={handleManualRotationChange}
									setIsRotating={setIsRotating}
									isRotating={isRotating}
									rotation={subText.rotation}
								/>
							)}
							<div
								className={`text-sub ${
									subText.background_color.startsWith("light")
										? "bg-sub-light"
										: "bg-sub-dark"
								} ${isRotating ? "cursor-alias" : "cursor-move"}`}
								style={{
									transform: `rotate(${subText.rotation || 0}deg)`,
								}}
								onClick={handleClick}
							>
								{subText.text}
							</div>
						</div>
					</Draggable>
				)}
			</>
		);
	}
}
