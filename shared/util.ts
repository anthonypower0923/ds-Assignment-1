import { marshall } from "@aws-sdk/util-dynamodb";
import { Game, Soundtrack } from "./types";

type Entity = Game | Soundtrack;  // NEW
export const generateItem = (entity: Entity) => {
  return {
    PutRequest: {
      Item: marshall(entity),
 },
 };
};

export const generateBatch = (data: Entity[]) => {
  return data.map((e) => {
    return generateItem(e);
 });
};