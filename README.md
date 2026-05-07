# Frontend Mentor - Interactive comments section solution

This is a solution to the [Interactive comments section challenge on Frontend Mentor](https://www.frontendmentor.io/challenges/interactive-comments-section-iG1RugEG9). Frontend Mentor challenges help you improve your coding skills by building realistic projects.

## Table of contents

- [Overview](#overview)
  - [The challenge](#the-challenge)
  - [Screenshot](#screenshot)
  - [Links](#links)
- [My process](#my-process)
  - [Built with](#built-with)
  - [What I learned](#what-i-learned)
  - [Continued development](#continued-development)
- [Author](#author)


## Overview

### The challenge

Users should be able to:

- View the optimal layout for the app depending on their device's screen size
- See hover states for all interactive elements on the page
- Create, Read, Update, and Delete comments and replies
- Upvote and downvote comments
- **Bonus**: Instead of using the `createdAt` strings from the `data.json` file, try using timestamps and dynamically track the time since the comment or reply was posted.

### Screenshot

#### Desktop

![Screenshot 2025-01-22 at 08-48-53 Frontend Mentor Interactive comments section](https://github.com/user-attachments/assets/99dc0220-8e35-4ca3-ad62-96969fad0e8b)

#### Mobile

![Screenshot 2025-01-22 at 08-49-15 Frontend Mentor Interactive comments section](https://github.com/user-attachments/assets/47322824-6f1b-4c8a-98c1-ebbe048fd047)


### Links

- Live site: [interactive-comments-section-web.vercel.app](https://interactive-comments-section-web.vercel.app)
- Frontend project: [interactive-comments-section-web](https://github.com/aronsn/interactive-comments-section-web)

## My process

### Built with

- [Express](https://expressjs.com/) - Web application framework
- [MongoDB](https://www.mongodb.com/) - Document database
- [MongoDB Atlas](https://www.mongodb.com/atlas) - Cloud database hosting
- [Render](https://render.com/) - API hosting

### Deployment

The API is deployed on [Render](https://render.com/) as a Node.js web service. The database is hosted on [MongoDB Atlas](https://www.mongodb.com/atlas) (M0 free tier).

The following environment variables are required:

| Variable | Description |
|---|---|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `FRONTEND_URL` | URL of the frontend app (used for CORS) |

For local development, a `docker-compose.yml` is included to spin up a local MongoDB instance and Mongo Express UI:

```bash
docker compose up
```

Then create a `config.env` file with:
MONGODB_URI=mongodb://root:example@localhost:27017/interactive-comments-section?authSource=admin
FRONTEND_URL=http://localhost:5173

### What I learned

- How to build a REST API and program server logic.
- How to build with a document-based database.
- How to deploy a Node.js API to Render with a cloud database on MongoDB Atlas.
- How to configure CORS to allow requests from a separately deployed frontend.

### Continued development

- Containerize the full stack to better mimic the production environment.
- Add authentication so users have persistent identities.

## Author

- Frontend Mentor - [@aronsn](https://www.frontendmentor.io/profile/aronsn)
