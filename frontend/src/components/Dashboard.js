import React, { useState, useEffect } from 'react';
import { projectAPI, listAPI, taskAPI, commentAPI } from '../api';
import { getSocket, joinProject } from '../socket';

const Dashboard = () => {
  const [view, setView] = useState('dashboard');
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
const [boards, setBoards] = useState([]);
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Modal state
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showListModal, setShowListModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [currentTask, setCurrentTask] = useState(null);
  const [currentListId, setCurrentListId] = useState(null);

  // Form state
  const [projectForm, setProjectForm] = useState({ name: '', description: '', members: '' });
  const [listForm, setListForm] = useState({ name: '' });
  const [taskForm, setTaskForm] = useState({
    title: '', description: '', assignees: [], dueDate: '', priority: 'medium'
  });
  const [comment, setComment] = useState('');

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    const socket = getSocket();
    socket.on('task-updated', () => loadSelectedProject(selectedProject?.id));
    socket.on('task-created', () => loadSelectedProject(selectedProject?.id));
    socket.on('task-deleted', () => loadSelectedProject(selectedProject?.id));
    socket.on('new-comment', () => {
      if (currentTask) loadTaskDetail(currentTask._id);
    });
    return () => {
      socket.off('task-updated');
      socket.off('task-created');
      socket.off('task-deleted');
      socket.off('new-comment');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProject, currentTask]);

  const loadProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await projectAPI.getAll();
      setProjects(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const loadSelectedProject = async (projectId) => {
    if (!projectId) return;
    try {
      const { data } = await projectAPI.getById(projectId);
      setSelectedProject(data);
      setBoards(data.boards || []);
      if (data.boards && data.boards.length > 0) {
        const firstBoard = data.boards[0];
        const { data: listsData } = await listAPI.getAllByBoard(firstBoard._id);
        setLists(listsData);
      } else {
        setLists([]);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load project');
    }
  };

  const handleSelectProject = async (project) => {
    setSelectedProject(project);
    setView('board');
    joinProject(project._id);
    await loadSelectedProject(project._id);
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      const members = projectForm.members
        ? projectForm.members.split(',').map(m => m.trim()).filter(Boolean)
        : [];
      await projectAPI.create({
        name: projectForm.name,
        description: projectForm.description,
        members
      });
      setShowProjectModal(false);
      setProjectForm({ name: '', description: '', members: '' });
      await loadProjects();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create project');
    }
  };

  const handleCreateList = async (e) => {
    e.preventDefault();
    try {
      const board = boards[0];
      await listAPI.create({ name: listForm.name, boardId: board._id });
      setShowListModal(false);
      setListForm({ name: '' });
      await loadSelectedProject(selectedProject._id);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create list');
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      await taskAPI.create({
        title: taskForm.title,
        description: taskForm.description,
        listId: currentListId,
        projectId: selectedProject._id,
        assignees: taskForm.assignees,
        dueDate: taskForm.dueDate,
        priority: taskForm.priority
      });
      setShowTaskModal(false);
      setTaskForm({ title: '', description: '', assignees: [], dueDate: '', priority: 'medium' });
      await loadSelectedProject(selectedProject._id);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create task');
    }
  };

  const loadTaskDetail = async (taskId) => {
    const { data } = await taskAPI.getById(taskId);
    setCurrentTask(data);
  };

  const openTaskDetail = async (task) => {
    setCurrentTask(task);
    setShowTaskDetail(true);
    await loadTaskDetail(task._id);
  };

  const handleAddComment = async () => {
    if (!comment.trim()) return;
    try {
      await commentAPI.create({ content: comment, taskId: currentTask._id });
      setComment('');
      await loadTaskDetail(currentTask._id);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add comment');
    }
  };

  const handleUpdateTask = async (field, value) => {
    try {
      await taskAPI.update(currentTask._id, { [field]: value });
      await loadTaskDetail(currentTask._id);
      await loadSelectedProject(selectedProject._id);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update task');
    }
  };

  const handleDeleteTask = async () => {
    try {
      await taskAPI.delete(currentTask._id);
      setShowTaskDetail(false);
      setCurrentTask(null);
      await loadSelectedProject(selectedProject._id);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete task');
    }
  };

  const renderStats = () => {
    let totalTasks = 0;
    let inProgress = 0;
    let completed = 0;
    projects.forEach(p => {
      if (p.boards) {
        p.boards.forEach(b => {
          if (b.lists) {
            b.lists.forEach(l => {
              if (l.tasks) {
                totalTasks += l.tasks.length;
                l.tasks.forEach(t => {
                  if (t.status === 'in-progress') inProgress++;
                  if (t.status === 'done') completed++;
                });
              }
            });
          }
        });
      }
    });
    return { totalProjects: projects.length, totalTasks, inProgress, completed };
  };

  const stats = renderStats();

  return (
    <div className="main-content">
      <aside className="sidebar">
        <div className="sidebar-menu">
          <button
            className={`sidebar-item ${view === 'dashboard' ? 'active' : ''}`}
            onClick={() => setView('dashboard')}
          >
            <i className="fas fa-th-large"></i>
            <span>Dashboard</span>
          </button>
          <button
            className={`sidebar-item ${view === 'projects' ? 'active' : ''}`}
            onClick={() => setView('projects')}
          >
            <i className="fas fa-project-diagram"></i>
            <span>Projects</span>
          </button>
          <button
            className={`sidebar-item ${view === 'board' ? 'active' : ''}`}
            onClick={() => setView(selectedProject ? 'board' : 'projects')}
          >
            <i className="fas fa-columns"></i>
            <span>Board</span>
          </button>
        </div>
      </aside>

      <div className="content-area">
        {error && <div className="auth-error">{error} <button onClick={() => setError(null)}>×</button></div>}

        {/* Dashboard View */}
        {view === 'dashboard' && (
          <div id="dashboardView" className="view active">
            <div className="view-header">
              <h1>Dashboard</h1>
              <div className="view-actions">
                <button className="btn-secondary" onClick={() => setShowProjectModal(true)}>
                  <i className="fas fa-plus"></i> New Project
                </button>
              </div>
            </div>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon" style={{ background: '#e8f5e9' }}>
                  <i className="fas fa-project-diagram" style={{ color: '#4caf50' }}></i>
                </div>
                <div className="stat-info">
                  <h3>{stats.totalProjects}</h3>
                  <p>Total Projects</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon" style={{ background: '#e3f2fd' }}>
                  <i className="fas fa-tasks" style={{ color: '#2196f3' }}></i>
                </div>
                <div className="stat-info">
                  <h3>{stats.totalTasks}</h3>
                  <p>Total Tasks</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon" style={{ background: '#fff3e0' }}>
                  <i className="fas fa-clock" style={{ color: '#ff9800' }}></i>
                </div>
                <div className="stat-info">
                  <h3>{stats.inProgress}</h3>
                  <p>In Progress</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon" style={{ background: '#f3e5f5' }}>
                  <i className="fas fa-check-circle" style={{ color: '#9c27b0' }}></i>
                </div>
                <div className="stat-info">
                  <h3>{stats.completed}</h3>
                  <p>Completed</p>
                </div>
              </div>
            </div>
            <div className="recent-projects">
              <h2>Recent Projects</h2>
              <div className="project-grid">
                {projects.length === 0 && !loading && (
                  <div className="empty-state">
                    <i className="fas fa-folder-open"></i>
                    <h3>No Projects Yet</h3>
                    <p>Create your first project to get started</p>
                  </div>
                )}
                {projects.map(p => (
                  <div key={p._id} className="project-card" onClick={() => handleSelectProject(p)}>
                    <h3>{p.name}</h3>
                    <p>{p.description}</p>
                    <div className="project-meta">
                      <span>{p.members?.length || 0} members</span>
                      <span>{p.boards?.length || 0} boards</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Projects View */}
        {view === 'projects' && (
          <div id="projectsView" className="view active">
            <div className="view-header">
              <h1>Projects</h1>
              <div className="view-actions">
                <button className="btn-secondary" onClick={() => setShowProjectModal(true)}>
                  <i className="fas fa-plus"></i> New Project
                </button>
              </div>
            </div>
            <div className="project-grid">
              {projects.length === 0 && !loading && (
                <div className="empty-state">
                  <i className="fas fa-folder-open"></i>
                  <h3>No Projects Yet</h3>
                  <p>Create your first project to get started</p>
                </div>
              )}
              {projects.map(p => (
                <div key={p._id} className="project-card" onClick={() => handleSelectProject(p)}>
                  <h3>{p.name}</h3>
                  <p>{p.description}</p>
                  <div className="project-meta">
                    <span>{p.members?.length || 0} members</span>
                    <span>{p.boards?.length || 0} boards</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Board View */}
        {view === 'board' && selectedProject && (
          <div id="boardView" className="view active">
            <div className="view-header">
              <h1>{selectedProject.name}</h1>
              <div className="view-actions">
                <button
                  className="btn-secondary"
                  onClick={() => setShowListModal(true)}
                >
                  <i className="fas fa-plus"></i> Add List
                </button>
              </div>
            </div>
            <div className="board-container">
              {lists.length === 0 && (
                <div className="empty-state">
                  <i className="fas fa-columns"></i>
                  <h3>No Lists Yet</h3>
                  <p>Add a list to get started</p>
                </div>
              )}
              {lists.map(list => (
                <div key={list._id} className="board-column">
                  <div className="column-header">
                    <h3>{list.name}</h3>
                    <span className="task-count">{list.tasks?.length || 0}</span>
                  </div>
                  <div className="task-list-container">
                    {list.tasks?.map(task => (
                      <div key={task._id} className="task-card" onClick={() => openTaskDetail(task)}>
                        <div className="task-title">{task.title}</div>
                        <div className="task-meta">
                          <span className={`task-priority priority-${task.priority || 'medium'}`}>
                            {task.priority || 'medium'}
                          </span>
                          <span>{task.assignees?.length || 0} assignees</span>
                        </div>
                      </div>
                    ))}
                    <button
                      className="btn-sm btn-secondary add-task-btn"
                      onClick={() => { setCurrentListId(list._id); setShowTaskModal(true); }}
                      style={{ width: '100%', marginTop: '0.5rem' }}
                    >
                      <i className="fas fa-plus"></i> Add Task
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      {showProjectModal && (
        <div className="modal active">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Create New Project</h2>
              <button className="modal-close" onClick={() => setShowProjectModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleCreateProject}>
              <div className="form-group">
                <label>Project Name</label>
                <input
                  type="text"
                  value={projectForm.name}
                  onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                  placeholder="Enter project name"
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={projectForm.description}
                  onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                  placeholder="Enter project description"
                  rows="3"
                />
              </div>
              <div className="form-group">
                <label>Team Members (comma separated emails)</label>
                <input
                  type="text"
                  value={projectForm.members}
                  onChange={(e) => setProjectForm({ ...projectForm, members: e.target.value })}
                  placeholder="email1@example.com, email2@example.com"
                />
              </div>
              <button type="submit" className="btn-primary">Create Project</button>
            </form>
          </div>
        </div>
      )}

      {/* Create List Modal */}
      {showListModal && (
        <div className="modal active">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Add New List</h2>
              <button className="modal-close" onClick={() => setShowListModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleCreateList}>
              <div className="form-group">
                <label>List Name</label>
                <input
                  type="text"
                  value={listForm.name}
                  onChange={(e) => setListForm({ name: e.target.value })}
                  placeholder="Enter list name"
                  required
                />
              </div>
              <button type="submit" className="btn-primary">Add List</button>
            </form>
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {showTaskModal && (
        <div className="modal active">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Create New Task</h2>
              <button className="modal-close" onClick={() => setShowTaskModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleCreateTask}>
              <div className="form-group">
                <label>Task Title</label>
                <input
                  type="text"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  placeholder="Enter task title"
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  placeholder="Enter task description"
                  rows="3"
                />
              </div>
              <div className="form-group">
                <label>Due Date</label>
                <input
                  type="date"
                  value={taskForm.dueDate}
                  onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Priority</label>
                <select
                  value={taskForm.priority}
                  onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <button type="submit" className="btn-primary">Create Task</button>
            </form>
          </div>
        </div>
      )}

      {/* Task Detail Modal */}
      {showTaskDetail && currentTask && (
        <div className="modal active">
          <div className="modal-content modal-large">
            <div className="modal-header">
              <h2>{currentTask.title}</h2>
              <button className="modal-close" onClick={() => setShowTaskDetail(false)}>&times;</button>
            </div>
            <div className="task-detail-grid">
              <div className="task-detail-main">
                <div className="task-detail-description">
                  <h4>Description</h4>
                  <p>{currentTask.description || 'No description'}</p>
                </div>
                <div className="task-detail-comments">
                  <h4>Comments</h4>
                  <div className="comment-list">
                    {currentTask.comments?.length === 0 && (
                      <div className="empty-state">No comments yet</div>
                    )}
                    {currentTask.comments?.map(c => (
                      <div key={c._id} className="comment-item">
                        <div className="comment-header">
                          <span className="comment-user">{c.user?.name || 'User'}</span>
                          <span className="comment-time">
                            {new Date(c.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="comment-content">{c.content}</div>
                      </div>
                    ))}
                  </div>
                  <div className="add-comment">
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Add a comment..."
                      rows="2"
                    />
                    <button className="btn-primary btn-sm" onClick={handleAddComment}>Comment</button>
                  </div>
                </div>
              </div>
              <div className="task-detail-sidebar">
                <div className="detail-item">
                  <label>Status</label>
                  <select
                    value={currentTask.status || 'todo'}
                    onChange={(e) => handleUpdateTask('status', e.target.value)}
                  >
                    <option value="todo">To Do</option>
                    <option value="in-progress">In Progress</option>
                    <option value="review">Review</option>
                    <option value="done">Done</option>
                  </select>
                </div>
                <div className="detail-item">
                  <label>Priority</label>
                  <select
                    value={currentTask.priority || 'medium'}
                    onChange={(e) => handleUpdateTask('priority', e.target.value)}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div className="detail-item">
                  <label>Due Date</label>
                  <input
                    type="date"
                    value={currentTask.dueDate ? currentTask.dueDate.split('T')[0] : ''}
                    onChange={(e) => handleUpdateTask('dueDate', e.target.value)}
                  />
                </div>
                <button className="btn-danger" onClick={handleDeleteTask}>Delete Task</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
