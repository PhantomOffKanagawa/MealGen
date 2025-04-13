import { gql } from "graphql-request";

// Types
export interface MealIngredient {
  ingredientId: string;
  quantity: number;
}

export interface Meal {
  _id: string;
  userId: string;
  name: string;
  ingredients: MealIngredient[];
  macros: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  price: number;
}

// GraphQL Queries and Mutations
// GraphQL query to fetch all meals
const GET_ALL_MEALS_QUERY = gql`
  query MealByUserId($filter: FilterFindManyMealInput) {
    mealByUserId(filter: $filter) {
      userId
      name
      ingredients {
        ingredientId
        quantity
      }
      macros {
        calories
        protein
        carbs
        fat
      }
      price
      _id
    }
  }
`;

// GraphQL mutation to create a new meal
const CREATE_MEAL_MUTATION = gql`
  mutation MealCreateOne($record: CreateOneMealInput!) {
    mealCreateOne(record: $record) {
      record {
        userId
        name
        ingredients {
          ingredientId
          quantity
        }
        macros {
          calories
          protein
          carbs
          fat
        }
        price
      }
    }
  }
`;

// GraphQL mutation to update an existing meal
const UPDATE_MEAL_MUTATION = gql`
  mutation MealUpdateById(
    $id: MongoID!
    $record: UpdateByIdMealInput!
  ) {
    mealUpdateById(_id: $id, record: $record) {
      recordId
    }
  }
`;

// GraphQL mutation to delete a meal
const DELETE_MEAL_MUTATION = gql`
  mutation MealRemoveById($id: MongoID!) {
    mealRemoveById(_id: $id) {
      recordId
    }
  }
`;

export const getAllMeals = async (graphqlClient: any, user: any) => {
  try {
    const data = await graphqlClient.request(GET_ALL_MEALS_QUERY, {
      filter: { userId: user?._id || '' },
    });
    return data.mealByUserId;
  } catch (error) {
    console.error("Error fetching meals:", error);
    throw error;
  }
};

export const createMeal = async (
  graphqlClient: any,
  meal: Omit<Meal, "_id">
) => {
  try {
    const data = await graphqlClient.request(CREATE_MEAL_MUTATION, {
      record: meal,
    });
    return data.mealCreateOne.record;
  } catch (error) {
    console.error("Error creating meal:", error);
    throw error;
  }
};

export const updateMeal = async (
  graphqlClient: any,
  id: string,
  meal: Partial<Meal>
) => {
  try {
    // Ensure the meal object contains the necessary fields for the update
    const { _id, ...newMeal } = meal;
    const data = await graphqlClient.request(UPDATE_MEAL_MUTATION, {
      id,
      record: newMeal,
    });
    return data.mealUpdateById.recordId;
  } catch (error) {
    console.error("Error updating meal:", error);
    throw error;
  }
};

export const deleteMeal = async (
  graphqlClient: any,
  id: string
) => {
  try {
    const data = await graphqlClient.request(DELETE_MEAL_MUTATION, {
      id,
    });
    return data.mealRemoveById.recordId;
  } catch (error) {
    console.error("Error deleting meal:", error);
    throw error;
  }
};
