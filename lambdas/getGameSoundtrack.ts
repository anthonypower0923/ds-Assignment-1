import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  QueryCommand,
  QueryCommandInput,
} from "@aws-sdk/lib-dynamodb";

const ddbDocClient = createDocumentClient();

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  try {
    console.log("Event: ", JSON.stringify(event));
    const queryParams = event.queryStringParameters;
    if (!queryParams) {
      return {
        statusCode: 500,
        headers: {
          "content-type": "application/json",
 },
        body: JSON.stringify({ message: "Missing query parameters" }),
 };
 }
    if (!queryParams.gameId) {
      return {
        statusCode: 500,
        headers: {
          "content-type": "application/json",
 },
        body: JSON.stringify({ message: "Missing game Id parameter" }),
 };
 }
    const gameId = parseInt(queryParams?.gameId);
    let commandInput: QueryCommandInput = {
      TableName: process.env.Soundtrack_TABLE_NAME,
 };
    if ("artist" in queryParams) {
      commandInput = {
 ...commandInput,
        IndexName: "artistIx",
        KeyConditionExpression: "gameId = :m and begins_with(artist, :a) ",
        ExpressionAttributeValues: {
          ":m": gameId,
          ":a": queryParams.artist,
 },
 };
 } else if ("title" in queryParams) {
      commandInput = {
 ...commandInput,
        KeyConditionExpression: "gameId = :m and begins_with(title, :t) ",
        ExpressionAttributeValues: {
          ":m": gameId,
          ":t": queryParams.title,
 },
 };
 } else {
      commandInput = {
 ...commandInput,
        KeyConditionExpression: "gameId = :m",
        ExpressionAttributeValues: {
          ":m": gameId,
 },
 };
 }

    const commandOutput = await ddbDocClient.send(
      new QueryCommand(commandInput)
 );

    return {
      statusCode: 200,
      headers: {
        "content-type": "application/json",
 },
      body: JSON.stringify({
        data: commandOutput.Items,
 }),
 };
 } catch (error: any) {
    console.log(JSON.stringify(error));
    return {
      statusCode: 500,
      headers: {
        "content-type": "application/json",
 },
      body: JSON.stringify({ error }),
 };
 }
};

function createDocumentClient() {
  const ddbClient = new DynamoDBClient({ region: process.env.REGION });
  const marshallOptions = {
    convertEmptyValues: true,
    removeUndefinedValues: true,
    convertClassInstanceToMap: true,
 };
  const unmarshallOptions = {
    wrapNumbers: false,
 };
  const translateConfig = { marshallOptions, unmarshallOptions };
  return DynamoDBDocumentClient.from(ddbClient, translateConfig);
}