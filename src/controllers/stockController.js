const pool = require('../db');
const axios = require('axios');

const HISTORY_SERVICE_URL = process.env.HISTORY_SERVICE_URL || 'http://localhost:4000/api/history/actions';

/**
 * Логирование действий в History Service
 */
async function logAction(actionType, productId, shopId, details) {
    try {
        await axios.post(HISTORY_SERVICE_URL, {
            action_type: actionType,
            product_id: productId,
            shop_id: shopId,
            details,
        });
    } catch (error) {
        console.error('Ошибка при логировании действия:', error.message);
    }
}

/**
 * Создание нового товара
 */
exports.createProduct = async (req, res) => {
    const { plu, name } = req.body;

    if (!plu || !name) {
        return res.status(400).json({ error: 'PLU и имя товара обязательны' });
    }

    try {
        const result = await pool.query(
            'INSERT INTO products (plu, name) VALUES ($1, $2) RETURNING *',
            [plu, name]
        );

        const product = result.rows[0];

        await logAction('CREATE_PRODUCT', product.id, null, { name });

        res.status(201).json(product);
    } catch (error) {
        console.error('Ошибка при создании товара:', error.message);
        res.status(500).json({ error: 'Не удалось создать товар' });
    }
};

/**
 * Создание остатка для товара
 */
exports.createStock = async (req, res) => {
    const { product_id, shop_id, on_shelf, in_order } = req.body;

    if (!product_id || !shop_id) {
        return res.status(400).json({ error: 'product_id и shop_id обязательны' });
    }

    try {
        const result = await pool.query(
            'INSERT INTO stock (product_id, shop_id, on_shelf, in_order) VALUES ($1, $2, $3, $4) RETURNING *',
            [product_id, shop_id, on_shelf || 0, in_order || 0]
        );

        const stock = result.rows[0];

        await logAction('CREATE_STOCK', product_id, shop_id, { on_shelf, in_order });

        res.status(201).json(stock);
    } catch (error) {
        console.error('Ошибка при создании остатка:', error.message);
        res.status(500).json({ error: 'Не удалось создать остаток' });
    }
};

/**
 * Увеличение остатков
 */
exports.increaseStock = async (req, res) => {
    const { stock_id, quantity } = req.body;

    if (!stock_id || !quantity) {
        return res.status(400).json({ error: 'stock_id и количество обязательны' });
    }

    try {
        const result = await pool.query(
            'UPDATE stock SET on_shelf = on_shelf + $1 WHERE id = $2 RETURNING *',
            [quantity, stock_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Остаток не найден' });
        }

        const updatedStock = result.rows[0];

        await logAction('INCREASE_STOCK', updatedStock.product_id, updatedStock.shop_id, { quantity });

        res.status(200).json(updatedStock);
    } catch (error) {
        console.error('Ошибка при увеличении остатков:', error.message);
        res.status(500).json({ error: 'Не удалось увеличить остаток' });
    }
};

/**
 * Уменьшение остатков
 */
exports.decreaseStock = async (req, res) => {
    const { stock_id, quantity } = req.body;

    if (!stock_id || !quantity) {
        return res.status(400).json({ error: 'stock_id и количество обязательны' });
    }

    try {
        const result = await pool.query(
            'UPDATE stock SET on_shelf = on_shelf - $1 WHERE id = $2 AND on_shelf >= $1 RETURNING *',
            [quantity, stock_id]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({ error: 'Недостаточно остатков или остаток не найден' });
        }

        const updatedStock = result.rows[0];

        await logAction('DECREASE_STOCK', updatedStock.product_id, updatedStock.shop_id, { quantity });

        res.status(200).json(updatedStock);
    } catch (error) {
        console.error('Ошибка при уменьшении остатков:', error.message);
        res.status(500).json({ error: 'Не удалось уменьшить остаток' });
    }
};

/**
 * Получение остатков по фильтрам
 */
exports.getStock = async (req, res) => {
    const { plu, shop_id, on_shelf_min, on_shelf_max, in_order_min, in_order_max } = req.query;

    if (Object.keys(req.query).length === 0) {
        return res.status(400).json({ error: 'Не указаны параметры фильтрации' });
    }
    
    try {
        let query = `
            SELECT s.*, p.plu, p.name, sh.name AS shop_name
            FROM stock s
            JOIN products p ON s.product_id = p.id
            JOIN shops sh ON s.shop_id = sh.id
            WHERE 1=1
        `;
        const values = [];

        if (plu) {
            values.push(plu);
            query += ` AND p.plu = $${values.length}`;
        }

        if (shop_id) {
            values.push(shop_id);
            query += ` AND s.shop_id = $${values.length}`;
        }

        if (on_shelf_min) {
            values.push(on_shelf_min);
            query += ` AND s.on_shelf >= $${values.length}`;
        }

        if (on_shelf_max) {
            values.push(on_shelf_max);
            query += ` AND s.on_shelf <= $${values.length}`;
        }

        if (in_order_min) {
            values.push(in_order_min);
            query += ` AND s.in_order >= $${values.length}`;
        }

        if (in_order_max) {
            values.push(in_order_max);
            query += ` AND s.in_order <= $${values.length}`;
        }

        const result = await pool.query(query, values);

        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Ошибка при получении остатков:', error.message);
        res.status(500).json({ error: 'Не удалось получить остатки' });
    }
};

/**
 * Получение товаров по фильтрам
 */
exports.getProducts = async (req, res) => {
    const { plu, name } = req.query;

    if (Object.keys(req.query).length === 0) {
        return res.status(400).json({ error: 'Не указаны параметры фильтрации' });
    }
    
    try {
        let query = `
            SELECT * 
            FROM products 
            WHERE 1=1
        `;
        const values = [];

        // Фильтрация по PLU (артикулу)
        if (plu) {
            values.push(plu);
            query += ` AND plu = $${values.length}`;
        }

        // Фильтрация по имени товара
        if (name) {
            values.push(`%${name}%`);
            query += ` AND name ILIKE $${values.length}`;
        }

        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Товары не найдены' });
        }

        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Ошибка при получении товаров:', error.message);
        res.status(500).json({ error: 'Не удалось получить товары' });
    }
};
