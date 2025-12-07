const prisma = require('../utils/prisma');

const createCategory = async (req, res) => {
    try {
        const { name, description } = req.body;
        const category = await prisma.category.create({
            data: { name, description },
        });
        res.status(201).json(category);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getCategories = async (req, res) => {
    try {
        const categories = await prisma.category.findMany();
        res.status(200).json(categories);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;
        const category = await prisma.category.update({
            where: { id: parseInt(id) },
            data: { name, description },
        });
        res.status(200).json(category);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const categoryId = parseInt(id);

        // Check if category exists
        const category = await prisma.category.findUnique({
            where: { id: categoryId },
        });

        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        // Check if there are any products using this category
        const productsCount = await prisma.product.count({
            where: { categoryId: categoryId },
        });

        // If there are products, move them to "Uncategorized" category
        if (productsCount > 0) {
            // Find or create "Uncategorized" category
            let uncategorizedCategory = await prisma.category.findFirst({
                where: { name: 'Uncategorized' },
            });

            if (!uncategorizedCategory) {
                // Create "Uncategorized" category if it doesn't exist
                uncategorizedCategory = await prisma.category.create({
                    data: {
                        name: 'Uncategorized',
                        description: 'Products without a specific category',
                    },
                });
                console.log('Created "Uncategorized" category');
            }

            // Move all products from this category to "Uncategorized"
            await prisma.product.updateMany({
                where: { categoryId: categoryId },
                data: { categoryId: uncategorizedCategory.id },
            });

            console.log(`Moved ${productsCount} product(s) to "Uncategorized" category`);
        }

        // Now safe to delete the category
        await prisma.category.delete({
            where: { id: categoryId },
        });

        res.status(200).json({
            message: productsCount > 0
                ? `Category deleted successfully. ${productsCount} product(s) moved to "Uncategorized" category.`
                : 'Category deleted successfully',
            productsMoved: productsCount,
        });
    } catch (error) {
        // Handle foreign key constraint errors (in case check above missed something)
        if (error.code === 'P2003' || error.message.includes('Foreign key constraint')) {
            return res.status(400).json({
                message: 'Cannot delete category. There are products or other records using this category.',
            });
        }
        res.status(500).json({ message: error.message });
    }
};

module.exports = { createCategory, getCategories, updateCategory, deleteCategory };
