export default function LoadingScreen({ message, showLoading }) {
	return (
		<div
			className={`fixed top-0 w-full h-full bg-loading-white pointer-events-none ${
				showLoading ? "" : "invisible opacity-0"
			}`}
			style={{ transition: "opacity 0.3s ease-in-out, visibility 0s 0.3s" }}
		>
			<div className="relative top-4 left-1/2 -translate-x-1/2 shadow-loading-text w-fit p-4 flex flex-col justify-center items-center">
				<p>{message}</p>
			</div>
			<p className="text-xl fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
				로고
			</p>
		</div>
	);
}
