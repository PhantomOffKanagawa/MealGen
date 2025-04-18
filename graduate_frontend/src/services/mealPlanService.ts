import { gql } from "@apollo/client";

// Types
export interface MacroNutrients {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface MealPlanItem {
  type: "ingredient" | "meal";
  itemId: string;
  quantity: number;
  group: string;
}

export interface MealPlan {
  _id: string;
  userId: string;
  name: string;
  items: MealPlanItem[];
  macros: MacroNutrients;
  price: number;
}

// GraphQL Queries and Mutations
// GraphQL query to fetch all meal plans
const GET_ALL_MEAL_PLANS_QUERY = gql`
  query GetMealPlans($filter: FilterFindManyMealPlanInput) {
    mealPlanMany(filter: $filter) {
      _id
      userId
      name
      items {
        type
        itemId
        quantity
        group
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
`;

// GraphQL mutation to create a new meal plan
const CREATE_MEAL_PLAN_MUTATION = gql`
  mutation MealPlanCreateOne($record: CreateOneMealPlanInput!) {
    mealPlanCreateOne(record: $record) {
      record {
        _id
        userId
        name
        items {
          type
          itemId
          quantity
          group
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

// GraphQL mutation to update an existing meal plan
const UPDATE_MEAL_PLAN_MUTATION = gql`
  mutation MealPlanUpdateOne(
    $filter: FilterUpdateOneMealPlanInput
    $record: UpdateOneMealPlanInput!
  ) {
    mealPlanUpdateOne(filter: $filter, record: $record) {
      recordId
    }
  }
`;

// GraphQL mutation to delete a meal plan
const DELETE_MEAL_PLAN_MUTATION = gql`
  mutation MealPlanRemoveOne($filter: FilterRemoveOneMealPlanInput) {
    mealPlanRemoveOne(filter: $filter) {
      recordId
    }
  }
`;

// GraphQL subscription to listen for updated meal plans
export const MEAL_PLAN_UPDATED = gql`
  subscription Subscription($userId: MongoID!) {
    mealPlanUpdated(userId: $userId) {
      mealPlanUpdated {
        userId
        name
        items {
          type
          itemId
          quantity
          group
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

// Service functions
export const getAllMealPlans = async (graphqlClient: any, user: any) => {
  try {
    const response = await graphqlClient.query({
      query: GET_ALL_MEAL_PLANS_QUERY,
      variables: {
        filter: { userId: user?._id || "" },
      },
      fetchPolicy: "no-cache",
    });
    return response.data.mealPlanMany;
  } catch (error) {
    console.error("Error fetching meal plans:", error);
    throw error;
  }
};

export const createMealPlan = async (
  graphqlClient: any,
  mealPlan: Omit<MealPlan, "_id">,
) => {
  try {
    const response = await graphqlClient.mutate({
      mutation: CREATE_MEAL_PLAN_MUTATION,
      variables: {
        record: mealPlan,
      },
    });
    return response.data.mealPlanCreateOne.record;
  } catch (error) {
    console.error("Error creating meal plan:", error);
    throw error;
  }
};

export const updateMealPlan = async (
  graphqlClient: any,
  id: string,
  userId: string,
  mealPlan: Partial<MealPlan>,
) => {
  try {
    // Ensure the mealPlan object contains the necessary fields for the update
    const { _id, ...newMealPlan } = mealPlan;
    const response = await graphqlClient.mutate({
      mutation: UPDATE_MEAL_PLAN_MUTATION,
      variables: {
        filter: { _id: id, userId },
        record: newMealPlan,
      },
    });
    return response.data.mealPlanUpdateOne.recordId;
  } catch (error) {
    console.error("Error updating meal plan:", error);
    throw error;
  }
};

export const deleteMealPlan = async (
  graphqlClient: any,
  id: string,
  userId: string,
) => {
  try {
    const response = await graphqlClient.mutate({
      mutation: DELETE_MEAL_PLAN_MUTATION,
      variables: {
        filter: {
          _id: id,
          userId,
        },
      },
    });
    return response.data.mealPlanRemoveOne.recordId;
  } catch (error) {
    console.error("Error deleting meal plan:", error);
    throw error;
  }
};
