#!/usr/bin/env node

/**
 * Comprehensive Meeting Functionality Test Suite
 * Tests all aspects of the Axiona meeting system
 */

const https = require('https');
const http = require('http');

const API_BASE = 'http://localhost:5050';
const FRONTEND_BASE = 'http://localhost:5173';

// Test utilities
const makeRequest = (url, options = {}) => {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    const req = protocol.request(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.on('error', reject);
    req.end();
  });
};

// Test functions
async function testBackendHealth() {
  console.log('🔍 Testing Backend Health...');
  try {
    const response = await makeRequest(`${API_BASE}/api/health`);
    console.log(`✅ Backend Status: ${response.status}`);
    return response.status === 200;
  } catch (error) {
    console.log('❌ Backend Health Check Failed:', error.message);
    return false;
  }
}

async function testSocketIO() {
  console.log('🔍 Testing Socket.IO Server...');
  try {
    const response = await makeRequest(`${API_BASE}/socket.io/`);
    console.log(`✅ Socket.IO Server: ${response.status} - ${JSON.stringify(response.data)}`);
    // Socket.IO returns code:0 with "Transport unknown" when accessed via HTTP (this is normal)
    return response.status === 400 && response.data.code === 0;
  } catch (error) {
    console.log('❌ Socket.IO Test Failed:', error.message);
    return false;
  }
}

async function testActiveMeetings() {
  console.log('🔍 Testing Active Meetings API...');
  try {
    const response = await makeRequest(`${API_BASE}/api/meetings/status/active`);
    if (response.status === 200 && response.data.success) {
      console.log(`✅ Active Meetings: ${response.data.count} meetings found`);
      response.data.data.forEach((meeting, index) => {
        console.log(`   ${index + 1}. ${meeting.title} (${meeting.participants.length} participants)`);
      });
      return true;
    } else {
      console.log('❌ Active Meetings API Failed:', response.data);
      return false;
    }
  } catch (error) {
    console.log('❌ Active Meetings Test Failed:', error.message);
    return false;
  }
}

async function testCreateMeeting() {
  console.log('🔍 Testing Meeting Creation...');
  try {
    const meetingData = {
      title: "Automated Test Meeting",
      description: "Testing meeting creation functionality",
      createdBy: "68ffb16c997866b5ec3d2435",
      settings: {
        maxParticipants: 6,
        allowChat: true,
        allowScreenShare: true
      }
    };

    const response = await makeRequest(`${API_BASE}/api/meetings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: meetingData
    });

    if (response.status === 201 && response.data.success) {
      console.log(`✅ Meeting Created: ${response.data.data.meetingId}`);
      console.log(`   Room ID: ${response.data.data.roomId}`);
      return response.data.data;
    } else {
      console.log('❌ Meeting Creation Failed:', response.data);
      return null;
    }
  } catch (error) {
    console.log('❌ Meeting Creation Test Failed:', error.message);
    return null;
  }
}

async function testJoinMeeting(meetingId) {
  console.log(`🔍 Testing Joining Meeting: ${meetingId}...`);
  try {
    const joinData = {
      userId: "68ffb16c997866b5ec3d2435",
      userName: "Test User Automated",
      userEmail: "test-automated@example.com"
    };

    const response = await makeRequest(`${API_BASE}/api/meetings/${meetingId}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: joinData
    });

    if (response.status === 200 && response.data.success) {
      console.log(`✅ Successfully Joined Meeting`);
      console.log(`   Participants: ${response.data.data.participantCount}`);
      console.log(`   Status: ${response.data.data.meeting.status}`);
      return true;
    } else {
      console.log('❌ Join Meeting Failed:', response.data);
      return false;
    }
  } catch (error) {
    console.log('❌ Join Meeting Test Failed:', error.message);
    return false;
  }
}

async function testMeetingDetails(meetingId) {
  console.log(`🔍 Testing Meeting Details: ${meetingId}...`);
  try {
    const response = await makeRequest(`${API_BASE}/api/meetings/${meetingId}`);
    
    if (response.status === 200 && response.data.success) {
      const meeting = response.data.data;
      console.log(`✅ Meeting Details Retrieved:`);
      console.log(`   Title: ${meeting.title}`);
      console.log(`   Status: ${meeting.status}`);
      console.log(`   Participants: ${meeting.participants.length}`);
      console.log(`   Settings: Chat(${meeting.settings.allowChat}), Screen Share(${meeting.settings.allowScreenShare})`);
      return true;
    } else {
      console.log('❌ Meeting Details Failed:', response.data);
      return false;
    }
  } catch (error) {
    console.log('❌ Meeting Details Test Failed:', error.message);
    return false;
  }
}

async function testFrontendAccess() {
  console.log('🔍 Testing Frontend Access...');
  try {
    const homeResponse = await makeRequest(`${FRONTEND_BASE}/`);
    const accessible = homeResponse.status === 200;
    console.log(`✅ Frontend Server: ${accessible ? 'Accessible' : 'Failed'} (Status: ${homeResponse.status})`);
    
    return accessible;
  } catch (error) {
    console.log('❌ Frontend Access Test Failed:', error.message);
    return false;
  }
}

async function testLeaveMeeting(meetingId) {
  console.log(`🔍 Testing Leave Meeting: ${meetingId}...`);
  try {
    const leaveData = {
      userId: "68ffb16c997866b5ec3d2435"
    };

    const response = await makeRequest(`${API_BASE}/api/meetings/${meetingId}/leave`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: leaveData
    });

    if (response.status === 200 && response.data.success) {
      console.log(`✅ Successfully Left Meeting`);
      return true;
    } else {
      console.log('❌ Leave Meeting Failed:', response.data);
      return false;
    }
  } catch (error) {
    console.log('❌ Leave Meeting Test Failed:', error.message);
    return false;
  }
}

// Main test execution
async function runMeetingTests() {
  console.log('🚀 Starting Axiona Meeting Functionality Tests\n');
  
  const results = {
    passed: 0,
    failed: 0,
    total: 0
  };

  const tests = [
    { name: 'Backend Health', fn: testBackendHealth },
    { name: 'Socket.IO Server', fn: testSocketIO },
    { name: 'Active Meetings API', fn: testActiveMeetings },
    { name: 'Frontend Access', fn: testFrontendAccess }
  ];

  // Run basic tests
  for (const test of tests) {
    const result = await test.fn();
    results.total++;
    if (result) {
      results.passed++;
      console.log(`✅ ${test.name}: PASSED\n`);
    } else {
      results.failed++;
      console.log(`❌ ${test.name}: FAILED\n`);
    }
  }

  // Test meeting lifecycle
  console.log('🔄 Testing Complete Meeting Lifecycle...\n');
  
  const meeting = await testCreateMeeting();
  results.total++;
  if (meeting) {
    results.passed++;
    console.log('✅ Create Meeting: PASSED\n');
    
    // Test joining
    const joined = await testJoinMeeting(meeting.meetingId);
    results.total++;
    if (joined) {
      results.passed++;
      console.log('✅ Join Meeting: PASSED\n');
    } else {
      results.failed++;
      console.log('❌ Join Meeting: FAILED\n');
    }
    
    // Test details
    const details = await testMeetingDetails(meeting.meetingId);
    results.total++;
    if (details) {
      results.passed++;
      console.log('✅ Meeting Details: PASSED\n');
    } else {
      results.failed++;
      console.log('❌ Meeting Details: FAILED\n');
    }
    
    // Test leaving
    const left = await testLeaveMeeting(meeting.meetingId);
    results.total++;
    if (left) {
      results.passed++;
      console.log('✅ Leave Meeting: PASSED\n');
    } else {
      results.failed++;
      console.log('❌ Leave Meeting: FAILED\n');
    }
    
  } else {
    results.failed++;
    console.log('❌ Create Meeting: FAILED\n');
  }

  // Final results
  console.log('📊 Test Results Summary:');
  console.log(`✅ Passed: ${results.passed}/${results.total}`);
  console.log(`❌ Failed: ${results.failed}/${results.total}`);
  console.log(`📈 Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);
  
  if (results.failed === 0) {
    console.log('\n🎉 All Meeting Functionality Tests PASSED!');
    console.log('✅ The Axiona meeting system is fully functional and ready for production use.');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the issues above.');
  }
  
  return results.failed === 0;
}

// Run the tests
if (require.main === module) {
  runMeetingTests().catch(console.error);
}

module.exports = { runMeetingTests };
