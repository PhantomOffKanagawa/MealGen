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

## Project Structure

The project is organized into two main directories:

```
MealGen/
├── graduate_frontend/    # Next.js frontend application
├── graduate_backend/     # Node.js GraphQL backend
```

### Frontend Structure

```
graduate_frontend/
├── public/              # Static assets
├── src/
│   ├── app/             # Next.js app directory (App Router)
│   │   ├── auth/        # Authentication pages
│   │   ├── ingredients/ # Ingredient management
│   │   ├── meals/       # Meal creation and management
│   │   ├── meal-plans/  # Meal plan creation with drag-and-drop
│   ├── components/      # Reusable React components
│   │   ├── dnd/         # Drag and drop components
│   │   ├── ingredients/ # Ingredient-related components
│   │   ├── meals/       # Meal-related components
│   │   ├── meal-plans/  # Meal planning components
│   ├── context/         # React context for state management
│   ├── services/        # API services and data fetching
│   └── utils/           # Utility functions and theme configuration
```

### Backend Structure

```
graduate_backend/
├── graphql/             # GraphQL schema and resolvers
│   ├── schemas/         # Individual schema definitions
├── mongodb/             # MongoDB models
├── utils/               # Utility functions
└── docs/                # Documentation
```

## Getting Started

### Prerequisites

- Node.js (v16+)
- MongoDB (local or Atlas connection)

### Installation and Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/PhantomOffKanagawa/MealGen.git
   cd MealGen
   ```

2. Backend setup:
   ```bash
   cd graduate_backend
   npm install
   ```

3. Create a `.env` file in the backend directory with:
   ```
   MONGODB_URI=<your-mongodb-connection-string>
   JWT_SECRET=<your-jwt-secret>
   PORT=4000
   ```

4. Start the backend server:
   ```bash
   npm run dev
   ```

5. Frontend setup:
   ```bash
   cd ../graduate_frontend
   npm install
   ```

6. Create a `.env.local` file in the frontend directory with:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:4000/graphql
   ```

7. Start the frontend development server:
   ```bash
   npm run dev
   ```

8. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

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

- The frontend uses Next.js with Turbopack for faster development
- Material UI is integrated with Next.js for consistent styling
- GraphQL is used for efficient data fetching with minimal overfetching
- MongoDB schemas are automatically converted to GraphQL types using GraphQL Compose

## Now To-Do
- Test Setup-and-Installation.md information
- ~~Add yarn prettier to package.json~~
- ~~Add wiki pages~~
   - Finish all wiki pages
- Update README.md with up to date info
- ~~Switch .env files with dummy data and reissue api keys~~

## Future To-Do

- Implement error handling and logging on frontend
- Implement more aggressive mongodb validation rules
- Implement automatic calculation and recalculation for nutritional values
- Implement more consistent live update handling
- Implement shared meal plans between users