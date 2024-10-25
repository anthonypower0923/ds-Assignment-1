import * as cdk from 'aws-cdk-lib';
import * as lambdanode from 'aws-cdk-lib/aws-lambda-nodejs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as custom from "aws-cdk-lib/custom-resources";
import { generateBatch } from "../shared/util";
import {games, songs} from "../seed/games";
import * as apig from "aws-cdk-lib/aws-apigateway";
import { Construct } from 'constructs';

export class AssignmentAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const gamesTable = new dynamodb.Table(this, "GamesTable", {
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      partitionKey: { name: "id", type: dynamodb.AttributeType.NUMBER },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      tableName: "Games",
    });

    const songsTable = new dynamodb.Table(this, "SongsTable", {
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      partitionKey: { name: "gameId", type: dynamodb.AttributeType.NUMBER },
      sortKey: { name: "title", type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      tableName: "Songs",
 });

    songsTable.addLocalSecondaryIndex({
      indexName: "artistIx",
      sortKey: { name: "artist", type: dynamodb.AttributeType.STRING },
 });

    const getGameByIdFn = new lambdanode.NodejsFunction(
      this,
      "GetGameByIdFn",
      {
        architecture: lambda.Architecture.ARM_64,
        runtime: lambda.Runtime.NODEJS_18_X,
        entry: `${__dirname}/../lambdas/getGameById.ts`,
        timeout: cdk.Duration.seconds(10),
        memorySize: 128,
        environment: {
          TABLE_NAME: gamesTable.tableName,
          REGION: 'eu-west-1',
        },
      }
    );


    const getAllGamesFn = new lambdanode.NodejsFunction(
      this,
      "GetAllGamesFn",
      {
        architecture: lambda.Architecture.ARM_64,
        runtime: lambda.Runtime.NODEJS_18_X,
        entry: `${__dirname}/../lambdas/getAllGames.ts`,
        timeout: cdk.Duration.seconds(10),
        memorySize: 128,
        environment: {
          TABLE_NAME: gamesTable.tableName,
          REGION: 'eu-west-1',
        },
      }
    );


    const getGameSoundtracksFn = new lambdanode.NodejsFunction(
      this,
      "GetCastMemberFn",
 {
        architecture: lambda.Architecture.ARM_64,
        runtime: lambda.Runtime.NODEJS_16_X,
        entry: `${__dirname}/../lambdas/getGameSoundtrack.ts`,
        timeout: cdk.Duration.seconds(10),
        memorySize: 128,
        environment: {
          CAST_TABLE_NAME: songsTable.tableName,
          REGION: "eu-west-1",
 },
 }
 );


    const newGameFn = new lambdanode.NodejsFunction(this, "AddGameFn", {
    architecture: lambda.Architecture.ARM_64,
    runtime: lambda.Runtime.NODEJS_16_X,
    entry: `${__dirname}/../lambdas/addGame.ts`,
    timeout: cdk.Duration.seconds(10),
    memorySize: 128,
    environment: {
      TABLE_NAME: gamesTable.tableName,
      REGION: "eu-west-1",
    },
    });

    const deleteGameByIdFn = new lambdanode.NodejsFunction(
      this,
      "DeleteGameByIdFn",
      {
        architecture: lambda.Architecture.ARM_64,
        runtime: lambda.Runtime.NODEJS_18_X,
        entry: `${__dirname}/../lambdas/deleteGame.ts`,
        timeout: cdk.Duration.seconds(10),
        memorySize: 128,
        environment: {
          TABLE_NAME: gamesTable.tableName,
          REGION: 'eu-west-1',
        },
      }
      );

    gamesTable.grantReadData(getGameByIdFn)
    gamesTable.grantReadData(getAllGamesFn)
    songsTable.grantReadData(getGameSoundtracksFn)
    gamesTable.grantReadWriteData(newGameFn)
    gamesTable.grantReadWriteData(deleteGameByIdFn)

    // REST API 
    const api = new apig.RestApi(this, "AssignmentRestAPI", {
      description: "assignment api",
      deployOptions: {
        stageName: "dev",
      },
      defaultCorsPreflightOptions: {
        allowHeaders: ["Content-Type", "X-Amz-Date"],
        allowMethods: ["OPTIONS", "GET", "POST", "PUT", "PATCH", "DELETE"],
        allowCredentials: true,
        allowOrigins: ["*"],
      },
    });

    const gamesEndpoint = api.root.addResource("games");
    gamesEndpoint.addMethod(
      "GET",
      new apig.LambdaIntegration(getAllGamesFn, { proxy: true })
    );

    const gameEndpoint = gamesEndpoint.addResource("{gameId}");
    gameEndpoint.addMethod(
      "GET",
      new apig.LambdaIntegration(getGameByIdFn, { proxy: true })
    );

    gamesEndpoint.addMethod(
      "POST",
      new apig.LambdaIntegration(newGameFn, { proxy: true })
    );

    gameEndpoint.addMethod(
      "DELETE",
      new apig.LambdaIntegration(deleteGameByIdFn, { proxy: true })
    );

    const gameSoundtrackEndpoint = gamesEndpoint.addResource("soundtrack");
    gameSoundtrackEndpoint.addMethod(
    "GET",
    new apig.LambdaIntegration(getGameSoundtracksFn, { proxy: true })
);

    new custom.AwsCustomResource(this, "gamesddbInitData", {
      onCreate: {
        service: "DynamoDB",
        action: "batchWriteItem",
        parameters: {
          RequestItems: {
            [gamesTable.tableName]: generateBatch(games),
            [songsTable.tableName]: generateBatch(songs),  // Added
 },
 },
        physicalResourceId: custom.PhysicalResourceId.of("gamesddbInitData"), //.of(Date.now().toString()),
 },
      policy: custom.AwsCustomResourcePolicy.fromSdkCalls({
        resources: [gamesTable.tableArn, songsTable.tableArn],  // Includes songs
 }),
 });

  }
}