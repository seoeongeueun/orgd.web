"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/app/utils/tools";
import Link from "next/link";

const fetchConnections = async () => {
	const response = await apiRequest("/api/settings/device", "GET");
	console.log(response);
	return response;
};

const triggerRefresh = async () => {
	const response = await apiRequest("/api/settings/device", "POST");
	if (response.ok) sessionStorage.removeItem("mainDevice");
};

export default function Page() {
	const [message, setMessage] = useState("");
	const [connections, setConnections] = useState({ main: 0, count: 0, max: 0 });
	const router = useRouter();

	useEffect(() => {
		if (sessionStorage.getItem("mainDevice")) {
			const check = document.getElementById("is-main-device");
			check.checked = true;
		}
	}, []);

	const handleRegister = async () => {
		const isMainDevice = document.getElementById("is-main-device").checked;
		if (isMainDevice) {
			sessionStorage.setItem("mainDevice", true);
			setMessage("메인 기기로 등록되었습니다.");
			setTimeout(() => {
				router.push("/");
			}, 2000);
		}
	};

	useEffect(() => {
		if (sessionStorage.getItem("mainDevice")) {
			const check = document.getElementById("is-main-device");
			check.checked = true;
		}
		fetchConnections().then((data) => {
			setConnections({
				main: data.mainDeviceCount,
				count: data.activeConnections,
				max: data.MAX_CONNECTIONS,
			});
		});
	}, []);

	return (
		<div className="w-full h-full flex flex-col items-center justify-center gap-8">
			<h1 className="absolute top-4 left-4 text-xl">기기 설정</h1>
			<div className="flex flex-col gap-2 text-center nav-input !p-4 rounded-sm">
				<h2>
					현재 연결된 기기
					{` ${connections.count} / ${connections.max}`}
				</h2>
				<p>현재 접속한 메인 기기 {connections.main}</p>
			</div>
			<div className="flex flex-row items-center gap-2">
				<label htmlFor="is-main-device">메인 기기입니다</label>
				<input type="checkbox" id="is-main-device" name="is-main-device" />
				<button
					type="submit"
					className="btn-gray ml-4"
					onClick={handleRegister}
				>
					등록
				</button>
			</div>
			<div className="flex flex-row gap-2">
				<Link href="/" className="btn-gray">
					홈으로
				</Link>
				<Link href="/settings" className="btn-gray">
					설정으로
				</Link>
			</div>

			{message && <p className="mt-4 text-gray-700">{message}</p>}
		</div>
	);
}
