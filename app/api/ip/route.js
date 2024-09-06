import { NextResponse } from "next/server";
import os from "os";

function getLocalIpAddress() {
	const interfaces = os.networkInterfaces();
	for (const name of Object.keys(interfaces)) {
		for (const iface of interfaces[name]) {
			if (iface.family === "IPv4" && !iface.internal) {
				return iface.address;
			}
		}
	}
	return "127.0.0.1";
}

export async function GET() {
	const ip = getLocalIpAddress();
	return NextResponse.json({ ip });
}
