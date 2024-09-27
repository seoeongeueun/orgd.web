import { NextResponse } from "next/server";
import { verifyToken } from "@/app/utils/tools";

export async function POST(req) {
	try {
		await verifyToken(req);

		const authorization = req.headers.get("Authorization");
		const response = await fetch(`https://${process.env.SERVER_URL}api/drop`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: authorization,
			},
		});
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
