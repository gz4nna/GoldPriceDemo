export interface GoldPrice {
  id: number;
  basePrice: number;
  retailMargin: number;
  salePrice: number;
  updateTime: string; // 后端返回的是 ISO 时间字符串
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}