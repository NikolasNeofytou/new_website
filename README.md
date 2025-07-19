# SHMMy Forum Enhancements

This repository provides a small website modernizing the SHMMy forum experience. It now includes a Node.js server that fetches live announcements from the School of Electrical and Computer Engineering.

## Features

- Responsive layout built on Bootstrap 5
- Dark mode toggle
- Animated background for a lively feel
- Live announcements from [ECE](https://www.ece.ntua.gr/gr/announcements) showing only the last month's posts in a responsive grid
- Past papers served locally from PDFs downloaded from the HMMY forum
- Login via LinkedIn/IEEE or your site profile with password security
- Lab partners board for finding teammates
- Student profiles via a dedicated sign-up page with university ID, dropdown year and specialization, and photo upload with electrical engineering themed defaults
- Ad banners across pages
- Logged-in users see their name and profile photo in the navbar

## Getting Started

1. Install dependencies with `npm install` (required for modules such as `bcryptjs`).
2. Start the server using `node server.js`. It will attempt to download PDFs from the HMMY forum into `papers/`.
3. (Optional) Run `npm run fetch-papers` manually to refresh the papers. This step requires network access to `shmmy.ntua.gr` and will fail if that domain is blocked.
4. Visit `http://localhost:3000` in a browser.
5. Browse `/pastpapers.html` to view the locally served past papers.
6. Use `/labpartners.html` to post or search for lab partners.
7. Visit `/register.html` to sign in with LinkedIn, IEEE, or your site profile using your university ID and password.
8. From the login page, follow the sign-up link to `/signup.html` and create a student profile with a chosen password.
   If `npm run fetch-papers` fails, you can manually place PDFs inside the `papers/` directory so they appear on the Past Papers page.
