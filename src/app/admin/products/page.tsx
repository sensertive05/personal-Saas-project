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
import { Dialog, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import {
  createProduct,
  deleteProduct,
  getProducts,
  updateProduct,
} from "@/lib/queries/products";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import type { Product } from "@/types/product";

const currencyFormatter = new Intl.NumberFormat("ko-KR", {
  style: "currency",
  currency: "KRW",
});

interface ProductFormValues {
  name: string;
  description: string;
  price: string;
  stockQuantity: string;
  category: string;
  imageUrl: string;
}

const emptyForm: ProductFormValues = {
  name: "",
  description: "",
  price: "",
  stockQuantity: "",
  category: "",
  imageUrl: "",
};

function isProductFormValid(values: ProductFormValues) {
  return (
    values.name.trim().length > 0 &&
    values.price.trim().length > 0 &&
    !Number.isNaN(Number(values.price)) &&
    Number(values.price) >= 0 &&
    values.stockQuantity.trim().length > 0 &&
    !Number.isNaN(Number(values.stockQuantity)) &&
    Number(values.stockQuantity) >= 0
  );
}

function ProductForm({
  idPrefix,
  values,
  onChange,
  onSubmit,
  submitLabel,
  pendingLabel,
  isPending,
  isError,
  errorMessage,
  isSuccess,
  successMessage,
}: {
  idPrefix: string;
  values: ProductFormValues;
  onChange: (values: ProductFormValues) => void;
  onSubmit: (e: React.FormEvent) => void;
  submitLabel: string;
  pendingLabel: string;
  isPending: boolean;
  isError: boolean;
  errorMessage: string;
  isSuccess?: boolean;
  successMessage?: string;
}) {
  return (
    <form className="grid gap-4 sm:grid-cols-2" onSubmit={onSubmit}>
      <div className="grid gap-1.5">
        <Label htmlFor={`${idPrefix}-name`}>상품명</Label>
        <Input
          id={`${idPrefix}-name`}
          value={values.name}
          onChange={(e) => onChange({ ...values, name: e.target.value })}
          required
        />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor={`${idPrefix}-category`}>카테고리</Label>
        <Input
          id={`${idPrefix}-category`}
          value={values.category}
          onChange={(e) => onChange({ ...values, category: e.target.value })}
        />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor={`${idPrefix}-price`}>가격</Label>
        <Input
          id={`${idPrefix}-price`}
          type="number"
          min="0"
          step="1"
          value={values.price}
          onChange={(e) => onChange({ ...values, price: e.target.value })}
          required
        />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor={`${idPrefix}-stockQuantity`}>재고 수량</Label>
        <Input
          id={`${idPrefix}-stockQuantity`}
          type="number"
          min="0"
          step="1"
          value={values.stockQuantity}
          onChange={(e) => onChange({ ...values, stockQuantity: e.target.value })}
          required
        />
      </div>

      <div className="grid gap-1.5 sm:col-span-2">
        <Label htmlFor={`${idPrefix}-imageUrl`}>이미지 URL</Label>
        <Input
          id={`${idPrefix}-imageUrl`}
          value={values.imageUrl}
          onChange={(e) => onChange({ ...values, imageUrl: e.target.value })}
          placeholder="https://..."
        />
      </div>

      <div className="grid gap-1.5 sm:col-span-2">
        <Label htmlFor={`${idPrefix}-description`}>설명</Label>
        <Textarea
          id={`${idPrefix}-description`}
          value={values.description}
          onChange={(e) => onChange({ ...values, description: e.target.value })}
        />
      </div>

      {isError && (
        <p className="text-destructive text-sm sm:col-span-2">{errorMessage}</p>
      )}

      {isSuccess && (
        <p className="text-sm text-emerald-600 sm:col-span-2">{successMessage}</p>
      )}

      <div className="sm:col-span-2">
        <Button type="submit" disabled={!isProductFormValid(values) || isPending}>
          {isPending ? pendingLabel : submitLabel}
        </Button>
      </div>
    </form>
  );
}

function toFormValues(product: Product): ProductFormValues {
  return {
    name: product.name,
    description: product.description ?? "",
    price: String(product.price),
    stockQuantity: String(product.stock_quantity),
    category: product.category ?? "",
    imageUrl: product.image_url ?? "",
  };
}

export default function AdminProductsPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(emptyForm);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState<ProductFormValues>(emptyForm);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

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

  const updateProductMutation = useMutation({
    mutationFn: () =>
      updateProduct(editingProduct!.id, {
        name: editForm.name.trim(),
        description: editForm.description.trim() || null,
        price: Number(editForm.price),
        stock_quantity: Number(editForm.stockQuantity),
        category: editForm.category.trim() || null,
        image_url: editForm.imageUrl.trim() || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setEditingProduct(null);
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: () => deleteProduct(deletingProduct!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setDeletingProduct(null);
    },
  });

  function openEditDialog(product: Product) {
    setEditForm(toFormValues(product));
    setEditingProduct(product);
    updateProductMutation.reset();
  }

  function openDeleteDialog(product: Product) {
    setDeletingProduct(product);
    deleteProductMutation.reset();
  }

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
            <ProductForm
              idPrefix="create"
              values={form}
              onChange={setForm}
              onSubmit={(e) => {
                e.preventDefault();
                createProductMutation.mutate();
              }}
              submitLabel="상품 등록"
              pendingLabel="등록 중..."
              isPending={createProductMutation.isPending}
              isError={createProductMutation.isError}
              errorMessage={
                createProductMutation.error instanceof Error
                  ? createProductMutation.error.message
                  : "상품 등록에 실패했습니다."
              }
              isSuccess={createProductMutation.isSuccess}
              successMessage="상품이 등록되었습니다."
            />
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
                    <TableHead className="text-right">작업</TableHead>
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
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(product)}
                          >
                            수정
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => openDeleteDialog(product)}
                          >
                            삭제
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog
        open={!!editingProduct}
        onOpenChange={(open) => !open && setEditingProduct(null)}
      >
        <DialogHeader>
          <DialogTitle>상품 수정</DialogTitle>
        </DialogHeader>
        <ProductForm
          idPrefix="edit"
          values={editForm}
          onChange={setEditForm}
          onSubmit={(e) => {
            e.preventDefault();
            updateProductMutation.mutate();
          }}
          submitLabel="저장"
          pendingLabel="저장 중..."
          isPending={updateProductMutation.isPending}
          isError={updateProductMutation.isError}
          errorMessage={
            updateProductMutation.error instanceof Error
              ? updateProductMutation.error.message
              : "상품 수정에 실패했습니다."
          }
        />
      </Dialog>

      <Dialog
        open={!!deletingProduct}
        onOpenChange={(open) => !open && setDeletingProduct(null)}
      >
        <DialogHeader>
          <DialogTitle>상품 삭제</DialogTitle>
          <DialogDescription>
            &lsquo;{deletingProduct?.name}&rsquo; 상품을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
          </DialogDescription>
        </DialogHeader>

        {deleteProductMutation.isError && (
          <p className="text-destructive mb-4 text-sm">
            {deleteProductMutation.error instanceof Error
              ? deleteProductMutation.error.message
              : "삭제에 실패했습니다."}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setDeletingProduct(null)}>
            취소
          </Button>
          <Button
            variant="destructive"
            disabled={deleteProductMutation.isPending}
            onClick={() => deleteProductMutation.mutate()}
          >
            {deleteProductMutation.isPending ? "삭제 중..." : "삭제"}
          </Button>
        </div>
      </Dialog>
    </main>
  );
}
