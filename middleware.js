import { NextResponse } from "next/server";
import { jwtVerify } from "jose"; // Import jwtVerify from jose

export async function middleware(req) {
	const token = req.cookies.get("authToken");

	if (!token) {
		console.log("No token found");
		return NextResponse.redirect(new URL("/login", req.url));
	}

	try {
		const { payload } = await jwtVerify(
			token.value,
			new TextEncoder().encode(process.env.JWT_SECRET)
		);
		const requestHeaders = new Headers(req.headers);
		requestHeaders.set("Authorization", `Bearer ${token.value}`);

		const response = NextResponse.next();
		response.headers.set("Authorization", `Bearer ${token.value}`);
		return response;
	} catch (err) {
		console.error("JWT verification error:", err);
		return NextResponse.redirect(new URL("/login", req.url));
	}
}

export const config = {
	matcher: ["/settings", "/api/:path*"],
};
