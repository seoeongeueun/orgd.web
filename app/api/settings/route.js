import { NextResponse } from "next/server";
import Settings from "@/app/models/settings"; // Updated path
import connectDB from "@/app/utils/mongodb";

export async function POST(req) {
	await connectDB();

	try {
		const { fontSizes } = await req.json();
		console.log("Received data:", fontSizes);
		const newSettings = new Settings({ fontSize: fontSizes });
		await newSettings.save();

		return new Response(JSON.stringify(newSettings), { status: 201 });
	} catch (error) {
		return new Response(JSON.stringify({ error: "Failed to save settings." }), {
			status: 400,
		});
	}
}

export async function GET(req) {
	await connectDB();
	try {
		const settings = await Settings.find();
		return NextResponse.json(settings);
	} catch (error) {
		return new Response(JSON.stringify({ error: "Failed to load settings." }), {
			status: 400,
		});
	}
}

export async function PUT(req) {
	await connectDB();

	try {
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
		return new Response(
			JSON.stringify({ error: "Failed to update settings." }),
			{
				status: 400,
			}
		);
	}
}
