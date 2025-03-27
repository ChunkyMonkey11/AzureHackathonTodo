import React, { useState } from 'react';
import { motion } from 'framer-motion';
import fetchAIResponse from '../services/openaiService';

function TodoForm({ onSubmit, onClose }) {
  const [text, setText] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('personal');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('medium');
  const [aiContent, setAiContent] = useState(null);
  const [loading, setLoading] = useState(false);

  // Generate AI-powered description
  const handleGenerateDescription = async () => {
    if (!text.trim() && !description.trim()) return;
    setLoading(true);
    const aiResponse = await fetchAIResponse(text, description);
    setAiContent(aiResponse);
    setLoading(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    
    const todoData = {
      text: text.trim(),
      description: description.trim(),
      category,
      dueDate: dueDate || null,
      priority,
      aiContent: aiContent ? {
        summary: aiContent.summary,
        estimatedTime: aiContent.estimatedTime,
        difficulty: aiContent.difficulty,
        steps: aiContent.steps,
        relatedTasks: aiContent.relatedTasks
      } : null
    };

    onSubmit(todoData);

    // Reset form
    setText('');
    setDescription('');
    setCategory('personal');
    setDueDate('');
    setPriority('medium');
    setAiContent(null);
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      easy: 'text-green-600',
      medium: 'text-yellow-600',
      hard: 'text-red-600'
    };
    return colors[difficulty] || 'text-gray-600';
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      onSubmit={handleSubmit}
      className="bg-white rounded-xl p-6 shadow-lg max-w-xl mx-auto"
    >
      <div className="space-y-4">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Task title"
          className="w-full px-4 py-2 bg-transparent border-b border-gray-200 text-gray-800 placeholder-gray-400 text-lg focus:outline-none focus:border-blue-600 transition-colors"
        />

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add description"
          rows="2"
          className="w-full px-4 py-2 bg-gray-50 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-600 transition-colors resize-none text-sm"
        />

        {/* AI Content Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700">AI Assistant</label>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={handleGenerateDescription}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm flex items-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Generating...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                  </svg>
                  Get AI Help
                </>
              )}
            </motion.button>
          </div>
          <div className="w-full bg-gray-50 border border-gray-200 rounded-lg p-4">
            {aiContent ? (
              <div className="space-y-4">
                {/* Summary */}
                <div className="text-sm text-gray-700">
                  <p className="font-medium mb-1">Summary:</p>
                  <p>{aiContent.summary}</p>
                </div>

                {/* Task Info */}
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <span className="text-gray-600">{aiContent.estimatedTime}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                    </svg>
                    <span className={`font-medium ${getDifficultyColor(aiContent.difficulty)}`}>
                      {aiContent.difficulty.charAt(0).toUpperCase() + aiContent.difficulty.slice(1)}
                    </span>
                  </div>
                </div>

                {/* Steps */}
                <div className="space-y-3">
                  <p className="font-medium text-sm">Steps:</p>
                  {aiContent.steps.map((step, index) => (
                    <div key={index} className="bg-white rounded-lg p-3 shadow-sm">
                      <div className="flex items-start gap-2">
                        <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </span>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{step.step}</p>
                          {step.details && (
                            <p className="text-sm text-gray-600 mt-1">{step.details}</p>
                          )}
                          {step.resources && step.resources.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {step.resources.map((resource, rIndex) => (
                                <a
                                  key={rIndex}
                                  href={resource.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                                  </svg>
                                  {resource.title}
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Related Tasks */}
                {aiContent.relatedTasks && aiContent.relatedTasks.length > 0 && (
                  <div className="text-sm">
                    <p className="font-medium mb-1">Related Tasks:</p>
                    <ul className="list-disc list-inside text-gray-600 space-y-1">
                      {aiContent.relatedTasks.map((task, index) => (
                        <li key={index}>{task}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-400 text-sm">Click "Get AI Help" to receive personalized guidance and resources</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-3 py-1.5 bg-gray-50 rounded-lg text-gray-800 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 transition-colors appearance-none"
          >
            <option value="personal">Personal</option>
            <option value="work">Work</option>
            <option value="shopping">Shopping</option>
            <option value="other">Other</option>
          </select>

          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="px-3 py-1.5 bg-gray-50 rounded-lg text-gray-800 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 transition-colors"
          />

          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="px-3 py-1.5 bg-gray-50 rounded-lg text-gray-800 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 transition-colors appearance-none"
          >
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
          </select>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-gray-600 hover:text-gray-800 text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            Add Task
          </button>
        </div>
      </div>
    </motion.form>
  );
}

export default TodoForm;
