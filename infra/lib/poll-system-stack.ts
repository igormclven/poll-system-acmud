import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigatewayv2';
import * as apigatewayIntegrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as apigatewayAuthorizers from 'aws-cdk-lib/aws-apigatewayv2-authorizers';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as path from 'path';

export class PollSystemStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ========================================
    // DynamoDB Tables
    // ========================================

    // Polls Table
    const pollsTable = new dynamodb.Table(this, 'PollsTable', {
      tableName: 'Polls',
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For dev, change to RETAIN in prod
      pointInTimeRecovery: true,
    });

    // PollInstances Table
    const pollInstancesTable = new dynamodb.Table(this, 'PollInstancesTable', {
      tableName: 'PollInstances',
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      pointInTimeRecovery: true,
    });

    // Add GSI for querying active instances
    pollInstancesTable.addGlobalSecondaryIndex({
      indexName: 'StatusIndex',
      partitionKey: { name: 'Status', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
    });

    // AccessKeys Table
    const accessKeysTable = new dynamodb.Table(this, 'AccessKeysTable', {
      tableName: 'AccessKeys',
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      timeToLiveAttribute: 'ExpiryDate',
      pointInTimeRecovery: true,
    });

    // Add GSI for querying by PollID
    accessKeysTable.addGlobalSecondaryIndex({
      indexName: 'PollIDIndex',
      partitionKey: { name: 'PollID', type: dynamodb.AttributeType.STRING },
    });

    // Votes Table
    const votesTable = new dynamodb.Table(this, 'VotesTable', {
      tableName: 'Votes',
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      pointInTimeRecovery: true,
    });

    // Suggestions Table
    const suggestionsTable = new dynamodb.Table(this, 'SuggestionsTable', {
      tableName: 'Suggestions',
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      pointInTimeRecovery: true,
    });

    // Add GSI for querying by Status
    suggestionsTable.addGlobalSecondaryIndex({
      indexName: 'StatusIndex',
      partitionKey: { name: 'Status', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
    });

    // ========================================
    // Cognito User Pool
    // ========================================

    const userPool = new cognito.UserPool(this, 'PollSystemUserPool', {
      userPoolName: 'poll-system-admins',
      selfSignUpEnabled: false, // Only admin can create users
      signInAliases: {
        email: true,
      },
      autoVerify: {
        email: true,
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For dev
    });

    // Add Cognito Domain for Hosted UI
    const userPoolDomain = new cognito.UserPoolDomain(this, 'PollSystemUserPoolDomain', {
      userPool,
      cognitoDomain: {
        domainPrefix: `poll-system-${this.account}`, // Unique domain prefix
      },
    });

    const userPoolClient = new cognito.UserPoolClient(this, 'PollSystemUserPoolClient', {
      userPool,
      authFlows: {
        userPassword: true,
        userSrp: true,
      },
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
        },
        scopes: [cognito.OAuthScope.OPENID, cognito.OAuthScope.EMAIL, cognito.OAuthScope.PROFILE],
        callbackUrls: [
          'http://localhost:3000/api/auth/callback/cognito',
          'https://poll.acmud.org/api/auth/callback/cognito',
        ],
        logoutUrls: [
          'http://localhost:3000',
          'https://poll.acmud.org',
        ],
      },
      generateSecret: false, // NextAuth works better without client secret for public clients
    });

    // ========================================
    // Lambda Functions
    // ========================================

    // Common environment variables for all lambdas
    const commonEnv = {
      POLLS_TABLE: pollsTable.tableName,
      POLL_INSTANCES_TABLE: pollInstancesTable.tableName,
      ACCESS_KEYS_TABLE: accessKeysTable.tableName,
      VOTES_TABLE: votesTable.tableName,
      SUGGESTIONS_TABLE: suggestionsTable.tableName,
    };

    // Create Poll Lambda
    const createPollLambda = new lambda.Function(this, 'CreatePollFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'create-poll.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/polls')),
      environment: commonEnv,
      timeout: cdk.Duration.seconds(30),
    });

    // Get Polls Lambda
    const getPollsLambda = new lambda.Function(this, 'GetPollsFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'get-polls.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/polls')),
      environment: commonEnv,
      timeout: cdk.Duration.seconds(30),
    });

    // Get Poll Details Lambda
    const getPollDetailsLambda = new lambda.Function(this, 'GetPollDetailsFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'get-poll-details.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/polls')),
      environment: commonEnv,
      timeout: cdk.Duration.seconds(30),
    });

    // Generate Access Keys Lambda
    const generateKeysLambda = new lambda.Function(this, 'GenerateKeysFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'generate-keys.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/access-keys')),
      environment: commonEnv,
      timeout: cdk.Duration.seconds(60),
    });

    // Vote Lambda
    const voteLambda = new lambda.Function(this, 'VoteFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'vote.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/voting')),
      environment: commonEnv,
      timeout: cdk.Duration.seconds(30),
    });

    // Get Results Lambda
    const getResultsLambda = new lambda.Function(this, 'GetResultsFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'get-results.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/voting')),
      environment: commonEnv,
      timeout: cdk.Duration.seconds(30),
    });

    // Submit Suggestion Lambda
    const submitSuggestionLambda = new lambda.Function(this, 'SubmitSuggestionFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'submit-suggestion.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/suggestions')),
      environment: commonEnv,
      timeout: cdk.Duration.seconds(30),
    });

    // Manage Suggestions Lambda
    const manageSuggestionsLambda = new lambda.Function(this, 'ManageSuggestionsFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'manage-suggestions.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/suggestions')),
      environment: commonEnv,
      timeout: cdk.Duration.seconds(30),
    });

    // Recurrence Lambda (EventBridge triggered)
    const recurrenceLambda = new lambda.Function(this, 'RecurrenceFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'recurrence.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/recurrence')),
      environment: commonEnv,
      timeout: cdk.Duration.seconds(300), // 5 minutes for processing
    });

    // Manage Instances Lambda
    const manageInstancesLambda = new lambda.Function(this, 'ManageInstancesFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'manage-instances.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/instances')),
      environment: commonEnv,
      timeout: cdk.Duration.seconds(30),
    });

    // Grant DynamoDB permissions
    pollsTable.grantReadWriteData(createPollLambda);
    pollsTable.grantReadData(getPollsLambda);
    pollsTable.grantReadData(getPollDetailsLambda);
    pollsTable.grantReadData(recurrenceLambda);

    pollInstancesTable.grantReadWriteData(createPollLambda);
    pollInstancesTable.grantReadData(getPollDetailsLambda);
    pollInstancesTable.grantReadData(voteLambda);
    pollInstancesTable.grantReadData(getResultsLambda);
    pollInstancesTable.grantReadWriteData(recurrenceLambda);
    pollInstancesTable.grantReadWriteData(manageInstancesLambda);

    accessKeysTable.grantReadWriteData(generateKeysLambda);
    accessKeysTable.grantReadWriteData(voteLambda);
    accessKeysTable.grantReadData(getPollDetailsLambda);

    votesTable.grantReadWriteData(voteLambda);
    votesTable.grantReadData(getResultsLambda);
    votesTable.grantReadWriteData(manageInstancesLambda);

    suggestionsTable.grantReadWriteData(submitSuggestionLambda);
    suggestionsTable.grantReadWriteData(manageSuggestionsLambda);
    suggestionsTable.grantReadData(recurrenceLambda);

    // ========================================
    // API Gateway HTTP API
    // ========================================

    const httpApi = new apigateway.HttpApi(this, 'PollSystemApi', {
      apiName: 'poll-system-api',
      description: 'Poll System HTTP API',
      corsPreflight: {
        allowOrigins: ['*'], // Configure specific domains in production
        allowMethods: [
          apigateway.CorsHttpMethod.GET,
          apigateway.CorsHttpMethod.POST,
          apigateway.CorsHttpMethod.PUT,
          apigateway.CorsHttpMethod.DELETE,
        ],
        allowHeaders: ['Content-Type', 'Authorization', 'X-Api-Key'],
      },
    });

    // Cognito Authorizer
    const cognitoAuthorizer = new apigatewayAuthorizers.HttpJwtAuthorizer(
      'CognitoAuthorizer',
      `https://cognito-idp.${this.region}.amazonaws.com/${userPool.userPoolId}`,
      {
        jwtAudience: [userPoolClient.userPoolClientId],
      }
    );

    // Public Routes (Protected by API Key via BFF)
    httpApi.addRoutes({
      path: '/vote',
      methods: [apigateway.HttpMethod.POST],
      integration: new apigatewayIntegrations.HttpLambdaIntegration('VoteIntegration', voteLambda),
    });

    httpApi.addRoutes({
      path: '/poll/{pollId}',
      methods: [apigateway.HttpMethod.GET],
      integration: new apigatewayIntegrations.HttpLambdaIntegration('GetPollDetailsIntegration', getPollDetailsLambda),
    });

    httpApi.addRoutes({
      path: '/results/{pollInstanceId}',
      methods: [apigateway.HttpMethod.GET],
      integration: new apigatewayIntegrations.HttpLambdaIntegration('GetResultsIntegration', getResultsLambda),
    });

    httpApi.addRoutes({
      path: '/suggestions',
      methods: [apigateway.HttpMethod.POST],
      integration: new apigatewayIntegrations.HttpLambdaIntegration('SubmitSuggestionIntegration', submitSuggestionLambda),
    });

    // Admin Routes (Protected by Cognito Authorizer)
    httpApi.addRoutes({
      path: '/admin/polls',
      methods: [apigateway.HttpMethod.POST],
      integration: new apigatewayIntegrations.HttpLambdaIntegration('CreatePollIntegration', createPollLambda),
      authorizer: cognitoAuthorizer,
    });

    httpApi.addRoutes({
      path: '/admin/polls',
      methods: [apigateway.HttpMethod.GET],
      integration: new apigatewayIntegrations.HttpLambdaIntegration('GetPollsIntegration', getPollsLambda),
      authorizer: cognitoAuthorizer,
    });

    httpApi.addRoutes({
      path: '/admin/access-keys',
      methods: [apigateway.HttpMethod.POST],
      integration: new apigatewayIntegrations.HttpLambdaIntegration('GenerateKeysIntegration', generateKeysLambda),
      authorizer: cognitoAuthorizer,
    });

    httpApi.addRoutes({
      path: '/admin/suggestions',
      methods: [apigateway.HttpMethod.GET, apigateway.HttpMethod.PUT],
      integration: new apigatewayIntegrations.HttpLambdaIntegration('ManageSuggestionsIntegration', manageSuggestionsLambda),
      authorizer: cognitoAuthorizer,
    });

    httpApi.addRoutes({
      path: '/admin/instances',
      methods: [apigateway.HttpMethod.POST],
      integration: new apigatewayIntegrations.HttpLambdaIntegration('ManageInstancesIntegration', manageInstancesLambda),
      authorizer: cognitoAuthorizer,
    });

    // ========================================
    // EventBridge Scheduler (Daily Check for Poll Management)
    // ========================================

    const recurrenceRule = new events.Rule(this, 'DailyPollManagementRule', {
      schedule: events.Schedule.cron({
        minute: '0',
        hour: '0',
        weekDay: '*', // Every day at 00:00 UTC
      }),
      description: 'Daily check to open/close polls based on their scheduled dates',
    });

    recurrenceRule.addTarget(new targets.LambdaFunction(recurrenceLambda));

    // ========================================
    // Outputs
    // ========================================

    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: httpApi.apiEndpoint,
      description: 'API Gateway Endpoint',
      exportName: 'PollSystemApiEndpoint',
    });

    new cdk.CfnOutput(this, 'UserPoolId', {
      value: userPool.userPoolId,
      description: 'Cognito User Pool ID',
      exportName: 'PollSystemUserPoolId',
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: userPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID',
      exportName: 'PollSystemUserPoolClientId',
    });

    new cdk.CfnOutput(this, 'CognitoDomain', {
      value: userPoolDomain.domainName,
      description: 'Cognito Domain for Hosted UI',
      exportName: 'PollSystemCognitoDomain',
    });

    new cdk.CfnOutput(this, 'CognitoIssuer', {
      value: `https://cognito-idp.${this.region}.amazonaws.com/${userPool.userPoolId}`,
      description: 'Cognito Issuer URL',
      exportName: 'PollSystemCognitoIssuer',
    });

    new cdk.CfnOutput(this, 'Region', {
      value: this.region,
      description: 'AWS Region',
      exportName: 'PollSystemRegion',
    });
  }
}

