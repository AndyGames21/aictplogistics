# [AICTP Logistics Limited Website](https://www.aictp.com.ng)

A website for AICTP Logistics Limited that allows users to request trips/bookings, and for admins to manage bookings.

## Features

- User authentication (register, login)  
- Submit booking requests with origin, destination, dates, class, passengers  
- Admin dashboard to view all requested trips  
- Change status of bookings, send messages, delete bookings  
- Email notifications on booking requests  
- Validation and error handling  

## Tech Stack

- **Backend**: Node.js, Express  
- **Database**: PostgreSQL  
- **Templating**: EJS  
- **Styling**: CSS  
- **Email**: Nodemailer  

## Routes / Endpoints

Here are the main endpoints:

| Method | Path                  | Description                          |
|--------|-----------------------|--------------------------------------|
| `GET`  | `/`                   | Home / landing page                  |
| `GET`  | `/register`           | User registration page               |
| `POST` | `/register`           | Register new user                    |
| `GET`  | `/login`              | Login page                           |
| `POST` | `/login`              | Authenticate user                    |
| `GET`  | `/bookings`           | User view of bookings          |
| `POST` | `/bookings/book-trip` | Submit a booking (authenticated)     |

## Folder Structure

```
aictplogistics/
│
├── auth/             # authentication-related routes
├── config/           # config files (db, mailer, credentials)
├── public/           # static assets (CSS, JS, images)
├── routes/           # main application routes
├── views/            # EJS templates
├── server.js         # entry point
├── helpers.js        # helper utilities
├── statics.js        # static file setup
├── cron.js           # cron tasks 
└── package.json
```

## Contributing

1. Fork the project  
2. Create your feature branch: `git checkout -b feature-name`  
3. Commit your changes: `git commit -m "Add some feature"`  
4. Push to the branch: `git push origin feature-name`  
5. Open a Pull Request  

## License

This project is open source. 
