# SHMMy Forum Enhancements

This repository provides a small website modernizing the SHMMy forum experience. It now includes a Node.js server that fetches live announcements from the School of Electrical and Computer Engineering.

## Features

- Responsive layout built on Bootstrap 5
- Dark mode toggle
- Animated background for a lively feel
- Live announcements fetched from [ECE](https://www.ece.ntua.gr/gr/announcements)
- Past papers page serving local PDF files
- Login via verified LinkedIn or IEEE membership
- Lab partners board for finding teammates
- Student profiles with university ID, dropdown year and specialization, and photo upload with electrical engineering themed defaults
- Contact form placeholder

## Getting Started

1. Install dependencies with `npm install`.
2. Start the server using `node server.js`.
3. (Optional) Run `npm run fetch-papers` to download PDFs from the HMMY forum.
4. Visit `http://localhost:3000` in a browser.
5. Browse `/pastpapers.html` to view downloadable past papers.
6. Use `/labpartners.html` to post or search for lab partners.
7. Visit `/profiles.html` to create or view student profiles.
8. Visit `/register.html` to sign in using LinkedIn or IEEE membership.
