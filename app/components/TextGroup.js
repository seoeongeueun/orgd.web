export default function TextGroup({ mainText, subText = null }) {
	if (mainText)
		return (
			<div
				className="absolute p-0 m-0 -translate-x-1/2 -translate-y-1/2 flex flex-col justify-center items-center"
				style={{
					left: mainText.position?.x,
					top: mainText.position?.y,
				}}
			>
				<p className="absolute text-main p-0 m-0 whitespace-nowrap">
					{mainText.text}
				</p>
				{subText && (
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
		);
	return null;
}
