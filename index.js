const puppeteer = require('puppeteer')
const cheerio = require("cheerio")
const aliScraper = require("aliexpress-product-scraper")

let ids = []
const delay = ms => new Promise(r => setTimeout(r, ms))

//THIS CODE GATHERS ALL THE NECCESARY PRODUCT IF ATTAINED FROM
//THE GENERATINGALIEXPRESS FUNCTION 
const customLoop = async () => {
    for (let i = 0; i < ids.length; i++) {
        const id = ids[i];
        const allProducts = await aliScraper(id)
        if (allProducts) {
            console.log(allProducts);
        }
        await delay(10000)

        console.log(id);

    }
}

//THIS IS THE AUTOMATION LOGIN CODE
let login = async () => {
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: { width: 1920, height: 1080 }
    });
    const page = await browser.newPage();
    await page.goto('https://login.aliexpress.com/buyer.htm?return=https%3A%2F%2Fwww.aliexpress.com', { timeout: 60000 });

    //The Login form data
    let username = "Enter Username"
    let password ="Enter Password"

    // Fill in username and password fields
    await page.type('#fm-login-id', username);
    await page.type('#fm-login-password', password);

    // Submit the form
    await page.click('button[type="submit"]');

    // Wait for navigation to complete

    await page.waitForNavigation({ timeout: 90000 });
    // Check if user is logged in by looking for an element only visible to logged in users
    //  const loggedInElement = await page.$('.user-account');
    const loggedInElement = await page.$('.welcome-name');

    console.log(loggedInElement);

    if (loggedInElement) {
        console.log('User is logged in!');
        // Go to settings page
        try {
            // Click on the ship to dropdown
            await page.content()
            await page.waitForSelector('#switcher-info');
            await page.click('#switcher-info');

            // Click on the "Language" dropdown
            await page.waitForSelector('.switcher-currency-c.language-selector');
            await page.click('.switcher-currency-c.language-selector');

            // Select English from the dropdown
            await page.waitForSelector('.switcher-currency-c.language-selector .switcher-item[data-locale="ru_RU"]');
            await page.click('.switcher-currency-c.language-selector .switcher-item[data-locale="en_US"]');
            console.log("Language updated successfully....")

            // Select the Currency dropdown and set it to USD

            await page.waitForSelector('.switcher-currency-c.language-selector .switcher-item[data-locale="ru_RU"]');
            await page.click('.switcher-currency-c.language-selector .switcher-item[data-locale="en_US"]');
            console.log("Country updated successfully....")
            console.log("Currency updated successfully....")
            await page.waitForNavigation()
            console.log('Page settings changed successfully!');
        } catch (error) {
            console.error('Error:', error);
        } finally {
            await browser.close();
        }


    } else {
        console.log('Login failed :(');
    }

    //await browser.close();
}
//login()

//THIS CODE GETS INFORMATION ABOUT A PARTICULAR PRODUCT
const getProductDetails = async (id) => {
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: { width: 1080, height: 1080 }
    });
    const page = await browser.newPage(); //Opens new page
    await page.goto(`https://www.aliexpress.com/item/${id}.html`, { timeout: 900000 }) //The address to go to

    // Wait for the product page to load
    await page.waitForSelector('.product-title-text');
    await page.waitForSelector('.product-price-value');
    await page.waitForSelector('.product-price-mark');
    //await page.waitForSelector('.overview-rating-average');
    await page.waitForSelector('.product-reviewer-sold');

    // Get the HTML content of the product page
    const htmlContent = await page.content();

    // Parse the HTML content using Cheerio
    const $ = cheerio.load(htmlContent);

    // Extract the product details
    const title = $('.product-title-text').text().trim();
    const currency = $('.product-price-value').text().trim().replace(/[^\D]/g, '');
    //const rating = $('.overview-rating-average').text().trim();
    const price = parseFloat($('.product-price-value').text().trim().replace(/[^\d\.]/g, ''));
    const reviewerSold = $('.product-title-text').text().trim();
    //const description = $('#product-description').html().trim();
    const numberOfOrders = $('.order-num').text().trim();
    const numberOfReviews = parseInt($('.feedback-rating-total-num').text().trim());
    //const rating = parseFloat($('.feedback-rating-star').attr('title').trim().split(' ')[0]);
    const productImages = $('.images-view-list li img').map((i, el) => $(el).attr('src').replace('_50x50.jpg', '')).get();
    const productDetails = $('.product-property-list li').map((i, el) => ({
        key: $(el).find('.propery-title').text().trim(),
        value: $(el).find('.propery-des').text().trim(),
    })).get();

    //NB : If AliScrapper code fails,the alternative is to use console.log

    // console.log(title);
    // console.log(currency);
    // console.log(price);
    // console.log(productImages);
    // console.log(productDetails);
    // console.log(reviewerSold);
    // Return the product details as an object

    const allProducts = await aliScraper(id)
    console.log(allProducts);


    return {
        title,
        price,
        currency,
        numberOfOrders,
        numberOfReviews,
        productImages,
        productDetails,
    };

}
getProductDetails("1005005335799345")


//THIS CODE DISPLAYS ALL THE PRODUCTS THAT ARE WITHIN THE USERS SEARCHWORD
const generatingAliexpress = async (searchword) => {
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: { width: 1920, height: 1080 }
    });

    const page = await browser.newPage(); //Opens new page
    await page.goto(`https://www.aliexpress.com/w/wholesale-${searchword}.html?catId=0&initiative_id=SB_20230418005402&SearchText=${searchword}&spm=a2g0o.home.1000002.0`, { timeout: 90000 }) //The address to go to

    const htmlcontent = await page.content() //Wiats for page to fully load then gets the content
    const pageData = cheerio.load(htmlcontent) //Loading the page to cheerio
    const targetContainer = pageData('.list--gallery--34TropR'); //This is the class that contains all the items displayed
    const parsedHTML = targetContainer['0'].children[0] //Individual element (Gets the first element in this case)

    parsedHTML.parent.children.forEach(e => {
        e.children.forEach(el => {
            const productLink = el.attribs.href //Gets the link for the products displayed

            if (productLink != undefined) {
                let productId = productLink.split("/").pop().split(".")[0];
                if (productId !== undefined) {
                    ids.push(productId)
                    console.log(el);
                }
            }
        })
    })
    await customLoop()
}
//generatingAliexpress("BOOK")




