import { verify } from "jsonwebtoken";

export default function handler(req, res) {
	const token = req.cookies.authToken; // Access the authToken cookie directly

	if (!token) {
		console.log("No token found");
		return res.status(401).json({ message: "No token found" });
	}

	try {
		console.log("Token value:", token);
		const decoded = verify(token, process.env.JWT_SECRET); // Verify the token with the secret
		console.log("Decoded Token:", decoded); // Log the decoded JWT

		return res.status(200).json({ message: "Token is valid", decoded });
	} catch (err) {
		console.log("Error during token verification:", err); // Log any errors
		return res.status(401).json({ message: "Token verification failed" });
	}
}
