const express = require('express');
const { createProduct, createStock, increaseStock, decreaseStock, getStock, getProducts } = require('../controllers/stockController');
const router = express.Router();

router.post('/products', createProduct); // Создание нового товара
router.post('/stocks', createStock); // Создание остатка для товара
router.patch('/stocks/increase', increaseStock); // Увеличение остатков
router.patch('/stocks/decrease', decreaseStock); // Уменьшение остатков
router.get('/stocks', getStock); // Получение остатков с фильтрами
router.get('/products', getProducts);  // Получение товаров по фильтрам


module.exports = router;
