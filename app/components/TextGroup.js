export default function TextGroup({
	mainText,
	subText = null,
	isVisible,
	onMainTextClick,
	isComplete
}) {
	if (mainText)
		return (
			<>
				<p
					className={`absolute text-main text-center p-0 m-0 cursor-pointer ${isComplete && "animate-fade-out"}`}
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
						className={`absolute pointer-events-none text-sub text-center ${
							subText.background_color.startsWith("light")
								? isComplete ? "bg-sub-light animate-fade-out" : "bg-sub-light"
								: "bg-sub-dark"
						}`}
						id={`subtext-${subText.uid}`}
						style={{
							visibility: isVisible ? "visible" : "hidden",
							height: !isVisible ? 0 : "auto",
							left: subText.position?.x,
							top: subText.position?.y,
							transform: `rotate(${subText.rotation || 0}deg)`,
						}}
					>
						{subText.text}
					</div>
				)}
			</>
		);
	return null;
}
