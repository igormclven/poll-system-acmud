#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { PollSystemStack } from '../lib/poll-system-stack';

const app = new cdk.App();

new PollSystemStack(app, 'PollSystemStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  description: 'Serverless Poll System Infrastructure',
});

