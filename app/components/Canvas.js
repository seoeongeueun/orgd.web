import { useEffect, useRef } from "react";

export default function Canvas() {
	const canvasRef = useRef(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		const context = canvas.getContext("2d");

		context.font = "30px Arial";

		context.fillText("Hello!", 50, 50);
	}, []);

	return <canvas ref={canvasRef} width={1920} height={1080} />;
}
