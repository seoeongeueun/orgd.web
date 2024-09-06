import { NextResponse } from "next/server";

export async function GET(req) {
	const forwarded = req.headers.get("x-forwarded-for");
	const ip = forwarded ? forwarded.split(/, /)[0] : req.socket.remoteAddress;

	if (ip === "::1" || ip === "127.0.0.1") {
		return NextResponse.json({ ip: "localhost" });
	}

	return NextResponse.json({ ip });
}
