const express = require('express');
const {
  createTask,
  getTasksByList,
  getTask,
  updateTask,
  deleteTask,
  moveTask
} = require('../controllers/taskController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.route('/')
  .post(protect, createTask);

router.route('/list/:listId')
  .get(protect, getTasksByList);

router.route('/:id')
  .get(protect, getTask)
  .put(protect, updateTask)
  .delete(protect, deleteTask);

router.route('/:id/move')
  .put(protect, moveTask);

module.exports = router;