const express = require('express');
const stockRoutes = require('./src/routes/stockRoutes');

const app = express();
app.use(express.json());

app.use('/api', stockRoutes);

app.listen(3000, () => console.log('Stock Service running on port 3000'));
