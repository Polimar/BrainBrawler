const puppeteer = require('puppeteer');

async function testBasicFunctionality() {
  console.log('🚀 Testing basic BrainBrawler functionality...');
  
  const browser = await puppeteer.launch({ 
    headless: false, 
    args: ['--ignore-certificate-errors', '--disable-web-security'],
    devtools: true
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });

    const baseUrl = 'http://localhost:3001';

    console.log('📱 Loading the application...');
    await page.goto(baseUrl, { waitUntil: 'networkidle0', timeout: 30000 });
    
    console.log('⏰ Waiting for React to render...');
    await page.waitForTimeout(5000);

    // Take a screenshot to see what's rendered
    await page.screenshot({ path: 'app-loaded.png', fullPage: true });
    console.log('📸 Screenshot saved as app-loaded.png');

    // Check if we're on landing page or auth page
    const pageTitle = await page.title();
    console.log(`📄 Page title: ${pageTitle}`);

    // Check for main elements
    const hasAuthForm = await page.$('form') !== null;
    const hasLoginButton = await page.$('button[type="submit"]') !== null;
    const hasEmailInput = await page.$('input[type="email"]') !== null;
    const hasPasswordInput = await page.$('input[type="password"]') !== null;

    console.log('🔍 Element check:');
    console.log(`   Auth form: ${hasAuthForm}`);
    console.log(`   Login button: ${hasLoginButton}`);
    console.log(`   Email input: ${hasEmailInput}`);
    console.log(`   Password input: ${hasPasswordInput}`);

    // Navigate to auth page if we're on landing page
    if (!hasEmailInput) {
      console.log('🔄 Navigating to auth page...');
      
      // Look for auth/login links
      const authLinks = await page.$$eval('a', links => 
        links.filter(link => 
          link.href.includes('/auth') || 
          link.textContent.toLowerCase().includes('login') ||
          link.textContent.toLowerCase().includes('sign in')
        ).map(link => ({ href: link.href, text: link.textContent }))
      );
      
      console.log('🔗 Found auth links:', authLinks);
      
      if (authLinks.length > 0) {
        await page.click('a[href*="/auth"], a:contains("Login"), a:contains("Sign In")');
        await page.waitForTimeout(3000);
        await page.screenshot({ path: 'auth-page.png', fullPage: true });
        console.log('📸 Auth page screenshot saved');
      } else {
        // Try direct navigation
        await page.goto(`${baseUrl}/auth`, { waitUntil: 'networkidle0' });
        await page.waitForTimeout(3000);
      }
    }

    // Now check for auth form elements again
    const finalEmailInput = await page.$('input[type="email"]') !== null;
    const finalPasswordInput = await page.$('input[type="password"]') !== null;
    
    console.log('✅ Final auth form check:');
    console.log(`   Email input: ${finalEmailInput}`);
    console.log(`   Password input: ${finalPasswordInput}`);

    if (finalEmailInput && finalPasswordInput) {
      console.log('🎉 Auth form found - ready for login tests!');
      
      // Test basic API connectivity
      console.log('🌐 Testing API connectivity...');
      const response = await page.evaluate(async () => {
        try {
          const res = await fetch('/api/health');
          return { status: res.status, ok: res.ok };
        } catch (error) {
          return { error: error.message };
        }
      });
      
      console.log('📡 API response:', response);
      
    } else {
      console.log('❌ Auth form not found - may be a routing issue');
    }

    // Keep browser open for manual inspection
    console.log('🔍 Browser will stay open for 30 seconds for manual inspection...');
    await page.waitForTimeout(30000);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'error-simple.png', fullPage: true });
  } finally {
    await browser.close();
    console.log('🧹 Browser closed');
  }
}

testBasicFunctionality().catch(console.error); 