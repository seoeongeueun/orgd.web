import React, { memo } from "react";
import Image from "next/image";

const InputBox = memo(function InputBox({
	handleManualPositionChange,
	handleManualRotationChange = null,
	setIsRotating = null,
	isRotating = false,
	lastModified,
	rotation = 0,
	setIsEditSubText = null,
	isEditSubText = false,
}) {
	const renderInputField = (value, axis, handleChange) => (
		<input
			type="number"
			value={value}
			onChange={(e) => handleChange(e, axis)}
			onClick={(e) => e.stopPropagation()}
			className="w-16 input-border"
		/>
	);

	const handleRotateState = () => {
		if (setIsRotating) setIsRotating((prev) => !prev);
		if (setIsEditSubText) setIsEditSubText(false);
	};

	return (
		<div className="absolute flex flex-row gap-px text-base ml-auto bottom-8 right-0 z-[99] opacity-80">
			{!isEditSubText &&
				(!isRotating ? (
					<>
						{renderInputField(
							lastModified?.x.toFixed(0),
							"x",
							handleManualPositionChange
						)}
						{renderInputField(
							lastModified?.y.toFixed(0),
							"y",
							handleManualPositionChange
						)}
					</>
				) : (
					renderInputField(
						rotation.toFixed(0),
						null,
						handleManualRotationChange
					)
				))}

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
			<button
				type="button"
				onClick={() => setIsEditSubText((prev) => !prev)}
				className="bg-gray-50 border border-gray-300 w-8"
			>
				T
			</button>
		</div>
	);
});

export default InputBox;
