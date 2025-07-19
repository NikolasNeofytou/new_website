# SHMMy Forum Enhancements

This repository provides a small website modernizing the SHMMy forum experience. It now includes a Node.js server that fetches live announcements from the School of Electrical and Computer Engineering.

## Features

- Responsive layout built on Bootstrap 5
- Dark mode toggle
- Animated background for a lively feel
- Live announcements fetched from [ECE](https://www.ece.ntua.gr/gr/announcements)
- Past papers page listing PDFs scraped from the HMMY forum
- Login via LinkedIn/IEEE or your site profile with password security
- Lab partners board for finding teammates
- Student profiles via a dedicated sign-up page with university ID, dropdown year and specialization, and photo upload with electrical engineering themed defaults
- Ad banners across pages
- Logged-in users see their name and profile photo in the navbar
- Contact form placeholder

## Getting Started

1. Install dependencies with `npm install`.
2. Start the server using `node server.js`.
3. (Optional) Run `npm run fetch-papers` to cache PDFs from the HMMY forum.
4. Visit `http://localhost:3000` in a browser.
5. Browse `/pastpapers.html` to view past papers scraped from the forum.
6. Use `/labpartners.html` to post or search for lab partners.
7. Visit `/register.html` to sign in with LinkedIn, IEEE, or your site profile using your university ID and password.
8. From the login page, follow the sign-up link to `/signup.html` and create a student profile with a chosen password.
