"use client";
import { useState } from "react";
import EditPage from "../components/EditPage";

export default function Page() {
	const [ip, setIp] = useState("");
	const [message, setMessage] = useState(""); // For feedback after submission

	const handleIpChange = (e) => {
		setIp(e.target.value);
	};

	const handleSubmit = async () => {
		if (!ip) {
			setMessage("IP address cannot be empty");
			return;
		}
		try {
			const response = await fetch("/api/device", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ ip }),
			});
			const data = await response.json();

			if (response.ok) {
				setMessage("Device IP saved successfully");
			} else {
				setMessage("Failed to save device IP");
			}
		} catch (error) {
			console.error("Failed to create device", error);
			setMessage("An error occurred while saving the IP");
		}
	};

	return (
		<div className="flex flex-col justify-center items-start gap-4">
			<h1>설정</h1>
			<div className="flex flex-row gap-4">
				<input
					onChange={handleIpChange}
					value={ip}
					placeholder="메인 기기의 ip 주소를 입력해주세요"
					className="text-main w-40"
				/>
				<button onClick={handleSubmit} type="submit">
					저장
				</button>
			</div>

			{message && <p>{message}</p>}
			<EditPage />
		</div>
	);
}
