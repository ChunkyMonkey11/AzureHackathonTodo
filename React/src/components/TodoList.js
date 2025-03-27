/**
 * TodoList Component
 * Renders a list of todo items with animation support.
 * 
 * @component
 * @param {Object} props
 * @param {Array} props.todos - Array of todo objects to display
 * @param {Function} props.onToggle - Callback function to handle todo completion toggle
 * @param {Function} props.onDelete - Callback function to handle todo deletion
 * @param {Function} props.onEdit - Callback function to handle todo editing
 * @param {string} props.currentUserEmail - Email of the current user for permission checks
 * @param {string} props.selectedStep - Current selected step
 * @param {Function} props.setSelectedStep - Callback function to set the selected step
 */
import React from 'react';
import TodoItem from './TodoItem';
import { AnimatePresence } from 'framer-motion';

function TodoList({ todos, onToggle, onDelete, onEdit, currentUserEmail, selectedStep, setSelectedStep }) {
  return (
    <div className="space-y-4">
      <AnimatePresence>
        {todos.map(todo => (
          <TodoItem
            key={todo.id}
            todo={todo}
            onToggle={onToggle}
            onDelete={onDelete}
            onEdit={onEdit}
            currentUserEmail={currentUserEmail}
            selectedStep={selectedStep}
            setSelectedStep={setSelectedStep}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

export default TodoList;
