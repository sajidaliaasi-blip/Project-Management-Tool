const express = require('express');
const {
  createList,
  getListsByBoard,
  getList,
  updateList,
  deleteList
} = require('../controllers/listController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.route('/')
  .post(protect, createList);

router.route('/board/:boardId')
  .get(protect, getListsByBoard);

router.route('/:id')
  .get(protect, getList)
  .put(protect, updateList)
  .delete(protect, deleteList);

module.exports = router;
