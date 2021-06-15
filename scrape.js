const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
require('dotenv').config()


/**
 *  
 * @returns - The best two offers of all macbook models' from cimri.com. 
 */
async function scrapeApple() {
    // initiating browser and page
    const browser = await puppeteer.launch({ defaultViewport: null })
    const page = await browser.newPage()

    // global variables
    const products = []
    const url = 'https://www.cimri.com/dizustu-bilgisayar/en-ucuz-apple-dizustu-bilgisayar-fiyatlari'

    // navigating to cimri
    await page.goto(url)

    // getting products
    const elems = await page.evaluate(() => {
        const cimriProductSelector = '.cACjAF #cimri-product'
        return Array.from(document.querySelectorAll(cimriProductSelector), elem => elem.innerHTML)
    })

    // iterating each product
    elems.forEach(async elem => {
        // loading product html to cheerio in order to use jQuery functionality
        const $ = cheerio.load(elem)

        // getting product title
        const productTitleSelector = 'article .product-title'
        const productTitle = $(productTitleSelector).text()

        // getting websites
        const sitesSelector = 'article .top-offers .tag'
        const sites = $(sitesSelector).text()
        const splittedSites = sites.split(/(.com.tr|.com)/g)

        // getting prices
        const firstPriceSelector = 'article .top-offers .tag'
        const secondPriceSelector = 'article .top-offers .tag'
        const firstPrice = $(firstPriceSelector)[0].nextSibling.nodeValue
        const secondPrice = $(secondPriceSelector)[1]?.nextSibling.nodeValue

        const offer = {
            name: productTitle,
            bestOffers: []
        }

        const topOffersSelector = 'article .top-offers a'

        // iterating through top offers 
        $(topOffersSelector).each((i, elem) => {
            // best offer one
            if (i === 0) {
                offer.bestOffers.push({
                    website: splittedSites[0],
                    price: firstPrice,
                    link: elem.attribs.href
                })
            } else { // best offer two
                if (secondPrice !== undefined) offer.bestOffers.push({
                    website: splittedSites[2],
                    price: secondPrice,
                    link: elem.attribs.href
                })
            }
        })

        // pushing offer to products
        products.push(offer)
    })

    // closing browser and returning products
    await browser.close()
    return products
}

/**
 * 
 * @param jobName - Job name to scrape related jobs from linkedin.com.
 * @returns - Scraped jobs.
 */
async function scrapeJobs(jobName) {
    // initiating browser and page with some configurations
    const browser = await puppeteer.launch({ defaultViewport: null })
    const page = await browser.newPage()
    await page.setViewport({
        width: 1920,
        height: 1080
    })

    // global variables
    const jobs = []
    const url = 'https://www.linkedin.com'

    // navigating to linkedin
    await page.goto(url)

    // logging in 
    await page.type('#session_key', process.env.LINKEDIN_USERNAME)
    await page.type('#session_password', process.env.LINKEDIN_PASSWORD)

    await Promise.all([
        page.waitForNavigation(),
        page.click('#main-content > section.section.section--hero > div.sign-in-form-container > form > button'),
    ])

    // navigating to job offers related to entered job
    await page.goto(`https://www.linkedin.com/jobs/search/?keywords=${jobName}`)

    // getting jobs
    await getJobs(page, jobs)

    // closing the browser and returning jobs
    await browser.close()
    return jobs
}

/**
 * 
 * This method is used to scrape jobs from the scraped HTML.
 * @param page - The page that the jobs are being scraped.
 * @param jobs - Array of jobs to push scraped jobs.
 */
async function getJobs(page, jobs) {
    // here we are scrolling to the bottom within the jobs container because the jobs' inner html after 7th job are not loaded when they are not scrolled into. 
    await page.evaluate(() => {
        // selecting the jobs div
        const jobsDivSelector = 'body > div.application-outlet > div.authentication-outlet > div.job-search-ext > div > div > section.jobs-search__left-rail > div > div'
        const jobsDiv = document.querySelector(jobsDivSelector)
        
        // scrolling to the bottom of it smoothly
        jobsDiv.scroll({
            top: jobsDiv.scrollHeight,
            behavior: 'smooth'
        })
    })

    // and we have to wait for like 1.5 - 2 seconds for this to work.
    await page.waitForTimeout(2000)

    // fetching html of every single job in the page
    const scrapedJobs = await page.evaluate(() => {
        const jobsSelector = 'body > div.application-outlet > div.authentication-outlet > div.job-search-ext > div > div > section.jobs-search__left-rail > div > div > ul > li'
        return Array.from(document.querySelectorAll(jobsSelector), elem => elem.innerHTML)
    })

    // iterating through jobs
    scrapedJobs.forEach(async elem => {
        const job = {}

        // loading job html to cheerio in order to use jQuery functionality
        const $ = cheerio.load(elem)

        // selectors
        const jobLinkSelector = '.artdeco-entity-lockup__content div:nth-child(1) a'
        const jobOffererSelector = '.artdeco-entity-lockup__content div:nth-child(2) a'
        const jobLocationSelector = '.artdeco-entity-lockup__content div:nth-child(3) li'

        // getting job properties from html 
        const jobLink = $(jobLinkSelector).attr('href')
        const jobName = $(jobLinkSelector).text().replace(/\s\s+/gm, ' ')
        const jobOfferer = $(jobOffererSelector).text().replace(/\s\s+/gm, ' ')
        const jobLocation = $(jobLocationSelector).text().replace(/\s\s+/gm, ' ')

        // assigning them to job object
        job.link = 'www.linkedin.com' + jobLink
        job.jobName = jobName
        job.jobOfferer = jobOfferer
        job.jobLocation = jobLocation

        // pushing job to jobs array
        jobs.push(job)
    })

    // console.log(jobs)
}

module.exports = {
    scrapeApple,
    scrapeJobs
}