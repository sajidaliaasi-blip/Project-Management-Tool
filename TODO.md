# Project Management Tool - Bug Fix Plan

## Backend Fixes (COMPLETE & VERIFIED)
- [x] 1. Rename `models/borad.js` to `models/Board.js`
- [x] 2. Rename `models/.comment.js` to `models/Comment.js`
- [x] 3. Fix `backend/package.json` main and scripts paths
- [x] 4. Replace deprecated Mongoose `.remove()` calls with `findByIdAndDelete()`
- [x] 5. Remove deprecated `useNewUrlParser` and `useUnifiedTopology` options
- [x] 6. Fix auth middleware to return 401 if decoded user doesn't exist
- [x] 7. Add List controller and routes (List CRUD)
- [x] 8. Create `backend/.env` configuration file

## Frontend Fixes (COMPLETE)
- [x] 9. Fix `frontend/index.js` (was CSS, now proper React JS)
- [x] 10. Fix HTML script reference (created proper React structure)
- [x] 11. Implement React frontend using existing dependencies
- [x] 12. Connect frontend to backend API and Socket.IO
- [x] 13. Keep frontend and backend clearly separated

## Verification
- [x] 14. Update all `require()`/`import` paths to match filenames
- [x] 15. Verify backend starts successfully on port 5000 (✅ Server running on port 5000)
- [x] 16. Verify frontend starts successfully (react-scripts dev server running on port 3000)
- [x] 17. Restart backend to load fixed code — resolves "output not showing" issue (backend was running stale code disconnected from MongoDB)
