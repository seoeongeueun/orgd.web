export const debounce = (func, delay) => {
	let timeoutId;
	return (...args) => {
		if (timeoutId) {
			clearTimeout(timeoutId);
		}
		timeoutId = setTimeout(() => {
			func(...args);
		}, delay);
	};
};

export const throttle = (func, limit) => {
	let lastFunc;
	let lastRan;
	return (...args) => {
		if (!lastRan) {
			func(...args);
			lastRan = Date.now();
		} else {
			clearTimeout(lastFunc);
			lastFunc = setTimeout(() => {
				if (Date.now() - lastRan >= limit) {
					func(...args);
					lastRan = Date.now();
				}
			}, limit - (Date.now() - lastRan));
		}
	};
};

export const apiRequest = async (url, method = "GET", data = null) => {
	const options = {
		method,
		headers: {
			"Content-Type": "application/json",
		},
	};

	if (data) {
		options.body = JSON.stringify(data);
	}

	try {
		console.log(url, options);
		const response = await fetch(url, options);
		if (response.ok) {
			return await response.json();
		} else {
			const errorData = await response.json();
			console.error(`Error with ${method} request to ${url}:`, errorData);
			throw new Error(errorData);
		}
	} catch (error) {
		console.error("Error during fetch:", error);
		throw error;
	}
};
