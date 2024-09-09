import Draggable from "react-draggable";
import { useRef, useState } from "react";

export default function DraggableTextGroup({
	mainText,
	subText = null,
	isVisible,
	onMainTextClick,
	scale,
}) {
	const [isDragging, setIsDragging] = useState(false);
	const [deltaPosition, setDeltaPosition] = useState({ x: 0, y: 0 });
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

	if (mainText)
		return (
			<Draggable
				bounds="parent"
				nodeRef={nodeRef}
				disabled={false}
				defaultPosition={{ x: mainText.position?.x, y: mainText.position?.y }}
				scale={scale}
				handle=".text-main"
				onDrag={handleDragStart}
				onStop={handleDragStop}
			>
				<div
					ref={nodeRef}
					className="relative w-fit p-0 m-0 flex flex-col justify-center items-center"
				>
					<p
						className="absolute text-main whitespace-nowrap cursor-pointer"
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
								transform: `rotate(${subText.rotation || 0}deg)`,
							}}
						>
							{subText.text}
						</div>
					)}
				</div>
			</Draggable>
		);
	return null;
}
