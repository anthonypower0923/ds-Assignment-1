import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand , QueryCommand, QueryCommandInput } from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import * as AWS from 'aws-sdk';
import apiResponses from './common/apiResponses';

const ddbClient = new DynamoDBClient({ region: process.env.REGION });

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  try {
    console.log("[EVENT]", JSON.stringify(event));
    const translate = new AWS.Translate();
    const parameters  = event?.pathParameters;
    const gameId = parameters?.gameId ? parseInt(parameters.gameId) : undefined;
    const queryParams = event.queryStringParameters;

    if (!gameId) {
      return {
        statusCode: 404,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ Message: "Missing game Id" }),
      };
    }

    let commandOutput = await ddbClient.send(
      new GetCommand({
        TableName: process.env.TABLE_NAME,
        Key: { id: gameId },
      })
    );
    console.log("GetCommand response: ", commandOutput);
    if (!commandOutput.Item) {
      return {
        statusCode: 404,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ Message: "Invalid game Id" }),
      };
    }

    if (queryParams) {
      if (queryParams.language) {
        try {
          const translateParams: AWS.Translate.Types.TranslateTextRequest = {
            SourceLanguageCode: 'en',
            TargetLanguageCode: queryParams.language,
            Text: commandOutput.Item.overview,
        };
          commandOutput.Item.overview = (await translate.translateText(translateParams).promise()).TranslatedText;
        } catch (error) {
          return apiResponses._400({ message: 'unable to translate the message' + error });
        }
      }
    }

    const body = {
      data: commandOutput.Item,
    };

    // Return Response
    if (!queryParams) {
    return {
      statusCode: 200,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    };
  } else if (queryParams.soundtrack == 'True') {
    let commandInput: QueryCommandInput = {
      TableName: process.env.Soundtrack_TABLE_NAME,
    };

    commandInput = {
      ...commandInput,
      KeyConditionExpression: "gameId = :g",
      ExpressionAttributeValues: {
        ":g": gameId,
      },
    };

    const queryCommandOutput = await ddbClient.send(
      new QueryCommand(commandInput)
      );

      const body_soundtrack = {
        data: commandOutput.Item,
        soundtrack: queryCommandOutput.Items
      }
      return {
        statusCode: 200,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(body_soundtrack),
      };
    } else {
      return {
        statusCode: 200,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(body),
      };
    }
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

function createDDbDocClient() {
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