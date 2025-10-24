import { defineBackend } from '@aws-amplify/backend';
import { data } from './data/resource.js';
import { sayHello } from './functions/say-hello/resource';
import { scenarioGenerator } from './functions/scenario-generator/resource';

import * as iam from "aws-cdk-lib/aws-iam"

const backend = defineBackend({
  data,
  sayHello,
  scenarioGenerator,
});


const scenarioLambda = backend.scenarioGenerator.resources.lambda
const table = backend.data.resources.tables.Scenario;

// Get the DynamoDB table created by Amplify Data (your Scenario model)

backend.scenarioGenerator.addEnvironment(
  'DDB_TABLE_NAME',  // Env var name (use in Lambda code)
  table.tableName  // References the auto-generated table
);

// Grant CRUD + query permissions automatically
table.grantReadWriteData(scenarioLambda)

scenarioLambda.addToRolePolicy(new iam.PolicyStatement({
  sid: "AllowQueryScanOnScenarioGSIs",
  actions: ["dynamodb:Query", "dynamodb:Scan"],
  resources: [`${table.tableArn}/index/*`], // <- GSI ARNs
}));

scenarioLambda.addToRolePolicy(new iam.PolicyStatement({
  sid: "AllowRWOnScenarioTable",
  actions: [
    "dynamodb:GetItem",
    "dynamodb:PutItem",
    "dynamodb:UpdateItem",
    "dynamodb:DeleteItem",
    "dynamodb:BatchGetItem",
    "dynamodb:BatchWriteItem",
    "dynamodb:DescribeTable",
  ],
  resources: [table.tableArn], // <- table ARN only
}));

console.log("✅ Table:", table.tableName);
console.log("✅ Lambda:", scenarioLambda.functionName);
