# BlueTask - Modern Todo Application

BlueTask is a modern, feature-rich todo application built with React and Supabase. It offers a clean, intuitive interface for managing tasks with advanced features like task sharing, priority management, and real-time updates.

## 🌟 Features

### Core Features
- **Task Management**: Create, edit, and delete todos with ease
- **Priority Levels**: Set high, medium, or low priority for tasks
- **Categories**: Organize tasks into personal, work, shopping, or other categories
- **Due Dates**: Set deadlines for your tasks
- **Task Descriptions**: Add detailed descriptions to your todos
- **Completion Tracking**: Mark tasks as complete/incomplete

### Advanced Features
- **Task Sharing**: Share tasks with other users
- **Permission Control**: Set view or edit permissions for shared tasks
- **Invitation System**: Send and manage task sharing invitations
- **Real-time Updates**: Changes sync instantly across all users
- **Filtering & Sorting**: 
  - Filter by completion status (All/Pending/Completed)
  - Filter by category
  - Sort by date or priority
- **Recently Deleted**: Recover deleted tasks within 30 days
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Modern UI**: Clean, minimalist interface with smooth animations
- **AI Integration**: Smart task suggestions and content generation

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Supabase account and project
- OpenAI API key (for AI features)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/bluetask.git
cd bluetask/React
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
   Create a `.env` file in the React directory with the following variables:
```
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
REACT_APP_OPENAI_API_KEY=your_openai_api_key
```

4. Set up the database:
   - Create a new Supabase project at [Supabase Dashboard](https://app.supabase.com)
   - Use the provided `schema.sql` file to set up your database tables
   - Configure Row Level Security (RLS) policies

5. Set up OpenAI:
   - Get an API key from [OpenAI](https://platform.openai.com/api-keys)
   - Add your API key to the `.env` file
   - The AI features will be automatically enabled once the API key is set

6. Start the development server:
```bash
npm start
```

The application will be available at `http://localhost:3000`

## 🔧 Available Scripts

- `npm start`: Runs the app in development mode
- `npm test`: Launches the test runner
- `npm run build`: Builds the app for production
- `npm run eject`: Ejects from Create React App (one-way operation)

## 💻 Usage

### Creating a Todo
1. Click the "Add New Task" button
2. Fill in the task details:
   - Title
   - Description (optional)
   - Category
   - Priority
   - Due Date (optional)
3. Click "Add Task"

### Sharing a Todo
1. Click the share icon on any todo
2. Enter the recipient's email
3. Choose permission level (view/edit)
4. Send the invitation

### Managing Shared Todos
- View shared users by clicking "Show Shared Users"
- Modify permissions for shared users
- Revoke access when needed

### Recently Deleted
- Access recently deleted tasks from the trash icon
- Restore tasks within 30 days of deletion
- Permanently delete tasks from the recently deleted section

### AI Features
- Get smart task suggestions based on your input
- Receive AI-generated content for task descriptions
- Get task difficulty and time estimates
- All AI features require a valid OpenAI API key

## 🛠️ Built With
- [React](https://reactjs.org/) - Frontend framework
- [Supabase](https://supabase.com/) - Backend and authentication
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Framer Motion](https://www.framer.com/motion/) - Animations
- [OpenAI API](https://openai.com/) - AI features

## 📝 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/yourusername/bluetask/issues).

## 👤 Author
- GitHub: [@yourusername](https://github.com/yourusername)

## 🙏 Acknowledgments
- Supabase team for the amazing backend service
- React team for the powerful frontend framework
- OpenAI for the AI capabilities
- All contributors who help improve this project 