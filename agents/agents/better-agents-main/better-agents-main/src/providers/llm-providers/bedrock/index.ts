import type { LLMProviderProvider } from "../index.js";

/**
 * AWS Bedrock LLM provider implementation.
 * Requires AWS credentials (access key, secret key, and region).
 */
export const BedrockProvider: LLMProviderProvider = {
  id: "bedrock",
  displayName: "AWS Bedrock",
  apiKeyUrl: "https://console.aws.amazon.com/iam/home#/security_credentials",

  additionalCredentials: [
    {
      key: "awsSecretKey",
      label: "AWS Secret Access Key",
      type: "password",
      validate: (value) => {
        if (!value || value.length < 10) {
          return "AWS Secret Access Key is required";
        }
        return true;
      },
    },
    {
      key: "awsRegion",
      label: "AWS Region (e.g., us-east-1)",
      type: "text",
      defaultValue: "us-east-1",
      validate: (value) => {
        if (!value || value.length < 5) {
          return "AWS Region is required";
        }
        return true;
      },
    },
  ],

  getEnvVariables: ({ apiKey, additionalInputs }) => {
    const envVars = [
      { key: "AWS_ACCESS_KEY_ID", value: apiKey },
    ];

    if (additionalInputs?.awsSecretKey) {
      envVars.push({
        key: "AWS_SECRET_ACCESS_KEY",
        value: additionalInputs.awsSecretKey,
      });
    }

    if (additionalInputs?.awsRegion) {
      envVars.push({
        key: "AWS_REGION",
        value: additionalInputs.awsRegion,
      });
    }

    return envVars;
  },
};

