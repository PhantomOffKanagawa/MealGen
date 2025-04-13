import { gql } from "graphql-request";

// Types
export interface MacroNutrients {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface MealPlanItem {
  type: 'ingredient' | 'meal';
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
const GET_ALL_MEAL_PLANS = gql`
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

const GET_MEAL_PLAN_BY_ID = gql`
  query GetMealPlanById($id: MongoID!) {
    mealPlanById(_id: $id) {
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
const CREATE_MEAL_PLAN = gql`
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
const UPDATE_MEAL_PLAN = gql`
  mutation MealPlanUpdateById(
    $id: MongoID!,
    $record: UpdateByIdMealPlanInput!
  ) {
    mealPlanUpdateById(_id: $id, record: $record) {
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

// GraphQL mutation to delete a meal plan
const DELETE_MEAL_PLAN = gql`
  mutation MealPlanRemoveById($id: MongoID!) {
    mealPlanRemoveById(_id: $id) {
      record {
        _id
        name
      }
    }
  }
`;

// Service functions
export const getAllMealPlans = async (graphqlClient: any, user: any) => {
  try {
    const data = await graphqlClient.request(GET_ALL_MEAL_PLANS, {
      filter: { userId: user?._id || '' },
    });
    return data.mealPlanMany;
  } catch (error) {
    console.error("Error fetching meal plans:", error);
    throw error;
  }
};

export const getMealPlanById = async (graphqlClient: any, id: string) => {
  try {
    const data = await graphqlClient.request(GET_MEAL_PLAN_BY_ID, { id });
    return data.mealPlanById;
  } catch (error) {
    console.error("Error fetching meal plan:", error);
    throw error;
  }
};

export const createMealPlan = async (
  graphqlClient: any,
  mealPlan: Omit<MealPlan, "_id">
) => {
  try {
    const data = await graphqlClient.request(CREATE_MEAL_PLAN, {
      record: mealPlan,
    });
    return data.mealPlanCreateOne.record;
  } catch (error) {
    console.error("Error creating meal plan:", error);
    throw error;
  }
};

export const updateMealPlan = async (
  graphqlClient: any,
  id: string,
  mealPlan: Partial<MealPlan>
) => {
  try {
    // Ensure the mealPlan object contains the necessary fields for the update
    const { _id, ...newMealPlan } = mealPlan;
    const data = await graphqlClient.request(UPDATE_MEAL_PLAN, {
      id,
      record: newMealPlan,
    });
    return data.mealPlanUpdateById.record;
  } catch (error) {
    console.error("Error updating meal plan:", error);
    throw error;
  }
};

export const deleteMealPlan = async (
  graphqlClient: any,
  id: string
) => {
  try {
    const data = await graphqlClient.request(DELETE_MEAL_PLAN, {
      id,
    });
    return data.mealPlanRemoveById.record;
  } catch (error) {
    console.error("Error deleting meal plan:", error);
    throw error;
  }
};
