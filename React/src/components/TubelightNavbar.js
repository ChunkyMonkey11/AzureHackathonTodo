import React from 'react';

function TubelightNavbar({ user, onSignIn, onSignOut, onShowInvitations, onShowRecentlyDeleted }) {
  return (
    <nav className="bg-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-gray-900">Taskly</h1>
          </div>
          
          {user ? (
            <div className="flex items-center gap-4">
              <button
                onClick={onShowInvitations}
                className="text-gray-600 hover:text-gray-900"
              >
                Invitations
              </button>
              <button
                onClick={onShowRecentlyDeleted}
                className="text-gray-600 hover:text-gray-900"
              >
                Recently Deleted
              </button>
              <div className="flex items-center gap-2">
                <img
                  src={user.user_metadata?.avatar_url}
                  alt="Profile"
                  className="w-8 h-8 rounded-full"
                />
                <span className="text-gray-700">{user.email}</span>
              </div>
              <button
                onClick={onSignOut}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button
              onClick={onSignIn}
              className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Sign in with Google
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}

export default TubelightNavbar; 