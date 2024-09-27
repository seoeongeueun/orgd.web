"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/app/utils/tools";
import Link from "next/link";
import Image from "next/image";

const fetchConnections = async () => {
	const response = await apiRequest("/api/settings/device", "GET");
	console.log(response);
	return response;
};

const triggerServerAction = async (type) => {
	const response = await apiRequest(
		`/api/settings/${type === "drop" ? "device" : "refresh"}`,
		"POST"
	);
	return response;
};

export default function Page() {
	const [message, setMessage] = useState("화면 설정");
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
			setMessage("메인 기기로 등록되었습니다. 홈으로 이동합니다...");
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

	const handleDrop = async () => {
		if (confirm("정말 모든 연결을 끊으시겠습니까?")) {
			setMessage("모든 연결을 해제 중...");
			try {
				const response = await triggerServerAction("drop");
				if (response) {
					sessionStorage.removeItem("mainDevice");
					fetchConnections().then((data) => {
						setConnections({
							main: data.mainDeviceCount,
							count: data.activeConnections,
							max: data.MAX_CONNECTIONS,
						});
					});
					setMessage("모든 연결을 해제했습니다");
				}
			} catch (error) {
				setMessage("오류가 발생했습니다");
			}
		}
	};

	const handleRefresh = async () => {
		if (confirm("정말 모든 해설 텍스트를 초기화 하겠습니까?")) {
			setMessage("모든 해설 텍스트 되돌리는 중...");
			try {
				const response = await triggerServerAction("refresh");
				if (response) {
					setMessage("모든 해설 텍스트를 초기화 했습니다");
				}
			} catch (error) {
				setMessage("오류가 발생했습니다");
			}
		}
	};

	return (
		<div className="w-full h-full flex flex-col items-center justify-center">
			{message && (
				<p className="mb-10 text-black text-xl lg:text-nav-xl">{message}</p>
			)}

			<div className="flex flex-row items-start justify-center gap-20 lg:text-nav-md">
				<div className="flex flex-col gap-8 w-56 lg:w-96 text-center">
					<div className="flex flex-col gap-2 text-center nav-input !p-4 rounded-sm w-full">
						<h2>
							연결된 기기
							{` ${connections.count} / ${connections.max}`}
						</h2>
						<p>접속한 메인 기기 {connections.main}</p>
					</div>

					<div className="flex flex-row justify-start items-center gap-2 w-full">
						<label htmlFor="is-main-device">메인 기기입니다</label>
						<input type="checkbox" id="is-main-device" name="is-main-device" />
						<button
							type="submit"
							className="btn-gray ml-auto"
							onClick={handleRegister}
						>
							등록
						</button>
					</div>
					<div className="flex flex-row gap-2 text-center w-full">
						<Link href="/" className="btn-gray w-full">
							홈으로
						</Link>
						<Link href="/settings" className="btn-gray w-full">
							설정으로
						</Link>
					</div>
				</div>
				<div className="flex flex-col gap-4 justify-center items-center w-62 lg:w-96">
					<h1 className="flex flex-row items-center gap-1">
						<Image src="/icons/alert.svg" width={12} height={12} alt="alert" />
						사용시 주의 - 전시 화면에 영향이 갑니다
					</h1>
					<button
						type="button"
						className="nav-input !p-2 w-full hover:bg-theme-gray"
						onClick={handleDrop}
					>
						모든 연결 끊기
					</button>
					<button
						type="button"
						className="nav-input !p-2 w-full hover:bg-theme-gray"
						onClick={handleRefresh}
					>
						화면 초기화
					</button>
				</div>
			</div>
		</div>
	);
}
