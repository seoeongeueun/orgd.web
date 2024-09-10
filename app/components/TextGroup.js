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
					className="absolute -translate-x-1/2 -translate-y-1/2 text-main p-0 m-0 whitespace-nowrap cursor-pointer"
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
						className="absolute"
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
			</>
		);
	return null;
}
