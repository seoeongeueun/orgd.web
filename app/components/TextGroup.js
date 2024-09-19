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
					className="absolute text-main text-center p-0 m-0 cursor-pointer"
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
						className={`absolute text-sub text-center ${
							subText.background_color.startsWith("light")
								? "bg-sub-light"
								: "bg-sub-dark"
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
