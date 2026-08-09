const List = require('../models/List');
const Board = require('../models/Board');

// @desc    Create a list in a board
// @route   POST /api/lists
exports.createList = async (req, res) => {
  try {
    const { name, boardId } = req.body;

    const board = await Board.findById(boardId);
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    const list = await List.create({
      name,
      board: boardId
    });

    board.lists.push(list._id);
    await board.save();

    const populatedList = await List.findById(list._id);

    res.status(201).json(populatedList);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get all lists for a board
// @route   GET /api/lists/board/:boardId
exports.getListsByBoard = async (req, res) => {
  try {
    const lists = await List.find({ board: req.params.boardId })
      .populate({
        path: 'tasks',
        populate: [
          { path: 'assignees', select: 'name email' },
          { path: 'createdBy', select: 'name email' },
          { path: 'comments', populate: { path: 'user', select: 'name email' } }
        ]
      })
      .sort('order');

    res.json(lists);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get single list
// @route   GET /api/lists/:id
exports.getList = async (req, res) => {
  try {
    const list = await List.findById(req.params.id)
      .populate({
        path: 'tasks',
        populate: [
          { path: 'assignees', select: 'name email' },
          { path: 'createdBy', select: 'name email' },
          { path: 'comments', populate: { path: 'user', select: 'name email' } }
        ]
      })
      .sort('order');

    if (!list) {
      return res.status(404).json({ message: 'List not found' });
    }

    res.json(list);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update list
// @route   PUT /api/lists/:id
exports.updateList = async (req, res) => {
  try {
    const list = await List.findById(req.params.id);

    if (!list) {
      return res.status(404).json({ message: 'List not found' });
    }

    const updatedList = await List.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json(updatedList);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete list
// @route   DELETE /api/lists/:id
exports.deleteList = async (req, res) => {
  try {
    const list = await List.findById(req.params.id);

    if (!list) {
      return res.status(404).json({ message: 'List not found' });
    }

    // Remove list from board
    await Board.updateOne(
      { _id: list.board },
      { $pull: { lists: list._id } }
    );

    await List.findByIdAndDelete(req.params.id);
    res.json({ message: 'List removed' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
