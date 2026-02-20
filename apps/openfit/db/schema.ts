import * as auth from "./schema/auth";
import * as exercises from "./schema/exercises";
import * as reference from "./schema/reference";
import * as relations from "./schema/relations";
import * as routines from "./schema/routines";
import * as userData from "./schema/user-data";
import * as workouts from "./schema/workouts";

export const schema = {
  ...auth,
  ...userData,
  ...reference,
  ...exercises,
  ...routines,
  ...workouts,
  ...relations,
};

export default schema;
