import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const verifyToken = async (req) => {
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

export async function POST(req) {
	try {
		await verifyToken(req);

		const response = await fetch(
			`http://${process.env.SERVER_URL}api/refresh`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
			}
		);

		if (!response.ok) {
			throw new Error("Failed to trigger refresh on the external server.");
		}

		return NextResponse.json({
			message: "Server refresh triggered successfully.",
		});
	} catch (error) {
		return NextResponse.json({ message: error.message }, { status: 401 });
	}
}

export async function GET(req, res) {
	try {
		const response = await fetch(
			`https://${process.env.SERVER_URL}api/connections`
		);
		if (!response.ok) {
			throw new Error("Failed to fetch connections");
		}

		const data = await response.json();
		return NextResponse.json(data);
	} catch (error) {
		console.error("Error fetching connections:", error);
		return null;
	}
}
