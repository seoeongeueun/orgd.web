import Draggable from "react-draggable";
import { useRef, useState } from "react";
import { useMode } from "@/app/contexts/ModeContext";

export default function DraggableTextGroup({
	mainText,
	subText = null,
	isVisible,
	onMainTextClick,
	scale,
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
		setDeltaPosition({
			x: data.x,
			y: data.y,
		});
	};

	const handleDragStop = () => {
		mainText.position = {
			x: deltaPosition.x,
			y: deltaPosition.y,
		};
		setTimeout(() => setIsDragging(false), 0);
	};

	const handleClick = (e) => {
		console.log("click", isDragging);
		if (isDragging) {
			e.preventDefault();
		} else {
			onMainTextClick(mainText.uid);
		}
	};

	const handleSubTextDrag = (e, data) => {
		setSubTextPosition({
			x: data.x,
			y: data.y,
		});
	};

	if (mode === "main")
		return (
			<Draggable
				bounds="parent"
				nodeRef={nodeRef}
				disabled={mode !== "main"}
				position={{ x: mainText.position?.x, y: mainText.position?.y }}
				scale={scale}
				handle=".text-main"
				onDrag={handleDragStart}
				onStop={handleDragStop}
			>
				<div
					ref={nodeRef}
					className="relative w-fit h-fit p-0 m-0 flex flex-col justify-center items-center"
				>
					<p
						className={`absolute text-main whitespace-nowrap ${
							mode === "main" ? "cursor-pointer" : "cursor-default"
						}`}
						onClick={handleClick}
					>
						{mainText.text}
					</p>
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
			<div
				className="absolute p-0 m-0 -translate-x-1/2 -translate-y-1/2 flex flex-col justify-center items-center"
				style={{
					left: mainText.position?.x,
					top: mainText.position?.y,
				}}
			>
				<p
					className="absolute text-main p-0 m-0 whitespace-nowrap cursor-pointer"
					onClick={() => onMainTextClick(mainText.uid)}
				>
					{mainText.text}
				</p>
				{subText && isVisible && (
					<Draggable
						nodeRef={subNodeRef}
						position={subTextPosition}
						scale={scale}
						onDrag={handleSubTextDrag}
						defaultPosition={{
							x: subText.position?.x,
							y: subText.position?.y,
						}}
					>
						<div
							ref={subNodeRef}
							className="relative text-sub whitespace-nowrap"
						>
							<div
								className="w-fit h-fit bg-black"
								style={{
									transform: `rotate(${subText.rotation || 0}deg)`,
									backgroundColor:
										subText.background_color === "lightgray"
											? "bg-gray-300"
											: "bg-black",
								}}
							>
								{subText.text}
							</div>
						</div>
					</Draggable>
				)}
			</div>
		);
	}
}
