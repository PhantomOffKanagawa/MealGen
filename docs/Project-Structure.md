# Project Structure

This document explains the organization and structure of the MealGen codebase, which is divided into frontend and backend components.

## Root Project Structure

```
graduate_project_v/
├── graduate_frontend/    # Next.js frontend application
├── graduate_backend/     # Node.js GraphQL backend
├── docs/                 # Project documentation
├── README.md             # Project overview and setup instructions
```

## Frontend Structure (`graduate_frontend/`)

The frontend follows Next.js 15 conventions with the App Router pattern:

```
graduate_frontend/
├── public/                                 # Static assets
├── src/                    
│   ├── app/                                # Next.js app directory (App Router)
│   │   ├── auth/                           # Authentication pages
│   │   ├── ingredients/                    # Ingredient management
│   │   ├── meals/                          # Meal creation and management
│   │   ├── meal-plans/                     # Meal plan creation with drag-and-drop
│   │   ├── layout.tsx                      # Root layout component
│   │   ├── page.tsx                        # Home page component
│   │   └── globals.css                     # Global styles
│   ├── components/                         # Reusable React components
│   │   ├── dnd/                            # Drag and drop components
│   │   │   ├── Column.tsx                  # Column component for drag-and-drop
│   │   │   ├── DragDropMealPlanForm.tsx    # Main drag-and-drop interface
│   │   │   └── Item.tsx                    # Draggable item component
│   │   ├── ingredients/                    # Ingredient-related components
│   │   │   └── IngredientEditDialog.tsx    # Ingredient editing form
│   │   ├── meals/                          # Meal-related components
│   │   │   └── MealEditDialog.tsx          # Meal editing form
│   │   ├── meal-plans/                     # Meal planning components
│   │   │   ├── GroupedItemsList.tsx        # Grouped items display
│   │   │   ├── MealPlanEditDialog.tsx      # Meal plan editing form
│   │   │   └── NutritionTracker.tsx        # Nutrition summary component
│   │   ├── AuthGuard.tsx                   # Authentication protection component
│   │   ├── DataTable.tsx                   # Reusable data table component
│   │   ├── DeleteConfirmationDialog.tsx    # Confirm deletion dialog
│   │   ├── Header.tsx                      # Application header component
│   │   ├── PageHeader.tsx                  # Page header component
│   │   ├── NewComponent.tsx                # New component for additional functionality
│   ├── context/                            # React context for state management
│   │   └── AuthContext.tsx                 # Authentication context
│   ├── services/                           # API services and data fetching
│   │   ├── authService.ts                  # Authentication API functions
│   │   ├── graphql.ts                      # GraphQL client configuration
│   │   ├── ingredientService.ts            # Ingredient API functions
│   │   ├── mealService.ts                  # Meal API functions
│   │   └── mealPlanService.ts              # Meal plan API functions
│   └── utils/                              # Utility functions and theme configuration
│       └── theme.ts                        # Material UI theme configuration
├── next.config.ts                          # Next.js configuration
├── package.json                            # Dependencies and scripts
├── tsconfig.json                           # TypeScript configuration
└── README.md                               # Frontend-specific documentation
```

## Backend Structure (`graduate_backend/`)

The backend follows a modular structure organized around GraphQL and MongoDB:

```
graduate_backend/
├── graphql/             # GraphQL schema and resolvers
│   ├── schemas/         # Individual schema definitions
│   │   ├── IngredientSchema.js      # Ingredient GraphQL schema
│   │   ├── MealPlanSchema.js        # Meal Plan GraphQL schema
│   │   ├── MealSchema.js            # Meal GraphQL schema
│   │   └── UserSchema.js            # User GraphQL schema
│   ├── customOptions.js             # Custom resolver options
│   └── graphqlSchema.js             # Combined GraphQL schema
├── mongodb/             # MongoDB models
│   ├── IngredientModel.js           # Ingredient database model
│   ├── MealModel.js                 # Meal database model
│   ├── MealPlanModel.js             # Meal Plan database model
│   └── UserModel.js                 # User database model
├── utils/               # Utility functions
│   ├── env.js                       # Environment configuration
│   └── pubsub.js                    # PubSub for GraphQL subscriptions
├── docs/                # Backend documentation
│   ├── data-setup.md                # Data model setup guide
│   └── live-update.md               # Real-time update system guide
├── index.js             # Main application entry point
├── package.json         # Dependencies and scripts
└── README.md            # Backend-specific documentation
```

## Key File Responsibilities

### Frontend

1. **App Pages (`src/app/*/page.tsx`)**
   - Define page components for different sections of the application
   - Handle data fetching and state management
   - Integrate with the component system

2. **Components (`src/components/`)**
   - Encapsulate UI elements and functionality
   - Promote reusability across the application
   - Receive props from parent components

3. **Services (`src/services/`)**
   - Abstract API communication
   - Define TypeScript interfaces for data models
   - Implement GraphQL queries, mutations, and subscriptions

4. **Context (`src/context/`)**
   - Provide global state management
   - Share data between components without prop drilling
   - Handle authentication state

### Backend

1. **MongoDB Models (`mongodb/`)**
   - Define database schema using Mongoose
   - Implement validation rules

2. **GraphQL Schemas (`graphql/schemas/`)**
   - Convert Mongoose models to GraphQL types
   - Define queries, mutations, and subscriptions
   - Implement resolvers for data operations
   - Implement subscription resolvers for real-time updates
   - Use GraphQL Compose for schema generation

3. **Main Application (`index.js`)**
   - Configure Express and Apollo Server for HTTP and WebSocket
   - Set up middleware and authentication
   - Connect to MongoDB
   - Establish WebSocket connection for subscriptions

## Code Organization Principles

The project follows several code organization principles:

1. **Separation of Concerns**
   - Clear separation between UI components, business logic, and data access
   - Each file has a single, well-defined responsibility

2. **Feature-Based Organization**
   - Frontend code is primarily organized by feature (ingredients, meals, meal plans)
   - Backend code is organized by purpose (schemas, models, resolvers)
   - Shared components are separated into common directories

3. **Consistent Naming**
   - Files are named according to their primary content
   - Consistent naming patterns (e.g., `*Service.ts`, `*Schema.js`, `*Model.js`)

4. **Modular Architecture**
   - Components are designed to be modular and reusable
   - Clear interfaces between different parts of the application

## Key Takeaways

The project structure demonstrates several important concepts:

1. **Modern Web Application Organization**: Clear separation of frontend and backend with well-defined APIs
2. **Next.js App Router Pattern**: Organization according to Next.js 15 best practices
3. **GraphQL API Structure**: Modular organization of GraphQL schemas and resolvers
4. **MongoDB/Mongoose Integration**: Proper separation of database models and API schema
5. **Feature-Based Code Organization**: Grouping code by feature rather than technical type
