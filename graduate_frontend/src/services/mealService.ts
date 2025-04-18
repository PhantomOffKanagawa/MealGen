import { gql } from "@apollo/client";

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

// GraphQL mutation to update an existing meal by ID
const UPDATE_MEAL_MUTATION = gql`
  mutation MealUpdateOne(
    $filter: FilterUpdateOneMealInput
    $record: UpdateOneMealInput!
  ) {
    mealUpdateOne(filter: $filter, record: $record) {
      recordId
    }
  }
`;

// GraphQL mutation to delete a meal
const DELETE_MEAL_MUTATION = gql`
  mutation MealRemoveOne($filter: FilterRemoveOneMealInput!) {
    mealRemoveOne(filter: $filter) {
      recordId
    }
  }
`;

// GraphQL subscription to listen for updated meals
export const MEAL_UPDATED = gql`
  subscription MealSubscription($userId: MongoID!) {
    mealUpdated(userId: $userId) {
      mealUpdated {
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
      sourceClientId
    }
  }
`;

export const getAllMeals = async (graphqlClient: any, user: any) => {
  try {
    // Fetch all meals for the user using the GraphQL client
    // The query is executed with the user's ID as a filter
    // The fetchPolicy is set to 'no-cache' to ensure fresh data is fetched from the server
    const response = await graphqlClient.query({
      query: GET_ALL_MEALS_QUERY,
      variables: {
        filter: { userId: user?._id || "" },
      },
      fetchPolicy: "no-cache",
    });
    // Return the list of meals for the user
    return response.data.mealByUserId;
  } catch (error) {
    // Log any errors that occur during the fetch operation
    console.error("Error fetching ingredients:", error);
    throw error;
  }
};

// Function to create a new meal
// This function takes a GraphQL client and an meal object as parameters
export const createMeal = async (
  graphqlClient: any,
  meal: Omit<Meal, "_id">,
) => {
  try {
    // Send meal data in creation request
    const response = await graphqlClient.mutate({
      mutation: CREATE_MEAL_MUTATION,
      variables: {
        record: meal,
      },
    });
    // Return the created meal record
    return response.data.mealCreateOne.record;
  } catch (error) {
    // Log any errors that occur during the creation operation
    console.error("Error creating meal:", error);
    throw error;
  }
};

// Function to update an existing meal
// This function takes a GraphQL client, meal ID, and a partial meal object as parameters
export const updateMeal = async (
  graphqlClient: any,
  id: string,
  userId: string,
  meal: Partial<Meal>,
) => {
  try {
    // Ensure the meal object contains the necessary fields for the update
    const { _id, ...cleanMeal }: any = meal; // Destructure and remove _id
    // Remove __typename from the meal object if it exists
    delete cleanMeal?.__typename;
    delete cleanMeal?.macros?.__typename;

    // Clean __typename from each ingredient in the ingredients array
    if (cleanMeal.ingredients && Array.isArray(cleanMeal.ingredients)) {
      cleanMeal.ingredients = cleanMeal.ingredients.map((ingredient: any) => {
        const { __typename, ...cleanIngredient } = ingredient;
        return cleanIngredient;
      });
    }

    // Send update request with the meal ID and updated data
    const response = await graphqlClient.mutate({
      mutation: UPDATE_MEAL_MUTATION,
      variables: {
        filter: { _id: id },
        record: cleanMeal,
      },
    });

    // Return the ID of the updated meal
    return response.data.mealUpdateOne.recordId;
  } catch (error) {
    // Log any errors that occur during the update operation
    console.error("Error updating meal:", error);
    throw error;
  }
};

// Function to delete a meal
// This function takes a GraphQL client and meal ID as parameters
export const deleteMeal = async (
  graphqlClient: any,
  id: string,
  userId: string,
) => {
  try {
    // Send delete request with the meal ID
    const response = await graphqlClient.mutate({
      mutation: DELETE_MEAL_MUTATION,
      variables: {
        filter: { _id: id, userId: userId },
      },
    });
    // Return the ID of the deleted meal
    return response.data.mealRemoveOne.recordId;
  } catch (error) {
    // Log any errors that occur during the deletion operation
    console.error("Error deleting meal:", error);
    throw error;
  }
};
