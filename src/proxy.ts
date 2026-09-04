import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// /admin/* 라우트를 보호하는 optimistic 인증 체크(쿠키의 세션만 확인).
// 실제 데이터 변경은 여전히 Postgres 함수 안의 auth.uid() 체크로 막는다
// (supabase/schema.sql 참고) — 이 proxy는 로그인 안 된 사용자를 UX 차원에서
// 미리 걷어내는 역할일 뿐, 유일한 방어선이 아니다.
const LOGIN_PATH = "/admin/login";

export async function proxy(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isLoginPage = pathname === LOGIN_PATH;

  // getUser()가 세션을 갱신하면 setAll이 response에 새 쿠키를 써두므로,
  // 리다이렉트 응답을 새로 만들 때도 그 쿠키를 그대로 옮겨야 세션이 끊기지 않는다.
  if (!user && !isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = LOGIN_PATH;
    url.searchParams.set("redirectTo", pathname);
    const redirectResponse = NextResponse.redirect(url);
    response.cookies.getAll().forEach((cookie) =>
      redirectResponse.cookies.set(cookie)
    );
    return redirectResponse;
  }

  if (user && isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/products";
    const redirectResponse = NextResponse.redirect(url);
    response.cookies.getAll().forEach((cookie) =>
      redirectResponse.cookies.set(cookie)
    );
    return redirectResponse;
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
