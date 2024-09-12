import connectDB from "@/app/utils/mongodb";
import { NextResponse } from "next/server";
import MainText from "@/app/models/mainText";
import SubText from "@/app/models/subText";
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
		// Use jose for token verification
		const { payload } = await jwtVerify(
			token,
			new TextEncoder().encode(process.env.JWT_SECRET)
		);
		return payload; // Return the decoded payload (user information)
	} catch (error) {
		throw new Error("Invalid token");
	}
};

//Db에 존재하지 않는 유니크 uid를 생성
async function generateUniqueUid(model) {
	let uid;
	let exists = true;

	while (exists) {
		uid = `${Math.random().toString(36).slice(2, 11)}${Date.now()}`;
		exists = await model.exists({ uid });
	}

	return uid;
}

export async function POST(req) {
	await connectDB();

	try {
		await verifyToken(req);
		const { text, position, subText, subTextColor } = await req.json();

		const uid = await generateUniqueUid(MainText);

		const newMainText = new MainText({
			uid,
			text,
			position: {
				x: position.x,
				y: position.y,
			},
			sub_text_uid: subText ? await generateUniqueUid(SubText) : null,
		});

		await newMainText.save();

		if (subText) {
			const newSubText = new SubText({
				uid: newMainText.sub_text_uid,
				text: subText,
				background_color: subTextColor,
				position: {
					x: position.x,
					y: position.y,
				},
				main_text_uid: uid,
			});

			await newSubText.save();
		}

		return NextResponse.json({
			message: "MainText and SubText (if applicable) saved successfully",
		});
	} catch (error) {
		console.error("Error saving texts:", error);
		return NextResponse.json(
			{ error: "Failed to save texts" },
			{ status: 500 }
		);
	}
}

export async function PUT(req) {}
