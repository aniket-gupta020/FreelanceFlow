const Client = require('../models/Client');
const User = require('../models/User');
const Project = require('../models/Project');

exports.createClient = async (req, res) => {
    try {
        const userId = req.user.id;

        const user = await User.findById(userId);
        const clientCount = await Client.countDocuments({
            user: userId
        });


        if (user.plan === 'free' && clientCount >= 2) {
            return res.status(403).json({
                message: "Free limit reached (including deleted clients). Upgrade to Pro to add more clients.",
                isLimitReached: true
            });
        }

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

exports.getClients = async (req, res) => {
    try {
        const clients = await Client.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.status(200).json(clients);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.getClientById = async (req, res) => {
    try {
        const client = await Client.findById(req.params.id);

        if (!client) {
            return res.status(404).json({ message: "Client not found" });
        }

        if (client.user.toString() !== req.user.id) {
            return res.status(401).json({ message: "Not authorized" });
        }

        res.status(200).json(client);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.updateClient = async (req, res) => {
    try {
        const client = await Client.findById(req.params.id);

        if (!client) {
            return res.status(404).json({ message: "Client not found" });
        }

        if (client.user.toString() !== req.user.id) {
            return res.status(401).json({ message: "Not authorized" });
        }

        const { name, email, phone, mobile, defaultHourlyRate } = req.body;

        if (name) client.name = name;
        if (email) client.email = email;
        if (phone !== undefined) client.phone = phone;
        if (mobile !== undefined) client.mobile = mobile;
        if (defaultHourlyRate !== undefined) client.defaultHourlyRate = defaultHourlyRate;

        const updatedClient = await client.save();
        res.status(200).json(updatedClient);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.deleteClient = async (req, res) => {
    try {
        const client = await Client.findById(req.params.id);

        if (!client) {
            return res.status(404).json({ message: "Client not found" });
        }

        if (client.user.toString() !== req.user.id) {
            return res.status(401).json({ message: "Not authorized" });
        }

        const updateResult = await Project.updateMany(
            {
                client: client._id,
                status: { $not: { $regex: /^completed$/i } }
            },
            {
                $set: {
                    status: 'completed',
                    completedAt: new Date(),
                    deadline: new Date()
                }
            }
        );

        console.log(`[DEBUG] Explicitly marked projects as COMPLETED for client ${client.name} (ID: ${client._id})`);
        console.log(`[DEBUG] Update Result: Modified ${updateResult.modifiedCount} projects.`);

        await Client.findByIdAndUpdate(req.params.id, { isDeleted: true });

        res.status(200).json({ message: "Client moved to trash" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server Error" });
    }
};
