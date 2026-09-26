# Moka Cafe Social

Moka Cafe Social is a cafe-themed frontend social media application built with
HTML, CSS, and vanilla JavaScript.

Users can register, log in, create posts, upload media, like posts, save posts,
comment, share links, edit their profile, and manage settings.

## Live Demo

GitHub Pages:  
https://mokax6.github.io/Social-app/

## Why LocalStorage Instead of an API?

This project intentionally does not use a backend API, database, or server-side
authentication.

While developing the project from a mobile environment, API requests caused
Cross-Origin Resource Sharing (CORS) problems. To keep the app simple,
portable, and easy to run from GitHub Pages, the data layer was implemented
with the browser's `localStorage`.

This means:

- No backend server or API setup is required.
- The app works as a static website.
- Posts, comments, accounts, profile changes, likes, and saved items are stored
  in the current browser.
- Data remains available after refreshing the page in the same browser.
- Data does not automatically sync between different browsers or devices.
- This is a frontend/demo authentication system, not a production-secure
  account system.

## Features

- User registration and login
- Create, edit, and delete posts
- Upload images and videos to posts
- Like, save, comment, and share posts
- Profile page with avatar and cover photo
- Settings page for profile information and preferences
- Search interface for users and posts
- Responsive dark cafe-themed interface
- Sidebar navigation
- GitHub Pages compatible static deployment

## Application Map

```text
Home Feed (index.html)
├── Authentication
│   ├── Register
│   ├── Login
│   └── Logout
├── Posts
│   ├── Create
│   ├── Edit
│   ├── Delete
│   ├── Like
│   ├── Save
│   └── Share
├── Comments Modal
├── Profile (profile/profile.html)
│   ├── User posts
│   ├── Saved items
│   ├── Avatar upload
│   └── Cover upload
└── Settings (sittings/sittings.html)
    └── Profile and account preferences
```

## Project Structure

```text
.
├── index.html                 # Main home feed and application entry point
├── style.css                  # Global home page and shared styling
├── script.js                  # Feed initialization and home page behavior
├── js/
│   ├── Auth.js                # Register, login, logout, and sidebar navigation
│   ├── comments.js            # Comments modal and comment interactions
│   ├── modals.js              # Create-post and shared modal behavior
│   ├── post.js                # Post creation, rendering, and feed actions
│   └── Utils.js               # Shared browser and image utilities
├── profile/
│   ├── profile.html           # Profile page markup
│   ├── profile.css            # Profile page styling
│   └── profile.js             # Profile data, saved items, and profile actions
├── sittings/
│   ├── sittings.html         # Settings page markup
│   ├── sittings.css          # Settings page styling
│   └── sittings.js           # Settings and profile updates
├── files/                     # Bundled images and animated loading assets
├── .nojekyll                 # Tells GitHub Pages to serve the files directly
└── README.md                  # Project documentation
```

The folder name `sittings/` is kept from the original project so that all
existing links continue to work.

## How the Data Flows

```text
User action
    ↓
HTML interface
    ↓
JavaScript modules
    ↓
Browser localStorage
    ↓
The page is rendered again from saved local data
```

The main storage keys are created and managed by the JavaScript modules. There
is no external API request in the current version.

## How to Run

### Open locally

1. Download or clone the repository.
2. Open `index.html` in a modern browser.
3. No package installation or backend server is required.

### Use GitHub Pages

Open the live demo link above. GitHub Pages serves the files directly from the
root of the `main` branch.

## Important Limitations

- Clearing browser storage removes the local app data.
- Data created on one device is not available on another device.
- The current login system is for frontend demonstration only.
- A real multi-user production app would need an API, database, secure
  authentication, and server-side validation.

## Credits

Developed by moka.