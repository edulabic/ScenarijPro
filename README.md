# ScenarijPro

## Overview

A web-based application designed to support collaborative screenplay writing and editing. It provides a simple text editor for managing screenplays, organizing dialogue, and making changes while keeping collaborators synchronized through a REST API. 
The backend handles screenplay data, line-level editing, character management, and change tracking, with all data persisted in a MySQL database.
Developed as a project for the Web Technologies course at Faculty of Electrical Engineering Sarajevo.

## Features

- **Screenplay Management** — Create new screenplays and load existing ones for editing.
- **Collaborative Editing** — Edit screenplay content at the line level, using locking mechanisms to prevent conflicting modifications.
- **Character Management** — Lock character names during editing and rename characters consistently throughout a screenplay.
- **Change Tracking** — Store edits as deltas, allowing changes to be recorded and retrieved incrementally.
- **Synchronization** — Periodically fetch new changes from the API to keep screenplay content up to date.
- **Writing Tools** — Includes a word counter, automatic character role detection, and text formatting features to simplify screenplay writing.

## Tech Stack

- **JavaScript (Node.js)** — Application logic and backend runtime.
- **Express.js** — REST API for screenplay operations and collaboration features.
- **Sequelize** — ORM for database models and queries.
- **MySQL** — Persistent storage for screenplays, lines, characters, and edit history.
- **HTML & CSS** — Structure and styling of the web-based editor.

## Architecture

The application follows a client-server architecture. The frontend communicates with the Express REST API to create and retrieve screenplays, manage edits, and synchronize changes between collaborators. Sequelize handles communication with the MySQL database, while Docker Compose simplifies setting up the development environment.

## License

This project was created for educational purposes.
