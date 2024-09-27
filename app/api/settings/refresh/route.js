import { verifyToken } from "@/app/utils/tools";
import { NextResponse } from "next/server";

export async function POST(req) {
	try {
		await verifyToken(req);

		const authorization = req.headers.get("Authorization");
		const response = await fetch(
			`https://${process.env.SERVER_URL}api/refresh`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: authorization,
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
