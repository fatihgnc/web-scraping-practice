const app = require('express')()
const { scrapeApple, scrapeJobs } = require('./scrape')
require('dotenv').config() // for .env file

const PORT = process.env.PORT || 3000

// redirecting to /apple when '/' is requested
app.get('/', (req, res) => {
    res.redirect('/apple')
})

// /apple route for scraped macbook results
app.get('/apple', async (req, res) => {
    const products = await scrapeApple()
    // console.log(products)
    res.json(products)
})

// /jobs route for scraped jobs results
app.get('/jobs', async (req, res) => {
    const jobs = await scrapeJobs('backend developer')
    res.json(jobs)
})

app.listen(PORT, () => console.log(`listening on port ${PORT}`))