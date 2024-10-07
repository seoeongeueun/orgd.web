export default function TextGroup({
	mainText,
	subText = null,
	isVisible,
	onMainTextClick,
	isComplete,
}) {
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
							subText.background_color.startsWith("light")
								? isComplete
									? "bg-sub-light !opacity-30"
									: "bg-sub-light"
								: "bg-sub-dark"
						}`}
						id={`subtext-${subText.uid}`}
						onClick={() => onMainTextClick(mainText.uid)}
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
