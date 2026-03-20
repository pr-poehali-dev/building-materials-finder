import json
import os
import psycopg2
from datetime import datetime

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 't_p34696980_building_materials_f')
CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token',
}

def ok(data):
    return {'statusCode': 200, 'headers': {**CORS, 'Content-Type': 'application/json'}, 'body': json.dumps({'success': True, 'data': data}, ensure_ascii=False, default=str)}

def err(msg, code=400):
    return {'statusCode': code, 'headers': {**CORS, 'Content-Type': 'application/json'}, 'body': json.dumps({'success': False, 'error': msg}, ensure_ascii=False)}

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'], options=f'-c search_path={SCHEMA}')

def check_auth(event):
    token = event.get('headers', {}).get('X-Admin-Token', '')
    return token == os.environ.get('ADMIN_PASSWORD', '')

def handler(event: dict, context) -> dict:
    """Административная панель управления базой строительных товаров Новосибирска"""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    if not check_auth(event):
        return err('Неверный пароль', 401)

    method = event.get('httpMethod', 'GET')
    body = {}
    if event.get('body'):
        try:
            body = json.loads(event['body'])
        except Exception:
            pass

    action = (event.get('queryStringParameters') or {}).get('action', '') or body.get('action', '')
    conn = get_conn()
    cur = conn.cursor()

    try:
        # ── DISTRICTS ──────────────────────────────────────────────────
        if action == 'get_districts':
            cur.execute("SELECT id, name, slug FROM districts ORDER BY name")
            rows = [{'id': r[0], 'name': r[1], 'slug': r[2]} for r in cur.fetchall()]
            return ok(rows)

        # ── CATEGORIES ────────────────────────────────────────────────
        if action == 'get_categories':
            cur.execute("SELECT id, name, slug, icon FROM categories ORDER BY name")
            rows = [{'id': r[0], 'name': r[1], 'slug': r[2], 'icon': r[3]} for r in cur.fetchall()]
            return ok(rows)

        # ── SHOPS ─────────────────────────────────────────────────────
        if action == 'get_shops':
            cur.execute("""
                SELECT s.id, s.name, d.name as district, s.district_id, s.address,
                       s.phone, s.working_hours, s.rating, s.map_x, s.map_y,
                       COUNT(o.id) as offers_count
                FROM shops s
                LEFT JOIN districts d ON d.id = s.district_id
                LEFT JOIN offers o ON o.shop_id = s.id
                GROUP BY s.id, d.name ORDER BY s.name
            """)
            cols = ['id','name','district','district_id','address','phone','working_hours','rating','map_x','map_y','offers_count']
            rows = [dict(zip(cols, r)) for r in cur.fetchall()]
            return ok(rows)

        if action == 'create_shop':
            cur.execute("""
                INSERT INTO shops (name, district_id, address, phone, working_hours, rating, map_x, map_y)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id
            """, (body['name'], body['district_id'], body.get('address',''), body.get('phone',''),
                  body.get('working_hours',''), body.get('rating', 4.0), body.get('map_x', 50), body.get('map_y', 50)))
            new_id = cur.fetchone()[0]
            conn.commit()
            return ok({'id': new_id})

        if action == 'update_shop':
            cur.execute("""
                UPDATE shops SET name=%s, district_id=%s, address=%s, phone=%s,
                working_hours=%s, rating=%s, map_x=%s, map_y=%s WHERE id=%s
            """, (body['name'], body['district_id'], body.get('address',''), body.get('phone',''),
                  body.get('working_hours',''), body.get('rating', 4.0), body.get('map_x', 50), body.get('map_y', 50), body['id']))
            conn.commit()
            return ok({'updated': True})

        if action == 'delete_shop':
            cur.execute("DELETE FROM offers WHERE shop_id=%s", (body['id'],))
            cur.execute("DELETE FROM shops WHERE id=%s", (body['id'],))
            conn.commit()
            return ok({'deleted': True})

        # ── PRODUCTS ──────────────────────────────────────────────────
        if action == 'get_products':
            cur.execute("""
                SELECT p.id, p.name, c.name as category, p.category_id, p.description,
                       p.unit, p.brand, p.image_url,
                       COUNT(o.id) as offers_count,
                       MIN(o.price) as min_price, MAX(o.price) as max_price
                FROM products p
                LEFT JOIN categories c ON c.id = p.category_id
                LEFT JOIN offers o ON o.product_id = p.id
                GROUP BY p.id, c.name ORDER BY p.name
            """)
            cols = ['id','name','category','category_id','description','unit','brand','image_url','offers_count','min_price','max_price']
            rows = [dict(zip(cols, r)) for r in cur.fetchall()]
            return ok(rows)

        if action == 'create_product':
            cur.execute("""
                INSERT INTO products (name, category_id, description, unit, brand, image_url)
                VALUES (%s,%s,%s,%s,%s,%s) RETURNING id
            """, (body['name'], body['category_id'], body.get('description',''),
                  body.get('unit','шт'), body.get('brand',''), body.get('image_url','')))
            new_id = cur.fetchone()[0]
            conn.commit()
            return ok({'id': new_id})

        if action == 'update_product':
            cur.execute("""
                UPDATE products SET name=%s, category_id=%s, description=%s,
                unit=%s, brand=%s, image_url=%s WHERE id=%s
            """, (body['name'], body['category_id'], body.get('description',''),
                  body.get('unit','шт'), body.get('brand',''), body.get('image_url',''), body['id']))
            conn.commit()
            return ok({'updated': True})

        if action == 'delete_product':
            cur.execute("DELETE FROM offers WHERE product_id=%s", (body['id'],))
            cur.execute("DELETE FROM products WHERE id=%s", (body['id'],))
            conn.commit()
            return ok({'deleted': True})

        # ── OFFERS (цены) ─────────────────────────────────────────────
        if action == 'get_offers':
            product_id = body.get('product_id') or (event.get('queryStringParameters') or {}).get('product_id')
            cur.execute("""
                SELECT o.id, o.product_id, p.name as product_name,
                       o.shop_id, s.name as shop_name, d.name as district,
                       o.price, o.in_stock, o.updated_at
                FROM offers o
                JOIN products p ON p.id = o.product_id
                JOIN shops s ON s.id = o.shop_id
                JOIN districts d ON d.id = s.district_id
                WHERE (%s IS NULL OR o.product_id = %s)
                ORDER BY s.name
            """, (product_id, product_id))
            cols = ['id','product_id','product_name','shop_id','shop_name','district','price','in_stock','updated_at']
            rows = [dict(zip(cols, r)) for r in cur.fetchall()]
            return ok(rows)

        if action == 'upsert_offer':
            cur.execute("""
                INSERT INTO offers (product_id, shop_id, price, in_stock, updated_at)
                VALUES (%s,%s,%s,%s,NOW())
                ON CONFLICT (product_id, shop_id)
                DO UPDATE SET price=%s, in_stock=%s, updated_at=NOW()
                RETURNING id
            """, (body['product_id'], body['shop_id'], body['price'], body.get('in_stock', True),
                  body['price'], body.get('in_stock', True)))
            row = cur.fetchone()
            conn.commit()
            return ok({'id': row[0]})

        if action == 'delete_offer':
            cur.execute("DELETE FROM offers WHERE id=%s", (body['id'],))
            conn.commit()
            return ok({'deleted': True})

        # ── BULK IMPORT ───────────────────────────────────────────────
        if action == 'bulk_import':
            items = body.get('items', [])
            inserted = 0
            updated = 0
            for item in items:
                product_name = item.get('product_name', '').strip()
                category_id = item.get('category_id')
                shop_id = item.get('shop_id')
                price = item.get('price')
                in_stock = item.get('in_stock', True)
                unit = item.get('unit', 'шт')
                brand = item.get('brand', '')
                if not product_name or not shop_id or price is None:
                    continue
                cur.execute("SELECT id FROM products WHERE name=%s AND category_id=%s", (product_name, category_id))
                row = cur.fetchone()
                if row:
                    product_id = row[0]
                    updated += 1
                else:
                    cur.execute(
                        "INSERT INTO products (name, category_id, unit, brand) VALUES (%s,%s,%s,%s) RETURNING id",
                        (product_name, category_id, unit, brand)
                    )
                    product_id = cur.fetchone()[0]
                    inserted += 1
                cur.execute("""
                    INSERT INTO offers (product_id, shop_id, price, in_stock, updated_at)
                    VALUES (%s,%s,%s,%s,NOW())
                    ON CONFLICT (product_id, shop_id)
                    DO UPDATE SET price=%s, in_stock=%s, updated_at=NOW()
                """, (product_id, shop_id, price, in_stock, price, in_stock))
            conn.commit()
            return ok({'inserted_products': inserted, 'updated_products': updated, 'total_offers': len(items)})

        # ── STATS ─────────────────────────────────────────────────────
        if action == 'get_stats':
            cur.execute("SELECT COUNT(*) FROM products")
            products_count = cur.fetchone()[0]
            cur.execute("SELECT COUNT(*) FROM shops")
            shops_count = cur.fetchone()[0]
            cur.execute("SELECT COUNT(*) FROM offers")
            offers_count = cur.fetchone()[0]
            cur.execute("SELECT COUNT(*) FROM offers WHERE in_stock = TRUE")
            in_stock_count = cur.fetchone()[0]
            cur.execute("SELECT COUNT(*) FROM offers WHERE updated_at > NOW() - INTERVAL '7 days'")
            fresh_count = cur.fetchone()[0]
            return ok({
                'products': products_count,
                'shops': shops_count,
                'offers': offers_count,
                'in_stock': in_stock_count,
                'updated_week': fresh_count,
            })

        return err('Неизвестное действие')

    finally:
        cur.close()
        conn.close()
