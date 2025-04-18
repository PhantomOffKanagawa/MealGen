# MealGen - Smart Meal Planning Application

A comprehensive meal planning and nutrition tracking application built with Next.js, GraphQL, Apollo Server, and MongoDB.

## Project Overview

MealGen helps users plan meals, track nutrition, and manage food costs effectively. The application allows users to:

- Create and manage ingredients with nutritional information and costs
- Build meals by combining ingredients with automatic nutrition calculation
- Create meal plans with drag-and-drop functionality
- Track nutritional goals and food budgets

## Tech Stack

### Frontend
- **Next.js 15** with App Router
- **React** for component-based UI
- **TypeScript** for type safety
- **Material UI v7** for component design
- **DnD Kit** for drag-and-drop functionality
- **GraphQL Request** for API communication

### Backend
- **Node.js** with Express
- **Apollo Server** for GraphQL implementation
- **MongoDB** with Mongoose for data storage
- **GraphQL Compose** for schema generation
- **JWT** for authentication

## Learning Highlights

> [!TIP]
> Most of my challenges and learning experiences are documented in the wiki pages. \
> While they generally document the process of building the application quotes marked with `> [!NOTE]` or some other highlight are more personal notes as well as problems and how I solved them.

## Project Structure

The project is organized into two main directories:

```
MealGen/
├── graduate_frontend/    # Next.js frontend application
├── graduate_backend/     # Node.js GraphQL backend
```

Further details are in the [Project Structure](../../Project-Structure) wiki page.

## Getting Started

### Prerequisites

- Node.js (v16+)
- MongoDB (local or Atlas connection)

### Installation and Setup

The simplest way to get started is to clone the repository and follow the setup instructions in the [Setup and Installation](../../Setup-and-Installation) wiki page. \
Docker is recommended for easy setup and detailed in the wiki.

## Key Features

### User Authentication
- Secure login/signup with JWT authentication
- Protected routes for authenticated users

### Ingredient Management
- Create, update, and delete ingredients
- Track nutritional information and costs

### Meal Creation
- Combine ingredients to create meals
- Automatic calculation of nutritional values and costs

### Meal Planning
- Create meal plans for days or weeks
- Interactive drag-and-drop interface
- Nutritional summaries for each plan

## Development Notes

- [Development Notes](../../Development-Notes) - Insights and lessons learned during development
- [Learning Resources](../../Learning-Resources) - Useful resources for learning about the technologies used in this project

## Current To-Do
- Test Setup-and-Installation.md information
- ~~Add yarn prettier to package.json~~
- ~~Add wiki pages~~
   - ~~Finish all wiki pages~~
- ~~Update README.md with up to date info~~
- ~~Switch .env files with dummy data and reissue api keys~~
- ~~auth Page Error Handling~~
- Sort out last minute dnd bugs

## Next Steps

- Implement error handling and logging on frontend
- Implement more aggressive mongodb validation rules
- Implement automatic calculation and recalculation for nutritional values
- Implement more consistent live update handling
- Implement shared meal plans between users