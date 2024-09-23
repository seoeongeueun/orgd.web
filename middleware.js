import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

export async function middleware(req) {
	console.log(`Incoming request to: ${req.nextUrl.pathname}`);
	const excludedPaths = ["/api/auth"];

	const url = req.nextUrl;

	//get 요청이고 /settings에서 접근한게 아니면 경우는 패스
	//settings 페이지는 get 요청이라도 토큰을 확인
	if (
		excludedPaths.some((path) => url.pathname.startsWith(path)) ||
		(req.method === "GET" && !url.pathname.startsWith("/settings"))
	) {
		return NextResponse.next();
	}

	const token = req.cookies.get("authToken");

	// 토큰이 없으면 로그인 페이지로 리다이렉트
	if (!token) {
		console.log("No token found");
		return NextResponse.redirect(new URL("/login", req.url));
	}

	// 요청 헤더에 토큰을 추가해서 전달
	try {
		await jwtVerify(
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
	matcher: ["/settings/:path*", "/api/:path*"],
};
