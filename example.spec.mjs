import { chromium } from 'playwright'
import dotenv from 'dotenv'
import { jwtDecode } from 'jwt-decode'
import fs from 'fs/promises'
import path from 'path'

// Load environment variables
dotenv.config()

// Decode and validate JWT
function decodeToken(token) {
    try {
        const decoded = jwtDecode(token)
        console.log('🔑 JWT Decoded successfully:')
        console.log(`   Subject: ${decoded.sub || 'N/A'}`)
        console.log(`   Name: ${decoded.name || 'N/A'}`)
        console.log(`   Role: ${decoded.role || 'N/A'}`)
        console.log(`   Permissions: ${(decoded.permissions || []).join(', ') || 'N/A'}`)
        console.log(`   Issued at: ${new Date(decoded.iat * 1000).toISOString()}`)

        // Check if token is expired (if exp exists)
        if ( decoded.exp ) {
            const now = Math.floor(Date.now() / 1000)
            if ( decoded.exp < now ) {
                console.warn('⚠️  Warning: Token has expired!')
                return null
            }
        }
        return decoded
    } catch ( error ) {
        console.error('❌ Invalid JWT token:', error.message)
        return null
    }
}

// Main automation function
async function runAutomation() {
    const token = process.env.MY_JWT
    const targetUrl = process.env.TARGET_URL || 'https://playwright.dev'

    if ( !token ) {
        console.error('❌ MY_JWT not found in .env file')
        process.exit(1)
    }

    // Decode the JWT
    const decodedToken = decodeToken(token)
    if ( !decodedToken ) {
        console.error('❌ Cannot proceed with invalid token')
        process.exit(1)
    }

    console.log(`\n🚀 Launching browser and navigating to: ${targetUrl}`)

    const browser = await chromium.launch({
        headless: true,
        executablePath: '/usr/lib/chromium/chromium',
        args: ['--no-sandbox']
    })

    const context = await browser.newContext({
        // Inject the JWT as a cookie or localStorage item for the target site
        storageState: undefined
    })

    const page = await context.newPage()

    // Set JWT in localStorage before navigation (simulates authentication)
    await page.goto(targetUrl)
    await page.evaluate((token) => {
        localStorage.setItem('auth_token', token)
        console.log('🔐 Auth token set in localStorage')
    }, token)

    // Perform actions and collect results
    const results = {
        timestamp: new Date().toISOString(),
        user: {
            name: decodedToken.name,
            role: decodedToken.role,
            permissions: decodedToken.permissions
        },
        actions: [],
        errors: []
    }

    try {
        // Action 1: Wait for page to load
        console.log('📄 Waiting for page to load...')
        await page.waitForLoadState('networkidle')

        // Take a screenshot
        await page.screenshot({ path: '/tmp/playwright-output/screenshot-initial.png' })
        console.log('📸 Initial screenshot saved')

        // Action 2: Find and log all navigation links
        const links = await page.evaluate(() => {
            const navLinks = document.querySelectorAll('nav a, header a')
            return Array.from(navLinks).map(link => ({
                text: link.textContent.trim(),
                href: link.href
            }))
        })

        console.log(`🔗 Found ${links.length} navigation links`)
        results.actions.push({
            action: 'collect_links',
            links: links
        })

        // Action 3: Click on the first meaningful link (like "Docs" or "Get Started")
        const docsLink = links.find(link =>
            link.text.toLowerCase().includes('docs') ||
            link.text.toLowerCase().includes('get started')
        )

        if ( docsLink ) {
            console.log(`🖱️  Clicking on: "${docsLink.text}" -> ${docsLink.href}`)

            // Click and wait for navigation
            await Promise.all([
                page.waitForNavigation({ waitUntil: 'networkidle' }),
                page.click(`a:has-text("${docsLink.text}")`)
            ])

            console.log(`📍 Navigated to: ${page.url()}`)

            // Take screenshot after navigation
            await page.screenshot({ path: '/tmp/playwright-output/screenshot-after-click.png' })

            // Extract content from the new page
            const pageContent = await page.evaluate(() => {
                const title = document.title
                const h1 = document.querySelector('h1')?.textContent || ''
                const firstParagraph = document.querySelector('p')?.textContent || ''
                const codeBlocks = Array.from(document.querySelectorAll('pre code')).map(el => el.textContent)

                return { title, h1, firstParagraph, codeBlockCount: codeBlocks.length }
            })

            results.actions.push({
                action: 'navigate_and_extract',
                from: targetUrl,
                to: page.url(),
                clickedLink: docsLink.text,
                extractedContent: pageContent
            })

            console.log('📊 Extracted page content:')
            console.log(`   Title: ${pageContent.title}`)
            console.log(`   Heading: ${pageContent.h1}`)
            console.log(`   First paragraph: ${pageContent.firstParagraph.substring(0, 100)}...`)
            console.log(`   Code blocks found: ${pageContent.codeBlockCount}`)
        }

        // Generate HTML report
        const htmlReport = generateHtmlReport(results)
        const outputDir = '/tmp/playwright-output'
        await fs.mkdir(outputDir, { recursive: true })
        await fs.writeFile(path.join(outputDir, 'report.html'), htmlReport, 'utf8')
        console.log('📋 HTML report generated: /tmp/playwright-output/report.html')

        // Generate JSON report
        await fs.writeFile(
            path.join(outputDir, 'results.json'),
            JSON.stringify(results, null, 2)
        )
        console.log('📊 JSON results saved: /tmp/playwright-output/results.json')

    } catch ( error ) {
        console.error('❌ Error during automation:', error.message)
        results.errors.push({
            step: 'automation',
            error: error.message,
            timestamp: new Date().toISOString()
        })
    } finally {
        await browser.close()
        console.log('✅ Browser closed')
    }

    return results
}

function generateHtmlReport(results) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Playwright Automation Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        h1 { color: #333; border-bottom: 3px solid #45b7d1; padding-bottom: 10px; }
        .success { color: #4caf50; }
        .error { color: #f44336; }
        .section { margin: 20px 0; padding: 15px; background: #fafafa; border-left: 4px solid #45b7d1; }
        pre { background: #333; color: #fff; padding: 10px; border-radius: 4px; overflow-x: auto; white-space: pre-wrap; word-wrap: break-word; }
        .emoji { font-size: 1.2em; }
    </style>
</head>
<body>
    <div class="container">
        <h1><span class="emoji">🎭</span> Playwright Automation Report</h1>
        <div class="section">
            <h3><span class="emoji">📅</span> Execution Info</h3>
            <p><strong>Timestamp:</strong> ${results.timestamp}</p>
            <p><strong>User:</strong> ${results.user.name} (${results.user.role})</p>
            <p><strong>Permissions:</strong> ${results.user.permissions.join(', ')}</p>
        </div>
        <div class="section">
            <h3><span class="emoji">🔧</span> Actions Performed</h3>
            ${results.actions.map(action => `
                <p class="success"><span class="emoji">✅</span> ${action.action}</p>
                ${action.links ? `<p>Links found: ${action.links.length}</p>` : ''}
                ${action.clickedLink ? `<p>Clicked: <strong>${action.clickedLink}</strong></p>` : ''}
                ${action.extractedContent ? `
                    <pre>${JSON.stringify(action.extractedContent, null, 2)}</pre>
                ` : ''}
            `).join('')}
        </div>
        ${results.errors.length > 0 ? `
        <div class="section">
            <h3><span class="emoji">❌</span> Errors</h3>
            ${results.errors.map(error => `
                <p class="error">${error.step}: ${error.error}</p>
            `).join('')}
        </div>
        ` : ''}
    </div>
</body>
</html>`
}

// Run the automation
console.log('🎭 Playwright Automation with JWT Authentication')
console.log('================================================\n')

runAutomation()
    .then(results => {
        console.log('\n✨ Automation completed successfully!')
        console.log(`📊 Check /tmp/playwright-output/ for reports and screenshots`)
        process.exit(results.errors.length > 0 ? 1 : 0)
    })
    .catch(error => {
        console.error('\n💥 Fatal error:', error)
        process.exit(1)
    })