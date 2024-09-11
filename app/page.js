import SharedPage from "./components/SharedPage";

export default function Page() {
	return (
		<div id="scroll-div" className="overflow-auto">
			<SharedPage isEditMode={false} />
		</div>
	);
}
