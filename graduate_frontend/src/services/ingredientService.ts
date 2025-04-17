import { ApolloClient, NormalizedCacheObject } from "@apollo/client";
import { useMutation, gql, useQuery, useSubscription } from "@apollo/client";

// Types
export interface Ingredient {
  _id: string;
  userId: string;
  name: string;
  quantity: number;
  unit: string;
  macros: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  price: number;
}

// GraphQL Queries and Mutations
// GraphQL query to fetch all ingredients
const GET_ALL_INGREDIENTS_QUERY = gql`
  query IngredientByUserId($filter: FilterFindManyIngredientInput) {
    ingredientByUserId(filter: $filter) {
      userId
      name
      quantity
      unit
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

// GraphQL mutation to create a new ingredient
const CREATE_INGREDIENT_MUTATION = gql`
  mutation IngredientCreateOne($record: CreateOneIngredientInput!) {
    ingredientCreateOne(record: $record) {
      record {
        userId
        name
        quantity
        unit
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

// GraphQL mutation to update an existing ingredient
const UPDATE_INGREDIENT_MUTATION = gql`
mutation IngredientUpdateOne($filter: FilterUpdateOneIngredientInput, $record: UpdateOneIngredientInput!) {
  ingredientUpdateOne(filter: $filter, record: $record) {
    recordId
  }
}
`;

// GraphQL mutation to delete an ingredient
const DELETE_INGREDIENT_MUTATION = gql`
  mutation IngredientRemoveOne($filter: FilterRemoveOneIngredientInput) {
    ingredientRemoveOne(filter: $filter) {
      recordId
    }
  }
`;

// GraphQL subscription to listen for updated ingredients
export const INGREDIENT_UPDATED = gql`
  subscription Subscription($userId: MongoID!) {
    ingredientUpdated(userId: $userId) {
      ingredientUpdated {
        userId
        name
        quantity
        unit
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

// Function to fetch all ingredients for a user
// This function takes a GraphQL client and a user object as parameters
export const getAllIngredients = async (graphqlClient: ApolloClient<NormalizedCacheObject>, user: any) => {
  try {
    // Fetch all ingredients for the user using the GraphQL client
    // The query is executed with the user's ID as a filter
    // The fetchPolicy is set to 'no-cache' to ensure fresh data is fetched from the server
    const response = await graphqlClient.query({
      query: GET_ALL_INGREDIENTS_QUERY,
      variables: {
      filter: { userId: user?._id || '' },
      },
      fetchPolicy: 'no-cache',
    });
    // Return the list of ingredients for the user
    return response.data.ingredientByUserId;
  } catch (error) {
    // Log any errors that occur during the fetch operation
    console.error("Error fetching ingredients:", error);
    throw error;
  }
};

// Function to create a new ingredient
// This function takes a GraphQL client and an ingredient object as parameters
export const createIngredient = async (
  graphqlClient: ApolloClient<NormalizedCacheObject>,
  ingredient: Omit<Ingredient, "_id">
) => {
  try {
    // Send ingredient data in creation request
    const response = await graphqlClient.mutate(
      {
        mutation: CREATE_INGREDIENT_MUTATION,
        variables: {
          record: ingredient,
        },
      }
    );
    // Return the created ingredient record
    return response.data.ingredientCreateOne.record;
  } catch (error) {
    // Log any errors that occur during the creation operation
    console.error("Error creating ingredient:", error);
    throw error;
  }
};

// Function to update an existing ingredient
// This function takes a GraphQL client, an ingredient ID, a user ID, and an ingredient object as parameters
export const updateIngredient = async (
  graphqlClient: ApolloClient<NormalizedCacheObject>,
  id: string,
  userId: string,
  ingredient: Partial<Ingredient>
) => {
  try {
    // // Create a clean input object for the mutation
    // const cleanInput: Record<string, any> = {};
    
    // // Copy relevant fields, omitting __typename and _id
    // if ('userId' in ingredient && ingredient.userId) cleanInput.userId = ingredient.userId;
    // if ('name' in ingredient && ingredient.name) cleanInput.name = ingredient.name;
    // if ('quantity' in ingredient) cleanInput.quantity = ingredient.quantity;
    // if ('unit' in ingredient && ingredient.unit) cleanInput.unit = ingredient.unit;
    // if ('price' in ingredient) cleanInput.price = ingredient.price;
    
    // // Handle macros separately to remove __typename
    // if (ingredient.macros) {
    //   cleanInput.macros = {
    //     calories: ingredient.macros.calories,
    //     protein: ingredient.macros.protein,
    //     carbs: ingredient.macros.carbs,
    //     fat: ingredient.macros.fat
    //   };
    // }

    const {_id, ...cleanIngredient}: any = ingredient; // Destructure to omit _id
    // Remove __typename from macros if it exists
    delete cleanIngredient.__typename;
    delete cleanIngredient.macros?.__typename

    const response = await graphqlClient.mutate({
      mutation: UPDATE_INGREDIENT_MUTATION,
      variables: {
        filter: {
          _id: id,
          userId: userId,
        },
        record: cleanIngredient,
      },
    });
    // Return the updated ingredient record ID
    return response.data.ingredientUpdateOne.recordId;
  } catch (error) {
    // Log any errors that occur during the update operation
    console.error("Error updating ingredient:", error);
    throw error;
  }
};

// Function to delete an ingredient
// This function takes a GraphQL client, an ingredient ID, and a user ID as parameters
export const deleteIngredient = async (
  graphqlClient: ApolloClient<NormalizedCacheObject>,
  id: string,
  userId: string
) => {
  try {
    // Send delete request with the ingredient ID and user ID
    const response = await graphqlClient.mutate({
      mutation: DELETE_INGREDIENT_MUTATION,
      variables: {
        filter: {
          _id: id,
          userId: userId,
        }
      },
    });
    // Return the deleted ingredient record ID
    return response.data.ingredientRemoveOne.recordId;
  } catch (error) {
    // Log any errors that occur during the deletion operation
    console.error("Error deleting ingredient:", error);
    throw error;
  }
};