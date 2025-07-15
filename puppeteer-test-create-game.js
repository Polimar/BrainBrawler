const puppeteer = require('puppeteer');

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: true, // Run in background
    executablePath: '/usr/bin/chromium-browser', // Path for Chromium
    args: ['--no-sandbox', '--disable-setuid-sandbox'] // Args for Linux env
  });
  const page = await browser.newPage();
  const navigationPromise = page.waitForNavigation({ waitUntil: 'networkidle0' });

  try {
    console.log('Navigating to login page...');
    await page.goto('http://127.0.0.1:3001/auth', { waitUntil: 'networkidle0' });

    console.log('Typing credentials...');
    await page.type('input[name="username"]', 'premium'); // Correct username
    await page.type('input[name="password"]', 'password123');
    
    console.log('Clicking login button...');
    await page.click('button[type="submit"]');

    console.log('Waiting for dashboard URL...');
    await page.waitForFunction(
      'window.location.href.includes("/dashboard")',
      { timeout: 10000 } // Wait for 10 seconds
    );

    console.log('Login successful, currently at:', page.url());

    console.log('Navigating to Create Game page...');
    await page.goto('http://127.0.0.1:3001/app/create-game', { waitUntil: 'networkidle0' });
    console.log('Arrived at Create Game page.');

    // Wait for question sets to load and select the first one
    console.log('Waiting for question sets to be available...');
    await page.waitForSelector('select[name="questionSetId"] option:not([value=""])');
    const questionSetId = await page.$eval('select[name="questionSetId"] option:not([value=""])', el => el.value);
    await page.select('select[name="questionSetId"]', questionSetId);
    console.log(`Selected question set: ${questionSetId}`);
    
    // Click the create game button
    console.log('Clicking "Create Game" button...');
    // Use a more generic selector for the button
    await page.click('button.bg-green-600');
    
    console.log('Waiting for game lobby URL...');
    await page.waitForFunction(
      'window.location.href.includes("/app/game/")',
      { timeout: 10000 } // Wait for 10 seconds
    );
    
    console.log('Game creation request sent. Current URL:', page.url());

    // Final check
    if (page.url().includes('/auth')) {
        throw new Error('FAIL: Redirected back to login page after creating game.');
    } else if (page.url().includes('/app/game/')) {
        console.log('SUCCESS: Game created successfully and navigated to game lobby.');
    } else {
        console.log('UNKNOWN: Final URL is not the game lobby or login page. URL:', page.url());
    }

  } catch (error) {
    console.error('An error occurred during the test:', error);
  } finally {
    console.log('Closing browser.');
    await browser.close();
  }
})(); 