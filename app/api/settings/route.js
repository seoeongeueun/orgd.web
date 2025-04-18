import { NextResponse } from "next/server";
import Settings from "@/app/models/settings";
import connectDB from "@/app/utils/mongodb";
import { verifyToken } from "@/app/utils/tools";

export async function POST(req) {
	await connectDB();

	try {
		await verifyToken(req);

		const { fontSizes } = await req.json();
		console.log("Received data:", fontSizes);
		const newSettings = new Settings({ fontSize: fontSizes });
		await newSettings.save();

		return new Response(JSON.stringify(newSettings), { status: 201 });
	} catch (error) {
		console.error(error.message);
		return new Response(JSON.stringify({ error: error.message }), {
			status: error.message.includes("token") ? 401 : 400, // Return 401 for token issues
		});
	}
}

export async function GET(req) {
	await connectDB();

	try {
		const settings = await Settings.find();
		return NextResponse.json(settings);
	} catch (error) {
		console.error(error.message);
		return new Response(JSON.stringify({ error: error.message }), {
			status: error.message.includes("token") ? 401 : 400, // Return 401 for token issues
		});
	}
}

export async function PUT(req) {
	await connectDB();

	try {
		await verifyToken(req);

		const { fontSize } = await req.json();
		const updatedSettings = await Settings.findOneAndUpdate(
			{},
			{ fontSize },
			{ new: true }
		);

		if (!updatedSettings) {
			return new Response(JSON.stringify({ error: "No settings found." }), {
				status: 404,
			});
		}

		return new Response(JSON.stringify(updatedSettings), { status: 200 });
	} catch (error) {
		console.error(error.message);
		return new Response(JSON.stringify({ error: error.message }), {
			status: error.message.includes("token") ? 401 : 400, // Return 401 for token issues
		});
	}
}
