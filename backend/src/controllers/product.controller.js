const prisma = require('../utils/prisma');

// Generate a unique barcode
const generateBarcode = async () => {
    let barcode;
    let isUnique = false;
    
    while (!isUnique) {
        // Generate barcode: PRD + timestamp (last 8 digits) + random 4 digits
        const timestamp = Date.now().toString().slice(-8);
        const random = Math.floor(1000 + Math.random() * 9000); // 4-digit random number
        barcode = `PRD${timestamp}${random}`;
        
        // Check if barcode already exists
        const existing = await prisma.product.findUnique({
            where: { barcode }
        });
        
        if (!existing) {
            isUnique = true;
        }
    }
    
    return barcode;
};

const createProduct = async (req, res) => {
    try {
        const { name, barcode, categoryId, price, costPrice, quantity, minQuantity, supplierId, expiryDate } = req.body;
        
        // Auto-generate barcode if not provided
        let finalBarcode = barcode;
        if (!finalBarcode || finalBarcode.trim() === '') {
            finalBarcode = await generateBarcode();
        } else {
            // If barcode is provided, check if it's unique
            const existing = await prisma.product.findUnique({
                where: { barcode: finalBarcode }
            });
            if (existing) {
                return res.status(400).json({ message: 'Barcode already exists. Please use a different barcode or leave it empty to auto-generate.' });
            }
        }
        
        const product = await prisma.product.create({
            data: {
                name,
                barcode: finalBarcode,
                categoryId: parseInt(categoryId),
                price: parseFloat(price),
                costPrice: parseFloat(costPrice),
                quantity: parseInt(quantity),
                minQuantity: parseInt(minQuantity),
                supplierId: (supplierId && supplierId !== '') ? parseInt(supplierId) : null,
                expiryDate: (expiryDate && expiryDate !== '') ? new Date(expiryDate) : null,
            },
        });
        res.status(201).json(product);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getProducts = async (req, res) => {
    try {
        const { search, categoryId, lowStock, page = 1, limit = 10 } = req.query;
        let where = {};

        if (search) {
            where.OR = [
                { name: { contains: search } }, // Removed mode: 'insensitive' for MySQL compatibility if needed, or keep if Prisma handles it
                { barcode: { contains: search } },
            ];
        }

        if (categoryId) {
            where.categoryId = parseInt(categoryId);
        }

        if (lowStock === 'true') {
            where.quantity = {
                lte: prisma.product.fields.minQuantity,
            };
        }

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        // Get total count for pagination
        const total = await prisma.product.count({ where });

        const products = await prisma.product.findMany({
            where,
            include: { Category: true, Supplier: true },
            skip,
            take: limitNum,
            orderBy: { createdAt: 'desc' },
        });

        res.status(200).json({
            products,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum),
            },
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getProductByBarcode = async (req, res) => {
    try {
        const { barcode } = req.params;
        const product = await prisma.product.findUnique({
            where: { barcode },
            include: { Category: true },
        });
        if (!product) return res.status(404).json({ message: 'Product not found' });
        res.status(200).json(product);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;

        // If barcode is being changed, check if it's unique
        if (data.barcode) {
            const existing = await prisma.product.findFirst({
                where: { 
                    barcode: data.barcode,
                    id: { not: parseInt(id) } // Exclude current product
                }
            });
            if (existing) {
                return res.status(400).json({ message: 'Barcode already exists. Please use a different barcode.' });
            }
        }

        // Parse numbers
        if (data.categoryId) data.categoryId = parseInt(data.categoryId);
        if (data.price) data.price = parseFloat(data.price);
        if (data.costPrice) data.costPrice = parseFloat(data.costPrice);
        if (data.quantity) data.quantity = parseInt(data.quantity);
        if (data.minQuantity) data.minQuantity = parseInt(data.minQuantity);
        
        // Handle nullable fields - convert empty strings to null
        if (data.supplierId !== undefined) {
            if (data.supplierId === '' || data.supplierId === null) {
                data.supplierId = null;
            } else {
                data.supplierId = parseInt(data.supplierId);
            }
        }
        
        if (data.expiryDate !== undefined) {
            if (data.expiryDate === '' || data.expiryDate === null) {
                data.expiryDate = null;
            } else {
                data.expiryDate = new Date(data.expiryDate);
            }
        }

        const product = await prisma.product.update({
            where: { id: parseInt(id) },
            data,
        });
        res.status(200).json(product);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.product.delete({
            where: { id: parseInt(id) },
        });
        res.status(200).json({ message: 'Product deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { createProduct, getProducts, getProductByBarcode, updateProduct, deleteProduct };
