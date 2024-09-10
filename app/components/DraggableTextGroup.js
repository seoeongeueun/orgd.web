import Draggable from "react-draggable";
import { useRef, useState } from "react";
import { useMode } from "@/app/contexts/ModeContext";
import { set } from "mongoose";

export default function DraggableTextGroup({
	mainText,
	subText = null,
	isVisible,
	onMainTextClick,
	scale,
	lastModified,
	setLastModified,
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
	const { mode } = useMode();
	const nodeRef = useRef(null);
	const subNodeRef = useRef(null);

	const handleDragStart = (e, data) => {
		if (!isDragging) setIsDragging(true);
		let isMain = true;
		if (mode === "main") {
			setDeltaPosition({
				x: data.x,
				y: data.y,
			});
		} else {
			isMain = false;
			setSubTextPosition({
				x: data.x,
				y: data.y,
			});
		}
		setLastModified({
			uid: isMain ? mainText.uid : subText.uid,
			x: data.x,
			y: data.y,
			rotation: isMain ? mainText?.rotation || 0 : subText?.rotation || 0,
		}); // 마지막으로 수정한 텍스트의 정보를 저장
	};

	const handleDragStop = () => {
		// mainText.position = {
		// 	x: deltaPosition.x,
		// 	y: deltaPosition.y,
		// };
		if (mode === "main") {
			setLastModified({
				...lastModified,
				x: deltaPosition.x,
				y: deltaPosition.y,
			});
		} else {
			setLastModified({
				...lastModified,
				x: subTextPosition.x,
				y: subTextPosition.y,
			});
		}
		setTimeout(() => setIsDragging(false), 0);
	};

	const handleClick = (e) => {
		if (isDragging) {
			e.preventDefault();
		} else {
			onMainTextClick(mainText.uid);
		}
	};

	const handleManualPositionChange = (e, field) => {
		const value = parseInt(e.target.value, 10) || 0;
		const clampedValue =
			field === "x"
				? Math.min(Math.max(value, 0), 1920)
				: Math.min(Math.max(value, 0), 1080); // Clamp value
		if (mode === "main") {
			setDeltaPosition((prev) => ({
				...prev,
				[field]: clampedValue,
			}));
		} else {
			setSubTextPosition((prev) => ({
				...prev,
				[field]: clampedValue,
			}));
		}

		setLastModified((prev) => ({
			...prev,
			[field]: clampedValue,
		}));
	};

	if (mode === "main")
		return (
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
					className="relative w-fit h-fit p-0 m-0 flex flex-col justify-center items-center"
				>
					<div
						className={`absolute text-main whitespace-nowrap ${
							mode === "main" ? "cursor-pointer" : "cursor-default"
						} flex flex-col-reverse`}
						onClick={handleClick}
					>
						<span>{mainText.text}</span>
						{lastModified?.uid === mainText.uid && (
							<div className="ml-auto z-[99] opacity-80">
								<input
									type="number"
									value={lastModified?.x.toFixed(0)}
									onChange={(e) => handleManualPositionChange(e, "x")}
									onClick={(e) => e.stopPropagation()}
									className="w-16 input-border mr-px"
								/>
								<input
									type="number"
									value={lastModified?.y.toFixed(0)}
									onChange={(e) => handleManualPositionChange(e, "y")}
									onClick={(e) => e.stopPropagation()}
									className="w-16 input-border"
								/>
							</div>
						)}
					</div>
					{subText && isVisible && (
						<div
							ref={subNodeRef}
							className={`text-sub absolute whitespace-nowrap ${
								subText.background_color === "lightgray"
									? "bg-gray-300"
									: "bg-black"
							}`}
							style={{
								transform: `rotate(${subText.rotation || 0}deg) `,
							}}
						>
							{subText.text}
						</div>
					)}
				</div>
			</Draggable>
		);
	else {
		return (
			<div className="">
				<p
					className="absolute -translate-x-1/2 -translate-y-1/2 opacity-30 text-main"
					style={{ left: mainText.position?.x, top: mainText.position?.y }}
				>
					{mainText.text}
				</p>
				{subText && (
					<Draggable
						nodeRef={subNodeRef}
						position={subTextPosition}
						scale={scale}
						onDrag={handleDragStart}
						onStop={handleDragStop}
					>
						<div ref={subNodeRef} className="absolute">
							{lastModified?.uid === subText.uid && (
								<div className="absolute flex flex-row text-main ml-auto bottom-8 right-0 z-[99] opacity-80">
									<input
										type="number"
										value={lastModified?.x.toFixed(0)}
										onChange={(e) => handleManualPositionChange(e, "x")}
										onClick={(e) => e.stopPropagation()}
										className="w-16 input-border mr-px"
									/>
									<input
										type="number"
										value={lastModified?.y.toFixed(0)}
										onChange={(e) => handleManualPositionChange(e, "y")}
										onClick={(e) => e.stopPropagation()}
										className="w-16 input-border"
									/>
								</div>
							)}
							<div
								className="w-fit h-fit text-sub text-white bg-black"
								style={{
									transform: `rotate(${subText.rotation || 0}deg)`,
								}}
							>
								{subText.text}
							</div>
						</div>
					</Draggable>
				)}
			</div>
			// <div
			// 	className="absolute p-0 m-0 -translate-x-1/2 -translate-y-1/2 flex flex-col justify-center items-center"
			// 	style={{
			// 		left: mainText.position?.x,
			// 		top: mainText.position?.y,
			// 	}}
			// >
			// 	<p
			// 		className="absolute text-main p-0 m-0 whitespace-nowrap cursor-pointer"
			// 		onClick={() => onMainTextClick(mainText.uid)}
			// 	>
			// 		{mainText.text}
			// 	</p>
			// 	{subText && isVisible && (
			// 		<Draggable
			// 			nodeRef={subNodeRef}
			// 			position={subTextPosition}
			// 			scale={scale}
			// 			onDrag={handleSubTextDrag}
			// 			defaultPosition={{
			// 				x: subText.position?.x,
			// 				y: subText.position?.y,
			// 			}}
			// 		>
			// 			<div
			// 				ref={subNodeRef}
			// 				className="relative text-sub whitespace-nowrap"
			// 			>
			// 				<div
			// 					className="w-fit h-fit bg-black"
			// 					style={{
			// 						transform: `rotate(${subText.rotation || 0}deg)`,
			// 						backgroundColor:
			// 							subText.background_color === "lightgray"
			// 								? "bg-gray-300"
			// 								: "bg-black",
			// 					}}
			// 				>
			// 					{subText.text}
			// 				</div>
			// 			</div>
			// 		</Draggable>
			// 	)}
			// </div>
		);
	}
}
