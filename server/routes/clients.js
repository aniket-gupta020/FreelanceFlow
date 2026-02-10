const express = require('express');
const router = express.Router();
const { createClient, getClients, getClientById, updateClient, deleteClient } = require('../controllers/clientController');
const verifyToken = require('../middleware/verifyToken');

router.post('/', verifyToken, createClient);
router.get('/', verifyToken, getClients);
router.get('/:id', verifyToken, getClientById);
router.put('/:id', verifyToken, updateClient);
router.delete('/:id', verifyToken, deleteClient);

module.exports = router;
