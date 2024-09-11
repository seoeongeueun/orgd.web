"use client";
import EditPage from "../components/EditPage";
import { ModeProvider } from "@/app/contexts/ModeContext";
import { TriggerProvider } from "@/app/contexts/TriggerContext";
import NavBox from "../components/NavBox";

export default function Page() {
	return (
		<ModeProvider>
			<TriggerProvider>
				<EditPageContent />
			</TriggerProvider>
		</ModeProvider>
	);
}

export function EditPageContent() {
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
