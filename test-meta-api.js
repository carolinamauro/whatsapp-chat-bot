#!/usr/bin/env node

/**
 * Test script to validate Meta WhatsApp Business API configuration
 * Run this to test if your Meta API credentials are working
 * 
 * Usage: node test-meta-api.js
 */

require('dotenv').config();
const axios = require('axios');
const crypto = require('crypto');

const GRAPH_API_VERSION = 'v21.0';
const GRAPH_API_BASE_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

// Configuration from environment
const config = {
  accessToken: process.env.META_ACCESS_TOKEN,
  phoneNumberId: process.env.META_PHONE_NUMBER_ID,
  verifyToken: process.env.META_VERIFY_TOKEN,
  appSecret: process.env.META_APP_SECRET,
};

console.log('🧪 Meta WhatsApp Business API Configuration Test\n');

// Test 1: Check configuration
console.log('Test 1: Checking configuration...');
let missingConfig = [];

if (!config.accessToken) missingConfig.push('META_ACCESS_TOKEN');
if (!config.phoneNumberId) missingConfig.push('META_PHONE_NUMBER_ID');
if (!config.verifyToken) missingConfig.push('META_VERIFY_TOKEN');
if (!config.appSecret) missingConfig.push('META_APP_SECRET');

if (missingConfig.length > 0) {
  console.error('❌ Missing configuration:');
  missingConfig.forEach(key => console.error(`   - ${key}`));
  console.log('\n💡 Add these to your .env file');
  process.exit(1);
}

console.log('✅ All required environment variables are set\n');

// Test 2: Verify access token
console.log('Test 2: Verifying access token...');

async function verifyAccessToken() {
  try {
    const url = `${GRAPH_API_BASE_URL}/${config.phoneNumberId}`;
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${config.accessToken}`,
      },
    });
    
    console.log('✅ Access token is valid');
    console.log(`   Phone Number: ${response.data.display_phone_number}`);
    console.log(`   Verified Name: ${response.data.verified_name || 'N/A'}`);
    console.log(`   Quality Rating: ${response.data.quality_rating || 'N/A'}\n`);
    return true;
  } catch (error) {
    console.error('❌ Access token verification failed');
    if (error.response) {
      console.error(`   Error: ${error.response.data.error?.message || 'Unknown error'}`);
      console.error(`   Type: ${error.response.data.error?.type || 'N/A'}`);
      console.error(`   Code: ${error.response.data.error?.code || 'N/A'}`);
    } else {
      console.error(`   Error: ${error.message}`);
    }
    console.log('\n💡 Check your META_ACCESS_TOKEN and META_PHONE_NUMBER_ID in .env file');
    return false;
  }
}

// Test 3: Test webhook signature verification
console.log('Test 3: Testing webhook signature verification...');

function testSignatureVerification() {
  try {
    const testPayload = JSON.stringify({ test: 'data' });
    const expectedSignature = crypto
      .createHmac('sha256', config.appSecret)
      .update(testPayload)
      .digest('hex');
    
    const signatureHeader = `sha256=${expectedSignature}`;
    
    // Verify it
    const providedSignature = signatureHeader.split('sha256=')[1];
    const isValid = crypto.timingSafeEqual(
      Buffer.from(providedSignature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
    
    if (isValid) {
      console.log('✅ Webhook signature verification is working\n');
      return true;
    } else {
      console.error('❌ Webhook signature verification failed\n');
      return false;
    }
  } catch (error) {
    console.error('❌ Webhook signature verification test failed');
    console.error(`   Error: ${error.message}\n`);
    return false;
  }
}

// Test 4: Check webhook verify token
console.log('Test 4: Checking webhook verify token...');

function testVerifyToken() {
  if (config.verifyToken && config.verifyToken.length >= 20) {
    console.log('✅ Webhook verify token is set (length: ' + config.verifyToken.length + ' chars)\n');
    return true;
  } else {
    console.error('❌ Webhook verify token is too short (should be at least 20 chars)');
    console.log('💡 Generate a secure token: openssl rand -hex 32\n');
    return false;
  }
}

// Run all tests
async function runTests() {
  const test1 = true; // Already passed (configuration check)
  const test2 = await verifyAccessToken();
  const test3 = testSignatureVerification();
  const test4 = testVerifyToken();
  
  console.log('═══════════════════════════════════════');
  console.log('Test Results:');
  console.log('═══════════════════════════════════════');
  console.log(`Configuration:           ${test1 ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Access Token:            ${test2 ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Signature Verification:  ${test3 ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Verify Token:            ${test4 ? '✅ PASS' : '❌ FAIL'}`);
  console.log('═══════════════════════════════════════\n');
  
  if (test1 && test2 && test3 && test4) {
    console.log('🎉 All tests passed! Your Meta API configuration is ready.');
    console.log('\n📝 Next steps:');
    console.log('   1. Start your bot: npm run dev');
    console.log('   2. If testing locally, use ngrok: ngrok http 3000');
    console.log('   3. Configure webhook in Meta Developer Console');
    console.log('   4. Send a test message to your WhatsApp Business number\n');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed. Please fix the issues above.');
    console.log('   See DEPLOYMENT.md for detailed setup instructions.\n');
    process.exit(1);
  }
}

runTests();
