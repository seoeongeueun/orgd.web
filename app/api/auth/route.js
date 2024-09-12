import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function POST(req) {
	try {
		const { key } = await req.json();

		const secretKey = process.env.ACCESS_KEY;

		if (key === secretKey) {
			const token = jwt.sign(
				{ user: "authenticated" },
				process.env.JWT_SECRET,
				{
					expiresIn: "1h",
				}
			);

			const response = NextResponse.json({ success: true });
			response.cookies.set("authToken", token, {
				httpOnly: true,
				secure: process.env.NODE_ENV === "production",
				sameSite: "strict",
				maxAge: 60 * 60,
				path: "/",
			});

			return response;
		} else {
			return NextResponse.json(
				{ success: false, message: "Invalid key" },
				{ status: 401 }
			);
		}
	} catch (error) {
		return NextResponse.json(
			{ success: false, message: "An error occurred" },
			{ status: 500 }
		);
	}
}
