"""
API для поиска строительных материалов в Новосибирске.
Поддерживает фильтрацию по районам, категориям, цене, наличию и рейтингу.
"""
import json
import os
import psycopg2

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 't_p34696980_building_materials_f')
CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
}


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    params = event.get('queryStringParameters') or {}
    action = params.get('action', 'products')

    conn = get_conn()
    cur = conn.cursor()

    try:
        if action == 'districts':
            cur.execute(f"SELECT id, name, slug FROM {SCHEMA}.districts ORDER BY name")
            rows = cur.fetchall()
            data = [{'id': r[0], 'name': r[1], 'slug': r[2]} for r in rows]

        elif action == 'categories':
            cur.execute(f"SELECT id, name, slug, icon FROM {SCHEMA}.categories ORDER BY name")
            rows = cur.fetchall()
            data = [{'id': r[0], 'name': r[1], 'slug': r[2], 'icon': r[3]} for r in rows]

        elif action == 'shops':
            district_id = params.get('district_id')
            if district_id:
                cur.execute(f"""
                    SELECT s.id, s.name, d.name as district, s.address, s.phone,
                           s.working_hours, s.rating, s.map_x, s.map_y,
                           COUNT(DISTINCT o.product_id) as products_count
                    FROM {SCHEMA}.shops s
                    JOIN {SCHEMA}.districts d ON d.id = s.district_id
                    LEFT JOIN {SCHEMA}.offers o ON o.shop_id = s.id
                    WHERE s.district_id = {int(district_id)}
                    GROUP BY s.id, d.name
                    ORDER BY s.rating DESC
                """)
            else:
                cur.execute(f"""
                    SELECT s.id, s.name, d.name as district, s.address, s.phone,
                           s.working_hours, s.rating, s.map_x, s.map_y,
                           COUNT(DISTINCT o.product_id) as products_count
                    FROM {SCHEMA}.shops s
                    JOIN {SCHEMA}.districts d ON d.id = s.district_id
                    LEFT JOIN {SCHEMA}.offers o ON o.shop_id = s.id
                    GROUP BY s.id, d.name
                    ORDER BY s.rating DESC
                """)
            rows = cur.fetchall()
            data = [{
                'id': r[0], 'name': r[1], 'district': r[2], 'address': r[3],
                'phone': r[4], 'working_hours': r[5], 'rating': float(r[6]),
                'map_x': float(r[7]), 'map_y': float(r[8]), 'products_count': r[9]
            } for r in rows]

        elif action == 'map_districts':
            cur.execute(f"""
                SELECT d.id, d.name, d.slug,
                       COUNT(DISTINCT s.id) as shops_count,
                       MAX(s.map_x) as map_x, MAX(s.map_y) as map_y
                FROM {SCHEMA}.districts d
                LEFT JOIN {SCHEMA}.shops s ON s.district_id = d.id
                GROUP BY d.id, d.name, d.slug
                ORDER BY d.id
            """)
            rows = cur.fetchall()
            data = [{
                'id': r[0], 'name': r[1], 'slug': r[2],
                'shops': r[3], 'map_x': float(r[4]) if r[4] else 50, 'map_y': float(r[5]) if r[5] else 50
            } for r in rows]

        else:
            # action = products (default)
            search = params.get('search', '').strip()
            district_id = params.get('district_id')
            category_id = params.get('category_id')
            in_stock = params.get('in_stock')
            min_rating = params.get('min_rating', '0')
            price_min = params.get('price_min', '0')
            price_max = params.get('price_max', '9999999')
            limit = min(int(params.get('limit', '50')), 100)

            where_clauses = []
            if search:
                safe = search.replace("'", "''")
                where_clauses.append(f"(p.name ILIKE '%{safe}%' OR p.description ILIKE '%{safe}%' OR p.brand ILIKE '%{safe}%' OR c.name ILIKE '%{safe}%')")
            if district_id:
                where_clauses.append(f"s.district_id = {int(district_id)}")
            if category_id:
                where_clauses.append(f"p.category_id = {int(category_id)}")
            if in_stock == 'true':
                where_clauses.append("o.in_stock = TRUE")
            if min_rating and float(min_rating) > 0:
                where_clauses.append(f"s.rating >= {float(min_rating)}")
            where_clauses.append(f"o.price >= {float(price_min)}")
            where_clauses.append(f"o.price <= {float(price_max)}")

            where_sql = "WHERE " + " AND ".join(where_clauses) if where_clauses else ""

            cur.execute(f"""
                SELECT
                    p.id, p.name, c.name as category, p.unit, p.brand, p.description,
                    MIN(o.price) as min_price,
                    MAX(o.price) as max_price,
                    BOOL_OR(o.in_stock) as in_stock,
                    ROUND(AVG(s.rating), 1) as avg_rating,
                    COUNT(DISTINCT o.shop_id) as shops_count,
                    d.name as district,
                    s.name as best_shop,
                    MIN(o.price) as best_price
                FROM {SCHEMA}.products p
                JOIN {SCHEMA}.categories c ON c.id = p.category_id
                JOIN {SCHEMA}.offers o ON o.product_id = p.id
                JOIN {SCHEMA}.shops s ON s.id = o.shop_id
                JOIN {SCHEMA}.districts d ON d.id = s.district_id
                {where_sql}
                GROUP BY p.id, p.name, c.name, p.unit, p.brand, p.description, d.name, s.name
                ORDER BY avg_rating DESC, min_price ASC
                LIMIT {limit}
            """)
            rows = cur.fetchall()
            data = [{
                'id': r[0], 'name': r[1], 'category': r[2], 'unit': r[3],
                'brand': r[4], 'description': r[5],
                'min_price': float(r[6]), 'max_price': float(r[7]),
                'in_stock': r[8], 'rating': float(r[9]),
                'shops_count': r[10], 'district': r[11],
                'best_shop': r[12], 'best_price': float(r[13])
            } for r in rows]

        conn.close()
        return {
            'statusCode': 200,
            'headers': {**CORS_HEADERS, 'Content-Type': 'application/json'},
            'body': json.dumps({'success': True, 'data': data, 'count': len(data)}, ensure_ascii=False)
        }

    except Exception as e:
        conn.close()
        return {
            'statusCode': 500,
            'headers': {**CORS_HEADERS, 'Content-Type': 'application/json'},
            'body': json.dumps({'success': False, 'error': str(e)}, ensure_ascii=False)
        }
