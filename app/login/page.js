"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "../utils/tools";

export default function LoginPage() {
	const [key, setKey] = useState("");
	const [error, setError] = useState("");
	const router = useRouter();

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError("");

		try {
			// Send the key to the API for validation
			const response = await apiRequest("/api/auth", "POST", { key });

			if (response.success) {
				setError("인증되었습니다. 잠시만 기다려주세요.");
				router.push("/settings");
			} else {
				setError("틀린 키 입니다. 다시 시도해 주세요.");
			}
		} catch (err) {
			setError("에러가 발생했습니다. 키를 다시 확인해주세요.");
		}
	};

	return (
		<div className="flex flex-col items-center justify-center h-screen bg-white">
			<h1 className="text-2xl mb-4">Enter the Secret Key</h1>
			<form onSubmit={handleSubmit} className="flex flex-col gap-4">
				<input
					type="password"
					value={key}
					onChange={(e) => setKey(e.target.value)}
					placeholder="키 값을 입력해주세요"
					required
					className="p-2 nav-input"
				/>
				<button
					type="submit"
					className="bg-theme-gray text-white px-4 py-2 rounded"
				>
					입력
				</button>
			</form>
			{error && <p className="text-red-500 mt-4">{error}</p>}
		</div>
	);
}
