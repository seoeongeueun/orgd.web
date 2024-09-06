import connectDB from "@/app/utils/mongodb";
import MainText from "@/app/models/mainText";
import SubText from "@/app/models/subText";

export async function POST(req) {
	await connectDB();

	try {
		const { text, position, isSubText, mainTextId, backgroundColor } =
			await req.json();

		if (isSubText) {
			// Create a new SubText and associate it with an existing MainText
			const newSubText = new SubText({
				text,
				background_color: backgroundColor || "#ffffff",
				position,
				main_text_id: mainTextId,
			});

			await newSubText.save();

			// Optionally, populate the sub_text_id field in MainText
			const mainText = await MainText.findById(mainTextId);
			if (mainText) {
				mainText.sub_text_id = mainText.sub_text_id || [];
				mainText.sub_text_id.push(newSubText._id);
				await mainText.save();
			}

			return new Response(JSON.stringify(newSubText), { status: 201 });
		} else {
			// Create a new MainText button
			const newButton = new MainText({ text, position });
			await newButton.save();
			return new Response(JSON.stringify(newButton), { status: 201 });
		}
	} catch (error) {
		return new Response(JSON.stringify({ error: "Failed to create text" }), {
			status: 400,
		});
	}
}

// Handler for GET request
export async function GET(req) {
	await connectDB();

	try {
		// Step 1: Fetch all MainText documents
		const mainTexts = await MainText.find();

		// Step 2: For each MainText, fetch the corresponding SubText if it has a sub_text_uid
		const mainTextsWithSubTexts = await Promise.all(
			mainTexts.map(async (mainText) => {
				if (mainText.sub_text_uid) {
					// If there is a sub_text_uid, find the corresponding SubText
					const subText = await SubText.findOne({ uid: mainText.sub_text_uid });
					return { ...mainText._doc, subText }; // Include the SubText in the result
				}
				return { ...mainText._doc, subText: null }; // No SubText, return null
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
