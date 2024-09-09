import { NextResponse } from "next/server";
import Device from "@/app/models/device";
import connectDB from "@/app/utils/mongodb";

export async function POST(req) {
	await connectDB();

	try {
		const { ip } = await req.json();
		const newDevice = new Device({ ip });
		await newDevice.save();

		return new Response(JSON.stringify(newDevice), { status: 201 });
	} catch (error) {
		return new Response(JSON.stringify({ error: "Failed to create device" }), {
			status: 400,
		});
	}
}

export async function GET(req) {
	await connectDB();
	try {
		const devices = await Device.find();
		return NextResponse.json(devices);
	} catch (error) {
		return new Response(JSON.stringify({ error: "Failed to fetch devices" }), {
			status: 400,
		});
	}
}
