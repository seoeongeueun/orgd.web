import connectDB from "@/app/utils/mongodb";
import { NextResponse } from "next/server";
import MainText from "@/app/models/mainText";
import SubText from "@/app/models/subText";

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
