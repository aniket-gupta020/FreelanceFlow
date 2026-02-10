const Client = require('../models/Client');
const User = require('../models/User');

// @desc    Create a new client
// @route   POST /api/clients
// @access  Private
exports.createClient = async (req, res) => {
    try {
        const userId = req.user.id;

        // 1. Get User Plan & Current Client Count
        const user = await User.findById(userId);
        const clientCount = await Client.countDocuments({ user: userId });

        // 2. Enforce Limits (Free Plan: Max 2 Clients)
        if (user.plan === 'free' && clientCount >= 2) {
            return res.status(403).json({
                message: "Free limit reached. Upgrade to Pro to add more clients.",
                isLimitReached: true
            });
        }

        // 3. Create Client
        const newClient = new Client({
            ...req.body,
            user: userId
        });

        const savedClient = await newClient.save();
        res.status(201).json(savedClient);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server Error" });
    }
};

// @desc    Get all clients for the logged-in user
// @route   GET /api/clients
// @access  Private
exports.getClients = async (req, res) => {
    try {
        const clients = await Client.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.status(200).json(clients);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server Error" });
    }
};

// @desc    Delete a client
// @route   DELETE /api/clients/:id
// @access  Private
exports.deleteClient = async (req, res) => {
    try {
        const client = await Client.findById(req.params.id);

        if (!client) {
            return res.status(404).json({ message: "Client not found" });
        }

        // Verify ownership
        if (client.user.toString() !== req.user.id) {
            return res.status(401).json({ message: "Not authorized" });
        }

        await Client.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Client deleted" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server Error" });
    }
};
