"use client";
import { useState } from "react";
import EditPage from "../components/EditPage";
import { ModeProvider, useMode } from "@/app/contexts/ModeContext";

export default function Page() {
	return (
		<ModeProvider>
			<EditPageContent />
		</ModeProvider>
	);
}

export function EditPageContent() {
	const [ip, setIp] = useState("");
	const [message, setMessage] = useState("");
	const { mode, handleModeChange } = useMode();

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
		<div className="flex flex-col justify-center items-start gap-4 w-full h-full">
			<div className="flex flex-row justify-between items-center w-full p-4 text-2xl">
				<h1>데이터 설정</h1>
				<div className="flex flex-row gap-2">
					<button type="button">초기화</button>
					<button type="submit">저장</button>
				</div>
			</div>
			<button onClick={handleModeChange}>{mode.toUpperCase()}</button>
			<div className="flex flex-row gap-4">
				<input
					onChange={handleIpChange}
					value={ip}
					placeholder="메인 기기의 ip 주소를 입력해주세요"
					className="text-main w-40"
				/>
				<button onClick={handleSubmit} type="submit">
					입력
				</button>
			</div>

			{message && <p>{message}</p>}

			<EditPage />
		</div>
	);
}
