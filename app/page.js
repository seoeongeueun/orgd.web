"use client";
import { useEffect, useState } from "react";
import SharedPage from "./components/SharedPage";
import LoadingScreen from "./components/LoadingScreen";

export default function Page() {
	const [message, setMessage] = useState("텍스트를 눌러보세요");
	const [showLoading, setShowLoading] = useState(true);

	return (
		<>
			<div id="scroll-div" className="overflow-auto">
				<SharedPage
					setMessage={setMessage}
					setShowLoading={setShowLoading}
					showLoading={showLoading}
				/>
			</div>
			<LoadingScreen message={message} showLoading={showLoading} />
		</>
	);
}
