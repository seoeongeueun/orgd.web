"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Page() {
	const [message, setMessage] = useState("");
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
			setMessage("기기가 등록되었습니다.");
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
	}, []);

	return (
		<div className="w-full h-full flex flex-col items-center justify-center gap-4">
			<h1 className="absolute top-4 left-4 text-xl">기기 설정</h1>
			<div className="flex flex-row gap-4">
				<label htmlFor="is-main-device">메인 기기입니다</label>
				<input type="checkbox" id="is-main-device" name="is-main-device" />
			</div>
			<button type="submit" className="btn-gray" onClick={handleRegister}>
				등록
			</button>
			{message && <p className="mt-4 text-gray-700">{message}</p>}
		</div>
	);
}
