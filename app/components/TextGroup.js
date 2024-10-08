import { set } from "mongoose";
import new_subtexts from "../utils/subtexts_completed.json";
import { useState, useEffect } from "react";

export default function TextGroup({
	mainText,
	subText = null,
	isVisible,
	onMainTextClick,
	isComplete,
}) {
	const [subPosition, setSubPosition] = useState(subText?.position);
	const [subRotation, setSubRotation] = useState(subText?.rotation);

	useEffect(() => {
		if (
			isComplete &&
			subText &&
			!subText.background_color.startsWith("light")
		) {
			setTimeout(() => {
				const subtext = new_subtexts.find((sub) => sub.uid === subText.uid);
				if (subtext) {
					setSubPosition(subtext.position);
					setSubRotation(subtext.rotation);

					// 2초 후 다시 원래 위치로
					// setTimeout(() => {
					// 	setSubRotation(subText.rotation);
					// }, 2000);
				}
			}, 500);
		} else {
			if (subText) {
				setSubPosition(subText.position);
				setSubRotation(subText.rotation);
			}
		}
	}, [isComplete, subText]);

	if (mainText)
		return (
			<>
				<p
					className={`absolute text-main text-center p-0 m-0 cursor-pointer ${
						isComplete ? "opacity-0" : "opacity-100"
					}`}
					onClick={() => onMainTextClick(mainText.uid)}
					style={{
						left: mainText.position?.x,
						top: mainText.position?.y,
					}}
				>
					{mainText.text}
				</p>
				{subText && (
					<div
						className={`absolute text-sub cursor-pointer text-center transition-opacity duration-500 opacity-100 ${
							isComplete && "animate-move"
						} ${
							subText.background_color.startsWith("light")
								? isComplete
									? "bg-sub-light !opacity-0"
									: "bg-sub-light"
								: "bg-sub-dark"
						}`}
						id={`subtext-${subText.uid}`}
						onClick={() => onMainTextClick(mainText.uid)}
						style={{
							visibility: isVisible ? "visible" : "hidden",
							height: !isVisible ? 0 : "auto",
							left: `${subPosition?.x || 0}px`,
							top: `${subPosition?.y || 0}px`,
							transform: `rotate(${subText?.rotation || 0}deg)`,
							"--new-x": subPosition?.x || 0,
							"--new-y": subPosition?.y || 0,
							"--og-x": subText.position?.x || 0,
							"--og-y": subText.position?.y || 0,
							"--og-rotation": subText?.rotation || 0,
							"--new-rotation": subRotation || 0,
						}}
					>
						{subText.text}
					</div>
				)}
			</>
		);
	return null;
}
