const express = require('express');
const router = express.Router();
const { createClient, getClients, deleteClient } = require('../controllers/clientController');
const verifyToken = require('../middleware/verifyToken');

router.post('/', verifyToken, createClient);
router.get('/', verifyToken, getClients);
router.delete('/:id', verifyToken, deleteClient);

module.exports = router;
