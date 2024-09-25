import { jwtVerify } from "jose";

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

export const stripPx = (value) => parseInt(value.replace("px", ""), 10);

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
		const response = await fetch(url, options);
		if (response.ok) {
			return await response.json();
		} else {
			const errorData = await response.json();
			console.error(`Error with ${method} request to ${url}:`, errorData);
			throw new Error(errorData.error);
		}
	} catch (error) {
		console.error("Error during fetch:", error);
		throw error;
	}
};

export const verifyToken = async (req) => {
	const authHeader = req.headers.get("authorization");

	if (!authHeader) {
		throw new Error("No token provided");
	}

	const token = authHeader.split(" ")[1];

	if (!token) {
		throw new Error("Token missing");
	}

	try {
		const { payload } = await jwtVerify(
			token,
			new TextEncoder().encode(process.env.JWT_SECRET)
		);
		return payload;
	} catch (error) {
		throw new Error("Invalid token");
	}
};
