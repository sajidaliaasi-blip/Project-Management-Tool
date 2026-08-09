const Task = require('../models/Task');
const List = require('../models/List');
const Project = require('../models/Project');

// @desc    Create a task
// @route   POST /api/tasks
exports.createTask = async (req, res) => {
  try {
    const { title, description, listId, projectId, assignees, dueDate, priority, labels } = req.body;

    // Check if list exists
    const list = await List.findById(listId);
    if (!list) {
      return res.status(404).json({ message: 'List not found' });
    }

    const task = await Task.create({
      title,
      description,
      list: listId,
      project: projectId,
      assignees: assignees || [],
      createdBy: req.user._id,
      dueDate,
      priority,
      labels: labels || []
    });

    // Add task to list
    list.tasks.push(task._id);
    await list.save();

    const populatedTask = await Task.findById(task._id)
      .populate('assignees', 'name email')
      .populate('createdBy', 'name email')
      .populate('comments');

    res.status(201).json(populatedTask);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get tasks for a list
// @route   GET /api/tasks/list/:listId
exports.getTasksByList = async (req, res) => {
  try {
    const tasks = await Task.find({ list: req.params.listId })
      .populate('assignees', 'name email')
      .populate('createdBy', 'name email')
      .populate({
        path: 'comments',
        populate: { path: 'user', select: 'name email' }
      })
      .sort('order');

    res.json(tasks);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get single task
// @route   GET /api/tasks/:id
exports.getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignees', 'name email')
      .populate('createdBy', 'name email')
      .populate({
        path: 'comments',
        populate: { path: 'user', select: 'name email' }
      });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json(task);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
    .populate('assignees', 'name email')
    .populate('createdBy', 'name email')
    .populate({
      path: 'comments',
      populate: { path: 'user', select: 'name email' }
    });

    res.json(updatedTask);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

// Remove task from list
    await List.updateOne(
      { _id: task.list },
      { $pull: { tasks: task._id } }
    );

    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: 'Task removed' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Move task to different list
// @route   PUT /api/tasks/:id/move
exports.moveTask = async (req, res) => {
  try {
    const { newListId, newOrder } = req.body;
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Remove from old list
    await List.updateOne(
      { _id: task.list },
      { $pull: { tasks: task._id } }
    );

    // Add to new list
    await List.updateOne(
      { _id: newListId },
      { $push: { tasks: task._id } }
    );

    task.list = newListId;
    if (newOrder !== undefined) {
      task.order = newOrder;
    }
    await task.save();

    const updatedTask = await Task.findById(task._id)
      .populate('assignees', 'name email')
      .populate('createdBy', 'name email');

    res.json(updatedTask);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};