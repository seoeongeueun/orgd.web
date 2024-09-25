export default function LoadingScreen({ message }) {
	return (
		<div className="w-full h-full">
			<div className="fixed top-4 left-1/2 -translate-x-1/2 flex flex-col justify-center items-center">
				<p>{message}</p>
			</div>
			<p className="text-xl fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
				로고
			</p>
		</div>
	);
}
