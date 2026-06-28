import { NextResponse } from "next/server";

export function forbidden(message = "접근 권한이 없습니다.") {
  return NextResponse.json({ error: message }, { status: 403 });
}

export function unauthorized(message = "로그인이 필요합니다.") {
  return NextResponse.json({ error: message }, { status: 401 });
}
