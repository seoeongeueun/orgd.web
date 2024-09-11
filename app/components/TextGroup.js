export default function TextGroup({
	mainText,
	subText = null,
	isVisible,
	onMainTextClick,
}) {
	if (mainText)
		return (
			<>
				<p
					className="absolute text-main p-0 m-0 whitespace-nowrap cursor-pointer"
					onClick={() => onMainTextClick(mainText.uid)}
					style={{
						left: mainText.position?.x,
						top: mainText.position?.y,
					}}
				>
					{mainText.text}
				</p>
				{subText && isVisible && (
					<div
						className={`absolute text-sub whitespace-nowrap ${
							subText.background_color.startsWith("light")
								? "bg-gray-300"
								: "bg-black"
						}`}
						style={{
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
