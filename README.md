Сервис остатков товаров в магазине
<----Endpoints---->

Создание товара
POST /products
Body: { "plu": "12345", "name": "Товар 1" }

Создание остатка
POST /stock
Body: { "plu": "12345", "shop_id": 1, "on_shelf": 10, "in_order": 2 }

Увеличение остатка
PATCH /stock/increase
Body: { "plu": "12345", "shop_id": 1, "amount": 5 }

Уменьшение остатка
PATCH /stock/decrease
Body: { "plu": "12345", "shop_id": 1, "amount": 3 }

Получение остатков с фильтрами
GET /stock
Query Params: plu=12345&shop_id=1&on_shelf_min=10&on_shelf_max=20

Получение товаров с фильтрами
GET /products
Query Params: name=Товар 1&plu=12345


<----Примеры запросов---->

Создание товара (POST)
curl -X POST http://localhost:3000/api/products \
-H "Content-Type: application/json" \
-d '{"plu": "123", "name": "Product Name"}'

Создание остатка (POST)
curl -X POST http://localhost:3000/api/stocks \
-H "Content-Type: application/json" \
-d '{"product_id": "1", "shop_id": "1", "on_shelf": 50, "in_order": 20}'

Увеличение остатка (PATCH)
curl -X PATCH http://localhost:3000/api/stocks/increase \
-H "Content-Type: application/json" \
-d '{"stock_id": "1","quantity": 60}'

Уменьшение остатка (PATCH)
curl -X PATCH http://localhost:3000/api/stocks/increase \
-H "Content-Type: application/json" \
-d '{"stock_id": "1","quantity": 60}'

Получение остатков по фильтрам (GET)
curl -X GET "http://localhost:3000/api/stocks?plu=123&shop_id=1&quantity_on_shelf__gte=30&quantity_in_order__lte=20"

Получение товаров по фильтрам (GET)
curl -X GET "http://localhost:3000/api/products?plu=123&name=Product"