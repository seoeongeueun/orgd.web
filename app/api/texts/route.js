import connectDB from "@/app/utils/mongodb";
import MainText from "@/app/models/mainText";
import SubText from "@/app/models/subText";

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
