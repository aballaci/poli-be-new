import { type ClientSchema, a, defineData, secret } from '@aws-amplify/backend';
import { scenarioGenerator } from '../functions/scenario-generator/resource';


/*== STEP 1 ===============================================================
The section below creates a Todo database table with a "content" field. Try
adding a new "isDone" field as a boolean. The authorization rule below
specifies that any unauthenticated user can "create", "read", "update", 
and "delete" any "Todo" records.
=========================================================================*/

const topicDifficultyLangKeys = [
  "topic",
  "difficulty",
  "sourceLang",
  "targetLang",
] as const;

const schema = a.schema({
  Scenario: a.model({
    id: a.id().required(),
    topic: a.string().required(),
    difficulty: a.string().required(),
    sourceLang: a.string().required(),
    targetLang: a.string().required(),
    scenarioKey: a.string().required(), // composite key: topic#difficulty#sourceLang#targetLang
    scenario: a.string().required(),
    name: a.string().required(),
    description: a.string().required(),
    difficulty_level: a.string().required(),
  })
    .identifier(["id"])
    .secondaryIndexes((index) => [
      index("scenarioKey").name("byScenarioKey"),
    ])
    .authorization((allow) => [allow.authenticated()]),


  generateScenario: a
    .query()
    .arguments({
      topic: a.string().required(),
      difficulty: a.string().required(),
      sourceLang: a.string().required(),
      targetLang: a.string().required(),
    })
    .returns(a.ref('Scenario'))
    .authorization((allow) => [allow.authenticated()])
    .handler(a.handler.function(scenarioGenerator)),

});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});
