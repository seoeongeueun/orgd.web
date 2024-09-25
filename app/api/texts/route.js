import connectDB from "@/app/utils/mongodb";
import { NextResponse } from "next/server";
import MainText from "@/app/models/mainText";
import SubText from "@/app/models/subText";
import { verifyToken } from "@/app/utils/tools";

// 등록된 모든 메인과 서브 텍스트를 반환
export async function GET(req) {
	await connectDB();

	try {
		// 먼저 maintexts를 모두 가져오기
		const mainTexts = await MainText.find();

		// sub_text_uid를 가지고 있다면 subtext를 찾아서 mainText와 함께 반환
		const mainTextsWithSubTexts = await Promise.all(
			mainTexts.map(async (mainText) => {
				if (mainText.sub_text_uid) {
					const subText = await SubText.findOne({ uid: mainText.sub_text_uid });
					return { ...mainText._doc, subText };
				}
				return { ...mainText._doc, subText: null }; // subText가 없는 경우
			})
		);

		return new Response(JSON.stringify(mainTextsWithSubTexts), { status: 200 });
	} catch (error) {
		return new Response(
			JSON.stringify({ error: "Failed to fetch main texts" }),
			{ status: 500 }
		);
	}
}

// 이미 등록된 텍스트를 한번에 수정할 때 사용 (위치 이동, 회전 등)
export async function POST(req) {
	await connectDB();

	try {
		console.log("Starting token verification...");
		await verifyToken(req);
		console.log("Token verified successfully.");
		const { updatedTexts } = await req.json();

		for (const text of updatedTexts) {
			await MainText.findOneAndUpdate(
				{ uid: text.uid },
				{
					text: text.text,
					position: text.position,
				}
			);

			if (text.subText) {
				await SubText.findOneAndUpdate(
					{ uid: text.subText.uid },
					{
						text: text.subText.text,
						position: text.subText.position,
						rotation: text.subText.rotation,
						background_color: text.subText.background_color,
					}
				);
			}
		}
		console.log("Texts updated successfully.");
		return NextResponse.json({ message: "Texts updated successfully" });
	} catch (error) {
		console.error("Error updating texts:", error);
		return NextResponse.json(
			{ error: "Failed to update texts" },
			{ status: 500 }
		);
	}
}
