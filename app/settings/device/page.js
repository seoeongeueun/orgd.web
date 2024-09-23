"use client";
import { apiRequest } from "@/app/utils/tools";
import { set } from "mongoose";
import { useState, useEffect } from "react";

const fetchIp = async () => {
	const response = await fetch("/api/ip");
	const data = await response.json();
	return data;
};

export default function Page() {
	const [message, setMessage] = useState("");
	const [ipAddress, setIpAddress] = useState("");

	// useEffect(() => {
	// 	if (sessionStorage.getItem("mainDevice")) {
	// 		const check = document.getElementById("is-main-device");
	// 		check.checked = true;
	// 	}
	// }, []);

	// const handleRegister = async () => {
	// 	const isMainDevice = document.getElementById("is-main-device").checked;
	// 	if (isMainDevice) {
	// 		const response = await apiRequest("/api/settings/device", "POST", null);
	// 		if (response) {
	// 			sessionStorage.setItem("mainDevice", true);
	// 			setMessage("기기가 등록되었습니다.");
	// 		}
	// 	}
	// };

	useEffect(() => {
		fetchIp().then((data) => {
			setIpAddress(data.ip);
		});

		if (sessionStorage.getItem("mainDevice")) {
			const check = document.getElementById("is-main-device");
			check.checked = true;
		}
	}, []);

	const handleRegister = async () => {
		const isMainDevice = document.getElementById("is-main-device").checked;
		if (isMainDevice && ipAddress) {
			const response = await apiRequest("/api/settings/device", "POST", {
				ipAddress,
			});
			if (response) {
				sessionStorage.setItem("mainDevice", true);
				setMessage("기기가 등록되었습니다.");
			}
		} else {
			setMessage("IP 주소를 불러오는 중 문제가 발생했습니다.");
		}
	};

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
