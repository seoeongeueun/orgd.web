import Draggable from "react-draggable";
import { useRef, useEffect } from "react";

export default function DraggableTextGroup({
	mainText,
	subText = null,
	isVisible,
	onMainTextClick,
	scale,
}) {
	const nodeRef = useRef(null);

	if (mainText)
		return (
			<Draggable
				bounds="parent"
				nodeRef={nodeRef}
				defaultPosition={{ x: mainText.position?.x, y: mainText.position?.y }}
				scale={scale}
				// style={{
				// 	left: mainText.position?.x,
				// 	top: mainText.position?.y,
				// }}
			>
				<div
					ref={nodeRef}
					className="absolute p-0 m-0 -translate-x-1/2 -translate-y-1/2 flex flex-col justify-center items-center"
				>
					<p
						className="absolute text-main whitespace-nowrap cursor-pointer"
						onClick={() => onMainTextClick(mainText.uid)}
					>
						{mainText.text}
					</p>
					{subText && isVisible && (
						<div
							className="relative"
							style={{
								left: subText.position?.x,
								top: subText.position?.y,
								transform: `rotate(${subText.rotation || 0}deg)`,
							}}
						>
							<span
								className={`text-sub ${
									subText.background_color === "lightgray"
										? "bg-gray-300"
										: "bg-black"
								}`}
							>
								{subText.text}
							</span>
						</div>
					)}
				</div>
			</Draggable>
		);
	return null;
}
