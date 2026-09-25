PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS commerce_category_profiles (
  category_no INTEGER PRIMARY KEY,
  category_name TEXT NOT NULL UNIQUE,
  product_type TEXT NOT NULL UNIQUE CHECK (product_type IN ('course','ebook','program','physical')),
  fulfillment_type TEXT NOT NULL CHECK (fulfillment_type IN ('entitlement','shipment')),
  requires_shipping INTEGER NOT NULL CHECK (requires_shipping IN (0,1)),
  post_purchase_path TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','archived')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO commerce_category_profiles (
  category_no,category_name,product_type,fulfillment_type,requires_shipping,post_purchase_path,status
) VALUES
  (42,'강의','course','entitlement',0,'/my-space','active'),
  (43,'전자책','ebook','entitlement',0,'/my-space','active'),
  (48,'프로그램','program','entitlement',0,'/my-space','active'),
  (53,'일반상품','physical','shipment',1,NULL,'active')
ON CONFLICT(category_no) DO UPDATE SET
  category_name=excluded.category_name,
  product_type=excluded.product_type,
  fulfillment_type=excluded.fulfillment_type,
  requires_shipping=excluded.requires_shipping,
  post_purchase_path=excluded.post_purchase_path,
  status='active',
  updated_at=CURRENT_TIMESTAMP;
