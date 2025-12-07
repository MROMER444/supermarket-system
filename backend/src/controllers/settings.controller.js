const prisma = require('../utils/prisma');

const getSettings = async (req, res) => {
    try {
        let settings = await prisma.settings.findFirst();
        if (!settings) {
            settings = await prisma.settings.create({
                data: {
                    storeName: 'My Supermarket',
                    currency: 'IQD',
                },
            });
        }
        res.status(200).json(settings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateSettings = async (req, res) => {
    try {
        const { storeName, address, currency, printerIp } = req.body;
        let settings = await prisma.settings.findFirst();

        if (!settings) {
            settings = await prisma.settings.create({
                data: { storeName, address, currency, printerIp },
            });
        } else {
            settings = await prisma.settings.update({
                where: { id: settings.id },
                data: { storeName, address, currency, printerIp },
            });
        }
        res.status(200).json(settings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getSettings, updateSettings };
