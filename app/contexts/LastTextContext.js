import { createContext, useContext, useState } from "react";

const LastTextContext = createContext();

export function useLastText() {
	return useContext(LastTextContext);
}

export function LastTextProvider({ children }) {
	const [lastText, setLastText] = useState({
		uid: "",
		x: 0,
		y: 0,
		text: "",
		rotation: 0,
		background_color: "dark",
	});

	return (
		<LastTextContext.Provider value={{ lastText, setLastText }}>
			{children}
		</LastTextContext.Provider>
	);
}
