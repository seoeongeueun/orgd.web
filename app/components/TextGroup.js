export default function TextGroup({
	mainText,
	subText = null,
	isVisible,
	onMainTextClick,
	fontSize,
}) {
	if (mainText)
		return (
			<>
				<p
					className="absolute text-main text-center p-0 m-0 whitespace-pre-wrap cursor-pointer"
					onClick={() => onMainTextClick(mainText.uid)}
					style={{
						left: mainText.position?.x,
						top: mainText.position?.y,
						fontSize: fontSize?.default || "5px",
					}}
				>
					{mainText.text}
				</p>
				{subText && isVisible && (
					<div
						className={`absolute text-sub px-1 text-center whitespace-pre-wrap ${
							subText.background_color.startsWith("light")
								? "bg-gray-500"
								: "bg-black"
						}`}
						style={{
							left: subText.position?.x,
							top: subText.position?.y,
							transform: `rotate(${subText.rotation || 0}deg)`,
							fontSize: fontSize?.sub || "5px",
						}}
					>
						{subText.text}
					</div>
				)}
			</>
		);
	return null;
}
