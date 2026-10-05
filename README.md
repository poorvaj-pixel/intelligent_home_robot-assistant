# Intelligent Home Robot Assistant

A browser-based 3D home robot simulator. Explore a furnished home, give the robot household tasks, and watch it navigate between rooms and interact with objects.

## Features

- Interactive 3D house with rooms, furniture, household objects, doors, and a garden.
- Robot task simulations for organizing books, carrying a cup, storing vegetables, setting the dining table, and arranging chairs.
- Open and close doors, or send the robot to a room using the control panel.
- Type simple commands, such as `organize bookshelf`, `open study door`, `go to kitchen`, or `stop`.
- Monitor task progress, stop a task, reset the house, and switch camera views.
- Test the robot's arm and hand controls.

> This project is a 3D simulation that runs in your browser; it does not control a physical robot.

## Getting started

### Requirements

- Node.js (a current LTS release is recommended)
- npm

### Install and run

Clone the repository and start the development server:

```sh
git clone https://github.com/poorvaj-pixel/intelligent_home_robot-assistant.git
cd intelligent_home_robot-assistant
npm ci
npm run dev
```

Open the local URL printed by Vite in your browser.

## Available commands

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server. |
| `npm run build` | Create a production build. |
| `npm run preview` | Preview the production build locally. |
| `npm test` | Run the test suite once. |
| `npm run test:watch` | Run tests in watch mode. |
| `npm run lint` | Check the project with ESLint. |

## Tech stack

- React and TypeScript
- TanStack Start and TanStack Router
- Three.js with React Three Fiber
- Tailwind CSS
- Vite and Vitest
