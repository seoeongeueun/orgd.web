import { createContext, useContext, useState } from "react";

const TriggerContext = createContext();

export function useTrigger() {
	return useContext(TriggerContext);
}

export function TriggerProvider({ children }) {
	const [triggerState, setTriggerState] = useState({
		trigger: "",
		message: "",
	});

	const setTrigger = (trigger, message) => {
		setTriggerState({ trigger, message });
	};

	const value = {
		triggerState,
		setTrigger,
	};

	return (
		<TriggerContext.Provider value={value}>{children}</TriggerContext.Provider>
	);
}
