import Draggable from "react-draggable";
import { useRef, useState, useCallback, useMemo, useEffect } from "react";
import { useMode } from "@/app/contexts/ModeContext";
import { throttle } from "../utils/tools";
import InputBox from "./InputBox";
import { useTrigger } from "@/app/contexts/TriggerContext";

export default function DraggableTextGroup({
	mainText,
	subText = null,
	isVisible,
	onMainTextClick,
	scale,
	lastModified,
	setLastModified,
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

	const handleDragStart = useCallback(
		throttle((e, data) => {
			const deltaX =
				data.x - (mode === "main" ? deltaPosition.x : subTextPosition.x);
			const deltaY =
				data.y - (mode === "main" ? deltaPosition.y : subTextPosition.y);

			if (!isDragging) setIsDragging(true);

			// 메인 텍스트를 드래그할 때 이동한 값만큼 서브 텍스트도 같이 이동
			if (mode === "main") {
				setDeltaPosition({ x: data.x, y: data.y });
				setSubTextPosition((prev) => ({
					x: prev.x + deltaX,
					y: prev.y + deltaY,
				}));
			} else {
				if (isRotating) {
					const deltaRotation = (deltaX + deltaY) / 50;
					const newRotation = normalizeRotation(
						subText.rotation + deltaRotation
					);
					subText.rotation = newRotation;
				} else {
					setSubTextPosition({ x: data.x, y: data.y });
				}
			}
			// 마지막으로 수정한 텍스트의 정보를 저장 (inputbox에 값을 표시하기 위함)
			setLastModified({
				uid: mode === "main" ? mainText.uid : subText.uid,
				x: data.x,
				y: data.y,
				rotation:
					mode === "main" ? mainText?.rotation || 0 : subText?.rotation || 0,
			});
		}, 50),
		[isDragging, mode, deltaPosition, subTextPosition, setLastModified]
	);

	const handleDragStop = useCallback(() => {
		setLastModified((prev) => ({
			...prev,
			x: mode === "main" ? deltaPosition.x : subTextPosition.x,
			y: mode === "main" ? deltaPosition.y : subTextPosition.y,
		}));

		onUpdateText(mainText.uid, {
			...mainText,
			position: { x: deltaPosition.x, y: deltaPosition.y },
			subText: subText
				? {
						...subText,
						position: { x: subTextPosition.x, y: subTextPosition.y },
				  }
				: null,
		});

		setTimeout(() => setIsDragging(false), 0);
	}, [mode, deltaPosition, subTextPosition, onUpdateText, setLastModified]);

	const handleClick = useCallback(
		(e) => {
			if (isDragging) {
				e.preventDefault();
			} else {
				onMainTextClick(mainText.uid);
			}
		},
		[isDragging, onMainTextClick, mainText.uid]
	);

	const handleManualPositionChange = (e, field) => {
		const value = Math.max(
			0,
			Math.min(parseInt(e.target.value, 10) || 0, field === "x" ? 1920 : 1080)
		);

		if (mode === "main") {
			setDeltaPosition((prev) => ({ ...prev, [field]: value }));
		} else {
			setSubTextPosition((prev) => ({ ...prev, [field]: value }));
		}

		setLastModified((prev) => ({ ...prev, [field]: value }));
	};

	const handleManualRotationChange = (e) => {
		const value = parseInt(e.target.value, 10) || 0;
		const normalizedValue = normalizeRotation(value);
		subText.rotation = normalizedValue;
		setLastModified((prev) => ({ ...prev, rotation: normalizedValue }));
	};

	const subTextStyle = useMemo(
		() => ({
			transform: `rotate(${subText?.rotation || 0}deg)`,
			left: subTextPosition?.x,
			top: subTextPosition?.y,
		}),
		[subText?.rotation, subTextPosition]
	);

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
					onDrag={handleDragStart}
					onStop={handleDragStop}
				>
					<div
						ref={nodeRef}
						className="absolute w-fit h-fit p-0 m-0 drag-text-group"
					>
						<div
							className={`text-main whitespace-nowrap ${
								mode === "main" ? "cursor-move" : "cursor-default"
							} flex flex-col-reverse`}
							onClick={handleClick}
						>
							{mainText.text}
							{lastModified?.uid === mainText.uid && (
								<InputBox
									handleManualPositionChange={handleManualPositionChange}
									lastModified={lastModified}
									setLastModified={setLastModified}
								/>
							)}
						</div>
					</div>
				</Draggable>
				{subText && isVisible && (
					<div
						className={`absolute text-sub whitespace-nowrap ${
							subText.background_color === "lightgray"
								? "bg-gray-300"
								: "bg-black"
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
					className={`absolute ${
						triggerState?.trigger !== "visible" &&
						mainText.sub_text_uid === lastModified?.uid
							? "opacity-90"
							: "opacity-20"
					} text-main`}
					style={{ left: deltaPosition?.x, top: deltaPosition?.y }}
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
						onDrag={handleDragStart}
						onStop={handleDragStop}
					>
						<div ref={subNodeRef} className="absolute drag-text-group">
							{lastModified?.uid === subText.uid && (
								<InputBox
									handleManualPositionChange={handleManualPositionChange}
									handleManualRotationChange={handleManualRotationChange}
									setIsRotating={setIsRotating}
									isRotating={isRotating}
									lastModified={lastModified}
									setLastModified={setLastModified}
									rotation={subText.rotation}
								/>
							)}

							{isRotating && (
								<div className="absolute flex flex-row text-main ml-auto bottom-8 right-0 z-[99] opacity-80"></div>
							)}
							<div
								className="w-fit h-fit text-sub text-white bg-black cursor-move"
								style={{
									transform: `rotate(${subText.rotation || 0}deg)`,
								}}
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
