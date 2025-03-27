import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { handleInvitationResponse } from '../supabase';

function InvitationsModal({ isOpen, onClose, invitations, userEmail, onInvitationHandled }) {
  const handleResponse = async (invitationId, todoId, accept) => {
    try {
      await handleInvitationResponse(userEmail, invitationId, todoId, accept);
      onInvitationHandled();
    } catch (error) {
      console.error('Error handling invitation:', error);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold mb-4">Pending Invitations</h2>
            
            {invitations.length === 0 ? (
              <p className="text-gray-600">No pending invitations</p>
            ) : (
              <div className="space-y-4">
                {invitations.map((invitation) => (
                  <div
                    key={invitation.id}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="mb-2">
                      <h3 className="font-medium">{invitation.todo_data.title}</h3>
                      {invitation.todo_data.description && (
                        <p className="text-sm text-gray-600 mt-1">
                          {invitation.todo_data.description}
                        </p>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      From: {invitation.owner_email}
                    </p>
                    <div className="flex justify-end gap-2 mt-2">
                      <button
                        onClick={() => handleResponse(invitation.id, invitation.todo_id, false)}
                        className="px-4 py-2 text-gray-600 hover:text-black transition-colors"
                      >
                        Decline
                      </button>
                      <button
                        onClick={() => handleResponse(invitation.id, invitation.todo_id, true)}
                        className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                      >
                        Accept
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-black transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default InvitationsModal; 