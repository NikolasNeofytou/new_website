# SHMMy Forum Enhancements

This repository provides a modern website modernizing the SHMMy forum experience. It now includes a Node.js server that fetches live announcements from the School of Electrical and Computer Engineering.

## Features

- **Responsive Design** - Built with Bootstrap 5 for mobile and desktop
- **Dark Mode** - Toggle between light and dark themes
- **Live Announcements** - Fetches latest posts from [ECE NTUA](https://www.ece.ntua.gr/gr/announcements)
- **User Authentication** - Login and signup functionality
- **User Profiles** - View your profile information
- **Contact Form** - Send messages through the website
- **Modern UI** - Clean, professional interface suitable for academic use

## Getting Started

### Prerequisites
- Node.js (v14 or higher recommended)
- npm (comes with Node.js)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/NikolasNeofytou/new_website.git
cd new_website
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
node server.js
```

4. Open your browser and navigate to:
```
http://localhost:3000
```

## Usage

### For Students

1. **Sign Up**: Create an account using your University ID
2. **Login**: Access your profile with your University ID
3. **View Announcements**: See the latest updates from ECE
4. **Contact**: Send messages through the contact form
5. **Dark Mode**: Toggle dark mode using the button in the footer

### For Administrators

The server includes API endpoints that can be extended:
- `/api/announcements` - Fetch announcements
- `/api/users` - User registration
- `/api/login` - User authentication
- `/api/contact` - Contact form submissions

## Project Structure

```
new_website/
├── index.html          # Main landing page
├── login.html          # User login page
├── signup.html         # User registration page
├── profile.html        # User profile page
├── styles.css          # Custom styles
├── script.js           # Main JavaScript
├── login.js            # Login functionality
├── signup.js           # Signup functionality
├── profile.js          # Profile page functionality
├── logout.js           # Logout functionality
├── server.js           # Express server
├── users.json          # User data storage (demo)
├── package.json        # Node.js dependencies
└── README.md           # This file
```

## API Endpoints

### GET /api/announcements
Fetches latest announcements from ECE NTUA website.

**Response:**
```json
[
  {
    "date": "01/01/2025",
    "title": "Announcement Title",
    "category": "Category",
    "link": "https://..."
  }
]
```

### POST /api/users
Register a new user.

**Request:**
```json
{
  "univid": "12345",
  "name": "Student Name"
}
```

### POST /api/login
Login with University ID.

**Request:**
```json
{
  "univid": "12345"
}
```

### POST /api/contact
Submit a contact form message.

**Request:**
```json
{
  "name": "Your Name",
  "email": "email@example.com",
  "message": "Your message"
}
```

## Development Notes

- User data is stored in memory for demonstration purposes
- In production, implement proper database storage
- Authentication should use secure tokens and password hashing
- Contact form messages are logged to console (implement email service for production)
- Announcements fetching may fail due to external website changes

## Future Enhancements

- Database integration (PostgreSQL/MongoDB)
- Secure authentication with JWT
- Email notifications
- Course management
- Past papers repository
- Student profiles board
- Admin dashboard
- File uploads
- Search functionality

## Contributing

This is an academic project. For contributions, please contact the repository owner.

## License

ISC

## Contact

For questions or support, please use the contact form on the website.
