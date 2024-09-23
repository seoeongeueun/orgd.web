import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import Settings from "@/app/models/settings";
import connectDB from "@/app/utils/mongodb";

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
	await connectDB();

	try {
		await verifyToken(req);

		const key = process.env.MAIN_KEY;
		console.log(key);
		if (!key) {
			return new Response(JSON.stringify({ error: "값이 비어있습니다." }), {
				status: 400,
			});
		}

		const updatedSettings = await Settings.findOneAndUpdate(
			{}, //collection에 document가 하나만 있으므로 빈 객체로 조회
			{ mainDevice: key },
			{ new: true }
		);

		return NextResponse.json(key === updatedSettings.mainDevice, {
			status: 200,
		});
	} catch (error) {
		console.error(error.message);
		return new Response(JSON.stringify({ error: error.message }), {
			status: error.message.includes("token") ? 401 : 400,
		});
	}
}
