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

-- 주문(orders) / 주문 상품(order_items) 테이블
-- 로그인 기능이 아직 없으므로 브라우저별 guest_id(UUID, localStorage 저장)로 주문을 식별한다.

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  guest_id uuid not null,
  status text not null default 'pending',
  total_amount numeric(12, 2) not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists orders_guest_id_idx on orders (guest_id, created_at desc);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  product_id uuid not null references products (id),
  product_name text not null,
  unit_price numeric(12, 2) not null,
  quantity integer not null check (quantity > 0)
);

create index if not exists order_items_order_id_idx on order_items (order_id);

-- 개발 단계: 인증이 없어 guest_id 기반으로만 필터링한다 (RLS로 guest_id 소유권을 검증할 수 없음).
-- Supabase Auth 도입 시 guest_id -> user_id로 마이그레이션하고 정책을 auth.uid() 기반으로 다시 작성해야 한다.
alter table orders enable row level security;
alter table order_items enable row level security;

drop policy if exists "Public read/write access" on orders;
create policy "Public read/write access"
  on orders for all
  using (true)
  with check (true);

drop policy if exists "Public read/write access" on order_items;
create policy "Public read/write access"
  on order_items for all
  using (true)
  with check (true);

-- 장바구니 -> 주문 생성을 원자적으로 처리 (재고 차감 포함)
-- items 예시: '[{"product_id": "...", "quantity": 2}]'::jsonb
create or replace function create_order(guest_id uuid, items jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_order_id uuid;
  item record;
  current_stock integer;
  current_price numeric(12, 2);
  current_name text;
begin
  if jsonb_array_length(items) = 0 then
    raise exception 'no items in order';
  end if;

  insert into orders (guest_id, status, total_amount)
  values (create_order.guest_id, 'pending', 0)
  returning id into new_order_id;

  for item in
    select * from jsonb_to_recordset(items) as x(product_id uuid, quantity integer)
  loop
    select price, stock_quantity, name
      into current_price, current_stock, current_name
      from products
      where id = item.product_id
      for update;

    if current_stock is null then
      raise exception '상품을 찾을 수 없습니다: %', item.product_id;
    end if;

    if current_stock < item.quantity then
      raise exception '재고가 부족합니다: % (재고 %, 요청 %)', current_name, current_stock, item.quantity;
    end if;

    update products
      set stock_quantity = stock_quantity - item.quantity
      where id = item.product_id;

    insert into order_items (order_id, product_id, product_name, unit_price, quantity)
      values (new_order_id, item.product_id, current_name, current_price, item.quantity);
  end loop;

  update orders
    set total_amount = (
      select coalesce(sum(unit_price * quantity), 0)
      from order_items
      where order_id = new_order_id
    )
    where id = new_order_id;

  return new_order_id;
end;
$$;
