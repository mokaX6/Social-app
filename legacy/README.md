# Moka Cafe Social

A simple social media web application with a cafe theme.

Users can register, log in, create posts with text and images, like, save, comment, and manage their profile and settings.
## Why LocalStorage?

This project does not use a backend API.  
CORS issues appeared while developing from a mobile device, so all data is stored and managed using the browser LocalStorage.

## Features

- User registration and login
- Create, edit, and delete posts
- Upload images to posts and profile
- Like, save, comment, and share posts
- Profile page with avatar and cover photo
- Settings page to update name, username, bio, email, password, and profile picture
- Search for users and posts
- Sidebar navigation

## Project Structure
social media app/
├── files/                  # Media files (images and gifs)
├── js/
│   ├── Auth.js
│   ├── comments.js
│   ├── modals.js
│   ├── post.js
│   └── Utils.js
├── profile/
│   ├── profile.css
│   ├── profile.html
│   └── profile.js
├── sittings/
│   ├── sittings.css
│   ├── sittings.html
│   └── sittings.js
├── index.html
├── script.js
├── style.css
└── README.md

## How to Run

1. Open `index.html` in any modern browser.
2. No server or installation is required.
3. All data is saved in the browser LocalStorage.

---

Developed by moka