import * as cdk from 'aws-cdk-lib';
import * as lambdanode from 'aws-cdk-lib/aws-lambda-nodejs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as custom from "aws-cdk-lib/custom-resources";
import { generateBatch } from "../shared/util";
import {games, songs} from "../seed/games";
import * as apig from "aws-cdk-lib/aws-apigateway";
import { Construct } from 'constructs';
import * as node from "aws-cdk-lib/aws-lambda-nodejs";
import { IAM } from 'aws-sdk';

type AppApiProps = {
  userPoolId: string;
  userPoolClientId: string;
};

export class AppApi extends Construct {
  constructor(scope: Construct, id: string, props: AppApiProps) {
    super(scope, id);

    const api = new apig.RestApi(this, "AssignmentRestAPI", {
      description: "assignment api",
      endpointTypes: [apig.EndpointType.REGIONAL],
      defaultCorsPreflightOptions: {
        allowOrigins: apig.Cors.ALL_ORIGINS,
      },
    });

    const appCommonFnProps = {
      architecture: lambda.Architecture.ARM_64,
      timeout: cdk.Duration.seconds(10),
      memorySize: 128,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "handler",
      environment: {
        USER_POOL_ID: props.userPoolId,
        CLIENT_ID: props.userPoolClientId,
        REGION: cdk.Aws.REGION,
      },
    };

    const protectedRes = api.root.addResource("protected");

    const publicRes = api.root.addResource("public");

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

    const getGameByIdFn = new node.NodejsFunction(this, "GetGameByIdFn", {
      ...appCommonFnProps,
        entry: `${__dirname}/../lambdas/getGameById.ts`,
        environment: {
          Soundtrack_TABLE_NAME: songsTable.tableName,
          TABLE_NAME: gamesTable.tableName,
          REGION: 'eu-west-1',
        },
      }
    );


    const getAllGamesFn = new node.NodejsFunction(this, "GetAllFamesFn", {
      ...appCommonFnProps,
        entry: `${__dirname}/../lambdas/getAllGames.ts`,
        environment: {
          Soundtrack_TABLE_NAME: songsTable.tableName,
          TABLE_NAME: gamesTable.tableName,
          REGION: 'eu-west-1',
        },
      }
    );

    const getGameSoundtracksFn = new node.NodejsFunction(this, "GetGameSoundTrackFn", {
      ...appCommonFnProps,
        entry: `${__dirname}/../lambdas/getGameSoundtrack.ts`,
        environment: {
          Soundtrack_TABLE_NAME: songsTable.tableName,
          TABLE_NAME: gamesTable.tableName,
          REGION: 'eu-west-1',
        },
      }
    );


    const newGameFn = new node.NodejsFunction(this, "GetAllGamesFn", {
      ...appCommonFnProps,
        entry: `${__dirname}/../lambdas/addGame.ts`,
        environment: {
          Soundtrack_TABLE_NAME: songsTable.tableName,
          TABLE_NAME: gamesTable.tableName,
          REGION: 'eu-west-1',
        },
      }
    );

    const deleteGameByIdFn = new node.NodejsFunction(this, "DeleteGameByIdFn", {
      ...appCommonFnProps,
        entry: `${__dirname}/../lambdas/deleteGame.ts`,
        environment: {
          Soundtrack_TABLE_NAME: songsTable.tableName,
          TABLE_NAME: gamesTable.tableName,
          REGION: 'eu-west-1',
        },
      }
    );

    const authorizerFn = new node.NodejsFunction(this, "AuthorizerFn", {
      ...appCommonFnProps,
      entry: `${__dirname}/../lambdas/auth/authorizer.ts`,
    });

    const requestAuthorizer = new apig.RequestAuthorizer(
      this,
      "RequestAuthorizer",
      {
        identitySources: [apig.IdentitySource.header("cookie")],
        handler: authorizerFn,
        resultsCacheTtl: cdk.Duration.minutes(0),
      }
    );

    gamesTable.grantReadWriteData(getGameByIdFn)
    gamesTable.grantReadData(getAllGamesFn)
    songsTable.grantReadData(getGameSoundtracksFn)
    gamesTable.grantReadWriteData(newGameFn)
    gamesTable.grantReadWriteData(deleteGameByIdFn)
    songsTable.grantReadData(getGameByIdFn)
    getGameByIdFn.addToRolePolicy(new cdk.aws_iam.PolicyStatement({
      actions: [
        "translate:TranslateText",
        "comprehend:DetectDominantLanguage"
      ],
      resources: ["*"],
    }))


    const gameResPub = publicRes.addResource("games");
    const gameResPro = protectedRes.addResource("games");
    const gameByIdPub = publicRes.addResource("{gameId}");
    // const gameByIdPro = publicRes.addResource("{gameId}");

    gameResPub.addMethod(
      "GET",
      new apig.LambdaIntegration(getAllGamesFn));

    gameByIdPub.addMethod(
      "GET",
      new apig.LambdaIntegration(getGameByIdFn, { proxy: true }));

    gameResPro.addMethod(
      "POST",
      new apig.LambdaIntegration(newGameFn, { proxy: true }) , {
        authorizer: requestAuthorizer,
        authorizationType: apig.AuthorizationType.CUSTOM,
      });

    gameResPro.addMethod(
      "DELETE",
      new apig.LambdaIntegration(deleteGameByIdFn, { proxy: true })  , {
        authorizer: requestAuthorizer,
        authorizationType: apig.AuthorizationType.CUSTOM,
      });

    const soundTrackRes = publicRes.addResource("soundtrack");
    soundTrackRes.addMethod(
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