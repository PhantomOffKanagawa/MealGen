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
  mutation IngredientUpdateById(
    $id: MongoID!
    $record: UpdateByIdIngredientInput!
  ) {
    ingredientUpdateById(_id: $id, record: $record) {
      recordId
    }
  }
`;

// GraphQL mutation to delete an ingredient
const DELETE_INGREDIENT_MUTATION = gql`
  mutation IngredientRemoveById($id: MongoID!) {
    ingredientRemoveById(_id: $id) {
      recordId
    }
  }
`;

// GraphQL subscription to listen for new ingredients
export const INGREDIENT_ADDED = gql`
  subscription IngredientAdded {
    ingredientAdded {
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

export const getAllIngredients = async (graphqlClient: ApolloClient<NormalizedCacheObject>, user: any) => {
  try {
    const { data } = await graphqlClient.query({
      query: GET_ALL_INGREDIENTS_QUERY,
      variables: {
        filter: { userId: user?._id || '' },
      },
    });
    return data.ingredientByUserId;
  } catch (error) {
    console.error("Error fetching ingredients:", error);
    throw error;
  }
};

export const createIngredient = async (
  graphqlClient: any,
  ingredient: Omit<Ingredient, "_id">
) => {
  try {
    const data = await graphqlClient.mutate(
      {
        mutation: CREATE_INGREDIENT_MUTATION,
        variables: {
          record: ingredient,
        },
      }
    );
    return data.data.ingredientCreateOne.record;
  } catch (error) {
    console.error("Error creating ingredient:", error);
    throw error;
  }
};

export const updateIngredient = async (
  graphqlClient: any,
  id: string,
  ingredient: Partial<Ingredient>
) => {
  try {
    // Ensure the ingredient object contains the necessary fields for the update
    const { _id, ...newIngredient } = ingredient;
    const data = await graphqlClient.request(UPDATE_INGREDIENT_MUTATION, {
      id,
      record: newIngredient,
    });
    return data.ingredientUpdateById.recordId;
  } catch (error) {
    console.error("Error updating ingredient:", error);
    throw error;
  }
};

export const deleteIngredient = async (
  graphqlClient: any,
  id: string
) => {
  try {
    const data = await graphqlClient.request(DELETE_INGREDIENT_MUTATION, {
      id,
    });
    return data.ingredientRemoveById.recordId;
  } catch (error) {
    console.error("Error deleting ingredient:", error);
    throw error;
  }
};