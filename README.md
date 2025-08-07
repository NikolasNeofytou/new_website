# SHMMy Forum Enhancements

This repository provides a small website modernizing the SHMMy forum experience. It now includes a Node.js server that fetches live announcements from the School of Electrical and Computer Engineering. Announcements have their own page so the home page stays focused on the forum.

## Features

- Responsive layout built on Bootstrap 5
- Dark mode toggle
- Live announcements fetched from [ECE](https://www.ece.ntua.gr/gr/announcements)
- Contact form placeholder
- Sign-in system that accepts only `@ece.ntua.gr` emails and assigns a student ID

## Getting Started

1. Install dependencies with `npm install`.
2. Start the server using `node server.js`.
3. Visit `http://localhost:3000` in a browser.
