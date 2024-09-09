import { createContext, useContext, useState } from "react";

const ModeContext = createContext();

export function useMode() {
	return useContext(ModeContext);
}

export function ModeProvider({ children }) {
	const [mode, setMode] = useState("main");

	const handleModeChange = () => {
		setMode((prevMode) => (prevMode === "main" ? "sub" : "main"));
	};

	return (
		<ModeContext.Provider value={{ mode, handleModeChange }}>
			{children}
		</ModeContext.Provider>
	);
}
