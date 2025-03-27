import React from 'react';
import { motion } from 'framer-motion';

function TabFilter({ activeTab, setActiveTab, sortBy, setSortBy, filterCategory, setFilterCategory }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <motion.div 
        className="bg-white/10 backdrop-blur-lg rounded-full p-1 flex shadow-lg w-fit"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <button
          onClick={() => setActiveTab('all')}
          className={`px-8 py-2 rounded-full transition-all duration-200 text-sm font-medium ${
            activeTab === 'all'
              ? 'bg-white text-blue-600'
              : 'text-white/90'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-8 py-2 rounded-full transition-all duration-200 text-sm font-medium ${
            activeTab === 'pending'
              ? 'bg-white text-blue-600'
              : 'text-white/90'
          }`}
        >
          Pending
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`px-8 py-2 rounded-full transition-all duration-200 text-sm font-medium ${
            activeTab === 'completed'
              ? 'bg-white text-blue-600'
              : 'text-white/90'
          }`}
        >
          Completed
        </button>
      </motion.div>

      <div className="flex items-center gap-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-white/10 backdrop-blur-lg rounded-full px-4 py-1 flex items-center gap-2"
        >
          <span className="text-white/90 text-sm">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-transparent text-white/90 text-sm font-medium focus:outline-none cursor-pointer"
          >
            <option value="date" className="text-gray-800">Date</option>
            <option value="priority" className="text-gray-800">Priority</option>
          </select>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="bg-white/10 backdrop-blur-lg rounded-full px-4 py-1 flex items-center gap-2"
        >
          <span className="text-white/90 text-sm">Category:</span>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-transparent text-white/90 text-sm font-medium focus:outline-none cursor-pointer"
          >
            <option value="all" className="text-gray-800">All</option>
            <option value="personal" className="text-gray-800">Personal</option>
            <option value="work" className="text-gray-800">Work</option>
            <option value="shopping" className="text-gray-800">Shopping</option>
            <option value="other" className="text-gray-800">Other</option>
          </select>
        </motion.div>
      </div>
    </div>
  );
}

export default TabFilter; 