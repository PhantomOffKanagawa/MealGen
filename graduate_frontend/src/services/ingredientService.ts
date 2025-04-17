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

export const getAllIngredients = async (graphqlClient: ApolloClient<NormalizedCacheObject>, user: any) => {
  try {
    const response = await graphqlClient.query({
      query: GET_ALL_INGREDIENTS_QUERY,
      variables: {
      filter: { userId: user?._id || '' },
      },
      fetchPolicy: 'no-cache',
    });
    return response.data.ingredientByUserId;
  } catch (error) {
    console.error("Error fetching ingredients:", error);
    throw error;
  }
};

export const createIngredient = async (
  graphqlClient: ApolloClient<NormalizedCacheObject>,
  ingredient: Omit<Ingredient, "_id">
) => {
  try {
    const response = await graphqlClient.mutate(
      {
        mutation: CREATE_INGREDIENT_MUTATION,
        variables: {
          record: ingredient,
        },
      }
    );
    return response.data.ingredientCreateOne.record;
  } catch (error) {
    console.error("Error creating ingredient:", error);
    throw error;
  }
};

export const updateIngredient = async (
  graphqlClient: ApolloClient<NormalizedCacheObject>,
  id: string,
  userId: string,
  ingredient: Partial<Ingredient>
) => {
  try {
    // Create a clean input object for the mutation
    const cleanInput: Record<string, any> = {};
    
    // Copy relevant fields, omitting __typename and _id
    if ('userId' in ingredient && ingredient.userId) cleanInput.userId = ingredient.userId;
    if ('name' in ingredient && ingredient.name) cleanInput.name = ingredient.name;
    if ('quantity' in ingredient) cleanInput.quantity = ingredient.quantity;
    if ('unit' in ingredient && ingredient.unit) cleanInput.unit = ingredient.unit;
    if ('price' in ingredient) cleanInput.price = ingredient.price;
    
    // Handle macros separately to remove __typename
    if (ingredient.macros) {
      cleanInput.macros = {
        calories: ingredient.macros.calories,
        protein: ingredient.macros.protein,
        carbs: ingredient.macros.carbs,
        fat: ingredient.macros.fat
      };
    }
      const response = await graphqlClient.mutate({
      mutation: UPDATE_INGREDIENT_MUTATION,
      variables: {
        filter: {
          _id: id,
          userId: userId,
        },
        record: cleanInput,
      },
    });
    return response.data.ingredientUpdateOne.recordId;
  } catch (error) {
    console.error("Error updating ingredient:", error);
    throw error;
  }
};

export const deleteIngredient = async (
  graphqlClient: ApolloClient<NormalizedCacheObject>,
  id: string,
  userId: string
) => {
  try {
    const response = await graphqlClient.mutate({
      mutation: DELETE_INGREDIENT_MUTATION,
      variables: {
        filter: {
          _id: id,
          userId: userId,
        }
      },
    });
    return response.data.ingredientRemoveOne.recordId;
  } catch (error) {
    console.error("Error deleting ingredient:", error);
    throw error;
  }
};