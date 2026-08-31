"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { createProduct, getProducts } from "@/lib/queries/products";
import { isSupabaseConfigured } from "@/lib/supabase/client";

const currencyFormatter = new Intl.NumberFormat("ko-KR", {
  style: "currency",
  currency: "KRW",
});

const emptyForm = {
  name: "",
  description: "",
  price: "",
  stockQuantity: "",
  category: "",
  imageUrl: "",
};

export default function AdminProductsPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(emptyForm);

  const { data: products, isLoading: isLoadingProducts } = useQuery({
    queryKey: ["products"],
    queryFn: getProducts,
    enabled: isSupabaseConfigured,
  });

  const createProductMutation = useMutation({
    mutationFn: () =>
      createProduct({
        name: form.name.trim(),
        description: form.description.trim() || null,
        price: Number(form.price),
        stock_quantity: Number(form.stockQuantity),
        category: form.category.trim() || null,
        image_url: form.imageUrl.trim() || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setForm(emptyForm);
    },
  });

  const isFormValid =
    form.name.trim().length > 0 &&
    form.price.trim().length > 0 &&
    !Number.isNaN(Number(form.price)) &&
    Number(form.price) >= 0 &&
    form.stockQuantity.trim().length > 0 &&
    !Number.isNaN(Number(form.stockQuantity)) &&
    Number(form.stockQuantity) >= 0;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold">상품 등록</h1>
        <p className="text-muted-foreground text-sm">
          새 상품을 등록하고 등록된 상품 목록을 확인하세요.
        </p>
      </div>

      {!isSupabaseConfigured && (
        <Card>
          <CardHeader>
            <CardTitle>Supabase 연결이 필요합니다</CardTitle>
            <CardDescription>
              연결 후 상품을 등록할 수 있습니다.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {isSupabaseConfigured && (
        <Card>
          <CardHeader>
            <CardTitle>새 상품</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-4 sm:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault();
                createProductMutation.mutate();
              }}
            >
              <div className="grid gap-1.5">
                <Label htmlFor="name">상품명</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="category">카테고리</Label>
                <Input
                  id="category"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="price">가격</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="1"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  required
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="stockQuantity">재고 수량</Label>
                <Input
                  id="stockQuantity"
                  type="number"
                  min="0"
                  step="1"
                  value={form.stockQuantity}
                  onChange={(e) =>
                    setForm({ ...form, stockQuantity: e.target.value })
                  }
                  required
                />
              </div>

              <div className="grid gap-1.5 sm:col-span-2">
                <Label htmlFor="imageUrl">이미지 URL</Label>
                <Input
                  id="imageUrl"
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div className="grid gap-1.5 sm:col-span-2">
                <Label htmlFor="description">설명</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </div>

              {createProductMutation.isError && (
                <p className="text-destructive text-sm sm:col-span-2">
                  {createProductMutation.error instanceof Error
                    ? createProductMutation.error.message
                    : "상품 등록에 실패했습니다."}
                </p>
              )}

              {createProductMutation.isSuccess && (
                <p className="text-sm text-emerald-600 sm:col-span-2">
                  상품이 등록되었습니다.
                </p>
              )}

              <div className="sm:col-span-2">
                <Button
                  type="submit"
                  disabled={!isFormValid || createProductMutation.isPending}
                >
                  {createProductMutation.isPending ? "등록 중..." : "상품 등록"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {isSupabaseConfigured && (
        <Card>
          <CardHeader>
            <CardTitle>등록된 상품</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoadingProducts && (
              <p className="text-muted-foreground px-4 pb-4 text-sm">
                불러오는 중...
              </p>
            )}

            {!isLoadingProducts && products && products.length === 0 && (
              <p className="text-muted-foreground px-4 pb-4 text-sm">
                등록된 상품이 없습니다.
              </p>
            )}

            {!isLoadingProducts && products && products.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>상품명</TableHead>
                    <TableHead>카테고리</TableHead>
                    <TableHead className="text-right">가격</TableHead>
                    <TableHead className="text-right">재고</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>
                        {product.category ? (
                          <Badge variant="secondary">{product.category}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {currencyFormatter.format(product.price)}
                      </TableCell>
                      <TableCell className="text-right">
                        {product.stock_quantity}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </main>
  );
}
