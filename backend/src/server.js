const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const authRoutes = require('./routes/auth.routes');
const categoryRoutes = require('./routes/category.routes');
const supplierRoutes = require('./routes/supplier.routes');
const productRoutes = require('./routes/product.routes');
const posRoutes = require('./routes/pos.routes');
const orderRoutes = require('./routes/order.routes');
const settingsRoutes = require('./routes/settings.routes');
const refundRoutes = require('./routes/refund.routes');
const printRoutes = require('./routes/print.routes');

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/products', productRoutes);
app.use('/api/pos', posRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/refunds', refundRoutes);
app.use('/api/print', printRoutes);

app.get('/', (req, res) => {
    res.send('Supermarket System API is running');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
