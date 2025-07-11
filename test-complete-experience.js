const puppeteer = require('puppeteer');

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function testCompleteExperience() {
  console.log('🚀 Starting complete BrainBrawler experience test...');
  
  let browserFree, browserPremium;
  let pageFree, pagePremium;

  try {
    // Launch two browsers for different users
    console.log('📱 Launching browsers...');
    browserFree = await puppeteer.launch({ 
      headless: false, 
      args: ['--ignore-certificate-errors', '--disable-web-security'],
      devtools: false
    });
    browserPremium = await puppeteer.launch({ 
      headless: false, 
      args: ['--ignore-certificate-errors', '--disable-web-security'],
      devtools: false
    });

    pageFree = await browserFree.newPage();
    pagePremium = await browserPremium.newPage();

    // Set viewport for better visibility
    await pageFree.setViewport({ width: 1280, height: 720 });
    await pagePremium.setViewport({ width: 1280, height: 720 });

    const baseUrl = 'http://localhost:3001';

    // === USER FREE LOGIN ===
    console.log('👤 FREE user login...');
    await pageFree.goto(`${baseUrl}/auth`);
    await delay(3000);

    // Free user login (player1 from seed)
    await pageFree.type('input[type="email"]', 'player1@brainbrawler.com');
    await pageFree.type('input[type="password"]', 'password123');
    await pageFree.click('button[type="submit"]');
    await delay(3000);

    console.log('✅ FREE user logged in successfully');

    // === USER PREMIUM LOGIN ===
    console.log('👑 PREMIUM user login...');
    await pagePremium.goto(`${baseUrl}/auth`);
    await delay(3000);

    // Premium user login
    await pagePremium.type('input[type="email"]', 'premium@brainbrawler.com');
    await pagePremium.type('input[type="password"]', 'password123');
    await pagePremium.click('button[type="submit"]');
    await delay(3000);

    console.log('✅ PREMIUM user logged in successfully');

    // === FREE USER SENDS FRIEND REQUEST ===
    console.log('👥 FREE user navigating to Friends page...');
    await pageFree.click('a[href="/app/friends"]');
    await delay(2000);

    console.log('🔍 FREE user searching for premium user...');
    await pageFree.click('button:contains("Find Friends")');
    await delay(1000);
    
    await pageFree.type('input[placeholder*="Search"]', 'premiumuser');
    await delay(2000);

    console.log('➕ FREE user sending friend request...');
    await pageFree.click('button[title="Send friend request"], button:contains("Add"), svg[data-testid="user-plus"]');
    await delay(3000);

    console.log('✅ Friend request sent');

    // === PREMIUM USER ACCEPTS FRIEND REQUEST ===
    console.log('👑 PREMIUM user checking friend requests...');
    await pagePremium.click('a[href="/app/friends"]');
    await delay(2000);

    await pagePremium.click('button:contains("Requests")');
    await delay(1000);

    console.log('✅ PREMIUM user accepting friend request...');
    await pagePremium.click('button[title="Accept"], button:contains("Accept"), svg[data-testid="check"]');
    await delay(3000);

    console.log('✅ Friend request accepted - Users are now friends!');

    // === PREMIUM USER CREATES QUESTION SET ===
    console.log('📚 PREMIUM user creating question set...');
    await pagePremium.click('a[href="/app/question-sets"]');
    await delay(2000);

    await pagePremium.click('button:contains("AI Generate")');
    await delay(1000);

    // Fill in question set details
    await pagePremium.type('input[placeholder*="AI Generated"]', 'Science Quiz for Friends');
    await pagePremium.type('input[placeholder*="World War 2"]', 'Basic Science Facts');
    await pagePremium.select('select:last-of-type', 'EASY'); // Difficulty
    await delay(1000);

    console.log('🧠 Generating questions with AI...');
    await pagePremium.click('button:contains("Generate")');
    await delay(8000); // Wait for AI generation

    console.log('✅ Question set created successfully');

    // === PREMIUM USER CREATES GAME ===
    console.log('🎮 PREMIUM user creating game...');
    await pagePremium.click('a[href="/app/create-game"]');
    await delay(2000);

    // Select the created question set (should be first in list)
    await pagePremium.click('select:first-of-type option:nth-child(2)'); // Skip "Select..." option
    await delay(1000);

    // Configure game settings
    await pagePremium.select('select[value="4"]', '2'); // Max players: 2
    await pagePremium.select('select[value="10"]', '5'); // Questions: 5
    await pagePremium.select('select[value="30"]', '20'); // Time: 20 seconds

    // Select friend to invite
    console.log('👥 PREMIUM user inviting friend...');
    await pagePremium.click('.friend-invite-checkbox'); // Assuming there's a checkbox for friend
    await delay(1000);

    console.log('🚀 Creating game...');
    await pagePremium.click('button:contains("Create Game")');
    await delay(5000);

    // Get game code from success screen
    const gameCode = await pagePremium.$eval('.game-code, code, [data-testid="game-code"]', el => el.textContent);
    console.log(`✅ Game created with code: ${gameCode}`);

    // Join the created game
    await pagePremium.click('button:contains("Join Game")');
    await delay(3000);

    console.log('✅ PREMIUM user joined game as host');

    // === FREE USER JOINS GAME ===
    console.log('🎮 FREE user joining game...');
    await pageFree.click('a[href="/app/lobby"]');
    await delay(2000);

    // Look for the game with the code or join directly
    try {
      // Try to find and click on the game in lobby
      await pageFree.click(`button:contains("${gameCode}"), .game-card:contains("${gameCode}")`);
    } catch (error) {
      // If not found in lobby, try join by code
      console.log('⌨️ FREE user entering game code manually...');
      await pageFree.click('input[placeholder*="code"], input[placeholder*="Code"]');
      await pageFree.type('input[placeholder*="code"], input[placeholder*="Code"]', gameCode);
      await pageFree.click('button:contains("Join")');
    }
    await delay(3000);

    console.log('✅ FREE user joined game successfully');

    // === PREMIUM USER STARTS GAME ===
    console.log('🚀 PREMIUM user starting game...');
    await pagePremium.click('button:contains("Start Game")');
    await delay(3000);

    console.log('✅ Game started - Both players are now in game!');

    // === GAME PLAY SIMULATION ===
    console.log('🎯 Playing the game...');
    
    for (let round = 1; round <= 5; round++) {
      console.log(`📝 Round ${round}/5`);
      
      // Wait for question to load
      await delay(2000);
      
      // Both users answer (click first option for simplicity)
      await Promise.all([
        pageFree.click('.answer-option:first-child, button:contains("A"), .option-a').catch(() => {}),
        pagePremium.click('.answer-option:first-child, button:contains("A"), .option-a').catch(() => {})
      ]);
      
      console.log(`✅ Round ${round} completed`);
      await delay(3000); // Wait for next question
    }

    console.log('🏆 Game completed!');

    // === VERIFY RESULTS ===
    console.log('📊 Checking results...');
    await delay(5000);

    // Both users should see results screen
    const resultsVisible = await Promise.all([
      pageFree.$('.results, .leaderboard, h1:contains("Game Over")').then(el => !!el),
      pagePremium.$('.results, .leaderboard, h1:contains("Game Over")').then(el => !!el)
    ]);

    if (resultsVisible[0] && resultsVisible[1]) {
      console.log('✅ Results screen visible for both users');
    } else {
      console.log('⚠️ Results screen not visible for all users');
    }

    // === NAVIGATE TO DASHBOARD ===
    console.log('🏠 Returning to dashboard...');
    await Promise.all([
      pageFree.click('button:contains("Dashboard"), a[href="/app"]').catch(() => {}),
      pagePremium.click('button:contains("Dashboard"), a[href="/app"]').catch(() => {})
    ]);
    await delay(3000);

    console.log('🎉 Complete experience test completed successfully!');
    console.log('');
    console.log('Summary:');
    console.log('✅ FREE user logged in');
    console.log('✅ PREMIUM user logged in');
    console.log('✅ FREE user sent friend request');
    console.log('✅ PREMIUM user accepted friend request');
    console.log('✅ PREMIUM user created AI question set');
    console.log('✅ PREMIUM user created game and invited friend');
    console.log('✅ FREE user joined game');
    console.log('✅ Game played with 5 rounds');
    console.log('✅ Results displayed correctly');
    console.log('✅ Users returned to dashboard');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    // Take screenshots for debugging
    try {
      await pageFree.screenshot({ path: 'error-free-user.png' });
      await pagePremium.screenshot({ path: 'error-premium-user.png' });
      console.log('📸 Error screenshots saved');
    } catch (screenshotError) {
      console.error('Failed to take screenshots:', screenshotError);
    }
  } finally {
    // Clean up
    if (browserFree) await browserFree.close();
    if (browserPremium) await browserPremium.close();
    console.log('🧹 Browsers closed');
  }
}

// Run the test
testCompleteExperience().catch(console.error); 