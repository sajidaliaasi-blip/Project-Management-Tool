const Comment = require('../models/Comment');
const Task = require('../models/Task');

// @desc    Add comment to task
// @route   POST /api/comments
exports.addComment = async (req, res) => {
  try {
    const { content, taskId } = req.body;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const comment = await Comment.create({
      content,
      task: taskId,
      user: req.user._id
    });

    task.comments.push(comment._id);
    await task.save();

    const populatedComment = await Comment.findById(comment._id)
      .populate('user', 'name email');

    res.status(201).json(populatedComment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get comments for a task
// @route   GET /api/comments/task/:taskId
exports.getTaskComments = async (req, res) => {
  try {
    const comments = await Comment.find({ task: req.params.taskId })
      .populate('user', 'name email')
      .sort('-createdAt');

    res.json(comments);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update comment
// @route   PUT /api/comments/:id
exports.updateComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if user owns the comment
    if (comment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this comment' });
    }

    const updatedComment = await Comment.findByIdAndUpdate(
      req.params.id,
      { content: req.body.content },
      { new: true, runValidators: true }
    ).populate('user', 'name email');

    res.json(updatedComment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete comment
// @route   DELETE /api/comments/:id
exports.deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if user owns the comment
    if (comment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }

// Remove comment from task
    await Task.updateOne(
      { _id: comment.task },
      { $pull: { comments: comment._id } }
    );

    await Comment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Comment removed' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};