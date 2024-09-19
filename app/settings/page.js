"use client";
import EditPage from "../components/EditPage";
import { ModeProvider } from "@/app/contexts/ModeContext";
import { TriggerProvider } from "@/app/contexts/TriggerContext";
import NavBox from "../components/NavBox";
import { useEffect } from "react";
import { apiRequest } from "@/app/utils/tools";

export default function Page() {
	return (
		<ModeProvider>
			<TriggerProvider>
				<EditPageContent />
			</TriggerProvider>
		</ModeProvider>
	);
}

const fetchSettings = async () => {
	const settings = await apiRequest("/api/settings");
	console.log("폰트 설정 정보:", settings);
	return settings;
};

export function EditPageContent() {
	useEffect(() => {
		const updateFontSizeInputs = async () => {
			const data = await fetchSettings();
			const fontSizes = data[0].fontSize;
			document.documentElement.style.setProperty(
				"--fs-main",
				fontSizes.default
			);
			document.documentElement.style.setProperty("--fs-sub", fontSizes.sub);

			const fs = document.querySelector("#font-size");
			console.log(fs);
			if (fs) {
				const fontSizeMain = getComputedStyle(document.documentElement)
					.getPropertyValue("--fs-main")
					.trim();
				fs.value = parseInt(fontSizeMain.replace("px", ""));
			}

			const sfs = document.querySelector("#sub-font-size");
			if (sfs) {
				const fontSizeSub = getComputedStyle(document.documentElement)
					.getPropertyValue("--fs-sub")
					.trim();
				sfs.value = parseInt(fontSizeSub.replace("px", ""));
			}
		};
		updateFontSizeInputs();
	}, []);

	return (
		<div
			id="edit-page"
			className="flex flex-col justify-start items-start gap-4 w-full h-full overflow-y-auto overflow-x-hidden"
		>
			<NavBox />
			<EditPage />
		</div>
	);
}
