import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold">소규모 사업자를 위한 주문·재고 관리 서비스</h1>
        <p className="text-muted-foreground">
          엑셀 없이 상품, 재고, 주문을 한 곳에서 관리하세요.
        </p>
      </div>
      <Button asChild size="lg">
        <Link href="/products">상품 둘러보기</Link>
      </Button>
    </main>
  );
}
