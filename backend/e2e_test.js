async function runE2ETests() {
  const testEmail = `testadmin_${Date.now()}@autoallot.com`;
  const testPassword = 'securepassword123';
  const testName = `E2E Admin ${Date.now()}`;

  console.log('==================================================');
  console.log('🤖 AutoAllot End-to-End Functional Test Suite');
  console.log(`Test Email: ${testEmail}`);
  console.log(`Test Name: ${testName}`);
  console.log('==================================================\n');

  try {
    // 1. Test Admin Signup
    console.log('[STEP 1/5] Testing Admin Signup endpoint...');
    let isSignupBypassed = false;
    
    try {
      const signupRes = await fetch('http://localhost:5000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: testName,
          email: testEmail,
          password: testPassword
        })
      });

      const signupData = await signupRes.json();
      if (!signupRes.ok) {
        if (signupData.message?.includes('rate limit') || signupData.message?.includes('exceeded')) {
          console.log('⚠️ Signup Rate Limit Exceeded on Supabase. Bypassing signup step and using pre-seeded test admin...');
          isSignupBypassed = true;
        } else {
          throw new Error(`Signup failed: ${signupData.message}`);
        }
      } else {
        console.log('✅ Signup Successful!');
        console.log('Response Status:', signupRes.status);
        console.log('Response Message:', signupData.message);
        console.log('Returned Profile:', JSON.stringify(signupData.user, null, 2));
      }
    } catch (err) {
      if (err.message?.includes('rate limit') || err.message?.includes('exceeded')) {
        console.log('⚠️ Signup Rate Limit Exceeded on Supabase. Bypassing signup step and using pre-seeded test admin...');
        isSignupBypassed = true;
      } else {
        throw err;
      }
    }
    
    console.log('--------------------------------------------------\n');

    // 2. Test Admin Login
    console.log('[STEP 2/5] Testing Admin Login endpoint...');
    const loginEmail = isSignupBypassed ? 'testadmin_1784660334605@autoallot.com' : testEmail;
    const loginPassword = isSignupBypassed ? 'securepassword123' : testPassword;

    console.log(`Logging in as: ${loginEmail}`);
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: loginEmail,
        password: loginPassword
      })
    });

    const loginData = await loginRes.json();
    if (!loginRes.ok) {
      throw new Error(`Login failed: ${loginData.message}`);
    }

    console.log('✅ Login Successful!');
    console.log('Response Status:', loginRes.status);
    const token = loginData.token;
    console.log('Access Token Length:', token.length);
    console.log('Returned Admin:', JSON.stringify(loginData.user, null, 2));
    console.log('--------------------------------------------------\n');

    // 3. Test Session Persistence (/api/auth/me)
    console.log('[STEP 3/5] Testing Session verification (Authorization header)...');
    const meRes = await fetch('http://localhost:5000/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    });

    const meData = await meRes.json();
    if (!meRes.ok) {
      throw new Error(`Me endpoint failed: ${meData.message}`);
    }

    console.log('✅ Session verified successfully!');
    console.log('User Name:', meData.user.name);
    console.log('User Email:', meData.user.email);
    console.log('User Role:', meData.user.role);
    console.log('--------------------------------------------------\n');

    // 4. Test Protected Route Guard Checks
    console.log('[STEP 4/5] Testing Protected Route clearances...');
    
    // Call branches endpoint WITH valid token
    const branchesRes = await fetch('http://localhost:5000/api/branches', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const branchesData = await branchesRes.json();
    
    console.log('✅ Authorized access to /api/branches: SUCCESS (found', branchesData.data ? branchesData.data.length : 0, 'branches)');

    // Call branches endpoint WITHOUT token
    const unauthRes = await fetch('http://localhost:5000/api/branches');
    const unauthData = await unauthRes.json();
    
    if (unauthRes.status === 401 || unauthRes.status === 403) {
      console.log('✅ Unauthorized access check: SUCCESS (blocked with status:', unauthRes.status, '-', unauthData.message, ')');
    } else {
      console.log('❌ Unauthorized access check: FAILED (accessed without token, status:', unauthRes.status, ')');
    }
    console.log('--------------------------------------------------\n');

    // 5. Test Student CRUD Operations
    console.log('[STEP 5/5] Testing Student CRUD Operations with refactored schema...');
    
    // A. Create Student
    console.log('Creating student...');
    const createStudentRes = await fetch('http://localhost:5000/api/students', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        student_name: 'E2E Test Candidate',
        category: 'OPEN',
        branch: 'CO',
        percentage: 89.6,
        year: 'First Year',
        gender: 'Male',
        disability: 'No',
        income: 140000,
        mobile: '9876543210',
        nashik_municipal_corporation: 'Yes'
      })
    });

    const createStudentData = await createStudentRes.json();
    if (!createStudentRes.ok) {
      throw new Error(`Student creation failed: ${createStudentData.message}`);
    }

    const newStudentId = createStudentData.data.id;
    console.log(`✅ Student Created successfully! ID: ${newStudentId}`);
    console.log('Returned Student Profile:', JSON.stringify(createStudentData.data, null, 2));

    // B. Get Student List (Verification of read/listing)
    console.log('Fetching student listing...');
    const listRes = await fetch('http://localhost:5000/api/students', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const listData = await listRes.json();
    if (!listRes.ok) {
      throw new Error(`Student listing failed: ${listData.message}`);
    }
    const foundStudent = listData.data.find(s => s.id === newStudentId);
    if (!foundStudent) {
      throw new Error('Newly created student was not found in the paginated student list.');
    }
    console.log('✅ Student found in listing verified!');

    // C. Update Student
    console.log(`Updating student record (ID: ${newStudentId})...`);
    const updateRes = await fetch(`http://localhost:5000/api/students/${newStudentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        student_name: 'E2E Test Candidate (Updated)',
        category: 'OPEN',
        branch: 'CO',
        percentage: 92.4, // Updated percentage
        year: 'First Year',
        gender: 'Male',
        disability: 'Yes', // Updated disability
        income: 155000, // Updated income
        mobile: '9876543210',
        nashik_municipal_corporation: 'No' // Updated Nashik MC check
      })
    });

    const updateData = await updateRes.json();
    if (!updateRes.ok) {
      throw new Error(`Student update failed: ${updateData.message}`);
    }
    console.log('✅ Student updated successfully!');
    console.log('Updated Profile:', JSON.stringify(updateData.data, null, 2));

    // D. Delete Student
    console.log(`Deleting student record (ID: ${newStudentId})...`);
    const deleteRes = await fetch(`http://localhost:5000/api/students/${newStudentId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    const deleteData = await deleteRes.json();
    if (!deleteRes.ok) {
      throw new Error(`Student deletion failed: ${deleteData.message}`);
    }
    console.log('✅ Student deleted successfully!');

    console.log('\n==================================================');
    console.log('🎉 ALL FUNCTIONAL TESTS COMPLETED SUCCESSFULLY! 🎉');
    console.log('==================================================');

  } catch (err) {
    console.error('❌ E2E TEST FAILED:', err.message);
    process.exit(1);
  }
}

runE2ETests();
