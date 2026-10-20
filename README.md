<<<<<<< HEAD
# benchakiti-booking
This website is a prototype for project in subject EXP ENG CU, which solve a court &amp; equipment problem in Benchakiti park in Thailand.
=======
# Benjakitti Active prototype

A responsive, browser-based prototype for checking sports court queues and equipment availability at Benjakitti Park.

## Run it

Open `index.html` in a modern browser. The app uses only HTML, CSS, and JavaScript; it has no package or library dependencies to install.

For the best experience, serve this folder with any static web server. For example, if Python is already installed, run `python -m http.server 8000` in this folder and open `http://localhost:8000`.

## Demo accounts

- Administrator: `admin001` / `12345678`
- Head account: `headaccount001` / `RVKs2551`

## Prototype behavior

- Court queues, equipment reservations, new accounts, account changes, theme preferences, and the selected language are saved to this browser's local storage.
- The interface supports English, Thai, Simplified Chinese, and Japanese. Use the language selector in the top bar or Settings.
- Admin and head accounts can manage court queues and out-of-service courts, set equipment to idle, booked, or broken, assign equipment bookings, record actual pickup times, and release returned or missed reservations.
- Court schedules and broken or booked equipment are sample data. They are not synced between devices and do not notify park staff.
- This is a front-end prototype. A real service would need a shared backend, authentication, and an agreed source of live park availability.
>>>>>>> 05bcfbc (initial commit)
