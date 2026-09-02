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

-- 개발 단계: 관리자 인증이 아직 없어 조회/등록 모두 누구나 가능하도록 허용
-- (Supabase Auth 도입 시 등록/수정/삭제는 관리자 역할로 제한해야 함)
alter table products enable row level security;

drop policy if exists "Public read access" on products;
create policy "Public read access"
  on products for select
  using (true);

drop policy if exists "Public insert access" on products;
create policy "Public insert access"
  on products for insert
  with check (true);

-- 재고 수량만 안전하게 수정할 수 있는 함수 (RLS로는 컬럼 단위 제한이 불가능해
-- "누구나 update 가능" 정책을 products 테이블 전체에 걸면 가격/이름까지 바뀔 수 있다.
-- 대신 이 함수만 노출해 stock_quantity 외 컬럼은 수정할 수 없도록 한다.)
create or replace function update_product_stock(product_id uuid, stock_quantity integer)
returns products
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_product products;
begin
  if stock_quantity < 0 then
    raise exception '재고 수량은 0 이상이어야 합니다: %', stock_quantity;
  end if;

  update products
    set stock_quantity = update_product_stock.stock_quantity
    where id = update_product_stock.product_id
    returning * into updated_product;

  if updated_product is null then
    raise exception '상품을 찾을 수 없습니다: %', product_id;
  end if;

  return updated_product;
end;
$$;

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

-- orders는 select만 공개로 열어둔다. insert(create_order)와 status 변경(update_order_status)은
-- 모두 SECURITY DEFINER 함수를 통해서만 이뤄지므로 테이블에 별도 insert/update 정책이 필요 없다.
-- "for all" 정책은 guest_id/total_amount 등 다른 컬럼까지 클라이언트가 직접 바꿀 수 있게 열어버려 제거했다.
drop policy if exists "Public read/write access" on orders;
drop policy if exists "Public read access" on orders;
create policy "Public read access"
  on orders for select
  using (true);

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

-- 주문 상태만 안전하게 변경할 수 있는 함수 (products의 update_product_stock과 동일한 이유:
-- orders의 permissive RLS 정책으로는 status 외 컬럼(guest_id, total_amount 등)까지 열리므로
-- 이 함수만 노출해 status 외 컬럼은 수정할 수 없도록 한다.)
create or replace function update_order_status(order_id uuid, status text)
returns orders
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_order orders;
begin
  if status not in ('pending', 'confirmed', 'shipped', 'completed', 'cancelled') then
    raise exception '유효하지 않은 주문 상태입니다: %', status;
  end if;

  update orders
    set status = update_order_status.status
    where id = update_order_status.order_id
    returning * into updated_order;

  if updated_order is null then
    raise exception '주문을 찾을 수 없습니다: %', order_id;
  end if;

  return updated_order;
end;
$$;
