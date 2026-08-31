-- 상품(products) 테이블
-- Supabase SQL Editor에서 실행하세요.

create extension if not exists "pgcrypto";

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price numeric(12, 2) not null check (price >= 0),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  category text,
  image_url text,
  created_at timestamptz not null default now()
);

create index if not exists products_created_at_idx on products (created_at desc);

-- 개발 단계: 조회는 누구나 가능하도록 허용 (인증 도입 시 정책 재정의 필요)
alter table products enable row level security;

drop policy if exists "Public read access" on products;
create policy "Public read access"
  on products for select
  using (true);

-- 샘플 데이터 (선택)
insert into products (name, description, price, stock_quantity, category)
values
  ('아메리카노 원두 1kg', '고소한 브라질 산티스 원두', 18000, 42, '원두'),
  ('종이컵 (12oz, 50개입)', '테이크아웃용 종이컵', 6500, 120, '소모품'),
  ('헬스장 수건 세트', '3장 세트, 극세사 소재', 15000, 0, '용품')
on conflict do nothing;
