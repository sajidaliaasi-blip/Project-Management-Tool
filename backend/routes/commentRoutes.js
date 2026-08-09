const express = require('express');
const {
  addComment,
  getTaskComments,
  updateComment,
  deleteComment
} = require('../controllers/commentController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.route('/')
  .post(protect, addComment);

router.route('/task/:taskId')
  .get(protect, getTaskComments);

router.route('/:id')
  .put(protect, updateComment)
  .delete(protect, deleteComment);

module.exports = router;