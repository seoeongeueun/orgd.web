import React, { memo } from "react";
import Image from "next/image";
import { useLastText } from "../contexts/LastTextContext";

const InputBox = memo(function InputBox({
	handleManualPositionChange,
	handleManualRotationChange = null,
	setIsRotating = null,
	isRotating = false,
	rotation = 0,
}) {
	const { lastText } = useLastText();

	const renderInputField = (value, axis, handleChange) => (
		<input
			type="number"
			value={value}
			onChange={(e) => handleChange(e, axis)}
			onClick={(e) => e.stopPropagation()}
			className="w-16 input-border"
		/>
	);

	const handleRotateState = (e) => {
		e.stopPropagation();
		if (setIsRotating) setIsRotating((prev) => !prev);
	};

	return (
		<div className="absolute flex flex-row gap-px text-base ml-auto bottom-12 right-0 z-[99] opacity-80">
			{!isRotating ? (
				<>
					{renderInputField(
						lastText?.x.toFixed(0),
						"x",
						handleManualPositionChange
					)}
					{renderInputField(
						lastText?.y.toFixed(0),
						"y",
						handleManualPositionChange
					)}
				</>
			) : (
				renderInputField(rotation.toFixed(0), null, handleManualRotationChange)
			)}

			<button
				onClick={handleRotateState}
				className="bg-gray-50 border border-gray-300 w-8 flex justify-center items-center rounded-sm shrink-0"
			>
				<Image
					src={isRotating ? "/icons/rotate.svg" : "/icons/move.svg"}
					width={10}
					height={10}
					alt={isRotating ? "회전 아이콘" : "이동 아이콘"}
					className="pointer-events-none"
				/>
			</button>
		</div>
	);
});

export default InputBox;
