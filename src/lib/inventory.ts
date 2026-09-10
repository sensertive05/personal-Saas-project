// 재고 부족 판단 기준. 상품별 개별 설정 없이 전체 상품에 동일한 고정 임계값을 적용한다.
export const LOW_STOCK_THRESHOLD = 5;

export function isLowStock(stockQuantity: number): boolean {
  return stockQuantity > 0 && stockQuantity <= LOW_STOCK_THRESHOLD;
}
