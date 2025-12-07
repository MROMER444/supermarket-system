const prisma = require('../utils/prisma');

const createSupplier = async (req, res) => {
    try {
        const { name, contactInfo, address } = req.body;
        const supplier = await prisma.supplier.create({
            data: { name, contactInfo, address },
        });
        res.status(201).json(supplier);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getSuppliers = async (req, res) => {
    try {
        const suppliers = await prisma.supplier.findMany();
        res.status(200).json(suppliers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateSupplier = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, contactInfo, address } = req.body;
        const supplier = await prisma.supplier.update({
            where: { id: parseInt(id) },
            data: { name, contactInfo, address },
        });
        res.status(200).json(supplier);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deleteSupplier = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.supplier.delete({
            where: { id: parseInt(id) },
        });
        res.status(200).json({ message: 'Supplier deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { createSupplier, getSuppliers, updateSupplier, deleteSupplier };
